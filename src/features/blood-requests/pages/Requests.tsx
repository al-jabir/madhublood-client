import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { usePrefs } from "@/store/preferences.store";
import { t } from "@/i18n/translate";
import { RequestList } from "@/features/blood-requests/components/RequestList";
import { PageHeading } from "@/components/common/PageHeading";

export function Requests() {
  const { en } = usePrefs();
  return (
    <section className="page">
      <PageHeading
        title={t(en, "রক্তের অনুরোধ", "Blood requests")}
        desc={t(
          en,
          "যাচাইকৃত অনুরোধে সাড়া দিন। যোগাযোগ সর্বদা সম্মতিভিত্তিক।",
          "Respond to reviewed requests. Every connection begins with consent.",
        )}
      />
      <Link className="button" to="/requests/new">
        <Plus size={18} /> {t(en, "নতুন অনুরোধ", "Create a request")}
      </Link>
      <div className="spacer" />
      <RequestList />
    </section>
  );
}
