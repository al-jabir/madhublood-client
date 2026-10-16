import { errorText } from "@/utils/error-text";

export function Failure({ error }: { error: unknown }) {
  return (
    <div className="notice error" role="alert">
      {errorText(error)}
    </div>
  );
}
