import { requestLabel } from "../request-labels";
import { Field } from "@/components/ui/Field";
import { DateTimePicker } from "@/components/ui/DateTimePicker";
import { Loading } from "@/components/feedback/Loading";
import { usePrefs } from "@/store/preferences.store";
import { t } from "@/i18n/translate";
import { requestsApi } from "@/features/blood-requests/api/blood-requests.api";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useState } from "react";
import { toast } from "sonner";
import { errorText } from "@/utils/error-text";
import { LocationSelector } from "@/features/locations/components/LocationSelector";
export function EditRequest() {
  const { en } = usePrefs();
  const { id } = useParams();
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);
  const q = useQuery({
    queryKey: ["request-edit", id],
    queryFn: async () => requestsApi.detail(id),
  });
  if (q.isPending) return <Loading />;
  if (q.isError) return <p className="notice error">{errorText(q.error)}</p>;
  const d = q.data;
  if (!d.owner)
    return (
      <section className="page">
        <h1>403</h1>
        <p>
          {t(
            en,
            "শুধু অনুরোধকারী এই অনুরোধ সম্পাদনা করতে পারবেন।",
            "Only the owner can edit this request.",
          )}
        </p>
      </section>
    );
  return (
    <section className="page narrow">
      <div className="page-heading">
        <h1>{t(en, "অনুরোধ সম্পাদনা", "Edit request")}</h1>
        <p>
          {t(
            en,
            "সম্পাদনার পরে অনুরোধটি আবার যাচাই করা হবে।",
            "Edits return the request to moderation before it can become active.",
          )}
        </p>
      </div>
      <form
        className="panel form-grid"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          const data = Object.fromEntries(new FormData(e.currentTarget));
          if (
            !data.requiredAt ||
            Date.parse(String(data.requiredAt)) <= Date.now()
          ) {
            toast.error(
              t(
                en,
                "ভবিষ্যতের তারিখ ও সময় নির্বাচন করুন।",
                "Choose a future date and time.",
              ),
            );
            setBusy(false);
            return;
          }
          try {
            await requestsApi.edit(id, {
              ...data,
              units: Number(data.units),
              requiredAt: new Date(String(data.requiredAt)).toISOString(),
              contactConsent: data.contactConsent === "on",
              shareContactWithMembers: data.shareContactWithMembers === "on",
            });
            toast.success(
              t(
                en,
                "আপডেট করে যাচাইয়ের জন্য জমা হয়েছে",
                "Updated and submitted for review",
              ),
            );
            nav("/requests/" + id);
          } catch (err) {
            toast.error(errorText(err));
          } finally {
            setBusy(false);
          }
        }}
      >
        {[
          ["representative", t(en, "প্রতিনিধির নাম", "Representative"), "text"],
          ["contact", t(en, "মোবাইল নম্বর", "Mobile number"), "tel"],
          ["hospital", t(en, "হাসপাতাল", "Hospital"), "text"],
          ["units", t(en, "ইউনিট", "Units"), "number"],
          [
            "requiredAt",
            t(en, "প্রয়োজনের সময়", "Required by"),
            "datetime-local",
          ],
        ].map(([name, label, type]) => (
          <Field label={label} key={name}>
            {name === "requiredAt" ? (
              <DateTimePicker
                name="requiredAt"
                defaultValue={new Date(
                  new Date(d.requiredAt).getTime() -
                    new Date(d.requiredAt).getTimezoneOffset() * 60000,
                )
                  .toISOString()
                  .slice(0, 16)}
              />
            ) : (
              <input
                name={name}
                type={type}
                defaultValue={
                  name === "requiredAt"
                    ? new Date(
                        new Date(d[name]).getTime() -
                          new Date(d[name]).getTimezoneOffset() * 60000,
                      )
                        .toISOString()
                        .slice(0, 16)
                    : String(d[name as keyof typeof d] ?? "")
                }
                required
                min={name === "units" ? 1 : undefined}
                max={name === "units" ? 20 : undefined}
              />
            )}
          </Field>
        ))}
        <label className="field">
          {t(en, "এলাকা", "Area")}
          <LocationSelector
            defaultLocationId={d.locationId}
            defaultArea={d.area}
          />
        </label>
        <label className="field">
          {t(en, "রক্তের গ্রুপ", "Blood group")}
          <select name="bloodGroup" defaultValue={d.bloodGroup}>
            {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
        </label>
        <label className="field">
          {t(en, "উপাদান", "Component")}
          <select name="component" defaultValue={d.component}>
            {["whole-blood", "red-cells", "platelets", "plasma"].map((s) => (
              <option key={s} value={s}>
                {requestLabel(en, s)}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          {t(en, "জরুরিতা", "Urgency")}
          <select name="urgency" defaultValue={d.urgency}>
            {["routine", "urgent", "critical"].map((s) => (
              <option key={s} value={s}>
                {requestLabel(en, s)}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          {t(en, "নির্দেশনা", "Instructions")}
          <textarea
            name="instructions"
            defaultValue={d.instructions}
            maxLength={500}
          />
        </label>
        <label className="checkbox span2">
          <input
            name="contactConsent"
            type="checkbox"
            defaultChecked={d.contactConsent}
            required
          />
          {t(
            en,
            "সাড়া দেওয়া রক্তদাতাদের সঙ্গে যোগাযোগের তথ্য শেয়ার করতে সম্মত।",
            "I consent to sharing my contact with accepting donors.",
          )}
        </label>
        <label className="checkbox span2">
          <input
            type="checkbox"
            name="shareContactWithMembers"
            defaultChecked={d.shareContactWithMembers}
          />
          {t(
            en,
            "সক্রিয় অনুরোধে লগইন করা ব্যবহারকারীদের আমার নম্বর দেখাতে সম্মত।",
            "Show my contact number to signed-in users while this request is active.",
          )}
        </label>
        <button className="button" disabled={busy}>
          {t(en, "সংরক্ষণ করে আবার জমা দিন", "Save and resubmit")}
        </button>
        <Link className="button secondary" to={"/requests/" + id}>
          {t(en, "সম্পাদনা বাতিল", "Cancel editing")}
        </Link>
      </form>
    </section>
  );
}
