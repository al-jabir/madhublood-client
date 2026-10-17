import { canVolunteer } from "@/utils/volunteer-permissions";
import { useMe } from "@/features/auth/hooks/useMe";
import { useState } from "react";
import { UrgentFeed } from "@/features/community-tools/components/UrgentFeed";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { usePrefs } from "@/store/preferences.store";
import { t } from "@/i18n/translate";
import { RequestList } from "@/features/blood-requests/components/RequestList";
import { PageHeading } from "@/components/common/PageHeading";

export function Requests() {
  const { en } = usePrefs();
  const { data: me } = useMe();
  const [urgent, setUrgent] = useState(true);
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
      {canVolunteer(me, "submit-referrals") && (
        <Link className="button" to="/requests/new">
          <Plus size={18} /> {t(en, "নতুন অনুরোধ", "Create a request")}
        </Link>
      )}
      <div className="spacer" />
      <div className="button-row">
        <button
          className={"button " + (urgent ? "" : "secondary")}
          aria-pressed={urgent}
          onClick={() => setUrgent(true)}
        >
          {t(en, "জরুরি অনুরোধ", "Urgent feed")}
        </button>
        <button
          className={"button " + (!urgent ? "" : "secondary")}
          aria-pressed={!urgent}
          onClick={() => setUrgent(false)}
        >
          {t(en, "সব অনুরোধ", "All requests")}
        </button>
      </div>
      {urgent ? <UrgentFeed /> : <RequestList />}
    </section>
  );
}
