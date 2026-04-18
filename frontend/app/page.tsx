import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-2xl mb-6 shadow-lg shadow-blue-600/30">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 className="text-5xl font-bold text-white mb-3">Hostel Management</h1>
          <p className="text-blue-200 text-lg">Choose your login portal to continue</p>
        </div>

        {/* Login Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Super Admin */}
          <Link href="/login/admin" className="group">
            <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl p-8 text-center hover:scale-105 transition-all duration-300 shadow-lg shadow-purple-600/20 hover:shadow-purple-600/40 border border-purple-500/20 h-full">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-500/30 rounded-xl mb-5 group-hover:bg-purple-500/50 transition-colors">
                <svg className="w-8 h-8 text-purple-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Super Admin</h2>
              <p className="text-purple-200 text-sm">Full system access. Manage owners, users & settings.</p>
              <div className="mt-5 inline-flex items-center text-purple-200 text-sm font-medium group-hover:text-white transition-colors">
                Login as Admin
                <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </div>
          </Link>

          {/* Hostel Owner */}
          <Link href="/login/owner" className="group">
            <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-2xl p-8 text-center hover:scale-105 transition-all duration-300 shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/40 border border-emerald-500/20 h-full">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500/30 rounded-xl mb-5 group-hover:bg-emerald-500/50 transition-colors">
                <svg className="w-8 h-8 text-emerald-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Hostel Owner</h2>
              <p className="text-emerald-200 text-sm">Manage your hostel rooms, bookings & customers.</p>
              <div className="mt-5 inline-flex items-center text-emerald-200 text-sm font-medium group-hover:text-white transition-colors">
                Login as Owner
                <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </div>
          </Link>

          {/* Customer / User */}
          <Link href="/login/user" className="group">
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-8 text-center hover:scale-105 transition-all duration-300 shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 border border-blue-500/20 h-full">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500/30 rounded-xl mb-5 group-hover:bg-blue-500/50 transition-colors">
                <svg className="w-8 h-8 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Customer</h2>
              <p className="text-blue-200 text-sm">Browse rooms, make bookings & manage your stay.</p>
              <div className="mt-5 inline-flex items-center text-blue-200 text-sm font-medium group-hover:text-white transition-colors">
                Login as Customer
                <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </div>
          </Link>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-500 text-sm mt-10">
          © 2026 Hostel Management System. All rights reserved.
        </p>
      </div>
    </div>
  );
}
