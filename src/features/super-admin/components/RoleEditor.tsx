import { useId, useState } from "react";
import type { ManagedUser } from "@/types/api";
import { usePrefs } from "@/store/preferences.store";
import { t } from "@/i18n/translate";
export function RoleEditor({
  row,
  save,
}: {
  row: ManagedUser;
  save: (roles: string[], areas: string[], permissions: string[]) => void;
}) {
  const { en } = usePrefs();
  const fieldId = useId();
  const [role, setRole] = useState(
    row.roles.find((role) => role !== "user") ?? "user",
  );
  const [permissions, setPermissions] = useState<string[]>(row.volunteerPermissions ?? []);
  const [area, setArea] = useState(row.areas?.join("\n") ?? "");
  return (
    <form
      className="role-form"
      onSubmit={(event) => {
        event.preventDefault();
        if (
          confirm(
            t(
              en,
              "ভূমিকা বদলে এই ব্যবহারকারীর সক্রিয় সেশন বন্ধ করবেন?",
              "Change roles and revoke this user’s sessions?",
            ),
          )
        )
          save(
            role === "user" ? ["user"] : ["user", role],
            area
              .split(/\r?\n/)
              .map((value) => value.trim())
              .filter(Boolean),
            role === "volunteer" ? permissions : [],
          );
      }}
    >
      <label className="field">
        <span id={`${fieldId}-role-label`}>{t(en, "ভূমিকা", "Role")}</span>
        <select
          aria-labelledby={`${fieldId}-role-label`}
          value={role}
          onChange={(event) => setRole(event.target.value)}
        >
          {["user", "volunteer", "admin", "super-admin"].map((value) => (
            <option key={value} value={value}>
              {value === "volunteer"
                ? t(en, "সমন্বয়কারী", "Coordinator")
                : value === "user"
                  ? t(en, "সদস্য", "Member")
                  : value === "admin"
                    ? t(en, "অ্যাডমিন", "Admin")
                    : t(en, "সুপার অ্যাডমিন", "Super admin")}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span id={`${fieldId}-area-label`}>
          {t(
            en,
            "দায়িত্বের এলাকা (প্রতি লাইনে একটি)",
            "Assigned areas (one per line)",
          )}
        </span>
        <textarea
          aria-labelledby={`${fieldId}-area-label`}
          value={area}
          onChange={(event) => setArea(event.target.value)}
          maxLength={500}
          rows={2}
          placeholder="Madhupur, Tangail"
        />
      </label>
      {role === "volunteer" && <fieldset className="volunteer-permission-fields">
        <legend>{t(en,"স্বেচ্ছাসেবকের কাজের অনুমতি","Volunteer work permissions")}</legend>
        <p>{t(en,"শুধু ভূমিকা দিলেই কোনো কাজের অনুমতি দেওয়া হয় না। প্রয়োজনীয় কাজ আলাদা করে চালু করুন।", "The role alone grants no work access. Enable only the tasks this person needs.")}</p>
        {[["submit-referrals","অন্যের হয়ে অনুরোধ জমা","Submit requests for others","প্রকাশের আগে অ্যাডমিন যাচাই করবেন।","Administrator review is required before publication."], ["coordinate-requests","নির্ধারিত অনুরোধ পরিচালনা","Manage assigned requests","অনুমতি ও এলাকার সঙ্গে আলাদা দায়িত্বও মিলতে হবে।","Requires both assigned area and a specific request assignment."]].map(([key,bn,label,descBn,descEn]) => <label key={key}>
          <input type="checkbox" checked={permissions.includes(key)} onChange={e=>setPermissions(current=>e.target.checked?[...current,key]:current.filter(value=>value!==key))}/>
          <span><strong>{t(en,bn,label)}</strong><small>{t(en,descBn,descEn)}</small></span>
        </label>)}
      </fieldset>}
      <div className="user-access-save">
        <small>
          {t(
            en,
            "পরিবর্তন সংরক্ষণ করলে এই সদস্যকে আবার লগ ইন করতে হবে।",
            "Saving changes signs this member out of their active sessions.",
          )}
        </small>
        <button className="button secondary">
          {t(en, "ভূমিকা সংরক্ষণ", "Save role")}
        </button>
      </div>
    </form>
  );
}
