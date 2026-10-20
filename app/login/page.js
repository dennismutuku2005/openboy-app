"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Lock, User, AlertCircle, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Check if already authenticated
  useEffect(() => {
    try {
      const user = localStorage.getItem("openboy_user");
      if (user) {
        router.replace("/dashboard");
      }
    } catch {}
  }, [router]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password.trim()) {
      setError("Please provide both username and password.");
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      // Store internal operator session
      const userData = {
        username: username.trim(),
        role: "Operator",
        loginTime: new Date().toLocaleTimeString(),
      };
      try {
        localStorage.setItem("openboy_user", JSON.stringify(userData));
      } catch (err) {
        console.error(err);
      }
      router.push("/dashboard");
    }, 500);
  };

  const handleQuickLogin = (user, pass) => {
    setUsername(user);
    setPassword(pass);
  };

  return (
    <div className="min-h-screen w-full bg-[#14170e] flex flex-col items-center justify-center py-12 px-4 selection:bg-[#ffd600] selection:text-black">
      {/* Centered White Card with generous height and un-squeezed layout */}
      <div className="w-full max-w-[460px] bg-white rounded-2xl shadow-2xl p-10 sm:p-12 border border-zinc-200/60 relative min-h-[640px] flex flex-col justify-between">
        {/* Top Brand Header: Pure Logo with no background box and no text below */}
        <div>
          <div className="flex flex-col items-center mb-8">
            <Image
              src="/logos/logo.png"
              alt="OpenBoy Logo"
              width={80}
              height={80}
              priority
              className="object-contain transition-transform hover:scale-105"
            />
          </div>

          {/* Heading with generous spacing */}
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-[26px] font-bold text-zinc-900 tracking-tight">
              Log in to continue
            </h1>
            <p className="text-xs text-zinc-500 mt-2 font-medium">
              Please log in to continue.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2.5 animate-fade-in">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Username & Password Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username Input */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-2">
                Username <span className="text-amber-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  required
                  className="w-full pl-11 pr-4 py-3 text-sm bg-white text-zinc-900 border-2 border-[#ffd600] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ffd600]/40 transition-all placeholder:text-zinc-400 font-medium"
                />
                <User className="w-4 h-4 text-zinc-400 absolute left-4 top-3.5 pointer-events-none" />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-2">
                Password <span className="text-amber-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-11 pr-4 py-3 text-sm bg-white text-zinc-900 border-2 border-[#ffd600] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ffd600]/40 transition-all placeholder:text-zinc-400 font-medium"
                />
                <Lock className="w-4 h-4 text-zinc-400 absolute left-4 top-3.5 pointer-events-none" />
              </div>
            </div>

            {/* Electric Yellow Continue Button with Loading Spinner */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-6 bg-[#ffd600] hover:bg-[#eed000] text-black font-bold text-sm rounded-lg transition-all shadow-md hover:shadow-lg flex items-center justify-center cursor-pointer active:scale-[0.99] disabled:opacity-80"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin text-black" />
                ) : (
                  <span>Continue</span>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Bottom Section with Helper */}
        <div className="mt-8 pt-6 border-t border-zinc-100 flex items-center justify-center text-xs text-zinc-500">
          <button
            type="button"
            onClick={() => handleQuickLogin("admin", "openboy2026")}
            className="text-amber-600 hover:text-amber-700 font-semibold cursor-pointer underline underline-offset-4"
          >
            Auto-fill credentials
          </button>
        </div>
      </div>
    </div>
  );
}
