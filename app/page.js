"use client";

import { useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function RootRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    try {
      const user = localStorage.getItem("openboy_user");
      if (user) {
        router.replace("/dashboard");
      } else {
        router.replace("/login");
      }
    } catch {
      router.replace("/login");
    }
  }, [router]);

  return (
    <div className="min-h-screen w-full bg-[#14170e] flex flex-col items-center justify-center text-white">
      <div className="w-14 h-14 rounded-2xl bg-[#1d2314] border border-[#353f24] flex items-center justify-center p-2 mb-3 animate-pulse">
        <Image
          src="/logos/logo.png"
          alt="OpenBoy Logo"
          width={40}
          height={40}
          priority
          className="object-contain"
        />
      </div>
      <p className="text-xs text-zinc-400 font-mono tracking-wider">
        Redirecting to OpenBoy...
      </p>
    </div>
  );
}
