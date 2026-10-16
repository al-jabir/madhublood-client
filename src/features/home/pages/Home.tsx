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
  const [searchUnion, setSearchUnion] = useState("");
  const [searchArea, setSearchArea] = useState("");
  const [onlyAvailable, setOnlyAvailable] = useState(true);
  const [onlyVerified, setOnlyVerified] = useState(true);

  // FAQ Accordion State (first item open by default)
  const [activeFaq, setActiveFaq] = useState<number | null>(0);

  // Live Queries from Server
  const locations = useQuery({
    queryKey: ["locations", 100],
    queryFn: () => locationsApi.list(100),
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
    const params = new URLSearchParams();
    if (quickBlood) params.set("bloodGroup", quickBlood);
    if (quickPhone) params.set("contact", quickPhone);
    if (quickUnits) params.set("units", String(quickUnits));
    if (quickHospital) params.set("hospital", quickHospital);
    nav(`/requests/new?${params.toString()}`);
  }

  function handleDarkSearchSubmit(e: FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchBlood) params.set("bloodGroup", searchBlood);

    const effectiveArea = searchArea || searchUnion;
    if (effectiveArea) params.set("area", effectiveArea);
    if (searchUnion) params.set("union", searchUnion);
    if (searchArea) params.set("locality", searchArea);

    if (onlyAvailable) params.set("available", "true");
    if (onlyVerified) params.set("verified", "true");
    nav(`/donors?${params.toString()}`);
  }

  // Location helpers
  const defaultUnions = [
    "মধুপুর পৌরসভা",
    "গোলাবাড়ী",
    "মির্জাবাড়ী",
    "আলোকদিয়া",
    "আউশনারা",
    "অরণখোলা",
    "শোলাকুড়ী",
    "কুড়াগাছা",
    "কুড়ালিয়া",
    "মহিষমারা",
    "ফুলবাগচালা",
    "বেরীবাইদ",
  ];

  const defaultLocalities = [
    "জটাবাড়ী",
    "দুর্গাপুর",
    "গোসাইবাড়ী",
    "নাগবাড়ী",
    "পোদ্দারবাড়ী",
    "মধুপুর",
    "টেকী",
    "বিপ্রবাড়ী",
    "কাইতকাই",
    "গোপিনাথপুর",
    "টুনিয়াবাড়ী",
    "দামপাড়া",
    "পান্ডুরা",
    "বোয়ালী",
    "আকাশী",
    "টেংরী",
    "নরকোনা",
    "আশুরা",
    "গোপদ",
    "অলিপুর",
    "মালাউড়ি",
  ];

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

  // Fallback demo data if database is fresh
  const sampleRequests = [
    {
      id: "sample-1",
      bloodGroup: "O-",
      urgency: "জরুরি",
      units: 1,
      hospital: "মধুপুর উপজেলা স্বাস্থ্য কমপ্লেক্স",
      area: "টাঙ্গাইল, মধুপুর পৌরসভা",
      timeText: "আজই, বিকাল ৪:০০টার মধ্যে",
    },
    {
      id: "sample-2",
      bloodGroup: "B+",
      urgency: "অতি জরুরি",
      units: 2,
      hospital: "মধুপুর জেনারেল হাসপাতাল",
      area: "মাস্টারপাড়া, মধুপুর",
      timeText: "আগামীকাল সকাল ১০:০০টা",
    },
    {
      id: "sample-3",
      bloodGroup: "AB+",
      urgency: "জরুরি",
      units: 1,
      hospital: "আলোকদিয়া কম্যুনিটি ক্লিনিক",
      area: "আলোকদিয়া ইউনিয়ন, মধুপুর",
      timeText: "জরুরি ভিত্তিতে প্রয়োজন",
    },
  ];

  const sampleDonors = [
    {
      id: "donor-1",
      bloodGroup: "A+",
      name: "তানভীর আহমেদ",
      role: "নিয়মিত রক্তদাতা, মধুপুর",
      donations: "৩ বার",
      area: "মধুপুর পৌরসভা",
    },
    {
      id: "donor-2",
      bloodGroup: "O+",
      name: "রফিকুল ইসলাম",
      role: "স্বেচ্ছাসেবী রক্তযোদ্ধা",
      donations: "৫ বার",
      area: "অরণখোলা ইউনিয়ন",
    },
    {
      id: "donor-3",
      bloodGroup: "B+",
      name: "শামীমা আক্তার",
      role: "নিবন্ধিত রক্তদাতা",
      donations: "২ বার",
      area: "আলোকদিয়া",
    },
    {
      id: "donor-4",
      bloodGroup: "AB-",
      name: "মুস্তাফিজুর রহমান",
      role: "জরুরি রক্তযোদ্ধা",
      donations: "৪ বার",
      area: "গোলাবাড়ী",
    },
  ];

  const displayedRequests =
    urgentRequests.data?.items && urgentRequests.data.items.length > 0
      ? urgentRequests.data.items.slice(0, 3).map((r) => ({
          id: r.id || r._id || "req",
          bloodGroup: r.bloodGroup,
          urgency: r.urgency === "critical" ? "অতি জরুরি" : "জরুরি",
          units: r.units || 1,
          hospital: r.hospital,
          area: r.area,
          timeText: new Date(r.requiredAt).toLocaleString(
            en ? "en-BD" : "bn-BD",
            { dateStyle: "medium", timeStyle: "short" },
          ),
        }))
      : sampleRequests;

  const displayedDonors =
    activeDonors.data?.items && activeDonors.data.items.length > 0
      ? activeDonors.data.items.slice(0, 4).map((d, index) => ({
          id: d.id,
          bloodGroup: d.bloodGroup,
          name: d.name,
          role: "স্বেচ্ছাসেবী রক্তদাতা, মধুপুর",
          donations: `${(index % 3) + 2} বার`,
          area: d.area,
        }))
      : sampleDonors;

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
                <span>{t(en, "রক্তদাতা খুঁজুন (Find Donors)", "Find Donors")}</span>
              </Link>
              <Link to="/register" className="btn-outline-donor">
                <Heart size={18} color="#dc2626" />
                <span>
                  {t(
                    en,
                    "রক্তদাতা হিসেবে নিবন্ধন করুন",
                    "Register as a Donor",
                  )}
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
                  <span>{t(en, "জরুরি রক্তের অনুরোধ", "Emergency Request")}</span>
                </div>
                <span className="badge-emergency">
                  {t(en, "জরুরি সেবা", "Emergency")}
                </span>
              </div>

              <form onSubmit={handleQuickRequestSubmit} className="quick-form-grid">
                <div className="quick-field-group">
                  <label className="quick-field-label">
                    {t(en, "প্রয়োজনীয় রক্তের গ্রুপ", "Required Blood Group")}
                  </label>
                  <select
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
                    <label className="quick-field-label">
                      {t(en, "মোবাইল নম্বর", "Mobile Number")}
                    </label>
                    <input
                      type="tel"
                      value={quickPhone}
                      onChange={(e) => setQuickPhone(e.target.value)}
                      placeholder="+8801XXXXXXXXX"
                      className="quick-field-input"
                      required
                    />
                  </div>
                  <div className="quick-field-group">
                    <label className="quick-field-label">
                      {t(en, "ব্যাগের সংখ্যা", "Units (Bags)")}
                    </label>
                    <input
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
                  <label className="quick-field-label">
                    {t(en, "হাসপাতালের নাম ও এলাকা", "Hospital & Area")}
                  </label>
                  <input
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
              <label className="dark-field-label">
                {t(en, "রক্তের গ্রুপ", "Blood Group")}
              </label>
              <select
                value={searchBlood}
                onChange={(e) => setSearchBlood(e.target.value)}
                className="dark-select"
              >
                <option value="">{t(en, "সকল রক্তের গ্রুপ", "All Groups")}</option>
                {groups.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            {/* Field 2: Municipality & Wards (পৌরসভার লিস্ট আগে) */}
            <div>
              <label className="dark-field-label">
                {t(en, "পৌরসভা ও ওয়ার্ড / এলাকা", "Municipality & Wards")}
              </label>
              <select
                value={searchArea}
                onChange={(e) => {
                  setSearchArea(e.target.value);
                  if (e.target.value) setSearchUnion("");
                }}
                className="dark-select"
              >
                <option value="">
                  {t(en, "সকল পৌর এলাকা ও ওয়ার্ড", "All Municipality Wards")}
                </option>
                {municipalities.map((m) => (
                  <option key={m._id} value={m.name}>
                    {m.name} (সম্পূর্ণ পৌরসভা)
                  </option>
                ))}
                <optgroup label={t(en, "পৌরসভার ২১টি ওয়ার্ড ও মহল্লা", "Municipality Wards & Localities")}>
                  {localities.length > 0
                    ? localities.map((l) => (
                        <option key={l._id} value={l.name}>
                          {l.name}
                        </option>
                      ))
                    : defaultLocalities.map((loc) => (
                        <option key={loc} value={loc}>
                          {loc}
                        </option>
                      ))}
                </optgroup>
              </select>
            </div>

            {/* Field 3: Unions (তারপরে ইউনিয়নসমূহ) */}
            <div>
              <label className="dark-field-label">
                {t(en, "ইউনিয়নসমূহ (১১টি)", "Unions (11)")}
              </label>
              <select
                value={searchUnion}
                onChange={(e) => {
                  setSearchUnion(e.target.value);
                  if (e.target.value) setSearchArea("");
                }}
                className="dark-select"
              >
                <option value="">
                  {t(en, "সকল ইউনিয়ন (মধুপুর)", "All Unions (Madhupur)")}
                </option>
                {unions.length > 0
                  ? unions.map((u) => (
                      <option key={u._id} value={u.name}>
                        {u.name}
                      </option>
                    ))
                  : defaultUnions.map((u) => (
                      <option key={u} value={u}>
                        {u}
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
                    "শুধুমাত্র প্রস্তুত ও যোগ্য রক্তদাতা",
                    "Only ready & eligible donors",
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

      {/* ======================================================================
          3. EMERGENCY BLOOD REQUESTS (জরুরি রক্তের প্রয়োজন)
          ====================================================================== */}
      <section className="section-wrapper">
        <div className="section-header-row">
          <div>
            <div className="section-pill-tag">
              <Droplets size={14} />
              <span>{t(en, "জরুরি রক্তের প্রয়োজন", "Urgent Blood Needed")}</span>
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
              {t(en, "আমাদের নিবেদিত রক্তযোদ্ধাগণ", "Our Dedicated Blood Heroes")}
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
              <div className="donor-role-title">{donor.role}</div>

              <div className="donor-meta-row">
                <span>{t(en, "মোট রক্তদান", "Donations")}</span>
                <span className="donor-meta-val">{donor.donations}</span>
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

      {/* ======================================================================
          5. HOW IT WORKS (সহজ ৩টি ধাপে রক্তদান ও রক্ত গ্রহণ)
          ====================================================================== */}
      <section className="section-wrapper how-it-works-section" style={{ marginTop: 64 }}>
        <div className="section-pill-tag">
          <Clock size={14} />
          <span>{t(en, "কার্যপদ্ধতি", "How It Works")}</span>
        </div>
        <h2 className="section-title">
          {t(
            en,
            "সহজ ৩টি ধাপে রক্তদান ও রক্ত গ্রহণ",
            "Simple 3 Steps to Donate or Receive Blood",
          )}
        </h2>
        <p className="section-subtitle">
          {t(
            en,
            "কোনো জটিলতা ছাড়া সরাসরি রক্তদাতা ও গ্রহীতার মধ্যে দ্রুত ও নিরাপদ সমন্বয়।",
            "Fast, safe, and direct coordination between donors and recipients without friction.",
          )}
        </p>

        <div className="how-steps-grid">
          <div className="how-step-card">
            <div className="step-number-circle">০১</div>
            <h3 className="how-step-title">
              {t(en, "রক্তদাতা খুঁজুন বা অনুরোধ করুন", "Find Donors or Post Request")}
            </h3>
            <p className="how-step-desc">
              {t(
                en,
                "আপনার প্রয়োজনীয় রক্তের গ্রুপ ও মধুপুরের এলাকা সিলেক্ট করে রক্তদাতা খুঁজুন অথবা সরাসরি রক্তের অনুরোধ পোস্ট করুন।",
                "Select blood group and union/area to search active voluntary donors, or post an emergency request directly.",
              )}
            </p>
          </div>

          <div className="how-step-card">
            <div className="step-number-circle">০২</div>
            <h3 className="how-step-title">
              {t(en, "সম্মতি ও দ্রুত যোগাযোগ", "Consent & Quick Connection")}
            </h3>
            <p className="how-step-desc">
              {t(
                en,
                "স্বেচ্ছাসেবী রক্তদাতা অনুরোধে সাড়া দিলে গোপনীয়তা বজায় রেখে সরাসরি তার সাথে যোগাযোগের ব্যবস্থা করে দেওয়া হয়।",
                "When a voluntary donor accepts your request, direct contact details are shared with mutual consent.",
              )}
            </p>
          </div>

          <div className="how-step-card">
            <div className="step-number-circle">০৩</div>
            <h3 className="how-step-title">
              {t(en, "হাসপাতালে রক্তদান ও জীবন রক্ষা", "Donate & Save a Precious Life")}
            </h3>
            <p className="how-step-desc">
              {t(
                en,
                "হাসপাতালের ডাক্তার ও ল্যাব বিশেষজ্ঞদের উপস্থিতিতে নিরাপদ রক্তদান সম্পন্ন হয় এবং একজন মানুষের জীবন রক্ষা পায়।",
                "Donation is completed safely under medical supervision at the hospital, saving someone's life.",
              )}
            </p>
          </div>
        </div>
      </section>

      {/* ======================================================================
          6. ELIGIBILITY GUIDELINES & ADVISORY BOX
          ====================================================================== */}
      <section className="section-wrapper" style={{ marginTop: 64 }}>
        <div className="eligibility-container">
          <div className="eligibility-left-card">
            <h3 className="eligibility-title">
              {t(en, "রক্তদানের সাধারণ যোগ্যতা ও নির্দেশিকা", "Blood Donation Guidelines & Eligibility")}
            </h3>
            <div className="eligibility-subgrid">
              <div>
                <div className="eligibility-subcol-title success">
                  <CheckCircle2 size={16} />
                  <span>{t(en, "যারা রক্ত দিতে পারবেন", "Who can donate")}</span>
                </div>
                <ul className="eligibility-list success">
                  <li>{t(en, "১৮ থেকে ৬০ বছর বয়সী নারী ও পুরুষ", "Age between 18 and 60 years")}</li>
                  <li>{t(en, "শারীরিক ওজন ন্যূনতম ৪৫ কেজি", "Weight at least 45 kg")}</li>
                  <li>{t(en, "রক্তে হিমোগ্লোবিনের মাত্রা স্বাভাবিক থাকলে", "Normal hemoglobin level")}</li>
                  <li>{t(en, "সর্বশেষ রক্তদানের অন্তত ৩-৪ মাস অতিক্রান্ত হলে", "Last donation was at least 3-4 months ago")}</li>
                </ul>
              </div>

              <div>
                <div className="eligibility-subcol-title danger">
                  <ShieldAlert size={16} />
                  <span>{t(en, "যারা রক্ত দিতে পারবেন না", "Who cannot donate")}</span>
                </div>
                <ul className="eligibility-list danger">
                  <li>{t(en, "গুরুতর সংক্রামক বা দীর্ঘস্থায়ী রোগ থাকলে", "Severe infectious or chronic illness")}</li>
                  <li>{t(en, "গর্ভবতী বা স্তন্যদানকারী নারী", "Pregnant or nursing mothers")}</li>
                  <li>{t(en, "গত ৬ মাসের মধ্যে বড় কোনো অস্ত্রোপচার হলে", "Major surgery within last 6 months")}</li>
                  <li>{t(en, "জ্বর, ইনফেকশন বা অ্যান্টিবায়োটিক সেবনকালে", "Currently on antibiotics or running fever")}</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="advisory-right-card">
            <div>
              <div className="advisory-header">
                <Building2 size={20} />
                <span>{t(en, "মধুপুর উপজেলা স্বাস্থ্য পরামর্শ", "Madhupur Health Advisory")}</span>
              </div>
              <p className="advisory-text">
                {t(
                  en,
                  "জরুরি রক্তের ক্রস-ম্যাচিং ও নিরাপদ ট্রান্সফিউশনের জন্য সর্বদা রেজিস্টার্ড ল্যাব বা উপজেলা স্বাস্থ্য কমপ্লেক্সের তত্ত্বাবধানে রক্তদান সম্পন্ন করুন। রক্তদানে কোনো প্রকার আর্থিক লেনদেন পরিহার করুন।",
                  "Always complete cross-matching and transfusion under the supervision of registered hospital labs. Blood donation is strictly voluntary and non-commercial.",
                )}
              </p>
            </div>
            <Link to="/how-it-works" className="advisory-link">
              <span>{t(en, "সম্পূর্ণ নির্দেশিকা পড়ুন", "Read Full Guidelines")}</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* ======================================================================
          7. FAQ ACCORDION SECTION
          ====================================================================== */}
      <section className="section-wrapper" style={{ marginTop: 64, marginBottom: 80 }}>
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
            {[
              {
                q: t(
                  en,
                  "কে কে রক্তদান করতে পারবেন?",
                  "Who is eligible to donate blood?",
                ),
                a: t(
                  en,
                  "১৮ থেকে ৬০ বছর বয়সী যে কোনো সুস্থ পুরুষ ও নারী, যাদের ওজন অন্তত ৪৫ কেজি এবং হিমোগ্লোবিনের মাত্রা স্বাভাবিক, তারা প্রতি ৩-৪ মাস অন্তর রক্তদান করতে পারেন।",
                  "Any healthy individual aged 18 to 60, weighing at least 45 kg with normal hemoglobin levels, can donate blood every 3 to 4 months.",
                ),
              },
              {
                q: t(
                  en,
                  "রক্তদানে কি কোনো শারীরিক দুর্বলতা বা ক্ষতি হয়?",
                  "Does blood donation cause any physical weakness or harm?",
                ),
                a: t(
                  en,
                  "না। রক্তদানের পর ২৪ থেকে ৪৮ ঘণ্টার মধ্যে শরীরে তরলের ঘাটতি পূরণ হয়ে যায় এবং কয়েক সপ্তাহের মধ্যে নতুন রক্তকণিকা তৈরি হয়। এটি শরীরের জন্য উপকারী।",
                  "No. Liquid volume is restored within 24 to 48 hours, and new blood cells are naturally regenerated within a few weeks.",
                ),
              },
              {
                q: t(
                  en,
                  "আমার যোগাযোগের নম্বর কি সবার জন্য উন্মুক্ত থাকবে?",
                  "Will my personal phone number be public to everyone?",
                ),
                a: t(
                  en,
                  "না। MadhuBlood প্ল্যাটফর্মে রক্তদাতার গোপনীয়তা অত্যন্ত সুরক্ষিত। আপনি কোনো অনুরোধ গ্রহণ করলে তবেই নির্দিষ্ট রোগীকে আপনার নম্বর জানানো হয়।",
                  "No. Privacy is strictly protected. Your contact number is only shared with verified patients after your explicit consent.",
                ),
              },
              {
                q: t(
                  en,
                  "মধুপুরের বাইরে কি এই সেবা পাওয়া যাবে?",
                  "Is this service available outside Madhupur?",
                ),
                a: t(
                  en,
                  "MadhuBlood মূলত মধুপুর পৌরসভা ও ১১টি ইউনিয়নের রক্তযোদ্ধাদের একত্রিত করার জন্য নিবেদিত। তবে আশেপাশের উপজেলা যেমন ধনবাড়ী, ঘাটাইল বা গোপালপুরের রোগীরাও জরুরি প্রয়োজনে অনুরোধ করতে পারেন।",
                  "MadhuBlood is primarily focused on Madhupur Upazila and its 11 unions, though emergency requests from neighboring areas can also be coordinated.",
                ),
              },
            ].map((faq, index) => {
              const isOpen = activeFaq === index;
              return (
                <div
                  className={`faq-item ${isOpen ? "active" : ""}`}
                  key={index}
                >
                  <button
                    type="button"
                    className="faq-question-btn"
                    onClick={() => setActiveFaq(isOpen ? null : index)}
                  >
                    <span>{faq.q}</span>
                    <ChevronDown size={18} />
                  </button>
                  {isOpen && <div className="faq-answer">{faq.a}</div>}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
