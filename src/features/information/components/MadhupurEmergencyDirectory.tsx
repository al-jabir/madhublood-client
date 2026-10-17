import { Phone, Building2, Flame, Shield, Siren, Clock } from "lucide-react";
import { t } from "@/i18n/translate";

interface EmergencyContact {
  titleBn: string;
  titleEn: string;
  phone: string;
  displayPhone: string;
  descBn: string;
  descEn: string;
  icon: typeof Building2;
  available: string;
}

const emergencyList: EmergencyContact[] = [
  {
    titleBn: "জাতীয় জরুরি সেবা",
    titleEn: "National Emergency Helpline",
    phone: "999",
    displayPhone: "999",
    descBn: "পুলিশ, অ্যাম্বুলেন্স ও ফায়ার সার্ভিসের জন্য টোল-ফ্রি সরাসরি কল।",
    descEn: "Toll-free 24/7 service for police, ambulance, and fire rescue.",
    icon: Siren,
    available: "২৪ ঘণ্টা খোলা",
  },
  {
    titleBn: "মধুপুর উপজেলা স্বাস্থ্য কমপ্লেক্স",
    titleEn: "Madhupur Upazila Health Complex",
    phone: "01730324750",
    displayPhone: "01730-324750",
    descBn: "জরুরি চিকিৎসা সেবা, রক্তের প্রয়োজনে যোগাযোগ ও স্বাস্থ্য সহায়তা।",
    descEn: "Emergency medical department, blood transfusion coordination, and clinical support.",
    icon: Building2,
    available: "২৪ ঘণ্টা জরুরি বিভাগ",
  },
  {
    titleBn: "মধুপুর ফায়ার সার্ভিস ও অ্যাম্বুলেন্স",
    titleEn: "Madhupur Fire Service & Ambulance",
    phone: "01712452140",
    displayPhone: "01712-452140",
    descBn: "জরুরি রোগী পরিবহন ও দুর্ঘটনা উদ্ধার সেবা।",
    descEn: "Emergency patient transport and roadside rescue assistance.",
    icon: Flame,
    available: "২৪ ঘণ্টা প্রস্তুত",
  },
  {
    titleBn: "মধুপুর থানা (ডিউটি অফিসার)",
    titleEn: "Madhupur Police Station (Duty Officer)",
    phone: "01320044795",
    displayPhone: "01320-044795",
    descBn: "যেকোনো জরুরি নিরাপত্তা বা আইন-শৃঙ্খলা সংক্রান্ত প্রয়োজনে।",
    descEn: "Direct helpline for urgent security and community assistance in Madhupur.",
    icon: Shield,
    available: "২৪ ঘণ্টা সহায়তা",
  },
];

export function MadhupurEmergencyDirectory({ en }: { en: boolean }) {
  return (
    <div className="emergency-directory-panel">
      <div className="emergency-header">
        <Siren className="red" size={24} />
        <div>
          <h3>
            {t(
              en,
              "মধুপুর জরুরি সেবা ও হটলাইন ডিরেক্টরি",
              "Madhupur Emergency Hotlines & Directory",
            )}
          </h3>
          <p>
            {t(
              en,
              "জরুরি চিকিৎসা ও অ্যাম্বুলেন্সের প্রয়োজনে নিচের নম্বরে সরাসরি যোগাযোগ করুন।",
              "Direct one-tap dialing for clinical emergencies, rescue, and ambulance services in Madhupur.",
            )}
          </p>
        </div>
      </div>

      <div className="emergency-cards-grid">
        {emergencyList.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div className="emergency-contact-card" key={idx}>
              <div className="emergency-card-top">
                <div className="emergency-icon-box">
                  <Icon size={20} />
                </div>
                <div className="emergency-badge">
                  <Clock size={12} />
                  <span>{en ? item.available : item.available}</span>
                </div>
              </div>

              <h4>{en ? item.titleEn : item.titleBn}</h4>
              <p>{en ? item.descEn : item.descBn}</p>

              <div className="emergency-action-row">
                <a href={`tel:${item.phone}`} className="btn-emergency-call">
                  <Phone size={15} />
                  <span>{item.displayPhone}</span>
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
