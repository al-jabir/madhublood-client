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
  const schema = authSchema(register);
  const {
    register: r,
    getValues,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });
  const m = useMutation({
    mutationFn: async (values: z.output<typeof schema>) =>
      register ? authApi.register(values) : authApi.login(values),
    onSuccess: async (data) => {
      if ("message" in data) {
        toast.success(data.message);
        nav("/verify-otp", { state: { phone: getValues("phone") } });
      } else {
        setCsrf(data.csrf);
        await qc.invalidateQueries({ queryKey: ["me"] });
        nav("/dashboard");
      }
    },
    onError: (e) => toast.error(errorText(e)),
  });
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
        {register && (
          <Field label={t(en, "পূর্ণ নাম", "Full name")}>
            <input autoComplete="name" {...r("name")} />
          </Field>
        )}
        <Field label={t(en, "মোবাইল নম্বর", "Mobile number")}>
          <input
            type="tel"
            placeholder="+8801XXXXXXXXX"
            autoComplete="tel"
            {...r("phone")}
          />
        </Field>
        <Field label={t(en, "পাসওয়ার্ড", "Password")}>
          <input
            type="password"
            autoComplete={register ? "new-password" : "current-password"}
            {...r("password")}
          />
        </Field>
        {!register && (
          <Field label="Administrator MFA (if applicable)">
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              {...r("mfa")}
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
