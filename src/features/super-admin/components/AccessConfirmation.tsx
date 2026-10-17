import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ShieldCheck, LogOut, X, LoaderCircle } from "lucide-react";
import { usePrefs } from "@/store/preferences.store";
import { t } from "@/i18n/translate";
import "../access-confirmation.css";
export function AccessConfirmation({
  name,
  role,
  areas,
  permissions,
  onClose,
  onConfirm,
}: {
  name: string;
  role: string;
  areas: string[];
  permissions: string[];
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
}) {
  const { en } = usePrefs();
  const dialog = useRef<HTMLDialogElement>(null);
  const cancelButton = useRef<HTMLButtonElement>(null);
  const previousFocus = useRef(document.activeElement as HTMLElement | null);
  const [failed, setFailed] = useState(false);
  const uid = useId();
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const node = dialog.current!;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    node.showModal();
    cancelButton.current?.focus();
    return () => {
      node.close();
      document.body.style.overflow = previous;
      if (previousFocus.current?.isConnected) previousFocus.current.focus();
    };
  }, []);
  const roleName = (
    {
      user: t(en, "সদস্য", "Member"),
      volunteer: t(en, "সমন্বয়কারী", "Coordinator"),
      admin: t(en, "অ্যাডমিন", "Admin"),
      "super-admin": t(en, "সুপার অ্যাডমিন", "Super admin"),
    } as Record<string, string>
  )[role];
  async function confirm() {
    if (busy) return;
    setBusy(true);
    setFailed(false);
    try {
      await onConfirm();
      onClose();
    } catch {
      setFailed(true);
      setBusy(false);
    }
  }
  return createPortal(
    <dialog
      ref={dialog}
      className="access-confirmation"
      aria-labelledby={`${uid}-title`}
      aria-describedby={`${uid}-description`}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
    >
      <div className="access-confirmation-body">
        <div className="access-confirmation-top">
          <span className="access-confirmation-icon">
            <ShieldCheck size={25} />
          </span>
          <button
            type="button"
            className="icon"
            disabled={busy}
            onClick={onClose}
            aria-label={t(en, "পপআপ বন্ধ করুন", "Close confirmation")}
          >
            <X size={19} />
          </button>
        </div>
        <h2 id={`${uid}-title`}>
          {t(en, "অনুমতির পরিবর্তন নিশ্চিত করুন", "Confirm access changes")}
        </h2>
        <p id={`${uid}-description`}>
          {t(
            en,
            "নিচের পরিবর্তনগুলো সংরক্ষণ করা হবে।",
            "Review the access you are about to save.",
          )}
        </p>
        <div className="access-confirmation-member">
          <span aria-hidden="true">
            {name.trim().slice(0, 1).toUpperCase()}
          </span>
          <div>
            <small>{t(en, "ব্যবহারকারী", "MEMBER")}</small>
            <strong>{name}</strong>
          </div>
        </div>
        <dl className="access-confirmation-summary">
          <div>
            <dt>{t(en, "নতুন ভূমিকা", "Role to save")}</dt>
            <dd>{roleName}</dd>
          </div>
          <div>
            <dt>{t(en, "দায়িত্বের এলাকা", "Assigned areas")}</dt>
            <dd>
              {areas.length
                ? areas.join(" · ")
                : t(en, "এলাকা নির্ধারিত নেই", "No area assigned")}
            </dd>
          </div>
          {role === "volunteer" && (
            <div>
              <dt>{t(en, "কাজের অনুমতি", "Work permissions")}</dt>
              <dd>
                {permissions.length ? (
                  <ul>
                    {permissions.map((key) => (
                      <li key={key}>
                        {key === "submit-referrals"
                          ? t(
                              en,
                              "অন্যের হয়ে অনুরোধ জমা",
                              "Submit requests for others",
                            )
                          : t(
                              en,
                              "নির্ধারিত অনুরোধ পরিচালনা",
                              "Manage assigned requests",
                            )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  t(en, "কোনো কাজের অনুমতি নেই", "No work permissions")
                )}
              </dd>
            </div>
          )}
        </dl>
        <div className="access-confirmation-warning">
          <LogOut size={18} />
          <p>
            {t(
              en,
              "সংরক্ষণ করলে এই সদস্যের সক্রিয় সেশন বন্ধ হবে। নতুন অনুমতি ব্যবহার করতে আবার লগ ইন করতে হবে।",
              "This member will be signed out of all active sessions and must sign in again to use their updated access.",
            )}
          </p>
        </div>
        {failed && (
          <p className="access-confirmation-error" role="alert">
            {t(
              en,
              "পরিবর্তন সংরক্ষণ করা যায়নি। আবার চেষ্টা করুন।",
              "Changes could not be saved. Please try again.",
            )}
          </p>
        )}
        <div className="access-confirmation-actions">
          <button
            type="button"
            ref={cancelButton}
            className="button secondary"
            disabled={busy}
            onClick={onClose}
          >
            {t(en, "ফিরে যান", "Go back")}
          </button>
          <button
            type="button"
            className="button"
            disabled={busy}
            onClick={confirm}
          >
            {busy ? (
              <>
                <LoaderCircle
                  className="access-confirmation-spinner"
                  size={17}
                />
                {t(en, "সংরক্ষণ হচ্ছে…", "Saving…")}
              </>
            ) : (
              t(en, "নিশ্চিত করে সংরক্ষণ", "Confirm & save")
            )}
          </button>
        </div>
      </div>
    </dialog>,
    document.body,
  );
}
