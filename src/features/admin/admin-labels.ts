import { t } from "@/i18n/translate";
import { requestLabel } from "@/features/blood-requests/request-labels";
export const moderationLabel = (en: boolean, status: string) =>
  status === "verification"
    ? t(en, "পর্যালোচনা শুরু", "Start review")
    : status === "active"
      ? t(en, "অনুমোদন করুন", "Approve")
      : status === "rejected"
        ? t(en, "বাতিল করুন", "Reject")
        : requestLabel(en, status);
export const locationKind = (en: boolean, kind: string) =>
  ({
    district: t(en, "জেলা", "District"),
    upazila: t(en, "উপজেলা", "Upazila"),
    union: t(en, "ইউনিয়ন", "Union"),
    municipality: t(en, "পৌরসভা", "Municipality"),
    locality: t(en, "ওয়ার্ড / এলাকা", "Ward / locality"),
  })[kind] ?? t(en, "এলাকা", "Location");
export function auditLabel(en: boolean, action: string) {
  const labels: Record<string, [string, string]> = {
    "request.updated": [
      "অনুরোধের তথ্য হালনাগাদ",
      "Request information updated",
    ],
    "request.coordinator.assigned": [
      "সমন্বয়কারী নিয়োগ",
      "Coordinator assigned",
    ],
    "request.coordinator.removed": [
      "সমন্বয়কারীর দায়িত্ব সরানো",
      "Coordinator removed",
    ],
    "request.review.checked": ["অনুরোধ পর্যালোচনা", "Request reviewed"],
    "coordination.contact-updated": [
      "যোগাযোগের তথ্য হালনাগাদ",
      "Contact outcome updated",
    ],
    "coordination.ready": [
      "রক্তের ব্যবস্থা সম্পন্ন",
      "Blood arrangement ready",
    ],
    "coordination.owner-confirmed": [
      "অনুরোধকারী নিশ্চিত করেছেন",
      "Requester confirmed",
    ],
    "coordination.admin-completed": [
      "অ্যাডমিন অনুরোধ সম্পন্ন করেছেন",
      "Request completed by administrator",
    ],
    "announcement.updated": ["ঘোষণা হালনাগাদ", "Announcement updated"],
    "donor.verify": ["রক্তদাতা যাচাই", "Donor verified"],
    "location.create": ["এলাকা সংযোজন", "Location added"],
    "report.resolve": ["অভিযোগ নিষ্পত্তি", "Report resolved"],
    "ticket.resolve": ["সহায়তার অনুরোধ নিষ্পত্তি", "Support ticket resolved"],
  };
  if (labels[action]) return labels[action][en ? 1 : 0];
  if (
    action.startsWith("request.") &&
    requestLabel(en, action.slice(8)) !== action.slice(8)
  )
    return `${t(en, "অনুরোধ", "Request")} · ${requestLabel(en, action.slice(8))}`;
  return en
    ? action.replace(/[.-]/g, " ").replace(/^./, (c) => c.toUpperCase())
    : "কার্যক্রম রেকর্ড করা হয়েছে";
}
