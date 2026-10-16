import { useState } from "react";
import { authApi } from "../api/auth.api";
import { authSchema } from "../schemas/auth.schema";
import type { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Droplets, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { qc } from "@/lib/query-client";
import { usePrefs } from "@/store/preferences.store";
import { t } from "@/i18n/translate";
import { Field } from "@/components/ui/Field";
import { setCsrf } from "@/services/http";
import { errorText } from "@/utils/error-text";

export function AuthPage({ mode }: { mode: "register" | "login" }) {
  const { en } = usePrefs();
  const nav = useNavigate();
  const register = mode === "register";
  const [recoveryKey, setRecoveryKey] = useState("");
  const schema = authSchema(register);
  const {
    register: r,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });
  const m = useMutation({
    mutationFn: async (values: z.output<typeof schema>) =>
      register
        ? authApi.register({
            email: values.email,
            password: values.password,
            consent: values.consent,
          })
        : authApi.login({ email: values.email, password: values.password }),
    onSuccess: async (data) => {
      qc.removeQueries();
      setCsrf(data.csrf);
      qc.setQueryData(["me"], data.user);
      if ("recoveryKey" in data && typeof data.recoveryKey === "string")
        setRecoveryKey(data.recoveryKey);
      else nav("/dashboard?tab=profile");
    },
    onError: (e) => toast.error(errorText(e)),
  });
  if (recoveryKey)
    return (
      <section className="form-page">
        <div className="panel">
          <h1>{t(en, "অ্যাকাউন্ট তৈরি হয়েছে", "Account created")}</h1>
          <p>
            {t(
              en,
              "এই recovery key নিরাপদে সংরক্ষণ করুন। পাসওয়ার্ড ভুলে গেলে এটি লাগবে। এটি আবার দেখানো হবে না।",
              "Save this recovery key privately. You need it if you forget your password. It is shown only once.",
            )}
          </p>
          <textarea
            aria-label="Account recovery key"
            readOnly
            value={recoveryKey}
            rows={3}
          />
          <button
            className="button secondary"
            onClick={() => {
              const url = URL.createObjectURL(
                new Blob([recoveryKey], { type: "text/plain" }),
              );
              const link = document.createElement("a");
              link.href = url;
              link.download = "madhublood-recovery-key.txt";
              link.click();
              URL.revokeObjectURL(url);
            }}
          >
            Download recovery key
          </button>
          <button
            className="button"
            onClick={() => {
              setRecoveryKey("");
              m.reset();
              nav("/dashboard?tab=profile");
            }}
          >
            I saved my key — complete profile
          </button>
        </div>
      </section>
    );
  return (
    <section className="form-page">
      <div className="form-intro">
        <Droplets size={36} />
        <h1>
          {register
            ? t(en, "জীবনের পাশে থাকার শুরু", "Make a difference. Join us.")
            : t(en, "আবার স্বাগতম", "Welcome back")}
        </h1>
        <p>
          {t(
            en,
            "একটি নিরাপদ, স্বেচ্ছাসেবী কমিউনিটিতে আপনাকে স্বাগতম।",
            "A caring community, built on trust and consent.",
          )}
        </p>
      </div>
      <form className="panel" onSubmit={handleSubmit((v) => m.mutate(v))}>
        <Field label={t(en, "ইমেইল ঠিকানা", "Email address")}>
          <input
            type="email"
            autoComplete="email"
            maxLength={254}
            {...r("email")}
          />
        </Field>
        <Field label={t(en, "পাসওয়ার্ড", "Password")}>
          <input
            type="password"
            autoComplete={register ? "new-password" : "current-password"}
            {...r("password")}
          />
        </Field>
        {register && (
          <Field label={t(en, "পাসওয়ার্ড নিশ্চিত করুন", "Confirm password")}>
            <input
              type="password"
              autoComplete="new-password"
              {...r("confirmPassword")}
            />
          </Field>
        )}
        {register && (
          <label className="checkbox">
            <input type="checkbox" {...r("consent")} />
            <span>
              {t(
                en,
                "আমি অ্যাকাউন্ট তৈরিতে সম্মত এবং গোপনীয়তা নীতি পড়েছি।",
                "I consent to account creation and have read the privacy policy.",
              )}{" "}
              <Link to="/privacy">Privacy</Link>
            </span>
          </label>
        )}
        {Object.entries(errors).map(([key, e]) => (
          <p className="error-text" role="alert" key={key}>
            {String(e?.message)}
          </p>
        ))}
        <button className="button full" disabled={m.isPending}>
          {m.isPending
            ? "…"
            : register
              ? t(en, "অ্যাকাউন্ট তৈরি করুন", "Create account")
              : t(en, "লগ ইন করুন", "Sign in")}
          <ArrowRight size={17} />
        </button>
        <p>
          {register ? (
            <Link to="/login">
              {t(en, "অ্যাকাউন্ট আছে? লগ ইন", "Already registered? Sign in")}
            </Link>
          ) : (
            <>
              <Link to="/register">
                {t(en, "নতুন অ্যাকাউন্ট", "Create account")}
              </Link>{" "}
              ·{" "}
              <Link to="/forgot-password">
                {t(en, "পাসওয়ার্ড ভুলে গেছেন?", "Forgot password?")}
              </Link>
            </>
          )}
        </p>
      </form>
    </section>
  );
}
