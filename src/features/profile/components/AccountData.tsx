import { ActionConfirmation } from "@/components/common/ActionConfirmation";
import { usePrefs } from "@/store/preferences.store";
import { t } from "@/i18n/translate";
import { accountApi } from "../api/account.api";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { qc } from "@/lib/query-client";
import { setCsrf } from "@/services/http";

export function AccountData() {
  const nav = useNavigate();
  const { en } = usePrefs();
  const [confirmDelete, setConfirmDelete] = useState(false);
  return (
    <div className="account-data-content">
      <button
        type="button"
        className="text-link account-delete-trigger"
        onClick={() => setConfirmDelete(true)}
      >
        {t(en, "অ্যাকাউন্ট মুছতে চাই", "Delete my account")}
      </button>
      {confirmDelete && (
        <ActionConfirmation
          title={t(
            en,
            "স্থায়ীভাবে অ্যাকাউন্ট মুছবেন?",
            "Permanently delete your account?",
          )}
          description={t(
            en,
            "আপনার অ্যাকাউন্ট মুছে যাবে এবং চলমান অনুরোধ বাতিল হবে। এই কাজ ফিরিয়ে নেওয়া যাবে না।",
            "Your account will be deleted and active requests cancelled. This cannot be undone.",
          )}
          confirmLabel={t(en, "হ্যাঁ", "Yes")}
          cancelLabel={t(en, "না", "No")}
          onClose={() => {
            setConfirmDelete(false);
          }}
          onConfirm={async () => {
            await accountApi.delete();
            setCsrf("");
            qc.clear();
            nav("/");
            toast.success(
              t(en, "অ্যাকাউন্ট মুছে দেওয়া হয়েছে", "Account deleted"),
            );
          }}
        />
      )}
    </div>
  );
}
