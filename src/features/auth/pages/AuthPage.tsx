import { useState } from "react";
import { authApi } from "../api/auth.api";
import { authSchema } from "../schemas/auth.schema";
import type { z } from "zod";
import { Link, useNavigate, useLocation } from "react-router-dom";
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
import { AuthLayout } from "../components/AuthLayout";
import { PasswordInput } from "@/components/ui/PasswordInput";

export function AuthPage({ mode }: { mode: "register" | "login" }) {
  const { en } = usePrefs();
  const nav = useNavigate();
  const location = useLocation();
  const register = mode === "register";
  const [recoveryKey, setRecoveryKey] = useState("");
  const schema = authSchema(register);
  const {
    register: r,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });
  const m = useMutation({
    mutationFn: async (values: z.output<typeof schema>) => {
      if (register)
        return authApi.register({
          email: values.email,
          password: values.password,
          consent: values.consent,
        });
      await authApi.login({ email: values.email, password: values.password });
      // Confirm the browser retained the session before opening a private page.
      return authApi.me();
    },
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
      <AuthLayout>
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
      </AuthLayout>
    );
  return (
    <AuthLayout>
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
        {typeof location.state?.message === "string" && (
          <p className="notice" role="status">
            {location.state.message}
          </p>
        )}
        <Field label={t(en, "ইমেইল ঠিকানা", "Email address")}>
          <input
            type="email"
            autoComplete="email"
            maxLength={254}
            {...r("email")}
          />
        </Field>
        <Field label={t(en, "পাসওয়ার্ড", "Password")}>
          <PasswordInput
            autoComplete={register ? "new-password" : "current-password"}
            {...r("password")}
          />
        </Field>
        {register && (
          <Field label={t(en, "পাসওয়ার্ড নিশ্চিত করুন", "Confirm password")}>
            <PasswordInput
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
            ? t(en, "একটু অপেক্ষা করুন…", "Please wait…")
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
    </AuthLayout>
  );
}
