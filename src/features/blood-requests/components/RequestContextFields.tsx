import { Field } from "@/components/ui/Field";
import { t } from "@/i18n/translate";
import { usePrefs } from "@/store/preferences.store";
export function RequestContextFields({
  value = {},
}: {
  value?: { patientReason?: string; representativeRelationship?: string };
}) {
  const { en } = usePrefs();
  return (
    <>
      <Field
        label={t(
          en,
          "রোগীর সঙ্গে সম্পর্ক (ঐচ্ছিক, private)",
          "Relationship to patient (optional, private)",
        )}
      >
        <input
          name="representativeRelationship"
          maxLength={80}
          defaultValue={value.representativeRelationship}
          placeholder={t(
            en,
            "যেমন: ভাই, আত্মীয়, স্বেচ্ছাসেবক",
            "e.g. sibling, relative, volunteer",
          )}
        />
      </Field>
      <Field
        label={t(
          en,
          "রক্তের প্রয়োজনের কারণ (ঐচ্ছিক, private)",
          "Reason for blood need (optional, private)",
        )}
      >
        <input
          name="patientReason"
          maxLength={200}
          defaultValue={value.patientReason}
        />
      </Field>
      <p className="span2">
        {t(
          en,
          "শুধু পরিবারের অনুমতিতে সংক্ষিপ্ত কারণ লিখুন। রোগীর নাম, রিপোর্ট বা চিকিৎসার বিস্তারিত দেবেন না। এই তথ্য public card-এ দেখাবে না।",
          "Include a brief reason only with family permission. Do not include patient names, reports or detailed medical history. These fields are not shown on public cards.",
        )}
      </p>
    </>
  );
}
