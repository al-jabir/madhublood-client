import { usePrefs } from "@/store/preferences.store";
import { t } from "@/i18n/translate";
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useMe } from "@/features/auth/hooks/useMe";
import { Loading } from "@/components/feedback/Loading";
import { Failure } from "@/components/feedback/Failure";
import { Info } from "@/components/feedback/Info";

export function RequireUser({ children }: { children: React.ReactNode }) {
  const { en } = usePrefs();
  const q = useMe();
  const location = useLocation();
  return q.isPending ? (
    <Loading />
  ) : q.isError ? (
    <Failure error={q.error} />
  ) : !q.data ? (
    <Info
      title={t(en, "লগ ইন প্রয়োজন", "Sign in required")}
      text={t(
        en,
        "এই কাজের জন্য আপনার অ্যাকাউন্টে লগ ইন করুন।",
        "Sign in to your account to continue.",
      )}
      action
      actionState={{
        returnTo: { pathname: location.pathname, state: location.state },
      }}
    />
  ) : q.data.verificationRequired ? (
    <Navigate
      to="/verify-email"
      replace
      state={{
        email: q.data.email,
        returnTo: { pathname: location.pathname, state: location.state },
      }}
    />
  ) : (
    <>{children}</>
  );
}
