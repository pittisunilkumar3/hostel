import LoginForm from "@/app/components/LoginForm";

export default function OwnerLogin() {
  return (
    <LoginForm
      role="OWNER"
      title="Hostel Owner Login"
      subtitle="Manage your hostel, rooms & bookings"
      gradient="bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900"
      accentColor="text-emerald-300"
      bgColor="bg-slate-800/80"
      iconBg="bg-emerald-500/30"
      btnColor="bg-emerald-600"
      btnHover="hover:bg-emerald-700"
      btnGradient="bg-gradient-to-r from-emerald-600 to-teal-600"
      shadowColor="shadow-emerald-900/30"
      otpAccent="emerald"
      backLink="/"
      backLabel="Back to Home"
      dashboardPath="/owner/dashboard"
      registerPath="/register/owner"
      registerLabel="Register as Owner"
      icon={
        <svg className="w-8 h-8 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      }
    />
  );
}
