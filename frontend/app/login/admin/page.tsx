import LoginForm from "@/app/components/LoginForm";

export default function AdminLogin() {
  return (
    <LoginForm
      role="SUPER_ADMIN"
      title="Super Admin Login"
      subtitle="Full system access to manage everything"
      gradient="bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900"
      accentColor="text-purple-300"
      bgColor="bg-slate-800/80"
      iconBg="bg-purple-500/30"
      btnColor="bg-purple-600"
      btnHover="hover:bg-purple-700"
      shadowColor="shadow-purple-900/30"
      backLink="/"
      backLabel="Back to Home"
      dashboardPath="/admin/dashboard"
      icon={
        <svg className="w-8 h-8 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      }
    />
  );
}
