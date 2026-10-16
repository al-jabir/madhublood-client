import { requestsApi } from "@/features/blood-requests/api/blood-requests.api";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useState } from "react";
import { toast } from "sonner";
import { errorText } from "@/utils/error-text";
export function EditRequest() {
  const { id } = useParams();
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);
  const q = useQuery({
    queryKey: ["request-edit", id],
    queryFn: async () => requestsApi.detail(id),
  });
  if (q.isPending)
    return (
      <div className="loading" role="status">
        Loading…
      </div>
    );
  if (q.isError) return <p className="notice error">{errorText(q.error)}</p>;
  const d = q.data;
  if (!d.owner)
    return (
      <section className="page">
        <h1>403</h1>
        <p>Only the owner can edit this request.</p>
      </section>
    );
  return (
    <section className="page narrow">
      <div className="page-heading">
        <h1>অনুরোধ সম্পাদনা · Edit request</h1>
        <p>
          Edits return the request to moderation before it can become active.
        </p>
      </div>
      <form
        className="panel form-grid"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          const data = Object.fromEntries(new FormData(e.currentTarget));
          try {
            await requestsApi.edit(id, {
              ...data,
              units: Number(data.units),
              requiredAt: new Date(String(data.requiredAt)).toISOString(),
              contactConsent: data.contactConsent === "on",
            });
            toast.success("Updated and submitted for review");
            nav("/requests/" + id);
          } catch (err) {
            toast.error(errorText(err));
          } finally {
            setBusy(false);
          }
        }}
      >
        {[
          ["representative", "Representative", "text"],
          ["contact", "Mobile number", "tel"],
          ["hospital", "Hospital", "text"],
          ["area", "Area", "text"],
          ["units", "Units", "number"],
          ["requiredAt", "Required by", "datetime-local"],
        ].map(([name, label, type]) => (
          <label className="field" key={name}>
            {label}
            <input
              name={name}
              type={type}
              defaultValue={
                name === "requiredAt"
                  ? new Date(
                      new Date(d[name]).getTime() -
                        new Date(d[name]).getTimezoneOffset() * 60000,
                    )
                      .toISOString()
                      .slice(0, 16)
                  : String(d[name as keyof typeof d] ?? "")
              }
              required
              min={name === "units" ? 1 : undefined}
              max={name === "units" ? 20 : undefined}
            />
          </label>
        ))}
        <label className="field">
          Blood group
          <select name="bloodGroup" defaultValue={d.bloodGroup}>
            {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
        </label>
        <label className="field">
          Component
          <select name="component" defaultValue={d.component}>
            {["whole-blood", "red-cells", "platelets", "plasma"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className="field">
          Urgency
          <select name="urgency" defaultValue={d.urgency}>
            {["routine", "urgent", "critical"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className="field">
          Instructions
          <textarea
            name="instructions"
            defaultValue={d.instructions}
            maxLength={500}
          />
        </label>
        <label className="checkbox span2">
          <input
            name="contactConsent"
            type="checkbox"
            defaultChecked={d.contactConsent}
            required
          />
          I consent to sharing my contact with accepting donors.
        </label>
        <button className="button" disabled={busy}>
          Save and resubmit
        </button>
        <Link className="button secondary" to={"/requests/" + id}>
          Cancel editing
        </Link>
      </form>
    </section>
  );
}
