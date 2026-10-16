import { authApi } from "../api/auth.api";
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { PageHeading } from "@/components/common/PageHeading";
import { Field } from "@/components/ui/Field";
import { errorText } from "@/utils/error-text";

export function Verify({ reset = false }: { reset?: boolean }) {
  const nav = useNavigate();
  const location = useLocation();
  const state: unknown = location.state;
  const initialPhone =
    state &&
    typeof state === "object" &&
    "phone" in state &&
    typeof state.phone === "string"
      ? state.phone
      : "";
  const [sending, setSending] = useState(false);
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const values = Object.fromEntries(new FormData(e.currentTarget));
    setBusy(true);
    try {
      await authApi.verify({
        ...values,
        purpose: reset ? "reset" : "verify",
      });
      toast.success("Completed. Please sign in.");
      nav("/login");
    } catch (e) {
      toast.error(errorText(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="form-page">
      <PageHeading
        title={
          reset
            ? "পাসওয়ার্ড পুনরুদ্ধার · Reset password"
            : "ফোন যাচাই · Verify phone"
        }
      />
      <form className="panel" onSubmit={submit}>
        <Field label="Mobile number">
          <input
            name="phone"
            defaultValue={initialPhone}
            type="tel"
            required
            pattern="\+8801[3-9][0-9]{8}"
            placeholder="+8801XXXXXXXXX"
          />
        </Field>
        <button
          type="button"
          className="button secondary"
          disabled={sending || busy}
          onClick={async (e) => {
            const form = e.currentTarget.form!;
            const phone = form.elements.namedItem("phone") as HTMLInputElement;
            if (!phone.reportValidity()) return;
            setSending(true);
            try {
              await authApi.sendCode({
                phone: phone.value,
                purpose: reset ? "reset" : "verify",
              });
              toast.success("If the account exists, a code will be sent.");
            } catch (err) {
              toast.error(errorText(err));
            } finally {
              setSending(false);
            }
          }}
        >
          {sending ? "Sending..." : "Send / resend code"}
        </button>
        <Field label="SMS verification code">
          <input
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            required
          />
        </Field>
        {reset && (
          <Field label="New password (at least 12 characters)">
            <input
              name="password"
              type="password"
              minLength={12}
              maxLength={128}
              required
            />
          </Field>
        )}
        <button className="button" disabled={busy}>
          Verify & continue
        </button>
        <p className="muted">
          Codes expire in 10 minutes. SMS delivery requires a configured
          provider.
        </p>
      </form>
    </section>
  );
}
