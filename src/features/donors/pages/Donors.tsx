import { donorsApi } from "../api/donors.api";
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, MapPin, ShieldCheck } from "lucide-react";
import { usePrefs } from "@/store/preferences.store";
import { groups } from "@/features/donors/constants/blood-groups";
import { t } from "@/i18n/translate";
import { Loading } from "@/components/feedback/Loading";
import { Failure } from "@/components/feedback/Failure";
import { Empty } from "@/components/feedback/Empty";
import { Pager } from "@/components/ui/Pager";
import { PageHeading } from "@/components/common/PageHeading";

export function Donors() {
  const { en } = usePrefs();
  const [params] = useSearchParams();
  const [group, setGroup] = useState(params.get("bloodGroup") ?? "");
  const [available, setAvailable] = useState(false);
  const [verified, setVerified] = useState(false);
  const [page, setPage] = useState(1);
  const q = useQuery({
    queryKey: ["donors", group, available, verified, page],
    queryFn: async ({ signal }) =>
      donorsApi.search(
        {
          bloodGroup: group || undefined,
          available: available ? "true" : undefined,
          verified: verified ? "true" : undefined,
          page,
        },
        signal,
      ),
  });
  return (
    <section className="page">
      <PageHeading
        title={t(en, "মানুষের পাশে মানুষ", "Find a blood donor")}
        desc={t(
          en,
          "সঠিক গ্রুপের রক্তদাতা খুঁজুন। যোগাযোগের জন্য যাচাইকৃত অনুরোধ তৈরি করুন।",
          "Find the requested group. Create a verified request to connect with consenting donors.",
        )}
      />
      <div className="filter-bar">
        <label>
          {t(en, "রক্তের গ্রুপ", "Blood group")}
          <select
            value={group}
            onChange={(e) => {
              setGroup(e.target.value);
              setPage(1);
            }}
          >
            <option value="">{t(en, "সব গ্রুপ", "All groups")}</option>
            {groups.map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
        </label>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={available}
            onChange={(e) => {
              setAvailable(e.target.checked);
              setPage(1);
            }}
          />
          {t(en, "উপলব্ধ রক্তদাতা", "Available donors")}
        </label>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={verified}
            onChange={(e) => {
              setVerified(e.target.checked);
              setPage(1);
            }}
          />
          {t(en, "যাচাইকৃত", "Verified only")}
        </label>
      </div>
      <p className="privacy-note">
        <ShieldCheck size={16} />
        {t(
          en,
          "ফোন নম্বর ও ব্যক্তিগত ঠিকানা এখানে প্রকাশ করা হয় না।",
          "Phone numbers and home addresses stay private.",
        )}
      </p>
      {q.isPending ? (
        <Loading />
      ) : q.isError ? (
        <Failure error={q.error} />
      ) : !q.data.items.length ? (
        <Empty />
      ) : (
        <>
          <div className="card-grid">
            {q.data.items.map((d) => (
              <article className="donor-card" key={d.id}>
                <div className="card-top">
                  <span className="blood-type">{d.bloodGroup}</span>
                  {d.verified && <ShieldCheck className="green" />}
                </div>
                <h3>{d.name}</h3>
                <p>
                  <MapPin size={15} />
                  {d.area}
                </p>
                <span className={"badge " + (d.available ? "available" : "")}>
                  {d.available
                    ? t(en, "সাড়া দিতে প্রস্তুত", "Available")
                    : t(en, "এখন অনুপলব্ধ", "Unavailable")}
                </span>
                <Link to="/requests/new" className="card-link">
                  {t(
                    en,
                    "অনুরোধের মাধ্যমে যুক্ত হোন",
                    "Connect through a request",
                  )}
                  <ArrowUpRight size={16} />
                </Link>
              </article>
            ))}
          </div>
          <Pager page={page} total={q.data.total} setPage={setPage} />
        </>
      )}
    </section>
  );
}
