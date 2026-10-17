import { Loading } from "@/components/feedback/Loading";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { locationsApi } from "../api/locations.api";
import { Failure } from "@/components/feedback/Failure";
import { errorText } from "@/utils/error-text";
export function LocationsPanel() {
  const client = useQueryClient();
  const q = useQuery({
    queryKey: ["operations", "locations"],
    queryFn: () => locationsApi.list(50),
  });
  if (q.isPending) return <Loading compact />;
  if (q.isError) return <Failure error={q.error} />;
  return (
    <div className="panel">
      <form
        className="form-grid"
        onSubmit={async (event) => {
          event.preventDefault();
          try {
            await locationsApi.create(
              Object.fromEntries(new FormData(event.currentTarget)),
            );
            toast.success("Saved");
            client.invalidateQueries({ queryKey: ["operations"] });
          } catch (error) {
            toast.error(errorText(error));
          }
        }}
      >
        <label className="field">
          Location name
          <input name="name" minLength={2} maxLength={100} required />
        </label>
        <label className="field">
          Type
          <select name="kind">
            {["district", "upazila", "union", "municipality", "locality"].map(
              (value) => (
                <option key={value}>{value}</option>
              ),
            )}
          </select>
        </label>
        <label className="field span2">
          Official government source URL
          <input
            name="sourceUrl"
            type="url"
            required
            placeholder="https://…gov.bd/…"
          />
        </label>
        <button className="button">Import reviewed location</button>
      </form>
      {!q.data.items.length ? (
        <p className="muted">No records.</p>
      ) : (
        q.data.items.map((row) => (
          <div className="list-row" key={row._id}>
            <div>
              <strong>{row.name}</strong>
              <small>
                {row.kind} ·{" "}
                <a href={row.sourceUrl} target="_blank" rel="noreferrer">
                  Source
                </a>
              </small>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
