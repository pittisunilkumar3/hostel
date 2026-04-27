"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const redirectToLogin = async () => {
      try {
        const res = await fetch(`${API_URL}/api/settings/login-url-public`);
        const data = await res.json();
        if (data.success && data.data && data.data.customer_login_url) {
          router.replace(`/login/${data.data.customer_login_url}`);
        } else {
          router.replace("/login/user");
        }
      } catch {
        router.replace("/login/user");
      }
    };
    redirectToLogin();
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
