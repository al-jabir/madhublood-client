import { DatePicker } from "@/components/ui/DatePicker";
import { useMe } from "@/features/auth/hooks/useMe";
import { donorsApi } from "@/features/donors/api/donors.api";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { qc } from "@/lib/query-client";
import { groups } from "@/features/donors/constants/blood-groups";
import { Loading } from "@/components/feedback/Loading";
import { Failure } from "@/components/feedback/Failure";
import { Field } from "@/components/ui/Field";
import { errorText } from "@/utils/error-text";
import { LocationSelector } from "@/features/locations/components/LocationSelector";

export function DonorProfile() {
  const { data: me } = useMe();
  const q = useQuery({
    queryKey: ["profile"],
    queryFn: async () => donorsApi.me(),
  });
  const [busy, setBusy] = useState(false);
  if (q.isPending) return <Loading />;
  if (q.isError) return <Failure error={q.error} />;
  const d = q.data;
  return (
    <form
      key={JSON.stringify(d)}
      className="panel form-grid"
      onSubmit={async (e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        setBusy(true);
        try {
          const saved = await donorsApi.update({
            locationId: form.get("locationId") || undefined,
            bloodGroup: form.get("bloodGroup"),
            area: form.get("area"),
            available: form.get("available") === "on",
            directoryConsent: form.get("directoryConsent") === "on",
            contactConsent: form.get("contactConsent") === "on",
            notificationConsent: form.get("notificationConsent") === "on",
            ...(form.get("lastDonation")
              ? { lastDonation: form.get("lastDonation") }
              : {}),
          });
          toast.success("Profile saved");
          qc.setQueryData(["profile"], saved);
          await Promise.all([
            qc.invalidateQueries({ queryKey: ["donors"] }),
            qc.invalidateQueries({ queryKey: ["community-stats"] }),
          ]);
        } catch (e) {
          toast.error(errorText(e));
        } finally {
          setBusy(false);
        }
      }}
    >
      <Field label="Blood group">
        <select name="bloodGroup" defaultValue={d?.bloodGroup}>
          {groups.map((g) => (
            <option key={g}>{g}</option>
          ))}
        </select>
      </Field>
      <Field label="General area (never your home address)">
        <LocationSelector
          defaultLocationId={d?.locationId ?? me?.locationId}
          defaultArea={
            d?.locationLabel ?? d?.area ?? me?.locationLabel ?? me?.area ?? ""
          }
        />
      </Field>
      <Field label="Last donation date (optional)">
        <DatePicker
          name="lastDonation"
          defaultValue={d?.lastDonation}
          max={new Date().toLocaleDateString("en-CA")}
        />
      </Field>
      {[
        ["available", "I am available to receive requests"],
        [
          "directoryConsent",
          "Show my name and general area in the public donor directory",
        ],
        [
          "contactConsent",
          "Share my phone with request owners only when I accept",
        ],
        ["notificationConsent", "Receive in-app matching request alerts"],
      ].map(([name, label]) => (
        <label key={name} className="checkbox span2">
          <input
            name={name}
            type="checkbox"
            defaultChecked={Boolean(
              d?.[
                name as
                  | "available"
                  | "directoryConsent"
                  | "contactConsent"
                  | "notificationConsent"
              ],
            )}
          />
          {label}
        </label>
      ))}
      <p className="notice span2">
        Availability expresses willingness, not medical eligibility. A qualified
        clinician must assess each donation.
      </p>
      <button className="button" disabled={busy}>
        Save profile & consent
      </button>
    </form>
  );
}
