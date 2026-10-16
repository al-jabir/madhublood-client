import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { locationsApi } from "../api/locations.api";
import { usePrefs } from "@/store/preferences.store";
import { t } from "@/i18n/translate";
import { MapPin } from "lucide-react";
import type { LocationRecord } from "@/types/api";

interface LocationSelectorProps {
  id?: string;
  name?: string;
  defaultLocationId?: string;
  defaultArea?: string;
  required?: boolean;
  onChange?: (loc: LocationRecord | null, areaName: string) => void;
}

export function LocationSelector({
  id,
  defaultLocationId = "",
  defaultArea = "মধুপুর, টাঙ্গাইল",
  required = true,
  onChange,
}: LocationSelectorProps) {
  const { en } = usePrefs();
  const q = useQuery({
    queryKey: ["locations", 50],
    queryFn: () => locationsApi.list(50),
    staleTime: 1000 * 60 * 10,
  });

  const [selectedId, setSelectedId] = useState(defaultLocationId);
  const [areaText, setAreaText] = useState(defaultArea);

  useEffect(() => {
    if (defaultLocationId) setSelectedId(defaultLocationId);
    if (defaultArea) setAreaText(defaultArea);
  }, [defaultLocationId, defaultArea]);

  // Set default selection when locations load if not set
  useEffect(() => {
    if (!q.data?.items.length || selectedId) return;

    // Default to Madhupur upazila or first available
    const madhupur = q.data.items.find(
      (l) => l.kind === "upazila" && l.name.includes("মধুপুর"),
    );
    if (madhupur) {
      setSelectedId(madhupur._id);
      const text = `${madhupur.name}, টাঙ্গাইল`;
      setAreaText(text);
      onChange?.(madhupur, text);
    }
  }, [q.data, selectedId, onChange]);

  const items = q.data?.items || [];
  const upazilas = items.filter((l) => l.kind === "upazila");
  const municipalities = items.filter((l) => l.kind === "municipality");
  const unions = items.filter((l) => l.kind === "union");
  const localities = items.filter((l) => l.kind === "locality");

  function handleSelect(id: string) {
    setSelectedId(id);
    const loc = items.find((l) => l._id === id);
    if (!loc) return;

    let formatted = loc.name;
    if (
      loc.kind === "locality" ||
      loc.kind === "union" ||
      loc.kind === "municipality"
    ) {
      formatted = `${loc.name}, মধুপুর, টাঙ্গাইল`;
    } else if (loc.kind === "upazila") {
      formatted = `${loc.name}, টাঙ্গাইল`;
    }

    setAreaText(formatted);
    onChange?.(loc, formatted);
  }

  return (
    <div className="location-selector-wrap">
      {/* Hidden inputs to seamlessly populate FormData for locationId and area */}
      <input type="hidden" name="locationId" value={selectedId} />
      <input type="hidden" name="area" value={areaText} />

      <div className="select-with-icon" style={{ position: "relative" }}>
        <select
          id={id}
          value={selectedId}
          required={required}
          onChange={(e) => handleSelect(e.target.value)}
          aria-label={t(en, "এলাকা নির্বাচন করুন", "Select verified area")}
          style={{ width: "100%", paddingLeft: "36px" }}
        >
          <option value="">
            {q.isPending
              ? t(en, "এলাকা লোড হচ্ছে…", "Loading locations…")
              : t(en, "— এলাকা নির্বাচন করুন —", "— Select area —")}
          </option>

          {upazilas.length > 0 && (
            <optgroup label={t(en, "উপজেলা", "Upazila")}>
              {upazilas.map((l) => (
                <option key={l._id} value={l._id}>
                  {l.name}
                </option>
              ))}
            </optgroup>
          )}

          {municipalities.length > 0 && (
            <optgroup label={t(en, "পৌরসভা", "Municipality")}>
              {municipalities.map((l) => (
                <option key={l._id} value={l._id}>
                  {l.name}
                </option>
              ))}
            </optgroup>
          )}

          {localities.length > 0 && (
            <optgroup
              label={t(
                en,
                "মধুপুর পৌরসভার আওতাধীন এলাকা/মহল্লা",
                "Municipality Localities",
              )}
            >
              {localities.map((l) => (
                <option key={l._id} value={l._id}>
                  {l.name}
                </option>
              ))}
            </optgroup>
          )}

          {unions.length > 0 && (
            <optgroup label={t(en, "মধুপুরের ইউনিয়নসমূহ", "Madhupur Unions")}>
              {unions.map((l) => (
                <option key={l._id} value={l._id}>
                  {l.name} ইউনিয়ন
                </option>
              ))}
            </optgroup>
          )}
        </select>
        <MapPin
          size={18}
          style={{
            position: "absolute",
            left: "12px",
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--muted)",
            pointerEvents: "none",
          }}
        />
      </div>

      {areaText && (
        <small
          style={{
            display: "block",
            marginTop: "6px",
            color: "var(--muted)",
            fontSize: "12px",
          }}
        >
          {t(en, "নির্বাচিত এলাকা:", "Selected area:")}{" "}
          <strong>{areaText}</strong>
        </small>
      )}
    </div>
  );
}
