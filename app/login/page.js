"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/home");
    });
  }, [router]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (!data.session) {
          setNotice("Account created. Check your email to confirm, then sign in.");
          setMode("signin");
        } else {
          router.replace("/home");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.replace("/home");
      }
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-gradient-to-br from-violet-50 via-paper to-sky-50">
      <div className="w-full max-w-sm bg-white/80 backdrop-blur rounded-3xl shadow-lg shadow-violet-100 p-8 animate-fadeIn">
        <h1 className="text-2xl font-semibold text-center mb-1">Study Hub</h1>
        <p className="text-center text-sm text-ink/60 mb-6">
          {mode === "signin" ? "Welcome back — sign in to sync your data." : "Create your account."}
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-violet-100 bg-violet-50/40 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-violet-300"
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-violet-100 bg-violet-50/40 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-violet-300"
          />

          {error && <p className="text-sm text-rose-600">{error}</p>}
          {notice && <p className="text-sm text-emerald-600">{notice}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-violet-500 text-white py-3 text-sm font-medium shadow-md shadow-violet-200 disabled:opacity-60 active:scale-[0.98] transition"
          >
            {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <button
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setError("");
            setNotice("");
          }}
          className="mt-4 w-full text-center text-xs text-violet-600"
        >
          {mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
