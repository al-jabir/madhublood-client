import { useState, type FormEvent } from "react";
import { useMe } from "@/features/auth/hooks/useMe";
import { accountApi } from "@/features/profile/api/account.api";
import { Field } from "@/components/ui/Field";
import { LocationSelector } from "@/features/locations/components/LocationSelector";
import { qc } from "@/lib/query-client";
import { errorText } from "@/utils/error-text";
import { toast } from "sonner";

export function PersonalProfile() {
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
      <h2 className="span2">ব্যক্তিগত তথ্য · Personal information</h2>
      <p className="notice span2">
        Your email and contact phone are private. No SMS or email payment is
        needed. Your email address has not been independently verified.
      </p>
      <Field label="Email address">
        <input
          type="email"
          value={me?.email ?? ""}
          readOnly
          autoComplete="email"
        />
      </Field>
      <Field label="Full name">
        <input
          name="name"
          autoComplete="name"
          defaultValue={me?.name ?? ""}
          required
          minLength={2}
          maxLength={80}
        />
      </Field>
      <Field label="Contact phone (optional)">
        <input
          name="phone"
          type="tel"
          autoComplete="tel"
          defaultValue={me?.phone ?? ""}
          placeholder="+8801XXXXXXXXX"
          pattern="\+8801[3-9][0-9]{8}"
        />
        <small>
          Needed only when you choose to be available as a donor or share your
          contact after accepting a request.
        </small>
      </Field>
      <Field label="Gender (optional)">
        <select name="gender" defaultValue={me?.gender ?? "undisclosed"}>
          <option value="undisclosed">Prefer not to say</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
      </Field>
      <Field label="General area">
        <LocationSelector
          defaultLocationId={me?.locationId}
          defaultArea={me?.area ?? ""}
        />
      </Field>
      <p className="muted span2">
        No exact home address, national ID or medical history is requested.
        Blood group, last donation, availability and public/contact consent are
        in the optional donor section below.
      </p>
      <button className="button" disabled={busy}>
        {busy ? "Saving…" : "Save personal profile"}
      </button>
    </form>
  );
}
