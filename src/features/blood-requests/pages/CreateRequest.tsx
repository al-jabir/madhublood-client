import { requestsApi } from "../api/blood-requests.api";
import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
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
  const [busy, setBusy] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [draftId, setDraftId] = useState<string>();
  const [draftLocation, setDraftLocation] = useState({ id: "", area: "" });
  function valuesFrom(form: HTMLFormElement) {
    const values = Object.fromEntries(new FormData(form));
    const data: Record<string, unknown> = {
      ...values,
      units: Number(values.units),
      contactConsent: values.contactConsent === "on",
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
          input.value = new Date(
            date.getTime() - date.getTimezoneOffset() * 60000,
          )
            .toISOString()
            .slice(0, 16);
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
    setBusy(true);
    try {
      if (draftId) await requestsApi.saveDraft(values, draftId);
      const data = draftId
        ? await requestsApi.submitDraft(draftId)
        : await requestsApi.create(values);
      await qc.invalidateQueries({ queryKey: ["request-drafts"] });
      await qc.invalidateQueries({ queryKey: ["my-requests"] });
      toast.success("Submitted for verification");
      nav("/requests/" + data._id);
    } catch (e) {
      toast.error(errorText(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <RequireUser>
      <section className="page narrow">
        <PageHeading
          title={t(en, "রক্তের অনুরোধ তৈরি করুন", "Create a blood request")}
          desc="Requests are reviewed before they become public. Complete your personal profile first."
        />
        <DraftsPanel onLoad={loadDraft} />
        {draftId && (
          <p role="status">
            {t(en, "সংরক্ষিত খসড়া সম্পাদনা করছেন", "Editing a saved draft")}
          </p>
        )}
        <form ref={formRef} className="panel form-grid" onSubmit={submit}>
          <Field label="প্রতিনিধির নাম · Representative">
            <input
              name="representative"
              required
              minLength={2}
              maxLength={80}
            />
          </Field>
          <Field label="যোগাযোগ · Mobile">
            <input
              name="contact"
              type="tel"
              placeholder="+8801XXXXXXXXX"
              required
              pattern="\+8801[3-9][0-9]{8}"
            />
          </Field>
          <Field label="রক্তের গ্রুপ · Blood group">
            <select name="bloodGroup">
              {groups.map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>
          </Field>
          <Field label="উপাদান · Component">
            <select name="component">
              {["whole-blood", "red-cells", "platelets", "plasma"].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>
          <Field label="ইউনিট · Units">
            <input
              name="units"
              type="number"
              min={1}
              max={20}
              defaultValue={1}
              required
            />
          </Field>
          <Field label="জরুরিতা · Urgency">
            <select name="urgency">
              <option value="urgent">Urgent</option>
              <option value="critical">Critical</option>
              <option value="routine">Routine</option>
            </select>
          </Field>
          <Field label="হাসপাতাল · Hospital">
            <input name="hospital" minLength={3} maxLength={150} required />
          </Field>
          <Field label="এলাকা · Area">
            <LocationSelector
              key={draftId ?? "new"}
              defaultLocationId={draftLocation.id}
              defaultArea={draftLocation.area}
            />
          </Field>
          <Field label="প্রয়োজনের সময় · Required by">
            <input type="datetime-local" name="requiredAt" required />
          </Field>
          <Field label="নির্দেশনা · Instructions (private)">
            <textarea name="instructions" maxLength={500} />
          </Field>
          <label className="checkbox span2">
            <input name="contactConsent" type="checkbox" required />I consent to
            sharing this contact with donors who accept this request.
          </label>
          <p className="notice span2">
            Hospital staff must confirm blood component, compatibility, and
            donor eligibility. Do not include medical records or identity
            documents.
          </p>
          <button className="button" disabled={busy}>
            {busy ? "Submitting…" : "যাচাইয়ের জন্য জমা দিন · Submit"}
          </button>
          <button
            type="button"
            className="button secondary"
            disabled={busy}
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
