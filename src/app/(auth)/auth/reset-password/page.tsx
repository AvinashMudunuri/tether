"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [invalidLink, setInvalidLink] = useState(false);
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const authError = searchParams.get("error");

  useEffect(() => {
    if (authError === "auth") {
      setError("Invalid or expired link. Please request a new one.");
      setInvalidLink(true);
      return;
    }
    if (tokenHash && type === "recovery") {
      setHasSession(false);
      return;
    }
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setHasSession(!!user);
      if (!user && !tokenHash) {
        setInvalidLink(true);
      }
    });
  }, [tokenHash, type, authError]);

  const canSetPassword = hasSession === true || (!!tokenHash && type === "recovery");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();

    if (tokenHash && type === "recovery" && hasSession !== true) {
      const { error: otpError } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: "recovery",
      });
      if (otpError) {
        setError(otpError.message);
        setLoading(false);
        return;
      }
    } else if (!canSetPassword) {
      setError("Please complete the verification first.");
      setLoading(false);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password });

    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    router.push("/login?reset=success");
    router.refresh();
  }

  if (hasSession === null && !tokenHash) {
    return (
      <div
        className="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-8 border border-slate-200 dark:border-slate-800"
        role="region"
      >
        <p className="text-slate-600 dark:text-slate-400">Verifying your reset link...</p>
      </div>
    );
  }

  if (invalidLink) {
    return (
      <div
        className="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-8 border border-slate-200 dark:border-slate-800"
        role="region"
      >
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Invalid or expired link
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          {error || "This password reset link is invalid or has expired. Please request a new one."}
        </p>
        <Link
          href="/forgot-password"
          className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
        >
          Request new reset link
        </Link>
      </div>
    );
  }

  if (!canSetPassword && !invalidLink) {
    return (
      <div
        className="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-8 border border-slate-200 dark:border-slate-800"
        role="region"
      >
        <p className="text-slate-600 dark:text-slate-400">Verifying...</p>
      </div>
    );
  }

  return (
    <div
      className="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-8 border border-slate-200 dark:border-slate-800"
      role="region"
      aria-labelledby="reset-heading"
    >
      <h1 id="reset-heading" className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
        Set new password
      </h1>
      <p className="text-slate-600 dark:text-slate-400 mb-6">
        Enter your new password below.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div
            className="p-3 rounded-lg bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 text-sm"
            role="alert"
          >
            {error}
          </div>
        )}

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
          >
            New password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
            className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
            placeholder="At least 6 characters"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          aria-busy={loading}
          className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium"
        >
          {loading ? "Updating..." : "Update password"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
        <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-8 border border-slate-200 dark:border-slate-800">
          <p className="text-slate-600 dark:text-slate-400">Loading...</p>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
