export async function downloadRequestCard(data: {
  id: string;
  bloodGroup: string;
  hospital: string;
  area: string;
  units: number;
  requiredAt: string;
  en: boolean;
}) {
  await document.fonts.ready;
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1280;
  const c = canvas.getContext("2d");
  if (!c) throw new Error("Canvas unavailable");
  c.fillStyle = "#10151f";
  c.fillRect(0, 0, 1080, 1280);
  c.fillStyle = "#ef4444";
  c.fillRect(0, 0, 1080, 14);
  const font = (size: number, bold = false) =>
    `${bold ? 700 : 400} ${size}px ${data.en ? "Manrope" : "Hind Siliguri"}, sans-serif`;
  function text(
    value: string,
    y: number,
    size = 36,
    color = "#f8fafc",
    bold = false,
  ) {
    c!.font = font(size, bold);
    c!.fillStyle = color;
    c!.fillText(value, 72, y);
  }
  function wrap(value: string, y: number, size: number, maxLines = 3) {
    c!.font = font(size, true);
    const lines: string[] = [];
    let line = "",
      truncated = false;
    const segments = Array.from(
      new Intl.Segmenter(data.en ? "en" : "bn", {
        granularity: "grapheme",
      }).segment(value.trim()),
      (part) => part.segment,
    );
    for (const part of segments) {
      if (c!.measureText(line + part).width > 920 && line) {
        lines.push(line.trim());
        line = part.trimStart();
        if (lines.length === maxLines) {
          truncated = true;
          break;
        }
      } else line += part;
    }
    if (lines.length < maxLines && line) lines.push(line.trim());
    if (truncated) {
      let last = lines[lines.length - 1];
      while (c!.measureText(last + "…").width > 920) last = last.slice(0, -1);
      lines[lines.length - 1] = last + "…";
    }
    lines.forEach((line, index) =>
      text(line, y + index * size * 1.5, size, undefined, true),
    );
    return y + Math.max(0, lines.length - 1) * size * 1.5;
  }

  text("MadhuBlood", 100, 42, "#ef4444", true);
  text(data.en ? "BLOOD REQUEST" : "রক্তের প্রয়োজন", 178, 34, "#94a3b8", true);
  text(data.bloodGroup, 370, 170, "#ef4444", true);
  text(
    `${data.units} ${data.en ? "units needed" : "ইউনিট প্রয়োজন"}`,
    445,
    42,
    "#ffffff",
    true,
  );
  c.strokeStyle = "#334155";
  c.beginPath();
  c.moveTo(72, 490);
  c.lineTo(1008, 490);
  c.stroke();
  text(data.en ? "HOSPITAL" : "হাসপাতাল", 550, 24, "#94a3b8");
  const last = wrap(data.hospital, 610, 44, 3);
  text(data.en ? "AREA" : "এলাকা", last + 70, 24, "#94a3b8");
  wrap(data.area, last + 120, 32, 2);
  text(data.en ? "NEEDED BY" : "প্রয়োজনের সময়", 940, 24, "#94a3b8");
  text(
    new Date(data.requiredAt).toLocaleString(data.en ? "en-GB" : "bn-BD"),
    995,
    34,
    "#ffffff",
    true,
  );
  text(
    data.en ? "View details and respond" : "বিস্তারিত দেখুন ও সাড়া দিন",
    1100,
    28,
    "#94a3b8",
  );
  text(`${window.location.origin}/requests/${data.id}`, 1155, 24, "#f8fafc");
  text(
    data.en
      ? "Voluntary donors · Contact shared with consent"
      : "স্বেচ্ছায় রক্তদান · সম্মতিতে যোগাযোগ",
    1230,
    24,
    "#94a3b8",
  );
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/png"),
  );
  if (!blob) throw new Error("Image unavailable");
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `madhublood-request-${data.id}.png`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
