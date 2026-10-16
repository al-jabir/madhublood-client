import { useCursorNavigation } from "@/hooks/useCursorNavigation";
import { CursorPager } from "@/components/common/CursorPager";
import { donationsApi } from "@/features/donations/api/donations.api";
import { useQuery } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { qc } from "@/lib/query-client";
import { Loading } from "@/components/feedback/Loading";
import { Failure } from "@/components/feedback/Failure";
import { Empty } from "@/components/feedback/Empty";
import { Field } from "@/components/ui/Field";
import { errorText } from "@/utils/error-text";

export function Donations() {
  const pagination = useCursorNavigation("");
  const q = useQuery({
    queryKey: ["donations", pagination.after],
    queryFn: async () => donationsApi.list(pagination.after),
  });
  return (
    <div className="panel">
      <h2>My donation history</h2>
      <form
        className="inline-form"
        onSubmit={async (e) => {
          e.preventDefault();
          const form = e.currentTarget;
          try {
            await donationsApi.record(Object.fromEntries(new FormData(form)));
            qc.invalidateQueries({ queryKey: ["donations"] });
            toast.success("Donation recorded");
            form.reset();
          } catch (e) {
            toast.error(errorText(e));
          }
        }}
      >
        <Field label="Donation date">
          <input
            type="date"
            name="date"
            required
            max={new Date().toISOString().slice(0, 10)}
          />
        </Field>
        <Field label="Hospital">
          <input name="hospital" required minLength={2} maxLength={150} />
        </Field>
        <button className="button">Record donation</button>
      </form>
      {q.isError ? (
        <Failure error={q.error} />
      ) : q.isPending ? (
        <Loading />
      ) : q.data.items.length ? (
        q.data.items.map((d) => (
          <div className="list-row" key={d._id}>
            <Heart className="red" />
            {d.date} · {d.hospital}
          </div>
        ))
      ) : (
        <Empty />
      )}
      <CursorPager
        navigation={pagination}
        nextCursor={q.data?.nextCursor}
        busy={q.isFetching}
      />
    </div>
  );
}
