import { useQuery } from "@tanstack/react-query";
import { locationsApi } from "@/features/locations/api/locations.api";
import { useState } from "react";
import { useMe } from "@/features/auth/hooks/useMe";
import { usePrefs } from "@/store/preferences.store";
import { t } from "@/i18n/translate";
import { PersonalProfile } from "./PersonalProfile";
export function ProfileOverview() {
  const { data: me } = useMe();
  const { en } = usePrefs();
  const [editing, setEditing] = useState(false);
  const locations = useQuery({
    queryKey: ["locations", 50],
    queryFn: () => locationsApi.list(50),
  });
  const selectedLocation = locations.data?.items.find(
    (item) => item._id === me?.locationId,
  );
  const displayedArea =
    me?.locationLabel ||
    (selectedLocation && !me?.area?.startsWith(selectedLocation.name)
      ? `${selectedLocation.name}, ${me?.area ?? ""}`
      : me?.area);
  if (!me?.profileCompleted || editing)
    return (
      <section className="profile-editor">
        {me?.profileCompleted && (
          <button
            className="button secondary"
            onClick={() => setEditing(false)}
          >
            {t(en, "তথ্যে ফিরে যান", "Back to profile")}
          </button>
        )}
        <PersonalProfile />
      </section>
    );
  return (
    <section className="panel profile-overview">
      <div className="profile-overview-heading">
        <div className="profile-initial">
          {me.name?.trim().slice(0, 1) || "M"}
        </div>
        <div>
          <h2>{me.name}</h2>
          <p>{t(en, "আপনার ব্যক্তিগত তথ্য", "Your personal information")}</p>
        </div>
        <button className="button secondary" onClick={() => setEditing(true)}>
          {t(en, "তথ্য সম্পাদনা", "Edit profile")}
        </button>
      </div>
      <dl className="profile-info-grid">
        {[
          [t(en, "ইমেইল", "Email"), me.email],
          [
            t(en, "যোগাযোগের নম্বর", "Contact phone"),
            me.phone?.replace(/^\+88/, ""),
          ],
          [t(en, "এলাকা", "Area"), displayedArea],
          [
            t(en, "ইমেইল যাচাই", "Email verification"),
            me.emailVerified
              ? t(en, "যাচাইকৃত", "Verified")
              : t(en, "যাচাই করা হয়নি", "Not verified"),
          ],
        ].map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value || t(en, "যোগ করা হয়নি", "Not added")}</dd>
          </div>
        ))}
      </dl>
      <p className="muted">
        {t(
          en,
          "রক্তদাতা হতে আলাদা ‘রক্তদাতা ফর্ম’ বিভাগ পূরণ করুন।",
          "To volunteer, complete the separate Donor form tab.",
        )}
      </p>
    </section>
  );
}
