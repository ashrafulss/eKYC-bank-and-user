"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError("");
    // if (!form.email || !form.password) {
    //   setError("Please fill in all fields.");
    //   return;
    // }

    setLoading(true);
    try {
      //   const res = await fetch("/api/bank/login", {
      //     method: "POST",
      //     headers: { "Content-Type": "application/json" },
      //     body: JSON.stringify(form),
      //   });

      //   if (!res.ok) {
      //     const data = await res.json();
      //     setError(data.message || "Invalid credentials.");
      //     return;
      //   }

      router.push("/dashboard");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-blue-900 rounded-lg p-8 text-white">
      <h3 className="text-2xl font-bold mb-2">Staff Login</h3>
      <p className="text-blue-200 text-sm mb-8">
        Access restricted to authorized bank personnel only.
      </p>

      <div className="space-y-5">
        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-blue-100 mb-1.5">
            Email address
          </label>
          <input
            type="email"
            placeholder="staff@bank.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full px-4 py-2.5 rounded-md bg-blue-800 border border-blue-700 text-white placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
          />
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-blue-100 mb-1.5">
            Password
          </label>
          <input
            type="password"
            placeholder="••••••••"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full px-4 py-2.5 rounded-md bg-blue-800 border border-blue-700 text-white placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/20 border border-red-400/30 rounded-md px-3 py-2">
            <span className="text-red-300 text-xs">{error}</span>
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleLogin}
          disabled={loading}
          className={`w-full py-2.5 rounded-md font-semibold text-sm transition-all ${
            loading
              ? "bg-blue-400 cursor-not-allowed"
              : "bg-white text-blue-900 hover:bg-blue-50 active:scale-[0.98]"
          }`}
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>

        <p className="text-xs text-blue-300 text-center pt-2">
          Reviewer · Approver · Admin roles supported
        </p>
      </div>
    </div>
  );
}
