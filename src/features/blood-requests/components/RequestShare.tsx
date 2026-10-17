import { useState } from "react";
import { Share2, Copy, Check, MessageCircle, Send } from "lucide-react";
import { toast } from "sonner";
import { t } from "@/i18n/translate";
import { requestLabel } from "../request-labels";

interface RequestShareProps {
  id: string;
  bloodGroup: string;
  hospital: string;
  area: string;
  units: number;
  component?: string;
  requiredAt: string;
  en: boolean;
  contact?: string;
}

export function RequestShare({
  id,
  bloodGroup,
  hospital,
  area,
  units,
  component = "whole",
  requiredAt,
  en,
  contact,
}: RequestShareProps) {
  const [copied, setCopied] = useState(false);

  const requestUrl = `${window.location.origin}/requests/${id}`;
  const formattedDate = new Date(requiredAt).toLocaleString(
    en ? "en-BD" : "bn-BD",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  );

  const shareText = en
    ? `🚨 URGENT BLOOD NEEDED (${bloodGroup}) in Madhupur!\n` +
      `🩸 Blood Group: ${bloodGroup}\n` +
      `🏥 Hospital: ${hospital}\n` +
      `📍 Area: ${area}\n` +
      `📦 Required: ${units} unit(s) (${requestLabel(en, component)})\n` +
      `🕒 Needed by: ${formattedDate}\n` +
      (contact ? `📞 Contact: ${contact.replace(/^\+88/, "")}\n` : "") +
      `🔗 View details & respond: ${requestUrl}`
    : `🚨 জরুরি রক্তের প্রয়োজন (মধুপুর)!\n` +
      `🩸 রক্তের গ্রুপ: ${bloodGroup}\n` +
      `🏥 হাসপাতাল: ${hospital}\n` +
      `📍 এলাকা: ${area}\n` +
      `📦 পরিমাণ: ${units} ইউনিট (${requestLabel(en, component)})\n` +
      `🕒 প্রয়োজনের সময়: ${formattedDate}\n` +
      (contact ? `📞 যোগাযোগ: ${contact.replace(/^\+88/, "")}\n` : "") +
      `🔗 বিস্তারিত দেখুন ও সাড়া দিন: ${requestUrl}`;

  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;

  async function handleNativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: en
            ? `Urgent ${bloodGroup} Blood Request - MadhuBlood`
            : `জরুরি ${bloodGroup} রক্তের প্রয়োজন - মধুব্লাড`,
          text: shareText,
          url: requestUrl,
        });
      } catch {
        // User cancelled share
      }
    } else {
      handleCopyText();
    }
  }

  function handleCopyText() {
    navigator.clipboard
      .writeText(shareText)
      .then(() => {
        setCopied(true);
        toast.success(
          t(
            en,
            "শেয়ারের জন্য মেসেজ কপি করা হয়েছে!",
            "Request details copied to clipboard!",
          ),
        );
        setTimeout(() => setCopied(false), 2500);
      })
      .catch(() => {
        toast.error(
          t(en, "কপি করা সম্ভব হয়নি", "Could not copy to clipboard"),
        );
      });
  }

  return (
    <div className="request-share-box">
      <div className="request-share-header">
        <Share2 size={18} className="red" />
        <div>
          <h4>
            {t(
              en,
              "অনুরোধটি শেয়ার করুন (রক্তদাতা পেতে)",
              "Share this request to find donors",
            )}
          </h4>
          <p>
            {t(
              en,
              "হোয়াটসঅ্যাপ বা ফেসবুকে শেয়ার করে দ্রুত রক্তদাতা খুঁজে পেতে সাহায্য করুন।",
              "Broadcast on WhatsApp, Facebook, or Messenger to reach voluntary donors.",
            )}
          </p>
        </div>
      </div>

      <div className="request-share-actions">
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-share-whatsapp"
        >
          <MessageCircle size={18} />
          <span>{t(en, "WhatsApp-এ শেয়ার", "Share to WhatsApp")}</span>
        </a>

        {typeof navigator !== "undefined" && "share" in navigator ? (
          <button
            type="button"
            onClick={handleNativeShare}
            className="btn-share-native"
          >
            <Send size={16} />
            <span>{t(en, "অন্যান্য মাধ্যমে শেয়ার", "Share via App")}</span>
          </button>
        ) : null}

        <button
          type="button"
          onClick={handleCopyText}
          className="btn-share-copy"
        >
          {copied ? <Check size={16} className="green" /> : <Copy size={16} />}
          <span>
            {copied
              ? t(en, "কপি সম্পন্ন!", "Copied!")
              : t(en, "মেসেজ কপি করুন", "Copy details")}
          </span>
        </button>
      </div>
    </div>
  );
}
