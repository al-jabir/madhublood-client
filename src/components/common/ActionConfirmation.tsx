import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePrefs } from "@/store/preferences.store";
import { t } from "@/i18n/translate";
import { errorText } from "@/utils/error-text";
export function ActionConfirmation({
  title,
  description,
  confirmLabel,
  onConfirm,
  onClose,
  children,
  confirmDisabled = false,
  cancelLabel,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => Promise<void>;
  onClose: () => void;
  children?: import("react").ReactNode;
  confirmDisabled?: boolean;
  cancelLabel?: string;
}) {
  const { en } = usePrefs();
  const dialog = useRef<HTMLDialogElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const id = useId();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const node = dialog.current!;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    node.showModal();
    cancel.current?.focus();
    return () => {
      node.close();
      document.body.style.overflow = overflow;
      if (previous?.isConnected) previous.focus();
    };
  }, []);
  return createPortal(
    <dialog
      ref={dialog}
      className="action-confirmation"
      aria-labelledby={id}
      aria-describedby={`${id}-description`}
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onClose();
      }}
    >
      <h2 id={id}>{title}</h2>
      <p id={`${id}-description`}>{description}</p>
      {children}
      {error && (
        <p role="alert" className="notice error">
          {error}
        </p>
      )}
      <div className="action-confirmation-buttons">
        <button
          ref={cancel}
          type="button"
          className="button secondary"
          disabled={busy}
          onClick={onClose}
        >
          {cancelLabel ?? t(en, "বাতিল", "Cancel")}
        </button>
        <button
          type="button"
          className="button"
          disabled={busy || confirmDisabled}
          onClick={async () => {
            if (busy) return;
            setBusy(true);
            setError("");
            try {
              await onConfirm();
              onClose();
            } catch (e) {
              setError(errorText(e));
              setBusy(false);
            }
          }}
        >
          {busy ? t(en, "অপেক্ষা করুন…", "Please wait…") : confirmLabel}
        </button>
      </div>
    </dialog>,
    document.body,
  );
}
