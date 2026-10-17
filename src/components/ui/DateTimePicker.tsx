import { useId, useState } from "react";
import { DatePicker } from "./DatePicker";
import { usePrefs } from "@/store/preferences.store";
import { t } from "@/i18n/translate";
export function DateTimePicker({
  id,
  name,
  value,
  defaultValue = "",
  onChange,
}: {
  id?: string;
  name: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
}) {
  const { en } = usePrefs();
  const generated = useId();
  const fieldId = id ?? generated;
  const [internal, setInternal] = useState(defaultValue);
  const current = value ?? internal;
  const date = current.slice(0, 10),
    time = current.slice(11, 16) || "09:00";
  const hours = Number(time.slice(0, 2));
  const hour12 = hours % 12 || 12,
    minute = Number(time.slice(3, 5)),
    period = hours >= 12 ? "PM" : "AM";
  const today = new Date().toLocaleDateString("en-CA");
  function update(day: string, hour = hour12, minutes = minute, ampm = period) {
    const next = day
      ? `${day}T${String((hour % 12) + (ampm === "PM" ? 12 : 0)).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`
      : "";
    setInternal(next);
    onChange?.(next);
  }
  return (
    <div className="date-time-picker">
      <input type="hidden" name={name} value={current} />
      <DatePicker
        id={fieldId}
        value={date}
        onChange={(day) => update(day)}
        min={today}
        required
        title={t(en, "কখন রক্ত প্রয়োজন", "When is blood needed?")}
      />
      <div className="time-select-row">
        <div>
          <label htmlFor={`${fieldId}-hour`}>{t(en, "ঘণ্টা", "Hour")}</label>
          <select
            id={`${fieldId}-hour`}
            value={hour12}
            disabled={!date}
            onChange={(e) => update(date, Number(e.target.value))}
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((hour) => (
              <option key={hour} value={hour}>
                {String(hour).padStart(2, "0")}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`${fieldId}-minute`}>
            {t(en, "মিনিট", "Minute")}
          </label>
          <select
            id={`${fieldId}-minute`}
            value={minute}
            disabled={!date}
            onChange={(e) => update(date, hour12, Number(e.target.value))}
          >
            {Array.from({ length: 60 }, (_, i) => (
              <option key={i} value={i}>
                {String(i).padStart(2, "0")}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`${fieldId}-period`}>
            {t(en, "দিনের ভাগ", "AM / PM")}
          </label>
          <select
            id={`${fieldId}-period`}
            value={period}
            disabled={!date}
            onChange={(e) => update(date, hour12, minute, e.target.value)}
          >
            <option value="AM">{t(en, "পূর্বাহ্ণ", "AM")}</option>
            <option value="PM">{t(en, "অপরাহ্ণ", "PM")}</option>
          </select>
        </div>
      </div>
      <small className="muted">
        {t(
          en,
          "আপনার ডিভাইসের স্থানীয় সময় অনুযায়ী। ভবিষ্যতের সময় নির্বাচন করুন।",
          "Uses your device’s local time. Choose a future date and time.",
        )}
      </small>
    </div>
  );
}
