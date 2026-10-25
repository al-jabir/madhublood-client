import { useEffect, useRef, useState } from "react";
import { usePrefs } from "@/store/preferences.store";
import { t } from "@/i18n/translate";
import { parsePostDraft } from "./post-draft";

export function PostDraftImport({
  onApply,
}: {
  onApply: (values: Record<string, string>) => void;
}) {
  const { en } = usePrefs();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [review, setReview] = useState(false);
  const sequence = useRef(0);
  const stop = useRef<(() => void) | undefined>(undefined);
  useEffect(
    () => () => {
      sequence.current++;
      stop.current?.();
    },
    [],
  );
  const values = parsePostDraft(text);
  async function read(file: File | undefined) {
    if (!file) return;
    setError("");
    setReview(false);
    if (
      !/^image\/(png|jpeg|webp)$/.test(file.type) ||
      file.size > 8 * 1024 * 1024
    ) {
      setError(
        t(
          en,
          "৮ MB-এর মধ্যে PNG, JPG বা WebP ছবি দিন।",
          "Choose a PNG, JPG or WebP image under 8 MB.",
        ),
      );
      return;
    }
    const run = ++sequence.current;
    setBusy(true);
    setProgress(0);
    let worker:
      | Awaited<ReturnType<typeof import("tesseract.js").createWorker>>
      | undefined;
    try {
      const { createWorker } = await import("tesseract.js");
      const assets = new URL(
        `${import.meta.env.BASE_URL}ocr/`,
        window.location.origin,
      ).href;
      worker = await createWorker(["ben", "eng"], 1, {
        workerPath: assets + "worker.min.js",
        corePath: assets + "tesseract-core-lstm.wasm.js",
        langPath: assets,
        workerBlobURL: false,
        logger: (m) => {
          if (run === sequence.current && m.status === "recognizing text")
            setProgress(Math.round(m.progress * 100));
        },
      });
      stop.current = () => {
        void worker?.terminate().catch(() => undefined);
      };
      if (run !== sequence.current) {
        await worker.terminate();
        return;
      }
      const result = await worker.recognize(file);
      if (run === sequence.current) {
        setText(result.data.text.slice(0, 12000));
        if (!result.data.text.trim())
          setError(
            t(
              en,
              "লেখা পাওয়া যায়নি। পরিষ্কার ছবি দিন অথবা পোস্টের লেখা পেস্ট করুন।",
              "No text found. Try a clearer image or paste the post text.",
            ),
          );
      }
    } catch {
      if (run === sequence.current)
        setError(
          t(
            en,
            "ছবি পড়া যায়নি। পোস্টের লেখা পেস্ট করে চেষ্টা করুন।",
            "Could not read the image. Paste the post text instead.",
          ),
        );
    } finally {
      await worker?.terminate().catch(() => undefined);
      stop.current = undefined;
      if (run === sequence.current) setBusy(false);
    }
  }
  return (
    <section
      className="panel"
      style={{ display: "grid", gap: 16, marginBottom: 24 }}
    >
      <h2>{t(en, "পোস্ট থেকে খসড়া তৈরি", "Draft from a social post")}</h2>
      <p>
        {t(
          en,
          "ছবি এই browser-এ পড়া হবে, server-এ রাখা হবে না। প্রথমবার সাইট থেকে ভাষার ফাইল লোড হবে। ব্যক্তিগত চিকিৎসার নথি দেবেন না।",
          "Images are read in this browser and are not stored on the server. The first use loads language files from this site. Do not attach private medical documents.",
        )}
      </p>
      <label>
        {t(en, "পোস্টের screenshot (ঐচ্ছিক)", "Post screenshot (optional)")}
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          disabled={busy}
          onChange={(e) => void read(e.target.files?.[0])}
        />
      </label>
      {busy && (
        <p role="status">
          {t(en, "ছবির লেখা পড়া হচ্ছে…", "Reading image…")} {progress}%
        </p>
      )}
      {error && <p role="alert">{error}</p>}
      <label>
        {t(
          en,
          "পোস্টের লেখা মিলিয়ে নিন বা পেস্ট করুন",
          "Review or paste the post text",
        )}
        <textarea
          value={text}
          maxLength={12000}
          rows={6}
          disabled={busy}
          onChange={(e) => {
            setText(e.target.value);
            setReview(false);
          }}
        />
      </label>
      {text.trim() && (
        <>
          <dl>
            {Object.entries(values).map(([key, value]) => (
              <div key={key}>
                <dt>
                  {
                    {
                      bloodGroup: t(en, "গ্রুপ", "Blood group"),
                      contact: t(en, "নম্বর", "Phone"),
                      units: t(en, "পরিমাণ", "Units"),
                      hospital: t(en, "হাসপাতাল", "Hospital"),
                      patientReason: t(en, "কারণ", "Reason"),
                    }[key]
                  }
                </dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          {!Object.keys(values).length && (
            <p>
              {t(
                en,
                "তথ্য শনাক্ত হয়নি। নিচের form নিজে পূরণ করুন।",
                "No fields recognized. Fill the form manually below.",
              )}
            </p>
          )}
          <p>
            {t(
              en,
              "এটি অনুমানভিত্তিক খসড়া। পুরোনো পোস্টের ‘আজ’ থেকে তারিখ নেওয়া হবে না। সময়, ঠিকানা ও নম্বর পরিবারের সঙ্গে নিশ্চিত করুন। বিদ্যমান form-এর শুধু শনাক্ত field বদলাবে।",
              "This is an estimated draft. Dates are not inferred from ‘today’ in old posts. Confirm the time, address and phone with the family. Only recognized fields will replace current form values.",
            )}
          </p>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={review}
              onChange={(e) => setReview(e.target.checked)}
            />
            {t(
              en,
              "শনাক্ত তথ্য মিলিয়ে নিয়েছি",
              "I reviewed the extracted fields",
            )}
          </label>
          <button
            type="button"
            className="button"
            disabled={busy || !review || !Object.keys(values).length}
            onClick={() => {
              onApply(values);
              setText("");
              setReview(false);
            }}
          >
            {t(en, "Form-এ খসড়া বসান", "Apply draft to form")}
          </button>
        </>
      )}
    </section>
  );
}
