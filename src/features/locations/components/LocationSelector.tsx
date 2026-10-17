import { useState, useEffect, useId } from "react";
import { useQuery } from "@tanstack/react-query";
import { locationsApi } from "../api/locations.api";
import { usePrefs } from "@/store/preferences.store";
import { t } from "@/i18n/translate";
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
  defaultArea = "",
  required = true,
  onChange,
}: LocationSelectorProps) {
  const { en } = usePrefs();
  const uid = useId();
  const q = useQuery({
    queryKey: ["locations", 50],
    queryFn: () => locationsApi.list(50),
    staleTime: 600000,
  });
  const items = q.data?.items ?? [];
  const [selectedId, setSelectedId] = useState(defaultLocationId);
  const [upazilaChoice, setUpazilaChoice] = useState<string | null>(null);
  const [typeChoice, setTypeChoice] = useState<string | null>(null);
  useEffect(() => {
    setSelectedId(defaultLocationId);
    setUpazilaChoice(null);
    setTypeChoice(null);
  }, [defaultLocationId]);
  function ancestry(location?: LocationRecord) {
    const chain: LocationRecord[] = [];
    const visited = new Set<string>();
    let node = location;
    while (node && !visited.has(node._id)) {
      chain.push(node);
      visited.add(node._id);
      node = items.find((item) => item._id === node?.parent);
    }
    return chain;
  }
  const selected = items.find((item) => item._id === selectedId);
  const upazilas = items.filter((item) => item.kind === "upazila");
  const upazilaId =
    upazilaChoice ??
    ancestry(selected).find((item) => item.kind === "upazila")?._id ??
    (upazilas.length === 1 ? upazilas[0]._id : "");
  const areaType =
    typeChoice ??
    (selected?.kind === "union"
      ? "union"
      : ["municipality", "locality"].includes(selected?.kind ?? "")
        ? "municipality"
        : "");
  const effectiveId = selectedId || (areaType === "" ? upazilaId : "");
  const effective = items.find((item) => item._id === effectiveId);
  const chain = ancestry(effective);
  const label =
    chain
      .filter(
        (item) =>
          item.kind !== "municipality" || effective?.kind === "municipality",
      )
      .map((item) => item.name)
      .join(", ") || (effectiveId ? defaultArea : "");
  const options = items.filter(
    (item) =>
      ancestry(item).some((parent) => parent._id === upazilaId) &&
      (areaType === "union"
        ? item.kind === "union"
        : areaType === "municipality"
          ? ["municipality", "locality"].includes(item.kind)
          : false),
  );
  function select(value: string) {
    setSelectedId(value);
    const item = items.find((row) => row._id === value);
    onChange?.(
      item ?? null,
      ancestry(item)
        .map((row) => row.name)
        .join(", "),
    );
  }
  const unavailable = q.isPending || q.isError;
  return (
    <div className="location-selector-wrap">
      <input type="hidden" name="locationId" value={effectiveId} />
      <input type="hidden" name="area" value={label} />
      <div className="address-step-fields">
        <div>
          <label htmlFor={`${uid}-upazila`}>{t(en, "উপজেলা", "Upazila")}</label>
          <select
            id={`${uid}-upazila`}
            aria-label={t(en, "উপজেলা", "Upazila")}
            value={upazilaId}
            disabled={unavailable}
            required={required}
            onChange={(event) => {
              setUpazilaChoice(event.target.value);
              setTypeChoice("");
              select(event.target.value);
            }}
          >
            <option value="">
              {t(en, "উপজেলা বেছে নিন", "Choose upazila")}
            </option>
            {upazilas.map((item) => (
              <option key={item._id} value={item._id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`${uid}-type`}>
            {t(en, "এলাকার ধরন", "Area type")}
          </label>
          <select
            id={`${uid}-type`}
            aria-label={t(en, "এলাকার ধরন", "Area type")}
            value={areaType}
            disabled={unavailable || !upazilaId}
            onChange={(event) => {
              setTypeChoice(event.target.value);
              select(event.target.value ? "" : upazilaId);
            }}
          >
            <option value="">{t(en, "সমগ্র উপজেলা", "Entire upazila")}</option>
            <option value="municipality">
              {t(en, "পৌরসভা / ওয়ার্ড", "Municipality / wards")}
            </option>
            <option value="union">{t(en, "ইউনিয়ন", "Union")}</option>
          </select>
        </div>
        <div>
          <label htmlFor={id ?? `${uid}-area`}>
            {t(en, "এলাকা নির্বাচন", "Choose area")}
          </label>
          <select
            id={id ?? `${uid}-area`}
            aria-label={t(en, "এলাকা নির্বাচন করুন", "Select verified area")}
            value={areaType ? selectedId : ""}
            disabled={unavailable || !areaType || !upazilaId}
            required={required && !!areaType}
            onChange={(event) => select(event.target.value)}
          >
            <option value="">
              {q.isPending
                ? t(en, "এলাকা লোড হচ্ছে…", "Loading areas…")
                : !areaType
                  ? t(en, "আগে এলাকার ধরন বেছে নিন", "Choose area type first")
                  : t(en, "এলাকা বেছে নিন", "Select an area")}
            </option>
            {options.map((item) => (
              <option key={item._id} value={item._id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      {q.isError && (
        <p role="status" className="error-text">
          {t(en, "এলাকা লোড হয়নি।", "Could not load areas.")}{" "}
          <button
            type="button"
            className="text-link"
            onClick={() => void q.refetch()}
          >
            {t(en, "আবার চেষ্টা করুন", "Retry")}
          </button>
        </p>
      )}
      {label && (
        <small className="selected-address">
          {t(en, "নির্বাচিত এলাকা:", "Selected area:")} <strong>{label}</strong>
        </small>
      )}
    </div>
  );
}
