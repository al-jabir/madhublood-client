import { canVolunteer } from "@/utils/volunteer-permissions";
import { useMe } from "@/features/auth/hooks/useMe";
import { requestLabel } from "../request-labels";
import { DateTimePicker } from "@/components/ui/DateTimePicker";
import { requestsApi } from "../api/blood-requests.api";
import React, { useState, useRef } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { usePrefs } from "@/store/preferences.store";
import { groups } from "@/features/donors/constants/blood-groups";
import { t } from "@/i18n/translate";
import { PageHeading } from "@/components/common/PageHeading";
import { Field } from "@/components/ui/Field";
import { RequireUser } from "@/features/auth/components/RequireUser";
import { errorText } from "@/utils/error-text";
import { DraftsPanel } from "../components/DraftsPanel";
import type { RequestDraft } from "../api/blood-requests.api";
import { qc } from "@/lib/query-client";
import { LocationSelector } from "@/features/locations/components/LocationSelector";

export function CreateRequest() {
  const { en } = usePrefs();
  const nav = useNavigate();
  const { data: me } = useMe();
  const staff = canVolunteer(me, "submit-referrals");

  const [sourceDefaults, setSourceDefaults] = useState({
    source: "social-media",
    sourceUrl: "",
  });
  const [searchParams] = useSearchParams();
  const [onBehalf, setOnBehalf] = useState(
    searchParams.get("onBehalf") === "1",
  );
  const prefill = useLocation().state?.prefill;
  const urlBlood = groups.includes(prefill?.bloodGroup)
    ? prefill.bloodGroup
    : searchParams.get("bloodGroup") || "";
  const urlContact =
    typeof prefill?.contact === "string" ? prefill.contact.slice(0, 20) : "";
  const urlUnits = Math.min(
    20,
    Math.max(
      1,
      Math.trunc(Number(prefill?.units ?? searchParams.get("units")) || 1),
    ),
  );
  const urlHospital =
    typeof prefill?.hospital === "string" ? prefill.hospital.slice(0, 150) : "";
  const urlArea = searchParams.get("area") || "";

  const [busy, setBusy] = useState(false);
  const [requiredAt, setRequiredAt] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const [draftId, setDraftId] = useState<string>();
  const [draftLocation, setDraftLocation] = useState({ id: "", area: "" });
  function valuesFrom(form: HTMLFormElement) {
    const values = Object.fromEntries(new FormData(form));
    const data: Record<string, unknown> = {
      ...values,
      units: Number(values.units),
      contactConsent: values.contactConsent === "on",
      shareContactWithMembers: values.shareContactWithMembers === "on",
    };
    if (onBehalf && staff)
      data.referral = {
        source: values.source,
        sourceUrl: values.sourceUrl || "",
        verifiedByPhone: values.verifiedByPhone === "on",
        representativeConsent: values.representativeConsent === "on",
      };
    if (values.requiredAt)
      data.requiredAt = new Date(String(values.requiredAt)).toISOString();
    else delete data.requiredAt;
    return data;
  }
  function loadDraft(draft: RequestDraft) {
    const form = formRef.current;
    if (!form) return;
    form.reset();
    setOnBehalf(!!draft.data.referral);
    const referral = draft.data.referral as
      { source?: string; sourceUrl?: string } | undefined;
    setSourceDefaults({
      source: referral?.source || "social-media",
      sourceUrl: referral?.sourceUrl || "",
    });
    for (const [key, value] of Object.entries(draft.data)) {
      const input = form.elements.namedItem(key);
      if (input instanceof HTMLInputElement && input.type === "checkbox")
        input.checked = value === true;
      else if (
        input instanceof HTMLInputElement ||
        input instanceof HTMLSelectElement ||
        input instanceof HTMLTextAreaElement
      ) {
        if (key === "requiredAt" && typeof value === "string") {
          const date = new Date(value);
          const localDateTime = new Date(
            date.getTime() - date.getTimezoneOffset() * 60000,
          )
            .toISOString()
            .slice(0, 16);
          input.value = localDateTime;
          setRequiredAt(localDateTime);
        } else input.value = String(value ?? "");
      }
    }
    setDraftId(draft._id);
    setDraftLocation({
      id: String(draft.data.locationId ?? ""),
      area: String(draft.data.area ?? ""),
    });
  }
  async function saveDraft() {
    if (!formRef.current) return;
    setBusy(true);
    try {
      const draft = await requestsApi.saveDraft(
        valuesFrom(formRef.current),
        draftId,
      );
      setDraftId(draft._id);
      await qc.invalidateQueries({ queryKey: ["request-drafts"] });
      toast.success(t(en, "খসড়া সংরক্ষিত হয়েছে", "Draft saved successfully"));
    } catch (error) {
      toast.error(errorText(error));
    } finally {
      setBusy(false);
    }
  }
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const values = valuesFrom(e.currentTarget);
    if (
      !values.requiredAt ||
      Date.parse(String(values.requiredAt)) <= Date.now()
    ) {
      toast.error(
        t(
          en,
          "ভবিষ্যতের তারিখ ও সময় নির্বাচন করুন।",
          "Choose a future date and time.",
        ),
      );
      return;
    }
    setBusy(true);
    try {
      if (draftId) await requestsApi.saveDraft(values, draftId);
      const data = draftId
        ? await requestsApi.submitDraft(draftId)
        : await requestsApi.create(values);
      await qc.invalidateQueries({ queryKey: ["request-drafts"] });
      await qc.invalidateQueries({ queryKey: ["my-requests"] });
      toast.success(
        t(en, "যাচাইয়ের জন্য জমা হয়েছে", "Submitted for verification"),
      );
      nav("/requests/" + data._id);
    } catch (e) {
      toast.error(errorText(e));
    } finally {
      setBusy(false);
    }
  }
  if (!staff)
    return (
      <RequireUser>
        <section className="page narrow">
          <PageHeading
            title={t(
              en,
              "অনুরোধ যোগ করার অনুমতি প্রয়োজন",
              "Request submission is restricted",
            )}
            desc={t(
              en,
              "শুধু অনুমোদিত স্বেচ্ছাসেবক ও অ্যাডমিন রক্তের অনুরোধ যোগ করতে পারবেন। প্রয়োজনের তথ্য তাঁদের জানান। আপনি প্রকাশিত অনুরোধ দেখতে ও সাড়া দিতে পারবেন।",
              "Only authorized volunteers and administrators can add blood requests. Share your need with them. You can browse and respond to published requests.",
            )}
          />
          <a className="button" href="/requests">
            {t(en, "রক্তের অনুরোধ দেখুন", "View blood requests")}
          </a>
        </section>
      </RequireUser>
    );
  return (
    <RequireUser>
      <section className="page narrow">
        <PageHeading
          title={t(en, "রক্তের অনুরোধ তৈরি করুন", "Create a blood request")}
          desc={t(
            en,
            "প্রকাশের আগে অনুরোধ যাচাই করা হয়। আগে আপনার ব্যক্তিগত প্রোফাইল পূরণ করুন।",
            "Requests are reviewed before they become public. Complete your personal profile first.",
          )}
        />
        <DraftsPanel onLoad={loadDraft} />
        {draftId && (
          <p role="status">
            {t(en, "সংরক্ষিত খসড়া সম্পাদনা করছেন", "Editing a saved draft")}
          </p>
        )}
        <form
          ref={formRef}
          className="panel form-grid"
          onSubmit={submit}
          onReset={() => setRequiredAt("")}
        >
          {staff && (
            <label className="checkbox span2">
              <input
                type="checkbox"
                checked={onBehalf}
                onChange={(e) => {
                  setOnBehalf(e.target.checked);
                  setDraftId(undefined);
                }}
              />
              {t(
                en,
                "অন্যের হয়ে অনুরোধ যোগ করছি",
                "Submit on behalf of someone else",
              )}
            </label>
          )}
          {onBehalf && staff && (
            <section
              className="notice span2"
              style={{ display: "grid", gap: "16px" }}
            >
              <h3>
                {t(
                  en,
                  "পরিবারের অ্যাকাউন্ট প্রয়োজন নেই",
                  "No family account needed",
                )}
              </h3>
              <p>
                {t(
                  en,
                  "আপনি এই অনুরোধের যোগাযোগ ও নিশ্চিতকরণ দেখবেন। অনুমোদনের পর এটি প্রকাশিত হবে। উৎসের লিংক প্রকাশ করা হবে না।",
                  "You manage contact and family confirmation. An administrator reviews this before publication. The source link stays private.",
                )}
              </p>
              <Field label={t(en, "খবরের উৎস", "Source")}>
                <select name="source" defaultValue={sourceDefaults.source}>
                  <option value="social-media">
                    {t(en, "সামাজিক মাধ্যম", "Social media")}
                  </option>
                  <option value="phone">{t(en, "ফোন", "Phone")}</option>
                  <option value="hospital">
                    {t(en, "হাসপাতাল", "Hospital")}
                  </option>
                  <option value="personal-contact">
                    {t(en, "পরিচিত ব্যক্তি", "Personal contact")}
                  </option>
                </select>
              </Field>
              <Field
                label={t(
                  en,
                  "মূল পোস্টের লিংক (ঐচ্ছিক)",
                  "Original post link (optional)",
                )}
              >
                <input
                  name="sourceUrl"
                  type="url"
                  maxLength={1000}
                  defaultValue={sourceDefaults.sourceUrl}
                />
              </Field>
              <label className="checkbox">
                <input type="checkbox" name="verifiedByPhone" required />
                {t(
                  en,
                  "ফোনে কথা বলে প্রয়োজনটি নিশ্চিত করেছি",
                  "I confirmed the current need by phone",
                )}
              </label>
              <label className="checkbox">
                <input type="checkbox" name="representativeConsent" required />
                {t(
                  en,
                  "প্রতিনিধি অনুরোধ তৈরি ও সাড়া দেওয়া রক্তদাতাদের সঙ্গে নম্বর শেয়ারের অনুমতি দিয়েছেন",
                  "The representative permitted this request and contact sharing with responding donors",
                )}
              </label>
            </section>
          )}
          <Field label={t(en, "প্রতিনিধির নাম", "Representative")}>
            <input
              name="representative"
              required
              minLength={2}
              maxLength={80}
            />
          </Field>
          <Field label={t(en, "যোগাযোগ", "Mobile")}>
            <input
              name="contact"
              type="tel"
              placeholder="01XXXXXXXXX"
              defaultValue={urlContact.replace(/^\+88/, "")}
              required
              pattern="01[3-9][0-9]{8}"
            />
          </Field>
          <Field label={t(en, "রক্তের গ্রুপ", "Blood group")}>
            <select name="bloodGroup" defaultValue={urlBlood || "O+"}>
              {groups.map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>
          </Field>
          <Field label={t(en, "উপাদান", "Component")}>
            <select name="component">
              {["whole-blood", "red-cells", "platelets", "plasma"].map((s) => (
                <option key={s} value={s}>
                  {requestLabel(en, s)}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t(en, "ইউনিট", "Units")}>
            <input
              name="units"
              type="number"
              min={1}
              max={20}
              defaultValue={urlUnits}
              required
            />
          </Field>
          <Field label={t(en, "জরুরিতা", "Urgency")}>
            <select name="urgency">
              <option value="urgent">{t(en, "জরুরি", "Urgent")}</option>
              <option value="critical">{t(en, "অতি জরুরি", "Critical")}</option>
              <option value="routine">{t(en, "সাধারণ", "Routine")}</option>
            </select>
          </Field>
          <Field label={t(en, "হাসপাতাল", "Hospital")}>
            <input
              name="hospital"
              minLength={3}
              maxLength={150}
              defaultValue={urlHospital}
              required
            />
          </Field>
          <Field label={t(en, "এলাকা", "Area")}>
            <LocationSelector
              key={draftId ?? urlArea ?? "new"}
              defaultLocationId={draftLocation.id}
              defaultArea={draftLocation.area || urlArea || "মধুপুর, টাঙ্গাইল"}
            />
          </Field>
          <Field label={t(en, "প্রয়োজনের সময়", "Required by")}>
            <DateTimePicker
              name="requiredAt"
              value={requiredAt}
              onChange={setRequiredAt}
            />
          </Field>
          <Field label={t(en, "নির্দেশনা", "Instructions (private)")}>
            <textarea name="instructions" maxLength={500} />
          </Field>
          <label className="checkbox span2">
            <input type="checkbox" name="shareContactWithMembers" />
            {t(
              en,
              onBehalf
                ? "প্রতিনিধি সক্রিয় অনুরোধে লগইন করা ব্যবহারকারীদের তাঁর নম্বর দেখাতে অনুমতি দিয়েছেন।"
                : "সক্রিয় অনুরোধে লগইন করা ব্যবহারকারীদের আমার নম্বর দেখাতে সম্মত।",
              onBehalf
                ? "The representative allows their number to be shown to signed-in users while active."
                : "Show my contact number to signed-in users while this request is active.",
            )}
          </label>
          <label className="checkbox span2">
            <input name="contactConsent" type="checkbox" required />
            {t(
              en,
              onBehalf
                ? "প্রতিনিধি এই অনুরোধে সাড়া দেওয়া রক্তদাতাদের সঙ্গে যোগাযোগের তথ্য শেয়ারের অনুমতি দিয়েছেন।"
                : "এই অনুরোধে সাড়া দেওয়া রক্তদাতাদের সঙ্গে আমার যোগাযোগের তথ্য শেয়ার করতে সম্মত।",
              onBehalf
                ? "The representative allows sharing this contact with donors who accept."
                : "I consent to sharing this contact with donors who accept this request.",
            )}
          </label>
          <p className="notice span2">
            {t(
              en,
              "রক্তের উপাদান, সামঞ্জস্য ও রক্তদাতার উপযুক্ততা হাসপাতাল যাচাই করবে। চিকিৎসার নথি বা পরিচয়পত্র যুক্ত করবেন না।",
              "Hospital staff must confirm blood component, compatibility, and donor eligibility. Do not include medical records or identity documents.",
            )}
          </p>
          <button className="button" disabled={busy}>
            {busy
              ? t(en, "জমা হচ্ছে…", "Submitting…")
              : t(en, "যাচাইয়ের জন্য জমা দিন", "Submit for review")}
          </button>
          <button
            type="button"
            className="button secondary"
            disabled={busy || onBehalf}
            onClick={saveDraft}
          >
            {t(en, "খসড়া সংরক্ষণ করুন", "Save draft")}
          </button>
          {draftId && (
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setDraftId(undefined);
                setDraftLocation({ id: "", area: "" });
                formRef.current?.reset();
              }}
            >
              {t(en, "নতুন অনুরোধ", "Start new request")}
            </button>
          )}
        </form>
      </section>
    </RequireUser>
  );
}
