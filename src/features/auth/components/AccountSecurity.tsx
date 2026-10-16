import { useState, type FormEvent } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { authApi } from "../api/auth.api";
import { qc } from "@/lib/query-client";
import { setCsrf } from "@/services/http";
import { Field } from "@/components/ui/Field";
import { errorText } from "@/utils/error-text";

export function AccountSecurity() {
  const nav = useNavigate();
  const sessions = useQuery({
    queryKey: ["sessions"],
    queryFn: authApi.sessions,
  });
  const [busy, setBusy] = useState(false);
  const [recoveryKey, setRecoveryKey] = useState("");
  function signedOut() {
    setCsrf("");
    qc.clear();
    nav("/login");
  }
  const revoke = useMutation({
    mutationFn: authApi.revokeSession,
    onSuccess: async (data, id) => {
      toast.success(data.message);
      if (sessions.data?.items.find((s) => s.id === id)?.current) signedOut();
      else await qc.invalidateQueries({ queryKey: ["sessions"] });
    },
    onError: (error) => toast.error(errorText(error)),
  });
  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const currentPassword = String(values.get("currentPassword"));
    const newPassword = String(values.get("newPassword"));
    if (newPassword !== values.get("confirmPassword")) {
      toast.error("The new passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const result = await authApi.changePassword({
        currentPassword,
        newPassword,
      });
      toast.success(result.message);
      signedOut();
    } catch (error) {
      toast.error(errorText(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <h3>Active sessions</h3>
      <p>Review your sign-ins and sign out of sessions you no longer use.</p>
      {sessions.isPending && <p role="status">Loading sessions...</p>}
      {sessions.isError && <p role="alert">{errorText(sessions.error)}</p>}
      {sessions.data?.items.map((session) => (
        <div className="list-row" key={session.id}>
          <span>
            {session.current ? "This session" : "Other session"}
            <small>
              Signed in: {new Date(session.createdAt).toLocaleString()}
              <br />
              Expires: {new Date(session.expiresAt).toLocaleString()}
            </small>
          </span>
          <button
            type="button"
            className="button secondary"
            disabled={revoke.isPending}
            onClick={() => revoke.mutate(session.id)}
          >
            Sign out
          </button>
        </div>
      ))}
      <h3>Account recovery key</h3>
      <p>
        Replace your key if you lost it. This invalidates the old key and signs
        out all sessions. Save the new key before continuing.
      </p>
      {recoveryKey ? (
        <div>
          <textarea
            aria-label="New recovery key"
            readOnly
            value={recoveryKey}
            rows={3}
          />
          <button
            className="button"
            onClick={() => {
              setRecoveryKey("");
              signedOut();
            }}
          >
            I saved my key — sign in
          </button>
        </div>
      ) : (
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            const password = String(
              new FormData(event.currentTarget).get("password"),
            );
            setBusy(true);
            try {
              const result = await authApi.recoveryKey(password);
              setRecoveryKey(result.recoveryKey);
              setCsrf("");
            } catch (error) {
              toast.error(errorText(error));
            } finally {
              setBusy(false);
            }
          }}
        >
          <Field label="Current password for recovery key">
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
            />
          </Field>
          <button className="button secondary" disabled={busy}>
            Generate replacement recovery key
          </button>
        </form>
      )}
      <h3>Change password</h3>
      <p>Changing your password signs you out of all sessions.</p>
      <form onSubmit={changePassword}>
        <Field label="Current password">
          <input
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            required
            maxLength={128}
          />
        </Field>
        <Field label="New password (at least 6 characters)">
          <input
            name="newPassword"
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            maxLength={128}
          />
        </Field>
        <Field label="Confirm new password">
          <input
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            maxLength={128}
          />
        </Field>
        <button className="button" disabled={busy}>
          {busy ? "Changing password..." : "Change password"}
        </button>
      </form>
    </>
  );
}
