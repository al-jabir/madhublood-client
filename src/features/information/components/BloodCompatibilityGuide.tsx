import { useState } from "react";
import { Droplet, Info, Check, ShieldAlert } from "lucide-react";
import { t } from "@/i18n/translate";

const compatibilityMap: Record<
  string,
  {
    give: string[];
    receive: string[];
    descriptionBn: string;
    descriptionEn: string;
  }
> = {
  "O-": {
    give: ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
    receive: ["O-"],
    descriptionBn: "সর্বজনীন দাতা (Universal Donor)। O- রক্ত যেকোনো গ্রুপের রোগীকে জরুরি অবস্থায় দেওয়া যায়।",
    descriptionEn: "Universal Donor. O- red blood cells can be given to patients of any blood group in emergencies.",
  },
  "O+": {
    give: ["O+", "A+", "B+", "AB+"],
    receive: ["O+", "O-"],
    descriptionBn: "সবচেয়ে বেশি প্রয়োজন হয় এমন গ্রুপ। সকল পজিটিভ গ্রুপের রোগীকে রক্ত দিতে পারে।",
    descriptionEn: "Most commonly needed blood group. Can donate red blood cells to all positive blood types.",
  },
  "A-": {
    give: ["A-", "A+", "AB-", "AB+"],
    receive: ["A-", "O-"],
    descriptionBn: "A এবং AB উভয় গ্রুপের নেগেটিভ ও পজিটিভ রোগীদের রক্ত দিতে পারে।",
    descriptionEn: "Can donate red blood cells to both A and AB recipients (both positive and negative).",
  },
  "A+": {
    give: ["A+", "AB+"],
    receive: ["A+", "A-", "O+", "O-"],
    descriptionBn: "জনপ্রিয় ও সাধারণ গ্রুপ। A+ এবং AB+ রোগীদের রক্ত দিতে পারে।",
    descriptionEn: "Very common blood group. Can donate red blood cells to A+ and AB+ patients.",
  },
  "B-": {
    give: ["B-", "B+", "AB-", "AB+"],
    receive: ["B-", "O-"],
    descriptionBn: "তুলনামূলক বিরল নেগেটিভ গ্রুপ। B এবং AB গ্রুপের যে কাউকে রক্ত দিতে পারে।",
    descriptionEn: "Relatively rare Rh-negative group. Can give red blood cells to B and AB patients.",
  },
  "B+": {
    give: ["B+", "AB+"],
    receive: ["B+", "B-", "O+", "O-"],
    descriptionBn: "বাংলাদেশে অন্যতম পরিচিত গ্রুপ। B+ এবং AB+ রোগীদের রক্ত দিতে পারে।",
    descriptionEn: "Widely found in Bangladesh. Can donate red blood cells to B+ and AB+ recipients.",
  },
  "AB-": {
    give: ["AB-", "AB+"],
    receive: ["AB-", "A-", "B-", "O-"],
    descriptionBn: "সবচেয়ে বিরল রক্তের গ্রুপগুলোর একটি। শুধু AB গ্রুপের রোগীদের রক্ত দিতে পারে।",
    descriptionEn: "One of the rarest blood groups. Can donate red blood cells only to AB recipients.",
  },
  "AB+": {
    give: ["AB+"],
    receive: ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
    descriptionBn: "সর্বজনীন গ্রহীতা (Universal Recipient)। যেকোনো ব্লাড গ্রুপের রক্ত গ্রহণ করতে পারে।",
    descriptionEn: "Universal Recipient. Can safely receive red blood cells from any blood group.",
  },
};

const allGroups = ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"];

export function BloodCompatibilityGuide({ en }: { en: boolean }) {
  const [selectedGroup, setSelectedGroup] = useState<string>("B+");
  const info = compatibilityMap[selectedGroup] || compatibilityMap["B+"];

  return (
    <div className="compatibility-guide-container">
      <div className="compatibility-header">
        <Droplet className="red" size={24} />
        <div>
          <h3>
            {t(
              en,
              "ব্লাড গ্রুপ সামঞ্জস্য ক্যালকুলেটর (কার রক্ত কে নিতে পারে)",
              "Blood Compatibility Guide (Who Can Receive/Donate)",
            )}
          </h3>
          <p>
            {t(
              en,
              "যেকোনো রক্তের গ্রুপ নির্বাচন করে দেখুন কে কাকে রক্ত দিতে পারে।",
              "Select any blood type to explore donation and receipt compatibility.",
            )}
          </p>
        </div>
      </div>

      <div className="compatibility-group-selector" role="radiogroup" aria-label="Blood Group Selector">
        {allGroups.map((group) => (
          <button
            type="button"
            key={group}
            className={`group-choice-btn ${selectedGroup === group ? "active" : ""}`}
            onClick={() => setSelectedGroup(group)}
            aria-pressed={selectedGroup === group}
          >
            {group}
          </button>
        ))}
      </div>

      <div className="compatibility-summary-badge">
        <Info size={16} />
        <span>{en ? info.descriptionEn : info.descriptionBn}</span>
      </div>

      <div className="compatibility-grid">
        <div className="compat-col can-give">
          <h4>
            <Check size={16} className="green" />
            <span>
              {t(
                en,
                `${selectedGroup} কাদের রক্ত দিতে পারবে:`,
                `${selectedGroup} can donate to:`,
              )}
            </span>
          </h4>
          <div className="compat-pill-grid">
            {allGroups.map((grp) => {
              const matched = info.give.includes(grp);
              return (
                <span
                  key={grp}
                  className={`compat-pill ${matched ? "matched give" : "unmatched"}`}
                >
                  {grp}
                  {matched ? " ✓" : ""}
                </span>
              );
            })}
          </div>
        </div>

        <div className="compat-col can-receive">
          <h4>
            <Check size={16} className="green" />
            <span>
              {t(
                en,
                `${selectedGroup} কার থেকে রক্ত নিতে পারবে:`,
                `${selectedGroup} can receive from:`,
              )}
            </span>
          </h4>
          <div className="compat-pill-grid">
            {allGroups.map((grp) => {
              const matched = info.receive.includes(grp);
              return (
                <span
                  key={grp}
                  className={`compat-pill ${matched ? "matched receive" : "unmatched"}`}
                >
                  {grp}
                  {matched ? " ✓" : ""}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      <div className="compatibility-note">
        <ShieldAlert size={15} />
        <small>
          {t(
            en,
            "চিকিৎসাগত ক্রস-ম্যাচিং ও ল্যাব টেস্ট ছাড়া কখনোই রক্ত সঞ্চালন করা হয় না। হাসপাতাল বা ব্লাড ব্যাংকের চিকিৎসক সরাসরি সামঞ্জস্য যাচাই করবেন।",
            "Cross-matching and clinical testing are always mandatory before transfusion. Hospital clinical staff perform final suitability checks.",
          )}
        </small>
      </div>
    </div>
  );
}
