import { usePrefs } from "@/store/preferences.store";
import { t } from "@/i18n/translate";
export function PageHeading({ title, desc }: { title: string; desc?: string }) {
  const { en } = usePrefs();
  return (
    <div className="page-heading">
      <span className="eyebrow-label">
        {t(en, "মধুব্লাড · মধুপুর", "MADHUBLOOD · MADHUPUR")}
      </span>
      <h1>{title}</h1>
      {desc && <p>{desc}</p>}
    </div>
  );
}
