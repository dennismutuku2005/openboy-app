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
      <div className="mb-3 animate-pulse">
        <Image
          src="/logos/logo.png"
          alt="OpenBoy Logo"
          width={64}
          height={64}
          priority
          className="object-contain"
        />
      </div>
      <p className="text-xs text-zinc-400">
        Redirecting to OpenBoy...
      </p>
    </div>
  );
}
