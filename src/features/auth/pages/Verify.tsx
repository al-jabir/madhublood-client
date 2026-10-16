import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "@/features/auth/api/auth.api";
import { setCsrf } from "@/services/http";
import { qc } from "@/lib/query-client";
import { Field } from "@/components/ui/Field";
import { toast } from "sonner";
import { errorText } from "@/utils/error-text";
export function Verify(_props: { reset?: boolean }) {
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    if (data.get("password") !== data.get("confirmPassword")) {
      toast.error("Passwords do not match");
      return;
    }
    setBusy(true);
    try {
      const result = await authApi.resetPassword({
        email: data.get("email"),
        recoveryKey: data.get("recoveryKey"),
        password: data.get("password"),
      });
      setCsrf("");
      qc.clear();
      toast.success(result.message);
      nav("/login");
    } catch (error) {
      toast.error(errorText(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="form-page">
      <form className="panel" onSubmit={submit}>
        <h1>পাসওয়ার্ড পুনরুদ্ধার · Reset password</h1>
        <p>
          Use the recovery key you saved during registration. No SMS or email is
          sent. If you lost both your password and key, contact support; email
          alone cannot prove ownership.
        </p>
        <Field label="Email address">
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            maxLength={254}
          />
        </Field>
        <Field label="Recovery key">
          <input
            name="recoveryKey"
            type="password"
            required
            pattern="[a-fA-F0-9]{64}"
            autoComplete="off"
          />
        </Field>
        <Field label="New password">
          <input
            name="password"
            type="password"
            minLength={12}
            maxLength={128}
            required
            autoComplete="new-password"
          />
        </Field>
        <Field label="Confirm new password">
          <input
            name="confirmPassword"
            type="password"
            minLength={12}
            maxLength={128}
            required
            autoComplete="new-password"
          />
        </Field>
        <button className="button" disabled={busy}>
          {busy ? "Resetting…" : "Reset password"}
        </button>
      </form>
    </section>
  );
}
