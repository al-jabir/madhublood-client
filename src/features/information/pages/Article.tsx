import { helpFaq, helpSteps } from "@/i18n/help";
import { t } from "@/i18n/translate";
import { accountApi } from "@/features/profile/api/account.api";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { usePrefs } from "@/store/preferences.store";
import { PageHeading } from "@/components/common/PageHeading";
import { Field } from "@/components/ui/Field";
import { RequireUser } from "@/features/auth/components/RequireUser";
import { content } from "@/i18n/content";
import { errorText } from "@/utils/error-text";

export function Article({ page }: { page: string }) {
  const { en } = usePrefs();
  const c = content[page];
  return (
    <section className="page narrow">
      <PageHeading title={c[en ? 1 : 0]} />
      <div className="panel prose">
        {page === "faq" || page === "how-it-works" ? (
          (page === "faq" ? helpFaq : helpSteps).map((row, index) => (
            <section className="help-item" key={index}>
              <h2>{row[en ? 1 : 0]}</h2>
              <p>{row[en ? 3 : 2]}</p>
            </section>
          ))
        ) : (
          <p>{c[en ? 3 : 2]}</p>
        )}
        {page === "how-it-works" && (
          <Link className="button" to="/donors">
            {t(en, "রক্তদাতা খুঁজুন", "Find donors")} <ArrowRight size={17} />
          </Link>
        )}
        {page === "contact" && (
          <RequireUser>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget;
                try {
                  await accountApi.support(new FormData(form).get("message"));
                  toast.success("Support request saved");
                  form.reset();
                } catch (err) {
                  toast.error(errorText(err));
                }
              }}
            >
              <Field label="Your message">
                <textarea
                  name="message"
                  required
                  minLength={10}
                  maxLength={2000}
                />
              </Field>
              <button className="button">Submit support request</button>
            </form>
          </RequireUser>
        )}
      </div>
      <div className="article-links">
        <Link to="/guidelines">Donation guidelines</Link>
        <Link to="/faq">FAQ</Link>
      </div>
    </section>
  );
}
