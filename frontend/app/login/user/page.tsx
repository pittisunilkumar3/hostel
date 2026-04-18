import LoginForm from "@/app/components/LoginForm";

export default function UserLogin() {
  return (
    <LoginForm
      role="CUSTOMER"
      title="Customer Login"
      subtitle="Browse rooms & manage your bookings"
      gradient="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900"
      accentColor="text-blue-300"
      bgColor="bg-slate-800/80"
      iconBg="bg-blue-500/30"
      btnColor="bg-blue-600"
      btnHover="hover:bg-blue-700"
      shadowColor="shadow-blue-900/30"
      backLink="/"
      backLabel="Back to Home"
      dashboardPath="/user/dashboard"
      icon={
        <svg className="w-8 h-8 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      }
    />
  );
}
