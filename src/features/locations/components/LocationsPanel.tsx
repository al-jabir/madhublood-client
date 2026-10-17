import { Loading } from "@/components/feedback/Loading";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { MapPin, ExternalLink } from "lucide-react";
import { locationsApi } from "../api/locations.api";
import { Failure } from "@/components/feedback/Failure";
import { errorText } from "@/utils/error-text";
import { usePrefs } from "@/store/preferences.store";
import { t } from "@/i18n/translate";
import { Field } from "@/components/ui/Field";
import { locationKind } from "@/features/admin/admin-labels";
export function LocationsPanel() {
  const { en } = usePrefs();
  const client = useQueryClient();
  const [kind, setKind] = useState("district"),
    [parent, setParent] = useState(""),
    [busy, setBusy] = useState(false);
  const q = useQuery({
    queryKey: ["operations", "locations"],
    queryFn: () => locationsApi.list(50),
  });
  if (q.isPending) return <Loading compact />;
  if (q.isError) return <Failure error={q.error} />;
  const allowed: Record<string, string[]> = {
    upazila: ["district"],
    union: ["upazila"],
    municipality: ["upazila"],
    locality: ["union", "municipality", "upazila"],
  };
  const parents = q.data.items.filter((row) =>
    allowed[kind]?.includes(row.kind),
  );
  return (
    <div className="admin-locations">
      <section className="panel">
        <div className="admin-section-heading">
          <h2>{t(en, "যাচাইকৃত এলাকা যোগ করুন", "Add a reviewed location")}</h2>
          <p>
            {t(
              en,
              "সরকারি উৎস ও সঠিক মূল এলাকা বেছে তথ্য সংযোজন করুন।",
              "Use an official source and select the correct parent location.",
            )}
          </p>
        </div>
        <form
          className="form-grid admin-location-form"
          onSubmit={async (e) => {
            e.preventDefault();
            const form = e.currentTarget;
            setBusy(true);
            try {
              const values = Object.fromEntries(new FormData(form));
              await locationsApi.create({
                ...values,
                kind,
                ...(kind !== "district" ? { parent } : {}),
              });
              toast.success(t(en, "এলাকা যোগ হয়েছে", "Location added"));
              form.reset();
              setKind("district");
              setParent("");
              await Promise.all([
                client.invalidateQueries({
                  queryKey: ["operations", "locations"],
                }),
                client.invalidateQueries({ queryKey: ["locations"] }),
              ]);
            } catch (error) {
              toast.error(errorText(error));
            } finally {
              setBusy(false);
            }
          }}
        >
          <Field label={t(en, "এলাকার নাম", "Location name")}>
            <input
              name="name"
              minLength={2}
              maxLength={100}
              required
              disabled={busy}
            />
          </Field>
          <Field label={t(en, "এলাকার ধরন", "Location type")}>
            <select
              value={kind}
              disabled={busy}
              onChange={(e) => {
                setKind(e.target.value);
                setParent("");
              }}
            >
              {["district", "upazila", "union", "municipality", "locality"].map(
                (value) => (
                  <option key={value} value={value}>
                    {locationKind(en, value)}
                  </option>
                ),
              )}
            </select>
          </Field>
          {kind !== "district" && (
            <Field label={t(en, "মূল এলাকা", "Parent location")}>
              <select
                value={parent}
                required
                disabled={busy}
                onChange={(e) => setParent(e.target.value)}
              >
                <option value="">
                  {t(en, "মূল এলাকা বেছে নিন", "Choose parent location")}
                </option>
                {parents.map((row) => (
                  <option key={row._id} value={row._id}>
                    {row.name} · {locationKind(en, row.kind)}
                  </option>
                ))}
              </select>
            </Field>
          )}
          <div className="span2">
            <Field
              label={t(
                en,
                "সরকারি উৎসের লিংক",
                "Official government source URL",
              )}
            >
              <input
                name="sourceUrl"
                type="url"
                required
                disabled={busy}
                placeholder="https://…gov.bd/…"
              />
            </Field>
          </div>
          <div className="span2 admin-location-submit">
            <button className="button" disabled={busy}>
              {t(en, "যাচাইকৃত এলাকা সংযোজন", "Import reviewed location")}
            </button>
          </div>
        </form>
      </section>
      <section className="panel">
        <div className="admin-section-heading">
          <h2>{t(en, "সংরক্ষিত এলাকা", "Location directory")}</h2>
          <p>
            {q.data.items.length}{" "}
            {t(en, "টি এলাকা দেখানো হচ্ছে", "locations shown")}
          </p>
        </div>
        <div className="admin-location-grid">
          {q.data.items.map((row) => (
            <article className="admin-location-card" key={row._id}>
              <MapPin size={18} />
              <div>
                <h3>{row.name}</h3>
                <p>{locationKind(en, row.kind)}</p>
                {row.parent && (
                  <small>
                    {q.data.items.find((p) => p._id === row.parent)?.name ??
                      t(
                        en,
                        "মূল এলাকার সঙ্গে যুক্ত",
                        "Linked to parent location",
                      )}
                  </small>
                )}
                <a href={row.sourceUrl} target="_blank" rel="noreferrer">
                  {t(en, "সরকারি উৎস", "Official source")}{" "}
                  <ExternalLink size={12} />
                </a>
              </div>
            </article>
          ))}
        </div>
        {!q.data.items.length && (
          <p className="admin-empty-state">
            {t(en, "কোনো এলাকা নেই।", "No locations yet.")}
          </p>
        )}
      </section>
    </div>
  );
}
