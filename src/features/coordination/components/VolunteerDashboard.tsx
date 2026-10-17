import { useState, useEffect } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import {
  Plus,
  ClipboardList,
  Clock3,
  CheckCheck,
  ArrowUpRight,
  HeartHandshake,
  RefreshCw,
  History,
  Phone,
  MessageSquare,
  Search,
  UserRound,
  Edit3,
} from "lucide-react";
import { useMe } from "@/features/auth/hooks/useMe";
import { RequireUser } from "@/features/auth/components/RequireUser";
import { usePrefs } from "@/store/preferences.store";
import { t } from "@/i18n/translate";
import { canVolunteer } from "@/utils/volunteer-permissions";
import { Loading } from "@/components/feedback/Loading";
import { Failure } from "@/components/feedback/Failure";
import {
  volunteerApi,
  type VolunteerRequest,
  type VolunteerTask,
  type VolunteerActivity,
} from "../api/volunteer.api";
import { RequestDesk } from "./CoordinationDesk";
import { FamilyFeedback } from "./FamilyFeedback";
import { requestLabel } from "@/features/blood-requests/request-labels";
import "../volunteer.css";
export function VolunteerDashboard({
  embedded = false,
}: {
  embedded?: boolean;
}) {
  const { en } = usePrefs();
  const me = useMe();
  const [params, setParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [groupFilter, setGroupFilter] = useState("all");
  const tab = ["overview", "requests", "tasks", "history"].includes(
    params.get("tab") ?? "",
  )
    ? params.get("tab")!
    : "overview";
  const assigned = params.get("list") === "assigned";
  const page = Math.max(1, Number(params.get("page")) || 1);
  const status = params.get("status") || "all";
  const [selected, setSelected] = useState<{
    id: string;
    work: boolean;
    units: number;
    feedback?: VolunteerRequest["familyFeedback"];
  }>();
  useEffect(() => {
    if (selected)
      document
        .getElementById("volunteer-selected")
        ?.scrollIntoView({ block: "start" });
  }, [selected]);
  const submit = canVolunteer(me.data, "submit-referrals"),
    manage = canVolunteer(me.data, "coordinate-requests");
  const q = useQuery({
    queryKey: ["volunteer-dashboard", me.data?.id, tab, assigned, page, status],
    enabled: !!me.data && (submit || manage),
    queryFn: () =>
      volunteerApi.dashboard(
        tab === "requests" && assigned ? "assignments" : tab,
        page,
        status,
      ),
    refetchInterval: 30000,
    placeholderData: keepPreviousData,
  });
  const requestsList =
    (tab === "overview" || tab === "requests") && q.data
      ? (q.data.items as VolunteerRequest[])
          .filter((r) => {
            if (tab !== "requests") return true;
            if (groupFilter !== "all" && r.bloodGroup !== groupFilter)
              return false;
            if (searchQuery.trim()) {
              const term = searchQuery.toLowerCase().trim();
              const matchHospital = r.hospital?.toLowerCase().includes(term);
              const matchArea = r.area?.toLowerCase().includes(term);
              const matchBlood = r.bloodGroup?.toLowerCase().includes(term);
              const matchRep = r.representative?.toLowerCase().includes(term);
              return Boolean(
                matchHospital || matchArea || matchBlood || matchRep,
              );
            }
            return true;
          })
          .slice(0, tab === "overview" ? 6 : 12)
      : [];
  function navigate(values: Record<string, string>) {
    setSelected(undefined);
    setParams({ ...values });
  }
  const n = (value: number) => value.toLocaleString(en ? "en-GB" : "bn-BD");
  const date = (value: string) =>
    new Date(value).toLocaleString(en ? "en-GB" : "bn-BD", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  const events: Record<string, string> = {
    "request.submitted": t(en, "অনুরোধ জমা দিয়েছেন", "Request submitted"),
    "request.updated": t(en, "তথ্য সংশোধন করেছেন", "Request edited"),
    "request.cancelled": t(en, "অনুরোধ বাতিল করেছেন", "Request cancelled"),
    "coordination.contact-updated": t(
      en,
      "রক্তদাতার খোঁজ রেখেছেন",
      "Donor follow-up recorded",
    ),
    "request.contact-attempt": t(
      en,
      "যোগাযোগের ফল লিখেছেন",
      "Contact outcome recorded",
    ),
    "coordination.ready": t(
      en,
      "রক্তের ব্যবস্থা করেছেন",
      "Arrangement marked ready",
    ),
    "coordination.family-confirmed": t(
      en,
      "পরিবারের নিশ্চিতকরণ রেখেছেন",
      "Family confirmation recorded",
    ),
    "coordination.family-feedback": t(
      en,
      "পরিবারের মতামত রেখেছেন",
      "Family feedback saved",
    ),
    "coordination.admin-completed": t(
      en,
      "অনুরোধ সম্পন্ন করেছেন",
      "Request completed",
    ),
  };
  return (
    <RequireUser>
      <section
        className={
          embedded ? "volunteer-dashboard" : "page volunteer-dashboard"
        }
      >
        <div className="volunteer-heading">
          <div>
            <span className="volunteer-eyebrow">
              <HeartHandshake size={16} />
              {t(en, "মানুষের পাশে, প্রতিটি ধাপে", "CARE THROUGH EVERY STEP")}
            </span>
            <h1>{t(en, "স্বেচ্ছাসেবকের ড্যাশবোর্ড", "Volunteer dashboard")}</h1>
            <p>
              {t(
                en,
                "আপনার যোগ করা অনুরোধ, দায়িত্ব আর পরের কাজ—এক জায়গায়।",
                "Your requests, responsibilities and next steps, in one place.",
              )}
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            <button
              className="button secondary"
              disabled={q.isFetching}
              onClick={() => q.refetch()}
              title={t(en, "তথ্য আপডেট করুন", "Refresh data")}
            >
              <RefreshCw size={15} />
              {t(en, "রিফ্রেশ", "Refresh")}
            </button>
            {submit && (
              <Link className="button" to="/requests/new?onBehalf=1">
                <Plus size={17} />
                {t(en, "রক্তের প্রয়োজন যোগ করুন", "Add a blood request")}
              </Link>
            )}
          </div>
        </div>
        {!submit && !manage ? (
          <div className="volunteer-empty">
            <ClipboardList size={30} />
            <h2>{t(en, "কাজের অনুমতি প্রয়োজন", "Work permission required")}</h2>
            <p>
              {t(
                en,
                "শুধু স্বেচ্ছাসেবক ভূমিকা থাকলেই কাজ করা যায় না। প্রয়োজনীয় অনুমতি ও এলাকার দায়িত্বের জন্য প্রশাসকের সঙ্গে যোগাযোগ করুন।",
                "A volunteer role alone does not grant work access. Ask an administrator for task permissions and an assigned service area.",
              )}
            </p>
            <Link to="/dashboard">
              {t(en, "আমার অ্যাকাউন্টে ফিরুন", "Back to my account")}
            </Link>
          </div>
        ) : (
          <>
            <nav
              className="volunteer-tabs"
              aria-label={t(en, "স্বেচ্ছাসেবকের কাজ", "Volunteer workspace")}
            >
              {[
                ["overview", "সারসংক্ষেপ", "Overview"],
                ["requests", "অনুরোধ", "Requests"],
                ["tasks", "আজকের কাজ", "Today’s tasks"],
                ["history", "ইতিহাস", "History"],
              ].map(([key, bn, label]) => (
                <button
                  key={key}
                  aria-pressed={tab === key}
                  onClick={() => navigate({ tab: key })}
                >
                  {t(en, bn, label)}
                </button>
              ))}
            </nav>
            {q.isError ? (
              <Failure error={q.error} />
            ) : q.isPending ? (
              <Loading compact />
            ) : (
              <>
                {tab === "overview" && (
                  <>
                    <div className="volunteer-metrics">
                      {[
                        [
                          q.data.stats.created,
                          "আমার যোগ করা",
                          "Requests I added",
                          ClipboardList,
                          "requests",
                        ],
                        [
                          q.data.stats.pending,
                          "যাচাইয়ের অপেক্ষায়",
                          "Awaiting review",
                          Clock3,
                          "pending",
                        ],
                        [
                          q.data.stats.assignedOpen,
                          "আমার দায়িত্বে চলমান",
                          "Open assignments",
                          HeartHandshake,
                          "assignments",
                        ],
                        [
                          q.data.stats.callbacks,
                          "আজকের ও বকেয়া কল",
                          "Today & overdue calls",
                          Phone,
                          "tasks",
                        ],
                        [
                          q.data.stats.completed,
                          "আমার সম্পন্ন অনুরোধ",
                          "My completed requests",
                          CheckCheck,
                          "completed",
                        ],
                      ].map(([value, bn, label, Icon, destination]) => {
                        const I = Icon as typeof ClipboardList;
                        return (
                          <button
                            key={String(destination)}
                            onClick={() =>
                              navigate(
                                destination === "assignments"
                                  ? {
                                      tab: "requests",
                                      list: "assigned",
                                      status: "open",
                                    }
                                  : destination === "tasks"
                                    ? { tab: "tasks" }
                                    : {
                                        tab: "requests",
                                        list: "mine",
                                        ...(destination === "pending" ||
                                        destination === "completed"
                                          ? { status: String(destination) }
                                          : {}),
                                      },
                              )
                            }
                          >
                            <span>
                              <I size={19} />
                              <ArrowUpRight size={15} />
                            </span>
                            <strong>{n(value as number)}</strong>
                            <small>
                              {t(en, bn as string, label as string)}
                            </small>
                          </button>
                        );
                      })}
                    </div>
                    <div className="volunteer-guidance">
                      <div>
                        <span className="volunteer-eyebrow">
                          {t(en, "আপনার পরের কাজ", "YOUR NEXT STEP")}
                        </span>
                        <h2>
                          {q.data.stats.callbacks > 0
                            ? t(
                                en,
                                "কিছু পরিবার ও রক্তদাতা আপনার ফোনের অপেক্ষায়",
                                "Your follow-up calls need attention",
                              )
                            : q.data.stats.pending > 0
                              ? t(
                                  en,
                                  "আপনার অনুরোধ যাচাই হচ্ছে",
                                  "Your requests are being reviewed",
                                )
                              : t(
                                  en,
                                  "একটি প্রয়োজন থেকে সাহায্য শুরু হয়",
                                  "Every request starts with someone’s need",
                                )}
                        </h2>
                        <p>
                          {t(
                            en,
                            "অনুরোধ যোগ করুন → অ্যাডমিন যাচাই করবেন → দায়িত্বপ্রাপ্ত ব্যক্তি যোগাযোগ করবেন → পরিবার নিশ্চিত করবে → অ্যাডমিন সম্পন্ন করবেন।",
                            "Add a request → admin reviews → assigned volunteer follows up → family confirms → admin completes.",
                          )}
                        </p>
                      </div>
                      <button
                        className="button secondary"
                        onClick={() =>
                          navigate({
                            tab:
                              q.data.stats.callbacks > 0 ? "tasks" : "requests",
                          })
                        }
                      >
                        {t(en, "কাজের তালিকা দেখুন", "View my work")}
                        <ArrowUpRight size={16} />
                      </button>
                    </div>
                    <div className="volunteer-unit-summary">
                      <div>
                        <strong>{n(q.data.stats.requestedUnits)}</strong>
                        <span>
                          {t(
                            en,
                            "আমার অনুরোধে চাওয়া ব্যাগ",
                            "Units requested in my submissions",
                          )}
                        </span>
                      </div>
                      <div>
                        <strong>{n(q.data.stats.familyReportedUnits)}</strong>
                        <span>
                          {t(
                            en,
                            "পরিবারের জানানো পাওয়া ব্যাগ",
                            "Units reported received by families",
                          )}
                        </span>
                      </div>
                      <p>
                        {t(
                          en,
                          "এটি হাসপাতাল-যাচাইকৃত রক্তদানের হিসাব নয়। সর্বশেষ পরিবারের মতামত অনুযায়ী পাওয়া ব্যাগ দেখানো হয়।",
                          "These are not hospital-verified donations. Received units reflect the latest recorded family feedback.",
                        )}
                      </p>
                    </div>
                  </>
                )}
                {(tab === "overview" || tab === "requests") && (
                  <>
                    <div className="volunteer-list-heading">
                      <div>
                        <h2>
                          {tab === "overview"
                            ? t(
                                en,
                                "আমার সাম্প্রতিক অনুরোধ",
                                "My recent submissions",
                              )
                            : assigned
                              ? t(
                                  en,
                                  "আমার দায়িত্বের অনুরোধ",
                                  "My assigned requests",
                                )
                              : t(
                                  en,
                                  "আমার যোগ করা অনুরোধ",
                                  "Requests I added",
                                )}
                        </h2>
                        <p>
                          {t(
                            en,
                            "কার কত ব্যাগ প্রয়োজন ও এখন কী অবস্থা—এখানে দেখুন।",
                            "See the requirement, current status and the next step for each request.",
                          )}
                        </p>
                      </div>
                      {tab === "requests" && (
                        <select
                          aria-label={t(
                            en,
                            "অনুরোধের অবস্থা",
                            "Filter request status",
                          )}
                          value={status}
                          onChange={(e) =>
                            navigate({
                              tab,
                              list: assigned ? "assigned" : "mine",
                              status: e.target.value,
                            })
                          }
                        >
                          {[
                            ["all", "সব অবস্থা", "All statuses"],
                            ["pending", "যাচাইয়ের অপেক্ষায়", "Awaiting review"],
                            ["open", "চলমান", "Open"],
                            ["completed", "সম্পন্ন", "Completed"],
                            ["closed", "অন্যভাবে বন্ধ", "Other closed"],
                          ].map(([key, bn, label]) => (
                            <option key={key} value={key}>
                              {t(en, bn, label)}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                    {tab === "requests" && (
                      <>
                        <div className="volunteer-list-switch">
                          <button
                            aria-pressed={!assigned}
                            onClick={() => navigate({ tab, list: "mine" })}
                          >
                            {t(en, "আমার যোগ করা", "Added by me")}
                          </button>
                          {manage && (
                            <button
                              aria-pressed={assigned}
                              onClick={() =>
                                navigate({
                                  tab,
                                  list: "assigned",
                                  status: "open",
                                })
                              }
                            >
                              {t(en, "আমার দায়িত্বে", "Assigned to me")}
                            </button>
                          )}
                        </div>
                        <div className="volunteer-search-bar">
                          <div className="volunteer-search-input">
                            <Search size={15} />
                            <input
                              type="search"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              placeholder={t(
                                en,
                                "হাসপাতাল, এলাকা বা রোগীর নাম দিয়ে খুঁজুন...",
                                "Search by hospital, area or patient...",
                              )}
                            />
                          </div>
                          <select
                            className="volunteer-group-select"
                            value={groupFilter}
                            onChange={(e) => setGroupFilter(e.target.value)}
                            aria-label={t(
                              en,
                              "রক্তের গ্রুপ",
                              "Filter blood group",
                            )}
                          >
                            <option value="all">
                              {t(en, "সব রক্তের গ্রুপ", "All blood groups")}
                            </option>
                            {[
                              "A+",
                              "A-",
                              "B+",
                              "B-",
                              "AB+",
                              "AB-",
                              "O+",
                              "O-",
                            ].map((bg) => (
                              <option key={bg} value={bg}>
                                {bg}
                              </option>
                            ))}
                          </select>
                        </div>
                      </>
                    )}
                    {requestsList.length ? (
                      <div className="volunteer-request-grid">
                        {requestsList.map((r) => (
                            <article
                              key={r._id}
                              className="volunteer-request-card"
                            >
                              <div className="volunteer-card-top">
                                <strong className="volunteer-blood">
                                  {r.bloodGroup}
                                </strong>
                                <div
                                  style={{
                                    display: "flex",
                                    gap: "6px",
                                    alignItems: "center",
                                    flexWrap: "wrap",
                                  }}
                                >
                                  {tab === "overview" && (
                                    <span className="badge">
                                      {r.owner === me.data?.id
                                        ? t(en, "আমার যোগ করা", "My submission")
                                        : t(en, "আমার দায়িত্বে", "Assigned")}
                                    </span>
                                  )}
                                  {r.urgency === "emergency" && (
                                    <span className="badge danger">
                                      {t(en, "জরুরী", "Emergency")}
                                    </span>
                                  )}
                                  <span className="badge">
                                    {requestLabel(en, r.status)}
                                  </span>
                                </div>
                              </div>
                              <h3>{r.hospital}</h3>
                              <p>{r.area}</p>
                              {r.representative && (
                                <div className="volunteer-requester-info">
                                  <span>
                                    <UserRound size={13} />
                                    {r.representative}
                                  </span>
                                  {r.contact && (
                                    <a
                                      href={`tel:${r.contact}`}
                                      className="volunteer-call-link"
                                      onClick={(e) => e.stopPropagation()}
                                      title={t(
                                        en,
                                        "প্রতিনিধিকে ফোন করুন",
                                        "Call requester",
                                      )}
                                    >
                                      <Phone size={13} />
                                      {r.contact}
                                    </a>
                                  )}
                                </div>
                              )}
                              <div className="volunteer-request-info">
                                <strong>
                                  {n(r.units)}{" "}
                                  {t(en, "ব্যাগ প্রয়োজন", "units needed")}
                                </strong>
                                <span>
                                  <Clock3 size={14} />
                                  {date(r.requiredAt)}
                                </span>
                              </div>
                              {r.familyFeedback && (
                                <p className="volunteer-feedback-status">
                                  <MessageSquare size={14} />
                                  {r.familyFeedback.outcome === "received"
                                    ? t(
                                        en,
                                        `পরিবার জানিয়েছে ${n(r.familyFeedback.receivedUnits)} ব্যাগ পেয়েছে`,
                                        `Family reported ${n(r.familyFeedback.receivedUnits)} units received`,
                                      )
                                    : r.familyFeedback.outcome === "problem"
                                      ? t(
                                          en,
                                          "পরিবার সমস্যা জানিয়েছে",
                                          "Family reported a problem",
                                        )
                                      : r.familyFeedback.outcome === "no-answer"
                                        ? t(
                                            en,
                                            "প্রতিনিধি ফোন ধরেননি",
                                            "Representative did not answer",
                                          )
                                        : t(
                                            en,
                                            "পরিবারের সঙ্গে কথা হয়েছে",
                                            "Family contacted",
                                          )}
                                </p>
                              )}
                              <div className="volunteer-card-actions">
                                <Link to={`/requests/${r._id}`}>
                                  {t(en, "অনুরোধ দেখুন", "View request")}
                                  <ArrowUpRight size={15} />
                                </Link>
                                {manage &&
                                  [
                                    "active",
                                    "donors-contacted",
                                    "arranged",
                                  ].includes(r.status) && (
                                    <button
                                      onClick={() =>
                                        setSelected({
                                          id: r._id,
                                          work: true,
                                          units: r.units,
                                        })
                                      }
                                    >
                                      {t(en, "যোগাযোগ ও অগ্রগতি", "Follow up")}
                                    </button>
                                  )}
                                {!["cancelled", "rejected", "expired"].includes(
                                  r.status,
                                ) && (
                                  <button
                                    onClick={() =>
                                      setSelected({
                                        id: r._id,
                                        work: false,
                                        units: r.units,
                                        feedback: r.familyFeedback,
                                      })
                                    }
                                  >
                                    {t(
                                      en,
                                      "পরিবারের মতামত",
                                      "Family feedback",
                                    )}
                                  </button>
                                )}
                                {r.owner === me.data?.id &&
                                  submit &&
                                  [
                                    "submitted",
                                    "verification",
                                    "active",
                                  ].includes(r.status) && (
                                    <Link
                                      to={`/requests/${r._id}/edit`}
                                      className="volunteer-edit-link"
                                    >
                                      <Edit3 size={13} />
                                      {t(en, "সম্পাদনা", "Edit")}
                                    </Link>
                                  )}
                              </div>
                            </article>
                          ))}
                      </div>
                    ) : (
                      <div className="volunteer-empty">
                        <ClipboardList size={30} />
                        <h3>
                          {searchQuery || groupFilter !== "all"
                            ? t(
                                en,
                                "কোনো অনুরোধ পাওয়া যায়নি",
                                "No requests match your filter",
                              )
                            : t(
                                en,
                                "এই তালিকায় এখনও কোনো অনুরোধ নেই",
                                "No requests in this list yet",
                              )}
                        </h3>
                        <p>
                          {searchQuery || groupFilter !== "all"
                            ? t(
                                en,
                                "ফিল্টার বা সার্চ পরিবর্তন করে আবার চেষ্টা করুন।",
                                "Try adjusting your search query or blood group filter.",
                              )
                            : assigned
                              ? t(
                                  en,
                                  "অ্যাডমিন দায়িত্ব দিলে এখানে অনুরোধ দেখা যাবে।",
                                  "Requests will appear when an administrator assigns them to you.",
                                )
                              : t(
                                  en,
                                  "আপনার যোগ করা অনুরোধ এখানে থাকবে।",
                                  "Your submitted requests will appear here.",
                                )}
                        </p>
                      </div>
                    )}
                  </>
                )}
                {tab === "tasks" && (
                  <>
                    <div className="volunteer-list-heading">
                      <div>
                        <h2>
                          {t(
                            en,
                            "আজকের ও বকেয়া ফোন",
                            "Today’s calls & overdue follow-ups",
                          )}
                        </h2>
                        <p>
                          {t(
                            en,
                            "বাংলাদেশ সময় অনুযায়ী আজকের নির্ধারিত কল ও বকেয়া কাজ। কল বা এসএমএস স্বয়ংক্রিয়ভাবে পাঠানো হয় না।",
                            "Scheduled calls due by today in Bangladesh time, including overdue work. Calls and SMS are not sent automatically.",
                          )}
                        </p>
                      </div>
                    </div>
                    {!manage ? (
                      <div className="volunteer-empty">
                        <p>
                          {t(
                            en,
                            "এই কাজ দেখতে পরিচালনার অনুমতি প্রয়োজন।",
                            "Coordination permission is required to view tasks.",
                          )}
                        </p>
                      </div>
                    ) : q.data.items.length ? (
                      <div className="volunteer-task-list">
                        {(q.data.items as VolunteerTask[]).map((task) => (
                          <article key={task.id}>
                            <span className="volunteer-task-icon">
                              <Phone size={19} />
                            </span>
                            <div>
                              <h3>
                                {task.name} · {task.bloodGroup}
                              </h3>
                              <p>{task.hospital}</p>
                              <small>{date(task.nextContactAt)}</small>
                            </div>
                            <div className="volunteer-task-actions">
                              {task.phone && (
                                <a
                                  className="button secondary small"
                                  href={`tel:${task.phone}`}
                                >
                                  <Phone size={14} />
                                  {task.phone}
                                </a>
                              )}
                              <button
                                className="button small"
                                onClick={() =>
                                  setSelected({
                                    id: task.requestId,
                                    work: true,
                                    units: 0,
                                  })
                                }
                              >
                                {t(en, "আপডেট ও কাজ", "Update")}
                              </button>
                            </div>
                          </article>
                        ))}
                      </div>
                    ) : (
                      <div className="volunteer-empty">
                        <CheckCheck size={30} />
                        <h3>
                          {t(
                            en,
                            "আজকের নির্ধারিত কল বাকি নেই",
                            "No scheduled calls are due",
                          )}
                        </h3>
                        <p>
                          {t(
                            en,
                            "নতুন রক্তদাতার খোঁজ নিতে আমার দায়িত্বের অনুরোধ খুলুন।",
                            "Open your assignments to follow up with new donors.",
                          )}
                        </p>
                      </div>
                    )}
                  </>
                )}
                {tab === "history" && (
                  <>
                    <div className="volunteer-list-heading">
                      <div>
                        <h2>
                          {t(en, "আমার কাজের ইতিহাস", "My activity history")}
                        </h2>
                        <p>
                          {t(
                            en,
                            "আপনার নিজের রেকর্ড করা কাজগুলো। ব্যক্তিগত নোট এখানে দেখানো হয় না।",
                            "Your own recorded activity. Private notes are not shown here.",
                          )}
                        </p>
                      </div>
                    </div>
                    {q.data.items.length ? (
                      <ol className="volunteer-history">
                        {(q.data.items as VolunteerActivity[]).map((item) => (
                          <li key={item.id}>
                            <span>
                              <History size={16} />
                            </span>
                            <div>
                              <strong>
                                {events[item.action] ??
                                  t(
                                    en,
                                    "অনুরোধ আপডেট করেছেন",
                                    "Request updated",
                                  )}
                              </strong>
                              <p>
                                {item.bloodGroup} · {item.hospital}
                              </p>
                              <small>{date(item.createdAt)}</small>
                            </div>
                            <Link
                              to={`/requests/${item.requestId}`}
                              aria-label={t(en, "অনুরোধ দেখুন", "View request")}
                            >
                              <ArrowUpRight size={19} />
                            </Link>
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <div className="volunteer-empty">
                        <History size={30} />
                        <p>
                          {t(
                            en,
                            "কাজ শুরু করলে এখানে ইতিহাস দেখা যাবে।",
                            "Your activity will appear here as you work.",
                          )}
                        </p>
                      </div>
                    )}
                  </>
                )}
                {tab !== "overview" && (
                  <div className="volunteer-pagination">
                    <span>
                      {n(q.data.total)} {t(en, "টি রেকর্ড", "records")}
                    </span>
                    <button
                      className="button secondary small"
                      disabled={page === 1 || q.isFetching}
                      onClick={() =>
                        navigate({
                          tab,
                          list: assigned ? "assigned" : "mine",
                          status,
                          page: String(page - 1),
                        })
                      }
                    >
                      {t(en, "আগের", "Previous")}
                    </button>
                    <span>{n(page)}</span>
                    <button
                      className="button secondary small"
                      disabled={page * 12 >= q.data.total || q.isFetching}
                      onClick={() =>
                        navigate({
                          tab,
                          list: assigned ? "assigned" : "mine",
                          status,
                          page: String(page + 1),
                        })
                      }
                    >
                      {t(en, "পরের", "Next")}
                    </button>
                  </div>
                )}
                {selected && (
                  <section
                    id="volunteer-selected"
                    className="volunteer-selected"
                  >
                    <div className="volunteer-selected-top">
                      <h2>
                        {selected.work
                          ? t(en, "এই অনুরোধের কাজ", "Request workspace")
                          : t(
                              en,
                              "পরিবারের খোঁজ রাখুন",
                              "Follow up with the family",
                            )}
                      </h2>
                      <button
                        className="button secondary small"
                        onClick={() => setSelected(undefined)}
                      >
                        {t(en, "বন্ধ করুন", "Close")}
                      </button>
                    </div>
                    {selected.work ? (
                      <RequestDesk key={selected.id} id={selected.id} />
                    ) : (
                      <FamilyFeedback
                        key={selected.id}
                        id={selected.id}
                        units={selected.units}
                        feedback={selected.feedback}
                      />
                    )}
                  </section>
                )}
                <button
                  className="volunteer-refresh"
                  disabled={q.isFetching}
                  onClick={() => q.refetch()}
                >
                  <RefreshCw size={14} />
                  {t(en, "তথ্য আবার দেখুন", "Refresh data")}
                </button>
              </>
            )}
          </>
        )}
      </section>
    </RequireUser>
  );
}
