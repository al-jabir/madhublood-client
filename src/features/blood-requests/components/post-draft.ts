export function parsePostDraft(input: string): Record<string, string> {
  const text = input
    .slice(0, 12000)
    .replace(/[০-৯]/g, (d) => String("০১২৩৪৫৬৭৮৯".indexOf(d)));
  const result: Record<string, string> = {};
  const group = text.match(/(?:^|[^A-Za-z])(AB|A|B|O)\s*([+−-])/i);
  if (group)
    result.bloodGroup = group[1].toUpperCase() + (group[2] === "+" ? "+" : "-");
  const phone = text.match(/(?:\+?88)?(01[3-9][0-9]{8})(?![0-9])/);
  if (phone) result.contact = phone[1];
  const units = text.match(
    /(?:পরিমাণ|ইউনিট|units?)\s*[:：-]?\s*([0-9]{1,2})|([0-9]{1,2})\s*(?:ব্যাগ|bag|units?)/i,
  );
  if (
    units &&
    Number(units[1] || units[2]) >= 1 &&
    Number(units[1] || units[2]) <= 20
  )
    result.units = units[1] || units[2];
  if (!result.units) {
    const word = text.match(/(এক|দুই|তিন|চার|পাঁচ)\s*(?:ব্যাগ|ইউনিট)/);
    if (word)
      result.units = String(
        ["এক", "দুই", "তিন", "চার", "পাঁচ"].indexOf(word[1]) + 1,
      );
  }
  for (const line of text.split(/\r?\n/)) {
    const hospital = line.match(
      /^(?:স্থান|হাসপাতাল|hospital|location)\s*[:：;,]\s*(.+)/i,
    );
    if (hospital) result.hospital = hospital[1].trim().slice(0, 150);
    const reason = line.match(
      /^(?:রোগীর সমস্যা|রোগের কারণ|সমস্যা|reason)\s*[:：;,]\s*(.+)/i,
    );
    if (reason) result.patientReason = reason[1].trim().slice(0, 200);
  }
  return result;
}
