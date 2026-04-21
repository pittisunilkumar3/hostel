"use client";

import { useEffect, useState } from "react";

const API_URL = "http://localhost:3001";

interface LoginSetup {
  manualLogin: boolean;
  otpLogin: boolean;
  socialLogin: boolean;
  googleLogin: boolean;
  facebookLogin: boolean;
  appleLogin: boolean;
  emailVerification: boolean;
  phoneVerification: boolean;
  loaded: boolean;
}

const defaults: LoginSetup = {
  manualLogin: true,
  otpLogin: false,
  socialLogin: false,
  googleLogin: false,
  facebookLogin: false,
  appleLogin: false,
  emailVerification: false,
  phoneVerification: false,
  loaded: false,
};

export function useLoginSetup() {
  const [setup, setSetup] = useState<LoginSetup>(defaults);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      // Try cache first
      try {
        const cached = localStorage.getItem("loginSetup");
        if (cached) {
          const parsed = JSON.parse(cached);
          if (mounted) setSetup({ ...parsed, loaded: true });
        }
      } catch {}

      // Fetch fresh
      try {
        const res = await fetch(`${API_URL}/api/settings/login-setup-public`);
        const data = await res.json();
        if (data.success && data.data && mounted) {
          const d = data.data;
          const s: LoginSetup = {
            manualLogin: !!d.manual_login_status,
            otpLogin: !!d.otp_login_status,
            socialLogin: !!d.social_login_status,
            googleLogin: !!d.google_login_status,
            facebookLogin: !!d.facebook_login_status,
            appleLogin: !!d.apple_login_status,
            emailVerification: !!d.email_verification_status,
            phoneVerification: !!d.phone_verification_status,
            loaded: true,
          };
          setSetup(s);
          localStorage.setItem("loginSetup", JSON.stringify(s));
        }
      } catch {
        if (mounted) setSetup((prev) => ({ ...prev, loaded: true }));
      }
    };

    load();

    // Listen for manual refresh
    const handleRefresh = () => load();
    window.addEventListener("login-setup-changed", handleRefresh);

    return () => {
      mounted = false;
      window.removeEventListener("login-setup-changed", handleRefresh);
    };
  }, []);

  return setup;
}
