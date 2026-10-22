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
    <div className="min-h-screen w-full bg-openboy-bg flex flex-col items-center justify-center text-openboy-text-main">
      <div className="animate-pulse">
        <Image
          src="/logos/logo.png"
          alt="OpenBoy Logo"
          width={64}
          height={64}
          priority
          className="object-contain"
        />
      </div>
    </div>
  );
}
