import { usePrefs } from "@/store/preferences.store";
import { t } from "@/i18n/translate";
import { useState, type FormEvent } from "react";
import { useMe } from "@/features/auth/hooks/useMe";
import { accountApi } from "@/features/profile/api/account.api";
import { Field } from "@/components/ui/Field";
import { LocationSelector } from "@/features/locations/components/LocationSelector";
import { qc } from "@/lib/query-client";
import { errorText } from "@/utils/error-text";
import { toast } from "sonner";
import { Link } from "react-router-dom";

export function PersonalProfile() {
  const { en } = usePrefs();
  const { data: me } = useMe();
  const [busy, setBusy] = useState(false);
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    setBusy(true);
    try {
      const user = await accountApi.saveProfile({
        name: data.name,
        phone: data.phone,
        gender: data.gender,
        locationId: data.locationId,
      });
      qc.setQueryData(["me"], user);
      await qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success(
        "Personal profile saved. You can now create requests or set up your donor profile.",
      );
    } catch (error) {
      toast.error(errorText(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <form key={me?.id} className="panel form-grid" onSubmit={save}>
      <h2 className="span2">
        {t(en, "ব্যক্তিগত তথ্য", "Personal information")}
      </h2>
      <p className="notice span2">
        Your email and contact phone stay private.{" "}
        {me?.emailVerified ? (
          "Your email address is verified."
        ) : (
          <>
            Your email is not verified yet.{" "}
            <Link className="text-link" to="/verify-email">
              Verify your email →
            </Link>
          </>
        )}
      </p>
      <Field label={t(en, "ইমেইল ঠিকানা", "Email address")}>
        <input
          type="email"
          value={me?.email ?? ""}
          readOnly
          autoComplete="email"
        />
      </Field>
      <Field label={t(en, "পুরো নাম", "Full name")}>
        <input
          name="name"
          autoComplete="name"
          defaultValue={me?.name ?? ""}
          required
          minLength={2}
          maxLength={80}
        />
      </Field>
      <Field
        label={t(en, "যোগাযোগের নম্বর (ঐচ্ছিক)", "Contact phone (optional)")}
      >
        <input
          name="phone"
          type="tel"
          autoComplete="tel"
          defaultValue={me?.phone?.replace(/^\+88/, "") ?? ""}
          placeholder="01XXXXXXXXX"
          pattern="01[3-9][0-9]{8}"
        />
        <small>
          Needed only when you choose to be available as a donor or share your
          contact after accepting a request.
        </small>
      </Field>
      <Field label={t(en, "লিঙ্গ (ঐচ্ছিক)", "Gender (optional)")}>
        <select name="gender" defaultValue={me?.gender ?? "undisclosed"}>
          <option value="undisclosed">
            {t(en, "জানাতে চাই না", "Prefer not to say")}
          </option>
          <option value="male">{t(en, "পুরুষ", "Male")}</option>
          <option value="female">{t(en, "নারী", "Female")}</option>
          <option value="other">{t(en, "অন্যান্য", "Other")}</option>
        </select>
      </Field>
      <Field label={t(en, "এলাকা", "General area")}>
        <LocationSelector
          defaultLocationId={me?.locationId}
          defaultArea={me?.locationLabel ?? me?.area ?? ""}
        />
      </Field>
      <p className="muted span2">
        No exact home address, national ID or medical history is requested.
        Blood group, last donation, availability and public/contact consent are
        in the optional donor section below.
      </p>
      <button className="button" disabled={busy}>
        {busy
          ? t(en, "সংরক্ষণ হচ্ছে…", "Saving…")
          : t(en, "ব্যক্তিগত তথ্য সংরক্ষণ করুন", "Save personal profile")}
      </button>
    </form>
  );
}
