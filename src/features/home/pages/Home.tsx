import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Droplets,
  ArrowUpRight,
  ArrowRight,
  Search,
  MapPin,
  ShieldCheck,
  Heart,
  Users,
  Plus,
} from "lucide-react";
import { usePrefs } from "@/store/preferences.store";
import { groups } from "@/features/donors/constants/blood-groups";
import { t } from "@/i18n/translate";
import { RequestList } from "@/features/blood-requests/components/RequestList";
import { locationsApi } from "@/features/locations/api/locations.api";

export function Home() {
  const { en } = usePrefs();
  const [blood, setBlood] = useState("");
  const [area, setArea] = useState("");
  const nav = useNavigate();

  const locQ = useQuery({
    queryKey: ["locations", 50],
    queryFn: () => locationsApi.list(50),
    staleTime: 1000 * 60 * 10,
  });
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="status-dot" />
            {t(
              en,
              "মধুপুরের মানুষ, মধুপুরের পাশে",
              "OUR COMMUNITY. OUR RESPONSIBILITY.",
            )}
          </div>
          <h1>
            {t(en, "আপনার এক ব্যাগ রক্ত,", "One donation.")}
            <br />
            <em>{t(en, "কারও নতুন জীবন।", "A new chance at life.")}</em>
          </h1>
          <p>
            {t(
              en,
              "রক্তের প্রয়োজনে আপনি একা নন। মধুপুরের স্বেচ্ছাসেবী রক্তদাতাদের সঙ্গে যুক্ত হোন—সহজে, নিরাপদে, সঠিক সময়ে।",
              "When blood is needed, no one should feel alone. Connect with voluntary donors in Madhupur—simply, safely, and when it matters.",
            )}
          </p>
          <div className="hero-buttons">
            <Link to="/donors" className="button">
              <Search size={18} />
              {t(en, "রক্তদাতা খুঁজুন", "Find a blood donor")}
              <ArrowUpRight size={18} />
            </Link>
            <Link to="/requests/new" className="button secondary">
              <Plus size={18} />
              {t(en, "রক্তের অনুরোধ করুন", "Request blood")}
            </Link>
          </div>
          <div className="trust">
            <span>
              <ShieldCheck size={17} />
              {t(en, "ব্যক্তিগত তথ্য সুরক্ষিত", "Privacy comes first")}
            </span>
            <span>
              <Heart size={17} />
              {t(en, "সম্পূর্ণ স্বেচ্ছাসেবী", "Always voluntary")}
            </span>
          </div>
        </div>
        <div
          className="hero-art"
          aria-label="An illustration of a blood donation bag connecting the community"
        >
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="art-label">
            <span className="status-dot" />
            {t(en, "একসাথে, জীবনের পাশে", "Together, for life")}
          </div>
          <div className="blood-bag">
            <div className="bag-handle" />
            <div className="bag-label">
              <Droplets size={38} fill="currentColor" />
              <strong>এক ব্যাগ ভালোবাসা</strong>
              <span>A GIFT OF LIFE</span>
              <div className="bag-cross">+</div>
            </div>
            <div className="bag-bottom" />
          </div>
          <div className="tube" />
          <div className="float-card float-heart">
            <span className="soft-icon">
              <Heart fill="currentColor" size={20} />
            </span>
            <div>
              <strong>
                {t(en, "রক্ত দিন, জীবন বাঁচান", "Give blood. Give hope.")}
              </strong>
              <small>
                {t(
                  en,
                  "আপনার ইচ্ছেটুকুই প্রথম পদক্ষেপ",
                  "It starts with your willingness",
                )}
              </small>
            </div>
          </div>
          <div className="float-card float-shield">
            <ShieldCheck className="green" size={23} />
            <div>
              <strong>{t(en, "নিরাপদ সংযোগ", "A safer connection")}</strong>
              <small>
                {t(
                  en,
                  "আপনার সম্মতি, আপনার নিয়ন্ত্রণ",
                  "Your consent. Your control.",
                )}
              </small>
            </div>
          </div>
          <span className="art-plus p1">+</span>
          <span className="art-plus p2">+</span>
        </div>
      </section>
      <section className="quick-search">
        <div>
          <span className="overline">
            {t(en, "প্রয়োজনে, পাশে আছি", "LET’S FIND YOUR MATCH")}
          </span>
          <h2>
            {t(
              en,
              "কোন গ্রুপের রক্ত খুঁজছেন?",
              "Which blood group do you need?",
            )}
          </h2>
        </div>
        <div className="quick-controls">
          <label className="select-wrap">
            <Droplets size={18} />
            <select
              aria-label="Blood group"
              value={blood}
              onChange={(e) => setBlood(e.target.value)}
            >
              <option value="">{t(en, "রক্তের গ্রুপ", "Blood group")}</option>
              {groups.map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>
          </label>
          <label className="select-wrap">
            <MapPin size={18} />
            <select
              aria-label="Area"
              value={area}
              onChange={(e) => setArea(e.target.value)}
            >
              <option value="">
                {t(en, "সকল এলাকা (মধুপুর)", "All Madhupur")}
              </option>
              {locQ.data?.items?.map((l) => (
                <option key={l._id} value={l.name}>
                  {l.name}
                </option>
              ))}
            </select>
          </label>
          <button
            className="button"
            onClick={() => {
              const sp = new URLSearchParams();
              if (blood) sp.set("bloodGroup", blood);
              if (area) sp.set("area", area);
              const qs = sp.toString();
              nav("/donors" + (qs ? "?" + qs : ""));
            }}
          >
            <Search size={18} />
            {t(en, "খুঁজুন", "Search")}
          </button>
        </div>
      </section>
      <section className="values">
        <div>
          <span className="value-icon">
            <Users />
          </span>
          <div>
            <strong>
              {t(en, "স্থানীয় মানুষের নেটওয়ার্ক", "Rooted in our community")}
            </strong>
            <p>
              {t(
                en,
                "আপনার এলাকার রক্তদাতার সঙ্গে সংযোগ",
                "Connect with donors in your area",
              )}
            </p>
          </div>
        </div>
        <div>
          <span className="value-icon">
            <ShieldCheck />
          </span>
          <div>
            <strong>
              {t(en, "আপনার গোপনীয়তা আগে", "Your privacy, protected")}
            </strong>
            <p>
              {t(
                en,
                "সম্মতি ছাড়া ব্যক্তিগত যোগাযোগ প্রকাশ নয়",
                "Contact details shared with consent",
              )}
            </p>
          </div>
        </div>
        <div>
          <span className="value-icon">
            <Heart />
          </span>
          <div>
            <strong>
              {t(en, "মানবতার জন্য, বিনামূল্যে", "Voluntary, always free")}
            </strong>
            <p>
              {t(
                en,
                "রক্তদানে নেই কোনো লেনদেন",
                "A gift of life, never a transaction",
              )}
            </p>
          </div>
        </div>
      </section>
      <section className="section">
        <div className="section-heading">
          <div>
            <span className="overline">
              {t(en, "একটু এগিয়ে আসুন", "BE THERE WHEN IT MATTERS")}
            </span>
            <h2>{t(en, "জরুরি রক্তের অনুরোধ", "Active blood requests")}</h2>
            <p>
              {t(
                en,
                "একটি সাড়া হয়তো বদলে দিতে পারে একটি পরিবারের গল্প।",
                "Your response could make a difference to a family.",
              )}
            </p>
          </div>
          <Link to="/requests" className="text-link">
            {t(en, "সব অনুরোধ দেখুন", "View all requests")}
            <ArrowRight size={17} />
          </Link>
        </div>
        <RequestList compact />
      </section>
      <section className="how section">
        <div className="section-heading">
          <div>
            <span className="overline">
              {t(en, "সহজ তিনটি ধাপ", "A SIMPLE WAY TO HELP")}
            </span>
            <h2>
              {t(
                en,
                "জীবনের পাশে দাঁড়ানো এখন আরও সহজ",
                "A connection that starts with you",
              )}
            </h2>
          </div>
          <Link to="/how-it-works" className="text-link">
            {t(en, "বিস্তারিত জানুন", "Learn more")}
            <ArrowRight size={17} />
          </Link>
        </div>
        <div className="steps">
          {[
            [
              Search,
              "রক্তদাতা খুঁজুন",
              "Find your blood group",
              "প্রয়োজনীয় গ্রুপ ও এলাকা দিয়ে খুঁজুন।",
              "Search the group and area you need.",
            ],
            [
              ShieldCheck,
              "নিরাপদে সংযুক্ত হোন",
              "Connect with consent",
              "যাচাই করা অনুরোধে রক্তদাতার সাড়া পান।",
              "Receive donor responses to a reviewed request.",
            ],
            [
              Heart,
              "জীবনের পাশে থাকুন",
              "Make a difference",
              "হাসপাতালের পরামর্শে রক্তদানে এগিয়ে আসুন।",
              "Coordinate donation with the clinical team.",
            ],
          ].map(([Icon, bn, eng, desc, edesc], i) => {
            const I = Icon as typeof Search;
            return (
              <div className="step" key={i}>
                <span className="step-number">0{i + 1}</span>
                <I size={27} />
                <h3>{t(en, bn as string, eng as string)}</h3>
                <p>{t(en, desc as string, edesc as string)}</p>
              </div>
            );
          })}
        </div>
      </section>
      <section className="join">
        <div>
          <span className="overline">
            {t(
              en,
              "আপনিও হতে পারেন কারও আশার আলো",
              "SOMEONE’S HOPE COULD START WITH YOU",
            )}
          </span>
          <h2>
            {t(
              en,
              "রক্তদাতা হোন। মানবতার পাশে থাকুন।",
              "Be a donor. Be someone’s reason to hope.",
            )}
          </h2>
          <p>
            {t(
              en,
              "আজই যুক্ত হোন মধুপুরের স্বেচ্ছাসেবী রক্তদাতা পরিবারে।",
              "Join Madhupur’s voluntary blood donor community today.",
            )}
          </p>
        </div>
        <Link to="/register" className="button white">
          {t(en, "রক্তদাতা হিসেবে যোগ দিন", "Join the community")}
          <ArrowUpRight size={18} />
        </Link>
      </section>
    </>
  );
}
