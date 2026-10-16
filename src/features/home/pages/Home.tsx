import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  ArrowUpRight,
  Droplet,
  Heart,
  MapPin,
  Plus,
  Search,
  ShieldCheck,
  Users,
  HandHeart,
  ArrowDown,
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
  const locations = useQuery({
    queryKey: ["locations", 50],
    queryFn: () => locationsApi.list(50),
    staleTime: 600000,
  });
  function search(event: FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (blood) params.set("bloodGroup", blood);
    if (area) params.set("area", area);
    nav(`/donors${params.size ? `?${params}` : ""}`);
  }
  return (
    <>
      <section className="community-hero">
        <div className="community-hero-copy">
          <span className="community-kicker">
            <span className="status-dot" />
            {t(
              en,
              "মধুপুরের মানুষ, মধুপুরের পাশে",
              "LOCAL PEOPLE. LIFE-CHANGING CONNECTIONS.",
            )}
          </span>
          <h1>
            {t(en, "আপনার এক ব্যাগ রক্ত,", "A little of you.")}
            <br />
            <span>{t(en, "কারও পুরো পৃথিবী।", "A whole life ahead.")}</span>
          </h1>
          <p>
            {t(
              en,
              "প্রয়োজনে হাত বাড়িয়ে দিন। আপনার কাছের স্বেচ্ছাসেবী রক্তদাতাদের সঙ্গে যুক্ত হোন, কিংবা কারও জীবনের নতুন শুরুর অংশ হোন।",
              "Be there when it matters. Find voluntary donors near you, ask for help, or become someone’s reason to hope.",
            )}
          </p>
          <div className="hero-buttons">
            <Link to="/donors" className="button">
              <Search size={18} />
              {t(en, "রক্তদাতা খুঁজুন", "Find a donor")}
              <ArrowUpRight size={18} />
            </Link>
            <Link to="/register" className="button secondary">
              {t(en, "রক্তদাতা হতে চাই", "I want to help")}
              <Heart size={17} />
            </Link>
          </div>
          <div className="community-proof">
            <ShieldCheck size={18} />
            <span>
              {t(en, "সম্মতিভিত্তিক যোগাযোগ", "Consent-first connections")}
            </span>
            <i />
            <span>{t(en, "সম্পূর্ণ স্বেচ্ছাসেবী", "Always voluntary")}</span>
          </div>
        </div>
        <div className="donation-visual" aria-hidden="true">
          <div className="visual-topline">
            <span>
              <span className="status-dot" /> MADHUBLOOD COMMUNITY
            </span>
            <ArrowUpRight size={20} />
          </div>
          <div className="life-ring ring-outer" />
          <div className="life-ring ring-inner" />
          <div className="visual-word">
            GIVE
            <br />
            <span>HOPE.</span>
          </div>
          <div className="donation-drop">
            <Droplet size={135} strokeWidth={1} />
            <Heart size={33} fill="currentColor" />
          </div>
          <div className="group-token token-one">A+</div>
          <div className="group-token token-two">O−</div>
          <div className="group-token token-three">B+</div>
          <div className="visual-note">
            <span className="note-heart">
              <HandHeart size={24} />
            </span>
            <div>
              <strong>
                {t(en, "এক ব্যাগ ভালোবাসা", "A gift that matters.")}
              </strong>
              <small>
                {t(en, "একসাথে, জীবনের পাশে", "From one person. To another.")}
              </small>
            </div>
          </div>
          <span className="visual-caption">
            EVERY CONNECTION STARTS WITH CARE
          </span>
        </div>
      </section>
      <section className="finder-section" aria-labelledby="finder-title">
        <div className="finder-intro">
          <span className="overline">
            {t(
              en,
              "একটি সংযোগই বদলে দিতে পারে সবকিছু",
              "YOUR SEARCH STARTS HERE",
            )}
          </span>
          <h2 id="finder-title">
            {t(en, "কোন গ্রুপের রক্ত খুঁজছেন?", "Let’s find your match.")}
          </h2>
        </div>
        <form className="quick-controls" onSubmit={search}>
          <label className="finder-field">
            <span>
              <Droplet size={15} />
              {t(en, "রক্তের গ্রুপ", "Blood group")}
            </span>
            <select
              aria-label="Blood group"
              value={blood}
              onChange={(e) => setBlood(e.target.value)}
            >
              <option value="">{t(en, "সব গ্রুপ", "Any blood group")}</option>
              {groups.map((group) => (
                <option key={group}>{group}</option>
              ))}
            </select>
          </label>
          <label className="finder-field">
            <span>
              <MapPin size={15} />
              {t(en, "এলাকা", "Location")}
            </span>
            <select
              aria-label="Area"
              value={area}
              onChange={(e) => setArea(e.target.value)}
            >
              <option value="">
                {t(en, "মধুপুরের সব এলাকা", "All Madhupur")}
              </option>
              {locations.data?.items.map((item) => (
                <option key={item._id} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <button className="button" type="submit">
            <Search size={18} />
            {t(en, "রক্তদাতা খুঁজুন", "Search donors")}
          </button>
        </form>
        {locations.isError && (
          <p className="finder-status" role="status">
            {t(
              en,
              "এলাকার তালিকা পাওয়া যাচ্ছে না। সব এলাকায় খুঁজতে পারবেন।",
              "Locations are temporarily unavailable. You can still search all areas.",
            )}
          </p>
        )}
      </section>
      <section
        className="care-strip"
        aria-label={t(en, "আমাদের অঙ্গীকার", "Our commitments")}
      >
        {[
          [
            ShieldCheck,
            "সম্মতি সবার আগে",
            "Consent comes first",
            "ব্যক্তিগত যোগাযোগ আপনার নিয়ন্ত্রণে।",
            "You control your contact details.",
          ],
          [
            Users,
            "আপনার এলাকার মানুষ",
            "Closer to your community",
            "কাছের রক্তদাতার সঙ্গে সংযোগ।",
            "Connect with donors in your area.",
          ],
          [
            Heart,
            "মানবতার জন্য, বিনামূল্যে",
            "Kindness has no price",
            "রক্তদানে কোনো কেনাবেচা নয়।",
            "Blood donation is never a transaction.",
          ],
        ].map(([Icon, bn, eng, description, descriptionEn]) => {
          const Symbol = Icon as typeof Heart;
          return (
            <div key={String(eng)}>
              <span className="care-icon">
                <Symbol size={22} />
              </span>
              <div>
                <h3>{t(en, String(bn), String(eng))}</h3>
                <p>{t(en, String(description), String(descriptionEn))}</p>
              </div>
            </div>
          );
        })}
      </section>
      <section className="section community-requests" id="active-requests">
        <div className="section-heading">
          <div>
            <span className="overline">
              <span className="status-dot" />
              {t(en, "একটু এগিয়ে আসুন", "SOMEONE NEEDS YOU TODAY")}
            </span>
            <h2>{t(en, "একটি সাড়াই অনেক কিছু।", "Your response matters.")}</h2>
            <p>
              {t(
                en,
                "কমিউনিটির সক্রিয় রক্তের অনুরোধগুলো দেখুন।",
                "Explore active blood requests from the community.",
              )}
            </p>
          </div>
          <Link className="text-link" to="/requests">
            {t(en, "সব অনুরোধ", "All requests")}
            <ArrowUpRight size={18} />
          </Link>
        </div>
        <RequestList compact />
        <Link className="request-prompt" to="/requests/new">
          <span>
            <Plus size={19} />
            {t(
              en,
              "আপনার বা প্রিয়জনের রক্ত প্রয়োজন?",
              "Need blood for yourself or someone you love?",
            )}
          </span>
          <strong>
            {t(en, "অনুরোধ তৈরি করুন", "Create a request")}
            <ArrowRight size={17} />
          </strong>
        </Link>
      </section>
      <section className="community-how section">
        <div className="section-heading">
          <div>
            <span className="overline">
              {t(
                en,
                "সহজ শুরু, অর্থপূর্ণ পরিবর্তন",
                "SMALL STEPS. REAL CONNECTIONS.",
              )}
            </span>
            <h2>
              {t(en, "পাশে দাঁড়ানো এতটাই সহজ।", "A simpler way to be there.")}
            </h2>
          </div>
          <Link className="text-link" to="/how-it-works">
            {t(en, "আরও জানুন", "How it works")}
            <ArrowUpRight size={18} />
          </Link>
        </div>
        <div className="connection-steps">
          {[
            [
              Search,
              "খুঁজুন",
              "Find your community",
              "গ্রুপ ও এলাকা দিয়ে কাছের রক্তদাতাদের খুঁজুন।",
              "Search by blood group and area, or post a request.",
            ],
            [
              ShieldCheck,
              "যুক্ত হোন",
              "Make a connection",
              "যাচাই করা অনুরোধে সম্মতির ভিত্তিতে যোগাযোগ করুন।",
              "Connect through reviewed requests, with everyone’s consent.",
            ],
            [
              HandHeart,
              "পাশে থাকুন",
              "Give a little hope",
              "হাসপাতালের পরামর্শে রক্তদান সমন্বয় করুন।",
              "Coordinate your donation with the hospital’s clinical team.",
            ],
          ].map(([Icon, bn, eng, desc, engDesc], index) => {
            const Symbol = Icon as typeof Search;
            return (
              <article key={String(eng)}>
                <div className="connection-step-top">
                  <Symbol size={24} />
                  <span>0{index + 1}</span>
                </div>
                <h3>{t(en, String(bn), String(eng))}</h3>
                <p>{t(en, String(desc), String(engDesc))}</p>
              </article>
            );
          })}
        </div>
      </section>
      <section className="community-join">
        <div>
          <span className="overline">
            {t(
              en,
              "আপনার কমিউনিটি। আপনার অবদান।",
              "YOUR COMMUNITY. YOUR DIFFERENCE.",
            )}
          </span>
          <h2>
            {t(en, "কারও আশার কারণ হোন।", "Be someone’s reason to hope.")}
          </h2>
          <p>
            {t(
              en,
              "আজই মধুপুরের স্বেচ্ছাসেবী রক্তদাতা পরিবারে যুক্ত হোন।",
              "Join Madhupur’s voluntary donor community. It starts with you.",
            )}
          </p>
          <Link className="button white" to="/register">
            {t(en, "কমিউনিটিতে যোগ দিন", "Count me in")}
            <ArrowUpRight size={18} />
          </Link>
        </div>
        <div className="join-mark" aria-hidden="true">
          <Heart size={115} strokeWidth={1} />
          <ArrowDown size={50} />
        </div>
      </section>
    </>
  );
}
