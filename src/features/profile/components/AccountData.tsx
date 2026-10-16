import { accountApi } from "../api/account.api";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { qc } from "@/lib/query-client";
import { Field } from "@/components/ui/Field";
import { setCsrf } from "@/services/http";
import { errorText } from "@/utils/error-text";

export function AccountData() {
  const nav = useNavigate();
  const [password, setPassword] = useState("");
  return (
    <div className="account-data-content">
      <h3>Your data</h3>
      <button
        className="button secondary"
        onClick={async () => {
          try {
            const data = await accountApi.export();
            const url = URL.createObjectURL(
              new Blob([JSON.stringify(data, null, 2)], {
                type: "application/json",
              }),
            );
            const a = document.createElement("a");
            a.href = url;
            a.download = "madhublood-export.json";
            a.click();
            URL.revokeObjectURL(url);
          } catch (e) {
            toast.error(errorText(e));
          }
        }}
      >
        Export my data
      </button>
      <form
        className="account-delete-form"
        onSubmit={async (e) => {
          e.preventDefault();
          if (
            !confirm(
              "Permanently delete your account and cancel your requests?",
            )
          )
            return;
          try {
            await accountApi.delete(password);
            setCsrf("");
            qc.clear();
            nav("/");
            toast.success("Account deleted");
          } catch (err) {
            toast.error(errorText(err));
          }
        }}
      >
        <Field label="Confirm password to delete your account">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </Field>
        <button className="button secondary">
          Delete my account permanently
        </button>
      </form>
    </div>
  );
}
