import { useState } from "react";
import { DatePicker } from "@/components/ui/DatePicker";
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
  const [date, setDate] = useState("");
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
          if (!date) {
            toast.error("Choose a donation date first");
            return;
          }
          try {
            await donationsApi.record(Object.fromEntries(new FormData(form)));
            qc.invalidateQueries({ queryKey: ["donations"] });
            toast.success("Donation recorded");
            form.reset();
            setDate("");
            qc.invalidateQueries({ queryKey: ["community-stats"] });
          } catch (e) {
            toast.error(errorText(e));
          }
        }}
      >
        <Field label="Donation date">
          <DatePicker
            name="date"
            value={date}
            onChange={setDate}
            required
            max={new Date().toLocaleDateString("en-CA")}
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
