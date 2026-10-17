import { CommunityStats } from "../components/CommunityStats";
import { DemoExamples } from "@/features/demo/DemoExamples";
import { helpFaq, helpSteps } from "@/i18n/help";
import { useState, useMemo, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  Heart,
  Droplets,
  MapPin,
  Clock,
  Building2,
  ArrowRight,
  ChevronDown,
  CheckCircle2,
  ShieldAlert,
  Sparkles,
  UserCheck,
  Send,
  ShieldCheck,
} from "lucide-react";
import { usePrefs } from "@/store/preferences.store";
import { groups } from "@/features/donors/constants/blood-groups";
import { t } from "@/i18n/translate";
import { locationsApi } from "@/features/locations/api/locations.api";
import { requestsApi } from "@/features/blood-requests/api/blood-requests.api";
import { Failure } from "@/components/feedback/Failure";
import { Empty } from "@/components/feedback/Empty";
import { Loading } from "@/components/feedback/Loading";
import { donorsApi } from "@/features/donors/api/donors.api";

export function Home() {
  const { en } = usePrefs();
  const nav = useNavigate();

  // Quick Request Form State (Hero Section)
  const [quickBlood, setQuickBlood] = useState("O+");
  const [quickPhone, setQuickPhone] = useState("");
  const [quickUnits, setQuickUnits] = useState(1);
  const [quickHospital, setQuickHospital] = useState("");

  // Dark Search Box State
  const [searchBlood, setSearchBlood] = useState("");
  const [locationType, setLocationType] = useState("");
  const [searchArea, setSearchArea] = useState("");
  const [onlyAvailable, setOnlyAvailable] = useState(true);
  const [onlyVerified, setOnlyVerified] = useState(true);

  // FAQ Accordion State (first item open by default)
  const [activeFaq, setActiveFaq] = useState<number | null>(0);

  // Live Queries from Server
  const locations = useQuery({
    queryKey: ["locations", 50],
    queryFn: () => locationsApi.list(50),
    staleTime: 600000,
  });

  const urgentRequests = useQuery({
    queryKey: ["requests", "home"],
    queryFn: () => requestsApi.list(1),
    staleTime: 60000,
  });

  const activeDonors = useQuery({
    queryKey: ["donors", "home"],
    queryFn: () =>
      donorsApi.search({
        available: "true",
        verified: "true",
        page: 1,
      }),
    staleTime: 60000,
  });

  // Handlers
  function handleQuickRequestSubmit(e: FormEvent) {
    e.preventDefault();
    nav("/requests/new", {
      state: {
        prefill: {
          bloodGroup: quickBlood,
          contact: quickPhone,
          units: quickUnits,
          hospital: quickHospital,
        },
      },
    });
  }

  function handleDarkSearchSubmit(e: FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchBlood) params.set("bloodGroup", searchBlood);

    if (searchArea) {
      params.set("area", searchArea);
      const selected = locations.data?.items.find(
        (item) => item.name === searchArea,
      );
      params.set(selected?.kind === "union" ? "union" : "locality", searchArea);
    }

    if (onlyAvailable) params.set("available", "true");
    if (onlyVerified) params.set("verified", "true");
    nav(`/donors?${params.toString()}`);
  }

  // Location helpers
  const municipalities = useMemo(
    () => locations.data?.items?.filter((l) => l.kind === "municipality") || [],
    [locations.data?.items],
  );

  const unions = useMemo(
    () => locations.data?.items?.filter((l) => l.kind === "union") || [],
    [locations.data?.items],
  );

  const localities = useMemo(
    () => locations.data?.items?.filter((l) => l.kind === "locality") || [],
    [locations.data?.items],
  );

  const displayedRequests = (urgentRequests.data?.items ?? [])
    .slice(0, 3)
    .map((request) => ({
      id: request.id,
      bloodGroup: request.bloodGroup,
      urgency:
        request.urgency === "critical"
          ? t(en, "অতি জরুরি", "Critical")
          : request.urgency === "urgent"
            ? t(en, "জরুরি", "Urgent")
            : t(en, "সাধারণ", "Routine"),
      units: request.units,
      hospital: request.hospital,
      area: request.area,
      timeText: new Date(request.requiredAt).toLocaleString(
        en ? "en-BD" : "bn-BD",
        { dateStyle: "medium", timeStyle: "short" },
      ),
    }));
  const displayedDonors = (activeDonors.data?.items ?? []).slice(0, 4);

  return (
    <>
      {/* ======================================================================
          1. HERO SECTION (রক্তের বন্ধনে বাঁচুক একটি জীবন + Quick Request Form)
          ====================================================================== */}
      <section className="home-hero-section">
        <div className="home-hero-grid">
          {/* Left Column: Hero Copy */}
          <div>
            <div className="hero-pill-tag">
              <span className="pulsing-dot" />
              <span>
                {t(
                  en,
                  "রক্তদানে এগিয়ে আসুন, কোনো একটি জীবন বাঁচান!",
                  "Step forward. Save a life today!",
                )}
              </span>
            </div>

            <h1 className="hero-headline">
              {t(en, "রক্তের বন্ধনে", "Bound by blood,")}
              <span className="text-red">
                {t(en, "বাঁচুক একটি জীবন", "Save a precious life.")}
              </span>
            </h1>

            <p className="hero-lead-text">
              {t(
                en,
                "মধুপুর উপজেলার সকল রক্তযোদ্ধা, রোগী ও তাদের পরিবারদের এক প্ল্যাটফর্মে নিয়ে আসা একটি মহতী উদ্যোগ। আপনার এক ব্যাগ রক্ত বাঁচিয়ে দিতে পারে একটি মুমূর্ষু রোগীর প্রাণ।",
                "A community initiative uniting voluntary donors, patients, and families across Madhupur Upazila. Your voluntary donation can be someone’s second chance at life.",
              )}
            </p>

            <div className="hero-action-buttons">
              <Link to="/donors" className="btn-primary-red">
                <Search size={18} />
                <span>
                  {t(en, "রক্তদাতা খুঁজুন (Find Donors)", "Find Donors")}
                </span>
              </Link>
              <Link to="/register" className="btn-outline-donor">
                <Heart size={18} color="#dc2626" />
                <span>
                  {t(en, "রক্তদাতা হিসেবে নিবন্ধন করুন", "Register as a Donor")}
                </span>
              </Link>
            </div>

            <div className="hero-trust-list">
              <div className="hero-trust-item">
                <CheckCircle2 size={16} />
                <span>{t(en, "শতভাগ স্বেচ্ছাসেবী", "100% Voluntary")}</span>
              </div>
              <div className="hero-trust-item">
                <CheckCircle2 size={16} />
                <span>{t(en, "যাচাইকৃত রক্তযোদ্ধা", "Verified Donors")}</span>
              </div>
              <div className="hero-trust-item">
                <CheckCircle2 size={16} />
                <span>{t(en, "গোপনীয়তা সুরক্ষিত", "Privacy Protected")}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Quick Request Card */}
          <div>
            <div className="quick-request-card">
              <div className="quick-card-header">
                <div className="quick-card-title">
                  <div className="card-icon-wrap">
                    <Droplets size={18} />
                  </div>
                  <span>
                    {t(en, "জরুরি রক্তের অনুরোধ", "Emergency Request")}
                  </span>
                </div>
                <span className="badge-emergency">
                  {t(en, "জরুরি সেবা", "Emergency")}
                </span>
              </div>

              <form
                onSubmit={handleQuickRequestSubmit}
                className="quick-form-grid"
              >
                <div className="quick-field-group">
                  <label htmlFor="quick-blood" className="quick-field-label">
                    {t(en, "প্রয়োজনীয় রক্তের গ্রুপ", "Required Blood Group")}
                  </label>
                  <select
                    id="quick-blood"
                    value={quickBlood}
                    onChange={(e) => setQuickBlood(e.target.value)}
                    className="quick-field-select"
                    required
                  >
                    {groups.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="quick-two-cols">
                  <div className="quick-field-group">
                    <label
                      htmlFor="quick-contact"
                      className="quick-field-label"
                    >
                      {t(en, "মোবাইল নম্বর", "Mobile Number")}
                    </label>
                    <input
                      id="quick-contact"
                      type="tel"
                      value={quickPhone}
                      onChange={(e) => setQuickPhone(e.target.value)}
                      placeholder="01XXXXXXXXX"
                      className="quick-field-input"
                      pattern="01[3-9][0-9]{8}"
                      maxLength={11}
                      autoComplete="tel"
                      required
                    />
                  </div>
                  <div className="quick-field-group">
                    <label htmlFor="quick-units" className="quick-field-label">
                      {t(en, "ব্যাগের সংখ্যা", "Units (Bags)")}
                    </label>
                    <input
                      id="quick-units"
                      type="number"
                      min={1}
                      max={20}
                      value={quickUnits}
                      onChange={(e) => setQuickUnits(Number(e.target.value))}
                      className="quick-field-input"
                      required
                    />
                  </div>
                </div>

                <div className="quick-field-group">
                  <label htmlFor="quick-hospital" className="quick-field-label">
                    {t(en, "হাসপাতালের নাম ও এলাকা", "Hospital & Area")}
                  </label>
                  <input
                    id="quick-hospital"
                    type="text"
                    value={quickHospital}
                    onChange={(e) => setQuickHospital(e.target.value)}
                    placeholder={t(
                      en,
                      "যেমন: মধুপুর উপজেলা স্বাস্থ্য কমপ্লেক্স",
                      "e.g. Madhupur Upazila Health Complex",
                    )}
                    className="quick-field-input"
                    required
                  />
                </div>

                <button type="submit" className="btn-post-emergency">
                  <Send size={16} />
                  <span>
                    {t(
                      en,
                      "জরুরি রক্তের অনুরোধ পোস্ট করুন",
                      "Post Emergency Blood Request",
                    )}
                  </span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================================
          2. MADHUPUR DONOR SEARCH FILTER BANNER (Dark Slate Box)
             Matches reference screenshot media_1792149947737_1831bb80.png
          ====================================================================== */}
      <section className="dark-search-section">
        <div className="dark-search-box">
          <div className="dark-search-pill">
            <Sparkles size={13} />
            <span>
              {t(
                en,
                "নির্ভরযোগ্য রক্তদাতা নেটওয়ার্ক",
                "Verified Donor Network",
              )}
            </span>
          </div>

          <h2 className="dark-search-title">
            {t(
              en,
              "মধুপুর উপজেলার প্রস্তুত রক্তদাতা খুঁজুন",
              "Find Ready Donors in Madhupur Upazila",
            )}
          </h2>
          <p className="dark-search-subtitle">
            {t(
              en,
              "রক্তের গ্রুপ ও ইউনিয়ন বা এলাকা নির্বাচন করে দ্রুততম সময়ে রক্তদাতার সাথে যোগাযোগ করুন",
              "Select blood group and union or area to connect with nearby voluntary donors immediately",
            )}
          </p>

          <form onSubmit={handleDarkSearchSubmit} className="dark-search-form">
            {/* Field 1: Blood Group */}
            <div>
              <label htmlFor="search-blood" className="dark-field-label">
                {t(en, "রক্তের গ্রুপ", "Blood Group")}
              </label>
              <select
                id="search-blood"
                aria-label="Blood group"
                value={searchBlood}
                onChange={(e) => setSearchBlood(e.target.value)}
                className="dark-select"
              >
                <option value="">
                  {t(en, "সকল রক্তের গ্রুপ", "All Groups")}
                </option>
                {groups.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="search-location-type"
                className="dark-field-label"
              >
                {t(en, "এলাকার ধরন", "Area type")}
              </label>
              <select
                id="search-location-type"
                className="dark-select"
                value={locationType}
                onChange={(e) => {
                  setLocationType(e.target.value);
                  setSearchArea("");
                }}
              >
                <option value="">{t(en, "সব এলাকা", "All areas")}</option>
                <option value="municipality">
                  {t(en, "পৌরসভা / ওয়ার্ড", "Municipality / wards")}
                </option>
                <option value="union">{t(en, "ইউনিয়ন", "Union")}</option>
              </select>
            </div>
            <div>
              <label htmlFor="search-locality" className="dark-field-label">
                {t(en, "এলাকা নির্বাচন", "Choose area")}
              </label>
              <select
                id="search-locality"
                className="dark-select"
                value={searchArea}
                required={Boolean(locationType) && !locations.isError}
                disabled={locations.isPending || locations.isError}
                onChange={(e) => setSearchArea(e.target.value)}
              >
                <option value="">
                  {locations.isPending
                    ? t(en, "এলাকা লোড হচ্ছে…", "Loading areas…")
                    : locationType
                      ? t(en, "একটি এলাকা বেছে নিন", "Select an area")
                      : t(en, "মধুপুরের সব এলাকা", "Anywhere in Madhupur")}
                </option>
                {(locationType === "union"
                  ? unions
                  : locationType === "municipality"
                    ? [...municipalities, ...localities]
                    : [...municipalities, ...localities, ...unions]
                ).map((item) => (
                  <option key={item._id} value={item.name}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Submit Button */}
            <button type="submit" className="btn-dark-search">
              <Search size={17} />
              <span>{t(en, "খুঁজুন", "Search")}</span>
            </button>
          </form>

          {locations.isError && (
            <span className="search-location-error" role="status">
              {t(en, "এলাকা লোড হয়নি।", "Could not load areas.")}{" "}
              <button type="button" onClick={() => void locations.refetch()}>
                {t(en, "আবার চেষ্টা করুন", "Retry")}
              </button>
            </span>
          )}

          {/* Bottom Checkboxes and Note */}
          <div className="dark-checkbox-row">
            <div className="dark-checkbox-group">
              <label className="dark-checkbox-label">
                <input
                  type="checkbox"
                  checked={onlyAvailable}
                  onChange={(e) => setOnlyAvailable(e.target.checked)}
                />
                <span>
                  {t(
                    en,
                    "শুধুমাত্র প্রস্তুত রক্তদাতা",
                    "Only available donors",
                  )}
                </span>
              </label>
              <label className="dark-checkbox-label">
                <input
                  type="checkbox"
                  checked={onlyVerified}
                  onChange={(e) => setOnlyVerified(e.target.checked)}
                />
                <span>
                  {t(
                    en,
                    "যাচাইকৃত রক্তদাতা প্রোফাইল",
                    "Verified donor profiles",
                  )}
                </span>
              </label>
            </div>

            <div className="dark-privacy-note">
              <ShieldCheck size={14} />
              <span>
                {t(
                  en,
                  "যোগাযোগের নম্বর শুধুমাত্র সম্মতির ভিত্তিতে প্রকাশ করা হয়",
                  "Direct phone numbers stay private until consent",
                )}
              </span>
            </div>
          </div>
        </div>
      </section>

      <CommunityStats />
      {/* ======================================================================
          3. EMERGENCY BLOOD REQUESTS (জরুরি রক্তের প্রয়োজন)
          ====================================================================== */}
      <section className="section-wrapper">
        <div className="section-header-row">
          <div>
            <div className="section-pill-tag">
              <Droplets size={14} />
              <span>
                {t(en, "জরুরি রক্তের প্রয়োজন", "Urgent Blood Needed")}
              </span>
            </div>
            <h2 className="section-title">
              {t(en, "জরুরি রক্তের অনুরোধসমূহ", "Emergency Blood Requests")}
            </h2>
            <p className="section-subtitle">
              {t(
                en,
                "হাসপাতালে চিকিৎসাধীন রোগীদের জন্য এখনই রক্ত প্রয়োজন। আপনার একটি পদক্ষেপ বাঁচাতে পারে জীবন।",
                "Patients in critical need across Madhupur hospitals. Your immediate step could save a life.",
              )}
            </p>
          </div>
          <Link to="/requests" className="view-all-link">
            <span>{t(en, "সকল রক্তের অনুরোধ দেখুন", "View All Requests")}</span>
            <ArrowRight size={16} />
          </Link>
        </div>

        {urgentRequests.isPending ? (
          <Loading />
        ) : urgentRequests.isError ? (
          <Failure error={urgentRequests.error} />
        ) : displayedRequests.length === 0 ? (
          <Empty
            text={t(
              en,
              "এই মুহূর্তে কোনো সক্রিয় রক্তের অনুরোধ নেই।",
              "There are no active blood requests right now.",
            )}
          />
        ) : null}
        <div className="urgent-requests-grid">
          {displayedRequests.map((req) => (
            <div className="urgent-req-card" key={req.id}>
              <div className="urgent-card-top">
                <div className="blood-group-circle">{req.bloodGroup}</div>
                <span className="urgency-pill-tag">{req.urgency}</span>
              </div>

              <div className="urgent-card-hospital">{req.hospital}</div>

              <div className="urgent-card-info">
                <span>
                  <MapPin size={14} />
                  {req.area}
                </span>
                <span>
                  <Droplets size={14} />
                  {req.units} {t(en, "ব্যাগ প্রয়োজন", "Bags Required")}
                </span>
                <span style={{ color: "#dc2626", fontWeight: 600 }}>
                  <Clock size={14} />
                  {req.timeText}
                </span>
              </div>

              <div className="urgent-card-footer">
                <div className="verified-badge">
                  <CheckCircle2 size={13} />
                  <span>{t(en, "যাচাইকৃত অনুরোধ", "Verified Request")}</span>
                </div>
                <Link to={`/requests/${req.id}`} className="btn-card-help">
                  {t(en, "সাহায্য করুন", "Help Now")}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ======================================================================
          4. ACTIVE READY DONORS SHOWCASE (আমাদের নিবেদিত রক্তযোদ্ধাগণ)
          ====================================================================== */}
      <section className="section-wrapper" style={{ marginTop: 56 }}>
        <div className="section-header-row">
          <div>
            <div className="section-pill-tag">
              <UserCheck size={14} />
              <span>{t(en, "প্রস্তুত রক্তদাতা", "Ready Blood Donors")}</span>
            </div>
            <h2 className="section-title">
              {t(
                en,
                "আমাদের নিবেদিত রক্তযোদ্ধাগণ",
                "Our Dedicated Blood Heroes",
              )}
            </h2>
            <p className="section-subtitle">
              {t(
                en,
                "মধুপুর উপজেলার স্বেচ্ছাসেবী রক্তদাতারা রোগীদের সহযোগিতায় সদা প্রস্তুত রয়েছেন।",
                "Voluntary donors across Madhupur Upazila ready to step up for patients.",
              )}
            </p>
          </div>
          <Link to="/donors" className="view-all-link">
            <span>{t(en, "সব রক্তদাতা দেখুন", "View All Donors")}</span>
            <ArrowRight size={16} />
          </Link>
        </div>

        {activeDonors.isPending ? (
          <Loading />
        ) : activeDonors.isError ? (
          <Failure error={activeDonors.error} />
        ) : displayedDonors.length === 0 ? (
          <Empty
            text={t(
              en,
              "এই মুহূর্তে প্রস্তুত রক্তদাতার তালিকা খালি।",
              "No available donors are listed right now.",
            )}
          />
        ) : null}
        <div className="donors-showcase-grid">
          {displayedDonors.map((donor) => (
            <div className="donor-showcase-card" key={donor.id}>
              <div className="donor-card-header">
                <div className="donor-blood-tag">{donor.bloodGroup}</div>
                <span className="donor-avail-badge">
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      backgroundColor: "#16a34a",
                    }}
                  />
                  <span>{t(en, "রক্তদানে প্রস্তুত", "Ready")}</span>
                </span>
              </div>

              <div className="donor-name">{donor.name}</div>
              <div className="donor-role-title">
                {t(en, "স্বেচ্ছাসেবী রক্তদাতা", "Voluntary blood donor")}
              </div>

              <div className="donor-meta-row">
                <span>{t(en, "এলাকা", "Area")}</span>
                <span className="donor-meta-val">{donor.area}</span>
              </div>

              <Link
                to={`/requests/new?bloodGroup=${encodeURIComponent(donor.bloodGroup)}&area=${encodeURIComponent(donor.area)}`}
                className="btn-donor-request"
              >
                <Send size={13} />
                <span>{t(en, "অনুরোধ পাঠান", "Request Blood")}</span>
              </Link>
            </div>
          ))}
        </div>
      </section>

      <div className="section-wrapper">
        <DemoExamples />
      </div>
      {/* ======================================================================
          5. HOW IT WORKS (সহজ ৪টি ধাপে শুরু করুন)
          ====================================================================== */}
      <section
        className="section-wrapper how-it-works-section"
        style={{ marginTop: 64 }}
      >
        <div className="section-pill-tag">
          <Clock size={14} />
          <span>{t(en, "কার্যপদ্ধতি", "How It Works")}</span>
        </div>
        <h2 className="section-title">
          {t(en, "সহজ ৪টি ধাপে শুরু করুন", "Get started in 4 clear steps")}
        </h2>
        <p className="section-subtitle">
          {t(
            en,
            "কোনো জটিলতা ছাড়া সরাসরি রক্তদাতা ও গ্রহীতার মধ্যে দ্রুত ও নিরাপদ সমন্বয়।",
            "Fast, safe, and direct coordination between donors and recipients without friction.",
          )}
        </p>

        <div className="how-steps-grid">
          {helpSteps.map((row, index) => (
            <div className="how-step-card" key={index}>
              <div className="step-number-circle">
                {(index + 1).toLocaleString(en ? "en-BD" : "bn-BD")}
              </div>
              <h3 className="how-step-title">
                {row[en ? 1 : 0].replace(/^[0-9০-৯]+\. /, "")}
              </h3>
              <p className="how-step-desc">{row[en ? 3 : 2]}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ======================================================================
          6. ELIGIBILITY GUIDELINES & ADVISORY BOX
          ====================================================================== */}
      <section className="section-wrapper" style={{ marginTop: 64 }}>
        <div className="eligibility-container">
          <div className="eligibility-left-card">
            <h3 className="eligibility-title">
              {t(
                en,
                "রক্তদানের সাধারণ যোগ্যতা ও নির্দেশিকা",
                "Blood Donation Guidelines & Eligibility",
              )}
            </h3>
            <div className="eligibility-subgrid">
              <div>
                <div className="eligibility-subcol-title success">
                  <CheckCircle2 size={16} />
                  <span>{t(en, "দান করার আগে", "Before donating")}</span>
                </div>
                <ul className="eligibility-list success">
                  <li>
                    {t(
                      en,
                      "বয়স ও ওজনের স্থানীয় শর্ত যাচাই করুন",
                      "Check local age and weight requirements",
                    )}
                  </li>
                  <li>
                    {t(
                      en,
                      "রক্তদানের দিন সুস্থ আছেন কি না জানান",
                      "Discuss your health on the donation day",
                    )}
                  </li>
                  <li>
                    {t(
                      en,
                      "দানের আগে হিমোগ্লোবিন পরীক্ষা করান",
                      "Have haemoglobin checked before donation",
                    )}
                  </li>
                  <li>
                    {t(
                      en,
                      "শেষ রক্তদানের তারিখ স্বাস্থ্যকর্মীকে জানান",
                      "Tell staff when you last donated",
                    )}
                  </li>
                </ul>
              </div>

              <div>
                <div className="eligibility-subcol-title danger">
                  <ShieldAlert size={16} />
                  <span>
                    {t(en, "দান করার আগে না", "Tell the clinical team")}
                  </span>
                </div>
                <ul className="eligibility-list danger">
                  <li>
                    {t(
                      en,
                      "বর্তমান অসুস্থতা বা দীর্ঘস্থায়ী রোগ",
                      "Current illness or long-term conditions",
                    )}
                  </li>
                  <li>
                    {t(
                      en,
                      "গর্ভাবস্থা বা স্তন্যদান",
                      "Pregnancy or breastfeeding",
                    )}
                  </li>
                  <li>
                    {t(
                      en,
                      "সাম্প্রতিক অস্ত্রোপচার বা চিকিৎসা",
                      "Recent surgery or treatment",
                    )}
                  </li>
                  <li>
                    {t(
                      en,
                      "জ্বর, সংক্রমণ এবং চলমান ওষুধ",
                      "Fever, infection and current medication",
                    )}
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="advisory-right-card">
            <div>
              <div className="advisory-header">
                <Building2 size={20} />
                <span>
                  {t(
                    en,
                    "মধুপুর উপজেলা স্বাস্থ্য পরামর্শ",
                    "Madhupur Health Advisory",
                  )}
                </span>
              </div>
              <p className="advisory-text">
                {t(
                  en,
                  "জরুরি রক্তের ক্রস-ম্যাচিং ও নিরাপদ ট্রান্সফিউশনের জন্য সর্বদা রেজিস্টার্ড ল্যাব বা উপজেলা স্বাস্থ্য কমপ্লেক্সের তত্ত্বাবধানে রক্তদান সম্পন্ন করুন। রক্তদানে কোনো প্রকার আর্থিক লেনদেন পরিহার করুন।",
                  "Always complete cross-matching and transfusion under the supervision of registered hospital labs. Blood donation is strictly voluntary and non-commercial.",
                )}
              </p>
            </div>
            <a
              href="https://www.who.int/campaigns/world-blood-donor-day/2018/who-can-give-blood"
              target="_blank"
              rel="noreferrer"
              className="advisory-link"
            >
              <span>
                {t(en, "WHO-এর সাধারণ নির্দেশনা", "WHO eligibility guidance")}
              </span>
              <ArrowRight size={15} />
            </a>
          </div>
        </div>
      </section>

      {/* ======================================================================
          7. FAQ ACCORDION SECTION
          ====================================================================== */}
      <section
        className="section-wrapper"
        style={{ marginTop: 64, marginBottom: 80 }}
      >
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div className="section-pill-tag">
            <CheckCircle2 size={14} />
            <span>{t(en, "সাধারণ জিজ্ঞাসা", "FAQ")}</span>
          </div>
          <h2 className="section-title">
            {t(
              en,
              "রক্তদান সম্পর্কে কিছু প্রয়োজনীয় তথ্য",
              "Frequently Asked Questions",
            )}
          </h2>
          <p className="section-subtitle">
            {t(
              en,
              "রক্তদান ও এই প্ল্যাটফর্ম ব্যবহার সম্পর্কিত সাধারণ প্রশ্নগুলোর উত্তর।",
              "Important questions and answers about voluntary blood donation and this platform.",
            )}
          </p>
        </div>

        <div className="faq-container">
          <div className="faq-list">
            {helpFaq
              .map((row) => ({ q: row[en ? 1 : 0], a: row[en ? 3 : 2] }))
              .map((faq, index) => {
                const isOpen = activeFaq === index;
                return (
                  <div
                    className={`faq-item ${isOpen ? "active" : ""}`}
                    key={index}
                  >
                    <button
                      type="button"
                      className="faq-question-btn"
                      aria-expanded={isOpen}
                      aria-controls={`faq-answer-${index}`}
                      onClick={() => setActiveFaq(isOpen ? null : index)}
                    >
                      <span>{faq.q}</span>
                      <ChevronDown size={18} />
                    </button>
                    {isOpen && (
                      <div className="faq-answer" id={`faq-answer-${index}`}>
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      </section>
    </>
  );
}
