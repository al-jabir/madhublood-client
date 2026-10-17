import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { demoApi } from "./api/demo.api";
import { usePrefs } from "@/store/preferences.store";
import { t } from "@/i18n/translate";
import { toast } from "sonner";
import { errorText } from "@/utils/error-text";
export function DemoExamples({ manage = false }: { manage?: boolean }) {
  const { en } = usePrefs();
  const [page, setPage] = useState(0);
  const [busy, setBusy] = useState(false);
  const q = useQuery({
    queryKey: ["demo-data"],
    queryFn: demoApi.list,
    retry: false,
  });
  async function change(clear: boolean) {
    if (
      clear &&
      !confirm(
        t(
          en,
          "শুধু demo উদাহরণগুলো মুছবেন? বাস্তব তথ্য অপরিবর্তিত থাকবে।",
          "Clear only demo examples? Real records will stay unchanged.",
        ),
      )
    )
      return;
    setBusy(true);
    try {
      if (clear) await demoApi.clear();
      else await demoApi.generate();
      await q.refetch();
      setPage(0);
      toast.success(t(en, "Demo তথ্য আপডেট হয়েছে", "Demo data updated"));
    } catch (e) {
      toast.error(errorText(e));
    } finally {
      setBusy(false);
    }
  }
  if (!manage && (!q.data?.total || q.isError)) return null;
  const items = q.data?.items ?? [];
  const pages = Math.ceil(items.length / 9);
  return (
    <section className="panel demo-examples">
      <span className="badge">
        {t(en, "ডেমো · কাল্পনিক উদাহরণ", "DEMO · Fictional examples")}
      </span>
      <h2>{t(en, "কার্ডগুলো কীভাবে দেখাবে", "Explore example cards")}</h2>
      <p>
        {t(
          en,
          "২৫টি রক্তদাতা ও ২৫টি অনুরোধের উদাহরণ। বাস্তব জরুরি অনুরোধ নয়। যোগাযোগ, matching বা notification হয় না।",
          "25 donor and 25 request examples. These are not real emergencies. No contact, matching or notifications are available.",
        )}
      </p>
      {manage && (
        <div className="demo-actions">
          <button
            className="button"
            disabled={busy || q.isPending}
            onClick={() => void change(false)}
          >
            {t(en, "৫০টি demo যোগ করুন", "Generate 50 demos")}
          </button>
          <button
            className="button secondary"
            disabled={busy || !items.length}
            onClick={() => void change(true)}
          >
            {t(en, "সব demo মুছুন", "Clear all demos")}
          </button>
        </div>
      )}
      {q.isError && manage && <p role="alert">{errorText(q.error)}</p>}
      <p role="status">
        {items.length} {t(en, "টি demo উদাহরণ", "demo examples")}
      </p>
      <div className="card-grid">
        {items.slice(page * 9, page * 9 + 9).map((item) => (
          <article className="donor-card" key={item.name}>
            <div className="card-top">
              <span className="blood-type">{item.bloodGroup}</span>
              <span className="badge">{t(en, "ডেমো", "Demo")}</span>
            </div>
            <h3>{item.name}</h3>
            <p>{item.area}</p>
            <p>
              {item.kind === "donor"
                ? t(en, "রক্তদাতা কার্ডের উদাহরণ", "Example donor card")
                : `${item.units} ${t(en, "ব্যাগ · উদাহরণ হাসপাতাল", "units · Example hospital")}`}
            </p>
            <small>{t(en, "শুধু দেখার জন্য", "Preview only")}</small>
          </article>
        ))}
      </div>
      {pages > 1 && (
        <div className="demo-actions">
          <button
            className="button secondary"
            disabled={page === 0}
            onClick={() => setPage(page - 1)}
          >
            {t(en, "আগের", "Previous")}
          </button>
          <span>
            {page + 1} / {pages}
          </span>
          <button
            className="button secondary"
            disabled={page + 1 >= pages}
            onClick={() => setPage(page + 1)}
          >
            {t(en, "পরের", "Next")}
          </button>
        </div>
      )}
    </section>
  );
}
