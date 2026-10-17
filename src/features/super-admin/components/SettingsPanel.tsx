import { Loading } from "@/components/feedback/Loading";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { superAdminApi } from "../api/super-admin.api";
import { qc } from "@/lib/query-client";
import { Failure } from "@/components/feedback/Failure";
import { errorText } from "@/utils/error-text";
import { Field } from "@/components/ui/Field";
export function SettingsPanel() {
  const q = useQuery({
    queryKey: ["platform-settings"],
    queryFn: superAdminApi.settings,
  });
  const save = useMutation({
    mutationFn: ({ key, value }: { key: string; value: string | boolean }) =>
      superAdminApi.updateSetting(key, value),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["platform-settings"] });
      await qc.invalidateQueries({ queryKey: ["platform"] });
      toast.success("Platform setting updated successfully.");
    },
    onError: (error) => toast.error(errorText(error)),
  });
  if (q.isPending) return <Loading compact />;
  if (q.isError) return <Failure error={q.error} />;
  const value = (key: string) =>
    q.data.items.find((item) => item.key === key)?.value;
  return (
    <div className="panel">
      <h3>Platform settings</h3>
      <p>
        Maintenance pauses public API access. Staff can still sign in and turn
        it off. Health checks and account recovery remain available.
      </p>
      <label className="checkbox">
        <input
          type="checkbox"
          checked={
            save.isPending && save.variables?.key === "maintenance"
              ? save.variables.value === true
              : value("maintenance") === true
          }
          disabled={save.isPending}
          onChange={(e) =>
            save.mutate({ key: "maintenance", value: e.target.checked })
          }
        />
        Maintenance mode
      </label>
      <label className="checkbox">
        <input
          type="checkbox"
          checked={
            save.isPending && save.variables?.key === "registrationOpen"
              ? save.variables.value === true
              : value("registrationOpen") !== false
          }
          disabled={save.isPending}
          onChange={(e) =>
            save.mutate({ key: "registrationOpen", value: e.target.checked })
          }
        />
        Allow new registrations
      </label>
      <form
        key={String(value("supportMessage"))}
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate({
            key: "supportMessage",
            value: String(new FormData(e.currentTarget).get("message") ?? ""),
          });
        }}
      >
        <Field label="Public support message">
          <textarea
            name="message"
            maxLength={500}
            defaultValue={
              typeof value("supportMessage") === "string"
                ? String(value("supportMessage"))
                : ""
            }
          />
        </Field>
        <button className="button" disabled={save.isPending}>
          Save support message
        </button>
      </form>
    </div>
  );
}
