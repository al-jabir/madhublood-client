import { usePrefs } from "@/store/preferences.store";
import { t } from "@/i18n/translate";
import { Droplets } from "lucide-react";

export function Empty({ text }: { text?: string }) {
  const { en } = usePrefs();
  return (
    <div className="empty">
      <Droplets />
      <p>{text ?? t(en, "এখনও কোনো তথ্য নেই", "Nothing here yet")}</p>
    </div>
  );
}
