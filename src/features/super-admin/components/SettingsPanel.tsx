import { usePrefs } from "@/store/preferences.store";
import { t } from "@/i18n/translate";
import { Wrench, UserPlus } from "lucide-react";
import { Loading } from "@/components/feedback/Loading";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { superAdminApi } from "../api/super-admin.api";
import { qc } from "@/lib/query-client";
import { Failure } from "@/components/feedback/Failure";
import { errorText } from "@/utils/error-text";
import { Field } from "@/components/ui/Field";
export function SettingsPanel() {
  const { en } = usePrefs();
  const q = useQuery({
    queryKey: ["platform-settings"],
    queryFn: superAdminApi.settings,
  });
  const save = useMutation({
    mutationFn: ({ key, value }: { key: string; value: string | boolean }) =>
      superAdminApi.updateSetting(key, value),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["platform-settings"] });
      await qc.invalidateQueries({ queryKey: ["platform"] });
      toast.success(
        t(
          en,
          "সেটিংস হালনাগাদ হয়েছে",
          "Platform setting updated successfully.",
        ),
      );
    },
    onError: (error) => toast.error(errorText(error)),
  });
  if (q.isPending) return <Loading compact />;
  if (q.isError) return <Failure error={q.error} />;
  const value = (key: string) =>
    q.data.items.find((item) => item.key === key)?.value;
  return (
    <div className="panel admin-settings-panel">
      <div className="admin-section-heading">
        <h2>{t(en, "সাইটের নিয়ন্ত্রণ", "Platform settings")}</h2>
        <p>
          {t(
            en,
            "সাইট চালু রাখা, নতুন নিবন্ধন ও সহায়তার বার্তা পরিচালনা করুন।",
            "Manage site availability, registration and the public support message.",
          )}
        </p>
      </div>
      <label className="admin-setting-row">
        <span className="admin-record-icon">
          <Wrench size={20} />
        </span>
        <span className="admin-setting-copy">
          <strong>{t(en, "রক্ষণাবেক্ষণ মোড", "Maintenance mode")}</strong>
          <small>
            {t(
              en,
              "চালু করলে সাধারণ ব্যবহারকারী ও Volunteer-এর সেবা বন্ধ থাকবে। অ্যাডমিন প্যানেল চালু থাকবে; Super-admin এটি বন্ধ করতে পারবেন।",
              "Pause public and volunteer services. Administrators retain workspace access; a super admin can turn maintenance off.",
            )}
          </small>
        </span>
        <input
          aria-label={t(en, "রক্ষণাবেক্ষণ মোড", "Maintenance mode")}
          type="checkbox"
          checked={
            save.isPending && save.variables?.key === "maintenance"
              ? save.variables.value === true
              : value("maintenance") === true
          }
          disabled={save.isPending}
          onChange={(e) =>
            save.mutate({ key: "maintenance", value: e.target.checked })
          }
        />
      </label>
      <label className="admin-setting-row">
        <span className="admin-record-icon">
          <UserPlus size={20} />
        </span>
        <span className="admin-setting-copy">
          <strong>
            {t(en, "নতুন নিবন্ধন চালু", "Allow new registrations")}
          </strong>
          <small>
            {t(
              en,
              "নতুন সদস্যরা অ্যাকাউন্ট তৈরি করতে পারবেন।",
              "Let new members create an account.",
            )}
          </small>
        </span>
        <input
          aria-label={t(en, "নতুন নিবন্ধন চালু", "Allow new registrations")}
          type="checkbox"
          checked={
            save.isPending && save.variables?.key === "registrationOpen"
              ? save.variables.value === true
              : value("registrationOpen") !== false
          }
          disabled={save.isPending}
          onChange={(e) =>
            save.mutate({ key: "registrationOpen", value: e.target.checked })
          }
        />
      </label>
      <form
        className="admin-support-form"
        key={String(value("supportMessage"))}
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate({
            key: "supportMessage",
            value: String(new FormData(e.currentTarget).get("message") ?? ""),
          });
        }}
      >
        <Field
          label={t(en, "সবার জন্য সহায়তার বার্তা", "Public support message")}
        >
          <textarea
            name="message"
            maxLength={500}
            defaultValue={
              typeof value("supportMessage") === "string"
                ? String(value("supportMessage"))
                : ""
            }
          />
        </Field>
        <button className="button" disabled={save.isPending}>
          {t(en, "সহায়তার বার্তা সংরক্ষণ", "Save support message")}
        </button>
      </form>
    </div>
  );
}
