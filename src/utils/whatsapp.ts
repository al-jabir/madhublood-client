export function getWhatsAppUrl(phone: string, text: string = ""): string {
  const cleaned = phone.replace(/[^0-9]/g, "");
  const formatted = cleaned.startsWith("880")
    ? cleaned
    : cleaned.startsWith("0")
      ? `88${cleaned}`
      : `880${cleaned}`;
  const query = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${formatted}${query}`;
}
