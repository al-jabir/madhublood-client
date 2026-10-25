import { useQuery } from "@tanstack/react-query";
import { locationsApi } from "@/features/locations/api/locations.api";
import { AccessConfirmation } from "./AccessConfirmation";
import { useId, useState } from "react";
import type { ManagedUser } from "@/types/api";
import { usePrefs } from "@/store/preferences.store";
import { t } from "@/i18n/translate";
export function RoleEditor({
  row,
  save,
}: {
  row: ManagedUser;
  save: (
    roles: string[],
    areas: string[],
    permissions: string[],
    locationIds: string[],
  ) => void | Promise<void>;
}) {
  const { en } = usePrefs();
  const fieldId = useId();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [role, setRole] = useState(
    ["super-admin", "admin", "volunteer"].find((role) =>
      row.roles.includes(role),
    ) ?? "user",
  );
  const [permissions, setPermissions] = useState<string[]>(
    row.volunteerPermissions ?? [],
  );
  const scopes = useQuery({
    queryKey: ["operations", "role-scopes"],
    queryFn: locationsApi.scopeOptions,
    staleTime: 300000,
  });
  const [selectedIds, setSelectedIds] = useState<string[] | null>(null);
  const needsScope = role === "volunteer" || role === "admin";
  const ids =
    selectedIds ??
    (scopes.data ?? [])
      .filter((option) => row.areas?.includes(option.area))
      .map((option) => option.id);
  const chosen = (scopes.data ?? []).filter((option) =>
    ids.includes(option.id),
  );
  const canSave =
    !needsScope || (!scopes.isPending && !scopes.isError && chosen.length > 0);
  return (
    <>
      <form
        className="role-form"
        onSubmit={(event) => {
          event.preventDefault();
          if (canSave) setConfirmOpen(true);
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
        {needsScope && (
          <label className="field role-scope-field">
            <span id={`${fieldId}-area-label`}>
              {t(en, "যাচাইকৃত দায়িত্বের এলাকা", "Assigned service areas")}
            </span>
            <select
              aria-labelledby={`${fieldId}-area-label`}
              multiple
              value={ids}
              disabled={scopes.isPending || scopes.isError}
              onChange={(event) =>
                setSelectedIds(
                  Array.from(
                    event.target.selectedOptions,
                    (option) => option.value,
                  ),
                )
              }
              size={Math.min(5, Math.max(2, scopes.data?.length ?? 2))}
            >
              {(scopes.data ?? []).map((option) => (
                <option key={option.id} value={option.id}>
                  {option.area}
                </option>
              ))}
            </select>
            <small>
              {scopes.isPending
                ? t(
                    en,
                    "যাচাইকৃত এলাকা লোড হচ্ছে…",
                    "Loading verified service areas…",
                  )
                : scopes.isError
                  ? t(
                      en,
                      "এলাকা লোড হয়নি। আবার চেষ্টা করুন।",
                      "Could not load areas. Try again.",
                    )
                  : !scopes.data?.length
                    ? t(
                        en,
                        "আগে এলাকা তালিকায় যাচাইকৃত জেলা ও উপজেলা যোগ করুন।",
                        "Add verified districts and upazilas in Locations first.",
                      )
                    : t(
                        en,
                        "প্রয়োজনীয় এলাকা নির্বাচন করুন। একাধিক বাছতে Ctrl বা Command ধরে ক্লিক করুন।",
                        "Choose the required areas. Hold Ctrl or Command to select more than one.",
                      )}
            </small>
            {scopes.isError && (
              <button
                type="button"
                className="button secondary small"
                onClick={() => scopes.refetch()}
              >
                {t(en, "আবার চেষ্টা করুন", "Retry areas")}
              </button>
            )}
          </label>
        )}
        {role === "volunteer" && (
          <fieldset className="volunteer-permission-fields">
            <legend>
              {t(
                en,
                "স্বেচ্ছাসেবকের কাজের অনুমতি",
                "Volunteer work permissions",
              )}
            </legend>
            <p>
              {t(
                en,
                "শুধু ভূমিকা দিলেই কোনো কাজের অনুমতি দেওয়া হয় না। প্রয়োজনীয় কাজ আলাদা করে চালু করুন।",
                "The role alone grants no work access. Enable only the tasks this person needs.",
              )}
            </p>
            {[
              [
                "submit-referrals",
                "অন্যের হয়ে অনুরোধ জমা",
                "Submit requests for others",
                "প্রকাশের আগে অ্যাডমিন যাচাই করবেন।",
                "Administrator review is required before publication.",
              ],
              [
                "coordinate-requests",
                "নির্ধারিত অনুরোধ পরিচালনা",
                "Manage assigned requests",
                "অনুমতি ও এলাকার সঙ্গে আলাদা দায়িত্বও মিলতে হবে।",
                "Requires both assigned area and a specific request assignment.",
              ],
            ].map(([key, bn, label, descBn, descEn]) => (
              <label key={key}>
                <input
                  type="checkbox"
                  checked={permissions.includes(key)}
                  onChange={(e) =>
                    setPermissions((current) =>
                      e.target.checked
                        ? [...current, key]
                        : current.filter((value) => value !== key),
                    )
                  }
                />
                <span>
                  <strong>{t(en, bn, label)}</strong>
                  <small>{t(en, descBn, descEn)}</small>
                </span>
              </label>
            ))}
          </fieldset>
        )}
        <div className="user-access-save">
          <small>
            {t(
              en,
              "পরিবর্তন সংরক্ষণ করলে এই সদস্যকে আবার লগ ইন করতে হবে।",
              "Saving changes signs this member out of their active sessions.",
            )}
          </small>
          <button className="button secondary" disabled={!canSave}>
            {t(en, "ভূমিকা সংরক্ষণ", "Save role")}
          </button>
        </div>
      </form>
      {confirmOpen && (
        <AccessConfirmation
          name={row.name || row.email || t(en, "সদস্য", "Member")}
          role={role}
          areas={needsScope ? chosen.map((option) => option.area) : []}
          permissions={role === "volunteer" ? permissions : []}
          onClose={() => setConfirmOpen(false)}
          onConfirm={() =>
            save(
              role === "user" ? ["user"] : ["user", role],
              needsScope ? chosen.map((option) => option.area) : [],
              role === "volunteer" ? permissions : [],
              needsScope ? chosen.map((option) => option.id) : [],
            )
          }
        />
      )}
    </>
  );
}
