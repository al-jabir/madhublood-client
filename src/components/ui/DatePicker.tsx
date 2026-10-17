import { useEffect, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";
import { usePrefs } from "@/store/preferences.store";
import { t } from "@/i18n/translate";
export function DatePicker({
  id,
  name,
  defaultValue = "",
  value,
  onChange,
  max,
  min,
  title,
  required = false,
}: {
  id?: string;
  name?: string;
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  max?: string;
  min?: string;
  title?: string;
  required?: boolean;
}) {
  const { en } = usePrefs();
  const [internal, setInternal] = useState(defaultValue);
  const selected = value ?? internal;
  const today = new Date();
  const initial = new Date(
    (selected ||
      max ||
      `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`) +
      "T12:00:00",
  );
  const [month, setMonth] = useState(
    new Date(initial.getFullYear(), initial.getMonth(), 1),
  );
  const [open, setOpen] = useState(false);
  const modal = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (open) modal.current?.showModal();
    else if (modal.current?.open) {
      modal.current.close();
      trigger.current?.focus();
    }
  }, [open]);
  const year = month.getFullYear(),
    index = month.getMonth();
  const firstDay = new Date(year, index, 1).getDay();
  const count = new Date(year, index + 1, 0).getDate();
  const iso = (day: number) =>
    `${year}-${String(index + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  function choose(date: string) {
    setInternal(date);
    onChange?.(date);
    setOpen(false);
  }
  const locale = en ? "en-BD" : "bn-BD";
  return (
    <div className="date-picker">
      <input type="hidden" name={name} value={selected} />
      <button
        id={id}
        ref={trigger}
        type="button"
        className="date-trigger"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => {
          if (selected)
            setMonth(new Date(selected.slice(0, 7) + "-01T12:00:00"));
          setOpen(true);
        }}
      >
        <span className={selected ? "" : "muted"}>
          {selected
            ? new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
                new Date(selected + "T12:00:00"),
              )
            : t(en, "তারিখ বেছে নিন", "Choose a date")}
        </span>
        <CalendarDays size={19} />
      </button>
      <dialog
        ref={modal}
        className="date-dialog"
        aria-label={
          title ?? t(en, "রক্তদানের তারিখ নির্বাচন", "Choose donation date")
        }
        onCancel={() => setOpen(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) setOpen(false);
        }}
      >
        <div className="date-dialog-heading">
          <div>
            <span>{t(en, "তারিখ নির্বাচন", "SELECT DATE")}</span>
            <h3>{title ?? t(en, "রক্তদানের তারিখ", "Donation date")}</h3>
          </div>
          <button
            className="icon"
            type="button"
            aria-label={t(en, "ক্যালেন্ডার বন্ধ করুন", "Close calendar")}
            onClick={() => setOpen(false)}
          >
            <X size={19} />
          </button>
        </div>
        <div className="date-month-navigation">
          <button
            type="button"
            className="icon"
            aria-label={t(en, "আগের মাস", "Previous month")}
            onClick={() => setMonth(new Date(year, index - 1, 1))}
          >
            <ChevronLeft size={19} />
          </button>
          <select
            aria-label={t(en, "মাস", "Month")}
            value={index}
            onChange={(e) =>
              setMonth(new Date(year, Number(e.target.value), 1))
            }
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i} value={i}>
                {new Intl.DateTimeFormat(locale, { month: "long" }).format(
                  new Date(2020, i, 1),
                )}
              </option>
            ))}
          </select>
          <select
            aria-label={t(en, "বছর", "Year")}
            value={year}
            onChange={(e) =>
              setMonth(new Date(Number(e.target.value), index, 1))
            }
          >
            {Array.from(
              { length: min ? 6 : 101 },
              (_, i) => today.getFullYear() + (min ? 5 - i : -i),
            ).map((y) => (
              <option key={y} value={y}>
                {y.toLocaleString(locale, { useGrouping: false })}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="icon"
            aria-label={t(en, "পরের মাস", "Next month")}
            disabled={
              !!max &&
              `${year}-${String(index + 1).padStart(2, "0")}` >= max.slice(0, 7)
            }
            onClick={() => setMonth(new Date(year, index + 1, 1))}
          >
            <ChevronRight size={19} />
          </button>
        </div>
        <div className="date-weekdays">
          {Array.from({ length: 7 }, (_, i) => (
            <span key={i}>
              {new Intl.DateTimeFormat(locale, { weekday: "short" }).format(
                new Date(2023, 0, 1 + i),
              )}
            </span>
          ))}
        </div>
        <div className="date-days">
          {Array.from({ length: firstDay }, (_, i) => (
            <span key={`blank-${i}`} />
          ))}
          {Array.from({ length: count }, (_, i) => i + 1).map((day) => (
            <button
              type="button"
              key={day}
              disabled={(!!max && iso(day) > max) || (!!min && iso(day) < min)}
              aria-pressed={selected === iso(day)}
              aria-label={iso(day)}
              onClick={() => choose(iso(day))}
            >
              {day.toLocaleString(locale)}
            </button>
          ))}
        </div>
        <div className="date-dialog-footer">
          {!required && (
            <button
              type="button"
              className="text-link"
              onClick={() => choose("")}
            >
              {t(en, "মুছুন", "Clear")}
            </button>
          )}
          <button
            type="button"
            className="button secondary small"
            onClick={() => {
              setMonth(new Date(today.getFullYear(), today.getMonth(), 1));
              choose(
                `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`,
              );
            }}
          >
            {t(en, "আজ", "Today")}
          </button>
        </div>
      </dialog>
    </div>
  );
}
