import React from "react";
import { useMe } from "@/features/auth/hooks/useMe";
import { Loading } from "@/components/feedback/Loading";
import { Failure } from "@/components/feedback/Failure";
import { Info } from "@/components/feedback/Info";

export function RequireUser({ children }: { children: React.ReactNode }) {
  const q = useMe();
  return q.isPending ? (
    <Loading />
  ) : q.isError ? (
    <Failure error={q.error} />
  ) : !q.data ? (
    <Info
      title="লগ ইন প্রয়োজন · Sign in required"
      text="এই কাজের জন্য আপনার অ্যাকাউন্টে লগ ইন করুন।"
      action
    />
  ) : (
    <>{children}</>
  );
}
