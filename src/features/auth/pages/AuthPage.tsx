import { returnToFrom } from "../return-to";
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
  const returnTo = returnToFrom(location.state);
  const register = mode === "register";
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
      if (
        data.user.verificationRequired ||
        (register && !data.user.emailVerified)
      )
        nav("/verify-email", {
          replace: true,
          state: { email: data.user.email, returnTo, codeQueued: true },
        });
      else if (
        data.user.roles.some((role) =>
          ["admin", "super-admin", "volunteer"].includes(role),
        )
      )
        nav("/admin");
      else if (returnTo && data.user.profileCompleted)
        nav(returnTo.pathname, { state: returnTo.state });
      else nav("/dashboard?tab=profile", { state: { returnTo } });
    },
    onError: (e) => toast.error(errorText(e)),
  });
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
      <form className="auth-form" onSubmit={handleSubmit((v) => m.mutate(v))}>
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
            placeholder={t(en, "user@example.com", "user@example.com")}
            {...r("email")}
          />
        </Field>
        <Field label={t(en, "পাসওয়ার্ড", "Password")}>
          <PasswordInput
            autoComplete={register ? "new-password" : "current-password"}
            placeholder="••••••••"
            {...r("password")}
          />
        </Field>
        {register && (
          <Field label={t(en, "পাসওয়ার্ড নিশ্চিত করুন", "Confirm password")}>
            <PasswordInput
              autoComplete="new-password"
              placeholder="••••••••"
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
        <p className="auth-footer-links">
          {register ? (
            <Link to="/login" state={{ returnTo }}>
              {t(
                en,
                "অ্যাকাউন্ট আছে? লগ ইন করুন",
                "Already registered? Sign in",
              )}
            </Link>
          ) : (
            <>
              <Link to="/register" state={{ returnTo }}>
                {t(en, "নতুন অ্যাকাউন্ট তৈরি করুন", "Create account")}
              </Link>
              <span className="dot-sep">·</span>
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
