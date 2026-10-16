import { Link } from "react-router-dom";
import { ArrowRight, ShieldCheck } from "lucide-react";

export function Info({
  title,
  text,
  action = false,
  actionState,
}: {
  title: string;
  text: string;
  action?: boolean;
  actionState?: unknown;
}) {
  return (
    <section className="page narrow">
      <div className="panel empty">
        <ShieldCheck />
        <h1>{title}</h1>
        <p>{text}</p>
        <Link
          to={action ? "/login" : "/"}
          state={actionState}
          className="button"
        >
          {action ? "Sign in" : "Back home"}
          <ArrowRight size={17} />
        </Link>
      </div>
    </section>
  );
}
