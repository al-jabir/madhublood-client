import { CoordinatorTasks } from "@/features/community-tools/components/StaffTools";
import {
  DonorSuggestions,
  RequestTimeline,
} from "@/features/community-tools/components/MemberTools";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Phone,
  ClipboardList,
  UserRoundCheck,
  CheckCheck,
  ArrowRight,
  Clock3,
} from "lucide-react";
import { toast } from "sonner";
import {
  coordinationApi,
  type Contact,
  type Summary,
} from "../api/coordination.api";
import { qc } from "@/lib/query-client";
import { usePrefs } from "@/store/preferences.store";
import { t } from "@/i18n/translate";
import { requestLabel } from "@/features/blood-requests/request-labels";
import { Failure } from "@/components/feedback/Failure";
import { Loading } from "@/components/feedback/Loading";
import { DateTimePicker } from "@/components/ui/DateTimePicker";
import { errorText } from "@/utils/error-text";
import "../coordination.css";

async function refresh() {
  await Promise.all(
    [
      "coordination",
      "coordination-detail",
      "coordination-tasks",
      "request-timeline",
      "coordination-progress",
      "request",
      "requests",
      "moderation",
    ].map((key) => qc.invalidateQueries({ queryKey: [key] })),
  );
}
export function ProgressCards({ summary }: { summary: Summary }) {
  const { en } = usePrefs();
  return (
    <div className="coord-metrics">
      {[
        [summary.required, t(en, "প্রয়োজন", "Units needed")],
        [summary.arranged, t(en, "ব্যবস্থা হয়েছে", "Arranged")],
        [summary.arrived, t(en, "পৌঁছেছেন", "Donors arrived")],
        [summary.remaining, t(en, "এখনও বাকি", "Still needed")],
      ].map(([value, label]) => (
        <div key={label}>
          <strong>{value}</strong>
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}
function DonorContact({
  donor,
  id,
  disabled,
}: {
  donor: Contact;
  id: string;
  disabled: boolean;
}) {
  const { en } = usePrefs();
  const [outcome, setOutcome] = useState(
    donor.outcome === "not-contacted" ? "contacted" : donor.outcome,
  );
  const [note, setNote] = useState(donor.note);
  const [callback, setCallback] = useState(
    donor.nextContactAt
      ? new Date(
          new Date(donor.nextContactAt).getTime() -
            new Date(donor.nextContactAt).getTimezoneOffset() * 60000,
        )
          .toISOString()
          .slice(0, 16)
      : "",
  );
  const save = useMutation({
    mutationFn: () =>
      coordinationApi.contact(id, {
        donorId: donor.id,
        outcome,
        note,
        nextContactAt: callback ? new Date(callback).toISOString() : null,
      }),
    onSuccess: async () => {
      await refresh();
      toast.success(
        t(en, "যোগাযোগের তথ্য রাখা হয়েছে", "Contact update saved"),
      );
    },
    onError: (e) => toast.error(errorText(e)),
  });
  const outcomes = [
    ["contacted", "কথা হয়েছে", "Contacted"],
    ["no-answer", "ফোন ধরেননি", "No answer"],
    ["will-confirm", "পরে নিশ্চিত করবেন", "Will confirm"],
    ["unavailable", "আসতে পারবেন না", "Unavailable"],
    ["arranged", "আসবেন নিশ্চিত", "Confirmed attendance"],
    ["arrived", "হাসপাতালে পৌঁছেছেন", "Arrived at hospital"],
  ];
  return (
    <form
      className="coord-donor"
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate();
      }}
    >
      <div className="coord-between">
        <div>
          <strong>{donor.name}</strong>
          <small>
            {t(
              en,
              "সাড়া দিয়েছেন · যোগাযোগে সম্মতি আছে",
              "Accepted · contact consent active",
            )}
          </small>
        </div>
        {donor.phone && (
          <a className="button secondary small" href={`tel:${donor.phone}`}>
            <Phone size={16} />
            {donor.phone}
          </a>
        )}
      </div>
      <label>
        {t(en, "যোগাযোগের ফল", "Contact outcome")}
        <select
          value={outcome}
          disabled={disabled}
          onChange={(e) => setOutcome(e.target.value)}
        >
          {outcomes.map(([value, bn, english]) => (
            <option key={value} value={value}>
              {t(en, bn, english)}
            </option>
          ))}
        </select>
      </label>
      <label>
        {t(en, "দলের ব্যক্তিগত নোট", "Private team note")}
        <textarea
          maxLength={500}
          rows={2}
          value={note}
          disabled={disabled}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t(
            en,
            "যেমন: বিকেল ৪টায় আসতে পারবেন",
            "For example: can arrive at 4 pm",
          )}
        />
      </label>
      <details>
        <summary>
          <Clock3 size={15} />
          {t(en, "আবার যোগাযোগের সময় (ঐচ্ছিক)", "Callback time (optional)")}
        </summary>
        <DateTimePicker
          name={`callback-${donor.id}`}
          value={callback}
          onChange={setCallback}
          required={false}
          title={t(
            en,
            "আবার কখন যোগাযোগ করবেন?",
            "When should you call again?",
          )}
        />
        {callback && (
          <button
            type="button"
            className="text-link"
            onClick={() => setCallback("")}
          >
            {t(en, "সময় বাদ দিন", "Clear callback")}
          </button>
        )}
      </details>
      <button
        className="button secondary small"
        disabled={disabled || save.isPending}
      >
        {t(en, "আপডেট রাখুন", "Save update")}
      </button>
    </form>
  );
}
function RequestDesk({ id }: { id: string }) {
  const { en } = usePrefs();
  const detail = useQuery({
    queryKey: ["coordination-detail", id],
    queryFn: () => coordinationApi.detail(id),
    refetchInterval: 30000,
  });
  const [chosen, setChosen] = useState<string | undefined>();
  const change = useMutation({
    mutationFn: async (action: "assign" | "ready" | "complete") =>
      action === "assign"
        ? coordinationApi.assign(
            id,
            (chosen ?? detail.data?.coordinator?.id) || null,
          )
        : coordinationApi.action(id, action),
    onSuccess: async () => {
      await refresh();
      toast.success(t(en, "অনুরোধ আপডেট হয়েছে", "Request updated"));
    },
    onError: (e) => toast.error(errorText(e)),
  });
  if (detail.isPending) return <Loading />;
  if (detail.isError) return <Failure error={detail.error} />;
  const d = detail.data;
  return (
    <section className="coord-detail">
      <div className="coord-between">
        <div>
          <span className="coord-eyebrow">
            {t(en, "অনুরোধের সমন্বয়", "REQUEST WORKSPACE")}
          </span>
          <h2>{d.request.hospital}</h2>
          <p>{d.request.area}</p>
        </div>
        <span className="coord-blood">{d.request.bloodGroup}</span>
      </div>
      <div className="coord-between">
        <span className="badge">{requestLabel(en, d.request.status)}</span>
        <Link className="text-link" to={`/requests/${id}`}>
          {t(en, "মূল অনুরোধ", "View request")} <ArrowRight size={14} />
        </Link>
      </div>
      <ProgressCards summary={d.summary} />
      <p className="coord-hint">
        {t(
          en,
          "একজন নিশ্চিত রক্তদাতা = এক ইউনিটের ব্যবস্থা। এটি রক্তদান সম্পন্ন বা চিকিৎসাগত যোগ্যতার প্রমাণ নয়।",
          "Each confirmed donor counts toward one unit arranged. This is not a completed donation or medical clearance.",
        )}
      </p>
      {d.canAssign ? (
        <form
          className="coord-assignment"
          onSubmit={(e) => {
            e.preventDefault();
            change.mutate("assign");
          }}
        >
          <label>
            {t(en, "দায়িত্বপ্রাপ্ত সমন্বয়কারী", "Assigned coordinator")}
            <select
              value={chosen ?? d.coordinator?.id ?? ""}
              onChange={(e) => setChosen(e.target.value)}
            >
              <option value="">
                {t(en, "দায়িত্ব সরিয়ে দিন", "Unassigned")}
              </option>
              {d.candidates.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <button className="button secondary" disabled={change.isPending}>
            {t(en, "দায়িত্ব সংরক্ষণ", "Save assignment")}
          </button>
        </form>
      ) : (
        <div className="coord-notice">
          <UserRoundCheck size={18} />
          {t(
            en,
            "আপনার ওপর এই অনুরোধের দায়িত্ব দেওয়া হয়েছে।",
            "You are assigned to coordinate this request.",
          )}
        </div>
      )}
      {d.request.contact && (
        <div className="coord-between coord-contact">
          <div>
            <small>{t(en, "অনুরোধকারীর যোগাযোগ", "Requester contact")}</small>
            <strong>{d.request.representative}</strong>
          </div>
          <a href={`tel:${d.request.contact}`} className="text-link">
            <Phone size={16} />
            {d.request.contact}
          </a>
        </div>
      )}
      <DonorSuggestions id={id} />
      <details>
        <summary>
          {t(en, "অনুরোধের ঘটনাক্রম দেখুন", "View request timeline")}
        </summary>
        <RequestTimeline id={id} />
      </details>
      <div className="coord-section-heading">
        <h3>{t(en, "রক্তদাতাদের সঙ্গে যোগাযোগ", "Donor follow-up")}</h3>
        <p>
          {t(
            en,
            "শুধু সাড়া দেওয়া ও সম্মতি থাকা রক্তদাতারা এখানে দেখাবেন।",
            "Only donors who accepted and currently consent appear here.",
          )}
        </p>
      </div>
      {d.donors.length ? (
        d.donors.map((donor) => (
          <DonorContact
            key={`${donor.id}-${donor.outcome}-${donor.note}-${donor.nextContactAt}`}
            id={id}
            donor={donor}
            disabled={!d.canUpdate}
          />
        ))
      ) : (
        <div className="coord-empty">
          <UserRoundCheck size={28} />
          <h3>
            {t(en, "এখনও রক্তদাতার সাড়া নেই", "Waiting for donor responses")}
          </h3>
          <p>
            {t(
              en,
              "মূল অনুরোধটি শেয়ার করুন। রক্তদাতা সাড়া দিলে এখানে যোগাযোগ করতে পারবেন।",
              "Share the request. Accepted, consenting donors will appear here for follow-up.",
            )}
          </p>
          <Link className="button secondary" to="/donors">
            {t(en, "রক্তদাতা খুঁজুন", "Find donors")}
          </Link>
        </div>
      )}
      <div className="coord-completion">
        <CheckCheck size={22} />
        <div>
          <h3>
            {d.confirmed
              ? t(en, "অনুরোধকারী নিশ্চিত করেছেন", "Requester confirmed")
              : t(en, "ব্যবস্থা ও নিশ্চিতকরণ", "Arrangement & confirmation")}
          </h3>
          <p>
            {t(
              en,
              "সমন্বয়কারী ব্যবস্থা সম্পন্ন করবেন → অনুরোধকারী নিশ্চিত করবেন → admin বন্ধ করবেন।",
              "Coordinator arranges → requester confirms → administrator closes.",
            )}
          </p>
        </div>
        {d.request.status !== "arranged" && d.canUpdate && (
          <button
            className="button"
            disabled={
              change.isPending || !d.coordinator || d.summary.remaining > 0
            }
            onClick={() => change.mutate("ready")}
          >
            {t(en, "ব্যবস্থা সম্পন্ন", "Mark arranged")}
          </button>
        )}
        {d.request.status === "arranged" && d.canAssign && (
          <button
            className="button"
            disabled={
              change.isPending || !d.confirmed || d.summary.remaining > 0
            }
            onClick={() => change.mutate("complete")}
          >
            {t(en, "অনুরোধ সম্পন্ন করুন", "Complete request")}
          </button>
        )}
      </div>
    </section>
  );
}
export function CoordinationDesk() {
  const { en } = usePrefs();
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string>();
  const q = useQuery({
    queryKey: ["coordination", page],
    queryFn: () => coordinationApi.board(page),
    refetchInterval: 30000,
  });
  if (q.isPending) return <Loading />;
  if (q.isError) return <Failure error={q.error} />;
  const active =
    q.data.items.find((r) => r.id === selected)?.id ?? q.data.items[0]?.id;
  return (
    <div className="coord-desk">
      <div className="coord-intro">
        <div className="coord-intro-icon">
          <ClipboardList size={24} />
        </div>
        <div>
          <h2>
            {t(en, "একসঙ্গে রক্তের ব্যবস্থা করি", "Coordinate care, together")}
          </h2>
          <p>
            {t(
              en,
              "দায়িত্ব, যোগাযোগ ও অগ্রগতি—সব এক জায়গায়।",
              "Assignments, donor follow-up and progress in one place.",
            )}
          </p>
        </div>
        <span className="badge">
          {q.data.total} {t(en, "চলমান অনুরোধ", "open requests")}
        </span>
      </div>
      <CoordinatorTasks
        page={page}
        onSelect={(id) => {
          setSelected(id);
          requestAnimationFrame(() =>
            document
              .querySelector(".coord-detail-container")
              ?.scrollIntoView({
                block: "start",
                behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
                  .matches
                  ? "auto"
                  : "smooth",
              }),
          );
        }}
      />
      <div className="coord-layout">
        <aside className="coord-list">
          <h3>
            {q.data.canAssign
              ? t(en, "এলাকার অনুরোধ", "Area requests")
              : t(en, "আমার দায়িত্ব", "My assignments")}
          </h3>
          {q.data.items.map((r) => (
            <button
              className={`coord-request${active === r.id ? " is-selected" : ""}`}
              key={r.id}
              onClick={() => setSelected(r.id)}
              aria-pressed={active === r.id}
            >
              <span className="coord-between">
                <strong className="coord-group">{r.bloodGroup}</strong>
                <small>{requestLabel(en, r.status)}</small>
              </span>
              <strong>{r.hospital}</strong>
              <small>
                {new Date(r.requiredAt).toLocaleString(en ? "en-GB" : "bn-BD", {
                  day: "numeric",
                  month: "short",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </small>
              <span className="coord-progress">
                <span
                  style={{
                    width: `${Math.min(100, (r.summary.arranged / Math.max(1, r.summary.required)) * 100)}%`,
                  }}
                />
              </span>
              <span className="coord-between">
                <small>
                  {r.summary.arranged}/{r.summary.required}{" "}
                  {t(en, "ব্যবস্থা", "arranged")}
                </small>
                <small>
                  {r.coordinator?.name ??
                    t(en, "দায়িত্ব দেওয়া বাকি", "Unassigned")}
                </small>
              </span>
            </button>
          ))}
          {q.data.total > 12 && (
            <div className="coord-between">
              <button
                className="button secondary small"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                {t(en, "আগের", "Previous")}
              </button>
              <span>{page}</span>
              <button
                className="button secondary small"
                disabled={page * 12 >= q.data.total}
                onClick={() => setPage(page + 1)}
              >
                {t(en, "পরের", "Next")}
              </button>
            </div>
          )}
        </aside>
        <div className="coord-detail-container">
          {active ? (
            <RequestDesk key={active} id={active} />
          ) : (
            <div className="coord-empty">
              <ClipboardList size={36} />
              <h2>
                {t(en, "এই মুহূর্তে কোনো দায়িত্ব নেই", "No open assignments")}
              </h2>
              <p>
                {t(
                  en,
                  "Admin দায়িত্ব দিলে এখানে অনুরোধ দেখাবে।",
                  "Requests will appear here when an administrator assigns them.",
                )}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
