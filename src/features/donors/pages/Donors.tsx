import { canVolunteer } from "@/utils/volunteer-permissions";
import { useMe } from "@/features/auth/hooks/useMe";
import { donorsApi } from "../api/donors.api";
import { useState, useMemo, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  MapPin,
  ShieldCheck,
  RotateCcw,
  Droplets,
  Search,
} from "lucide-react";
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
  const { data: me } = useMe();
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
  const [areaType, setAreaType] = useState(
    initialUnion ? "union" : initialLocality ? "municipality" : "",
  );

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
    queryKey: ["locations", 50],
    queryFn: () => locationsApi.list(50),
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
    const nextGroup =
      newFilters.bloodGroup !== undefined ? newFilters.bloodGroup : group;
    const nextUnion = newFilters.union !== undefined ? newFilters.union : union;
    const nextLocality =
      newFilters.locality !== undefined ? newFilters.locality : locality;
    const nextAvailable =
      newFilters.available !== undefined ? newFilters.available : available;
    const nextVerified =
      newFilters.verified !== undefined ? newFilters.verified : verified;

    const chosenArea =
      newFilters.union !== undefined || newFilters.locality !== undefined
        ? nextLocality || nextUnion
        : effectiveArea;

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
    setAreaType("");
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

  const selectedLocationId = locQ.data?.items.find(
    (item) => item.name === effectiveArea,
  )?._id;
  const q = useQuery({
    queryKey: [
      "donors",
      group,
      effectiveArea,
      selectedLocationId,
      available,
      verified,
      page,
    ],
    queryFn: async ({ signal }) =>
      donorsApi.search(
        {
          bloodGroup: group || undefined,
          area: effectiveArea || undefined,
          locationId: selectedLocationId,
          available: available ? "true" : undefined,
          verified: verified ? "true" : undefined,
          page,
        },
        signal,
      ),
  });

  return (
    <section className="page donor-results-page">
      <PageHeading
        title={t(
          en,
          "মানুষের পাশে মানুষ · রক্তদাতা ডিরেক্টরি",
          "Find Blood Donors · Madhupur",
        )}
        desc={t(
          en,
          "মধুপুর উপজেলার স্বেচ্ছাসেবী রক্তদাতাদের তালিকা। সঠিক গ্রুপের রক্তদাতা খুঁজে জরুরি প্রয়োজনে যোগাযোগ করুন।",
          "Directory of voluntary blood donors in Madhupur Upazila. Filter by blood group, union, or locality to connect immediately.",
        )}
      />

      <div className="donor-search-panel dark-search-box">
        <div className="donor-filter-heading">
          <div>
            <h2>{t(en, "আপনার রক্তদাতা খুঁজুন", "Refine your search")}</h2>
            <p>
              {t(
                en,
                "ফিল্টার বদলালে ফলাফল নিজে থেকেই আপডেট হবে।",
                "Results update automatically when you change a filter.",
              )}
            </p>
          </div>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="donor-reset"
            >
              <RotateCcw size={15} />
              {t(en, "সব মুছুন", "Clear filters")}
            </button>
          )}
        </div>
        <form
          className="dark-search-form"
          onSubmit={(event) => {
            event.preventDefault();
            updateFilterParams({});
          }}
        >
          {/* Blood Group */}
          <label htmlFor="results-blood" className="dark-field-label">
            {t(en, "রক্তের গ্রুপ", "Blood group")}
            <select
              className="dark-select"
              id="results-blood"
              aria-label={t(en, "রক্তের গ্রুপ", "Blood group")}
              value={group}
              onChange={(e) => {
                const val = e.target.value;
                setGroup(val);
                updateFilterParams({ bloodGroup: val });
              }}
            >
              <option value="">{t(en, "সকল গ্রুপ", "All groups")}</option>
              {groups.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </label>

          <label className="dark-field-label" htmlFor="results-type">
            {t(en, "এলাকার ধরন", "Area type")}
            <select
              className="dark-select"
              id="results-type"
              aria-label={t(en, "এলাকার ধরন", "Area type")}
              value={areaType}
              onChange={(event) => {
                setAreaType(event.target.value);
                setArea("");
                setUnion("");
                setLocality("");
                updateFilterParams({ union: "", locality: "" });
              }}
            >
              <option value="">{t(en, "সব এলাকা", "All areas")}</option>
              <option value="municipality">
                {t(en, "পৌরসভা / ওয়ার্ড", "Municipality / wards")}
              </option>
              <option value="union">{t(en, "ইউনিয়ন", "Union")}</option>
            </select>
          </label>
          <label className="dark-field-label" htmlFor="results-area">
            {t(en, "এলাকা নির্বাচন", "Choose area")}
            <select
              className="dark-select"
              id="results-area"
              aria-label={t(en, "এলাকা", "Area")}
              value={effectiveArea}
              disabled={locQ.isPending || locQ.isError}
              onChange={(e) => {
                const val = e.target.value;
                const isUnion = unions.some((item) => item.name === val);
                setArea(val);
                setUnion(isUnion ? val : "");
                setLocality(isUnion ? "" : val);
                updateFilterParams({
                  union: isUnion ? val : "",
                  locality: isUnion ? "" : val,
                });
              }}
            >
              <option value="">
                {locQ.isPending
                  ? t(en, "এলাকা লোড হচ্ছে…", "Loading areas…")
                  : t(en, "মধুপুরের সব এলাকা", "Anywhere in Madhupur")}
              </option>
              {effectiveArea &&
                !locQ.data?.items.some(
                  (item) => item.name === effectiveArea,
                ) && <option value={effectiveArea}>{effectiveArea}</option>}
              {(areaType === "union"
                ? unions
                : areaType === "municipality"
                  ? [...municipalities, ...localities]
                  : [...municipalities, ...localities, ...unions]
              ).map((item) => (
                <option key={item._id} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="btn-dark-search">
            <Search size={17} />
            {t(en, "খুঁজুন", "Search")}
          </button>
        </form>
        {locQ.isError && (
          <p className="donor-location-error" role="status">
            {t(en, "এলাকা লোড হয়নি।", "Could not load areas.")}{" "}
            <button type="button" onClick={() => void locQ.refetch()}>
              {t(en, "আবার চেষ্টা করুন", "Retry")}
            </button>
          </p>
        )}
        <div className="donor-filter-options">
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
        </div>
      </div>
      <div className="donor-results-heading" aria-live="polite">
        <h2>{t(en, "রক্তদাতার তালিকা", "Search results")}</h2>
        <span>
          {q.isFetching
            ? t(en, "খোঁজা হচ্ছে…", "Searching…")
            : q.isError
              ? t(en, "ফলাফল লোড হয়নি", "Results unavailable")
              : `${q.data?.total ?? q.data?.items.length ?? 0} ${t(en, "জন রক্তদাতা", "donors found")}`}
        </span>
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
              : t(
                  en,
                  "বর্তমানে কোনো নিবন্ধিত রক্তদাতা নেই।",
                  "No registered donors found.",
                )
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
                    <span
                      className="badge verified"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <ShieldCheck size={14} className="green" />
                      {t(en, "যাচাইকৃত", "Verified")}
                    </span>
                  ) : null}
                </div>
                <h3>{d.name}</h3>
                <p>
                  <MapPin size={15} />
                  {d.locationLabel || d.area}
                </p>
                <span className={"badge " + (d.available ? "available" : "")}>
                  {d.available
                    ? t(en, "সাড়া দিতে প্রস্তুত", "Available")
                    : t(en, "এখন অনুপলব্ধ", "Unavailable")}
                </span>
                {canVolunteer(me, "submit-referrals") && (
                  <Link
                    to={`/requests/new?bloodGroup=${encodeURIComponent(d.bloodGroup)}&area=${encodeURIComponent(d.area)}`}
                    className="card-link"
                  >
                    <Droplets size={15} />
                    <span>
                      {t(
                        en,
                        "অনুরোধের মাধ্যমে যুক্ত হোন",
                        "Connect through request",
                      )}
                    </span>
                    <ArrowUpRight size={16} />
                  </Link>
                )}
              </article>
            ))}
          </div>
          <Pager page={page} total={q.data.total} setPage={setPage} />
        </>
      )}
    </section>
  );
}
