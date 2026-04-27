"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/login/user");
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-emerald-200">Redirecting to login...</p>
      </div>
    </div>
  );
}
