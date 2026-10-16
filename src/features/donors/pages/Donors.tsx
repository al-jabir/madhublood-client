import { donorsApi } from "../api/donors.api";
import { useState, useMemo, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, MapPin, ShieldCheck, RotateCcw, Droplets } from "lucide-react";
import { usePrefs } from "@/store/preferences.store";
import { groups } from "@/features/donors/constants/blood-groups";
import { t } from "@/i18n/translate";
import { Loading } from "@/components/feedback/Loading";
import { Failure } from "@/components/feedback/Failure";
import { Empty } from "@/components/feedback/Empty";
import { Pager } from "@/components/ui/Pager";
import { PageHeading } from "@/components/common/PageHeading";
import { locationsApi } from "@/features/locations/api/locations.api";

export function Donors() {
  const { en } = usePrefs();
  const [params, setParams] = useSearchParams();

  // Read URL parameters
  const initialGroup = params.get("bloodGroup") ?? "";
  const initialArea = params.get("area") ?? "";
  const initialUnion = params.get("union") ?? "";
  const initialLocality = params.get("locality") ?? "";
  const initialAvailable = params.get("available") === "true";
  const initialVerified = params.get("verified") === "true";

  const [group, setGroup] = useState(initialGroup);
  const [union, setUnion] = useState(initialUnion);
  const [locality, setLocality] = useState(initialLocality);
  const [area, setArea] = useState(initialArea);
  const [available, setAvailable] = useState(initialAvailable);
  const [verified, setVerified] = useState(initialVerified);
  const [page, setPage] = useState(1);

  // Sync state if URL search parameters change externally
  useEffect(() => {
    setGroup(params.get("bloodGroup") ?? "");
    setUnion(params.get("union") ?? "");
    setLocality(params.get("locality") ?? "");
    setArea(params.get("area") ?? "");
    setAvailable(params.get("available") === "true");
    setVerified(params.get("verified") === "true");
  }, [params]);

  const locQ = useQuery({
    queryKey: ["locations", 100],
    queryFn: () => locationsApi.list(100),
    staleTime: 1000 * 60 * 10,
  });

  // Separate locations into municipalities, unions, and localities
  const municipalities = useMemo(
    () => locQ.data?.items?.filter((l) => l.kind === "municipality") || [],
    [locQ.data?.items],
  );
  const unions = useMemo(
    () => locQ.data?.items?.filter((l) => l.kind === "union") || [],
    [locQ.data?.items],
  );
  const localities = useMemo(
    () => locQ.data?.items?.filter((l) => l.kind === "locality") || [],
    [locQ.data?.items],
  );

  // Effective area filter: locality takes precedence, then union, then direct area
  const effectiveArea = locality || union || area || "";

  // Update URL parameters when filters change
  function updateFilterParams(newFilters: {
    bloodGroup?: string;
    union?: string;
    locality?: string;
    available?: boolean;
    verified?: boolean;
  }) {
    const nextGroup = newFilters.bloodGroup !== undefined ? newFilters.bloodGroup : group;
    const nextUnion = newFilters.union !== undefined ? newFilters.union : union;
    const nextLocality = newFilters.locality !== undefined ? newFilters.locality : locality;
    const nextAvailable = newFilters.available !== undefined ? newFilters.available : available;
    const nextVerified = newFilters.verified !== undefined ? newFilters.verified : verified;

    const chosenArea = nextLocality || nextUnion || "";

    const newParams = new URLSearchParams();
    if (nextGroup) newParams.set("bloodGroup", nextGroup);
    if (chosenArea) newParams.set("area", chosenArea);
    if (nextUnion) newParams.set("union", nextUnion);
    if (nextLocality) newParams.set("locality", nextLocality);
    if (nextAvailable) newParams.set("available", "true");
    if (nextVerified) newParams.set("verified", "true");

    setParams(newParams, { replace: true });
    setPage(1);
  }

  function handleResetFilters() {
    setGroup("");
    setUnion("");
    setLocality("");
    setArea("");
    setAvailable(false);
    setVerified(false);
    setParams(new URLSearchParams(), { replace: true });
    setPage(1);
  }

  const hasActiveFilters = Boolean(
    group || union || locality || area || available || verified,
  );

  const q = useQuery({
    queryKey: ["donors", group, effectiveArea, available, verified, page],
    queryFn: async ({ signal }) =>
      donorsApi.search(
        {
          bloodGroup: group || undefined,
          area: effectiveArea || undefined,
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
        title={t(en, "মানুষের পাশে মানুষ · রক্তদাতা ডিরেক্টরি", "Find Blood Donors · Madhupur")}
        desc={t(
          en,
          "মধুপুর উপজেলার স্বেচ্ছাসেবী রক্তদাতাদের তালিকা। সঠিক গ্রুপের রক্তদাতা খুঁজে জরুরি প্রয়োজনে যোগাযোগ করুন।",
          "Directory of voluntary blood donors in Madhupur Upazila. Filter by blood group, union, or locality to connect immediately.",
        )}
      />

      <div className="filter-bar" style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "flex-end" }}>
        {/* Blood Group */}
        <label>
          {t(en, "রক্তের গ্রুপ", "Blood group")}
          <select
            value={group}
            onChange={(e) => {
              const val = e.target.value;
              setGroup(val);
              updateFilterParams({ bloodGroup: val });
            }}
          >
            <option value="">{t(en, "সকল গ্রুপ", "All groups")}</option>
            {groups.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </label>

        {/* Municipality & Wards (পৌরসভার লিস্ট আগে) */}
        <label>
          {t(en, "পৌরসভা ও এলাকা", "Municipality & Wards")}
          <select
            value={locality}
            onChange={(e) => {
              const val = e.target.value;
              setLocality(val);
              setUnion("");
              updateFilterParams({ locality: val, union: "" });
            }}
          >
            <option value="">{t(en, "সকল পৌর এলাকা ও ওয়ার্ড", "All Municipality Wards")}</option>
            {municipalities.map((m) => (
              <option key={m._id} value={m.name}>
                {m.name} (সম্পূর্ণ পৌরসভা)
              </option>
            ))}
            <optgroup label={t(en, "পৌরসভার ২১টি ওয়ার্ড ও মহল্লা", "Municipality Localities")}>
              {localities.map((l) => (
                <option key={l._id} value={l.name}>
                  {l.name}
                </option>
              ))}
            </optgroup>
          </select>
        </label>

        {/* Unions (তারপরে ইউনিয়নসমূহ) */}
        <label>
          {t(en, "ইউনিয়নসমূহ (১১টি)", "Unions (11)")}
          <select
            value={union}
            onChange={(e) => {
              const val = e.target.value;
              setUnion(val);
              setLocality("");
              updateFilterParams({ union: val, locality: "" });
            }}
          >
            <option value="">{t(en, "সকল ইউনিয়ন (মধুপুর)", "All Unions (Madhupur)")}</option>
            {unions.map((u) => (
              <option key={u._id} value={u.name}>
                {u.name}
              </option>
            ))}
          </select>
        </label>

        {/* Available toggle */}
        <label className="checkbox">
          <input
            type="checkbox"
            checked={available}
            onChange={(e) => {
              const val = e.target.checked;
              setAvailable(val);
              updateFilterParams({ available: val });
            }}
          />
          {t(en, "উপলব্ধ রক্তদাতা", "Available donors")}
        </label>

        {/* Verified toggle */}
        <label className="checkbox">
          <input
            type="checkbox"
            checked={verified}
            onChange={(e) => {
              const val = e.target.checked;
              setVerified(val);
              updateFilterParams({ verified: val });
            }}
          />
          {t(en, "যাচাইকৃত প্রোফাইল", "Verified only")}
        </label>

        {/* Reset Filters button */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleResetFilters}
            className="button secondary small"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", height: "40px" }}
          >
            <RotateCcw size={14} />
            <span>{t(en, "ফিল্টার মুছুন", "Reset")}</span>
          </button>
        )}
      </div>

      <p className="privacy-note">
        <ShieldCheck size={16} />
        {t(
          en,
          "ব্যক্তিগত গোপনীয়তার স্বার্থে ফোন নম্বর ও ঠিকানা উন্মুক্ত নয়। রক্তের প্রয়োজনে সরাসরি অনুরোধ জানান।",
          "For privacy, direct phone numbers stay protected until mutual request consent.",
        )}
      </p>

      {q.isPending ? (
        <Loading />
      ) : q.isError ? (
        <Failure error={q.error} />
      ) : !q.data.items.length ? (
        <Empty
          text={
            hasActiveFilters
              ? t(
                  en,
                  "আপনার নির্বাচিত ফিল্টারে কোনো রক্তদাতা পাওয়া যায়নি। ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন।",
                  "No donors matched your selected filters. Try broadening your search.",
                )
              : t(en, "বর্তমানে কোনো নিবন্ধিত রক্তদাতা নেই।", "No registered donors found.")
          }
        />
      ) : (
        <>
          <div className="card-grid">
            {q.data.items.map((d) => (
              <article className="donor-card" key={d.id}>
                <div className="card-top">
                  <span className="blood-type">{d.bloodGroup}</span>
                  {d.verified ? (
                    <span className="badge verified" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      <ShieldCheck size={14} className="green" />
                      {t(en, "যাচাইকৃত", "Verified")}
                    </span>
                  ) : null}
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
                <Link
                  to={`/requests/new?bloodGroup=${encodeURIComponent(d.bloodGroup)}&area=${encodeURIComponent(d.area)}`}
                  className="card-link"
                >
                  <Droplets size={15} />
                  <span>{t(en, "অনুরোধের মাধ্যমে যুক্ত হোন", "Connect through request")}</span>
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
