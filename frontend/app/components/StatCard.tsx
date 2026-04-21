"use client";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  change?: string;
  subtitle?: string;
}

export default function StatCard({ title, value, icon, color, bgColor, change, subtitle }: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg hover:shadow-gray-100/50 transition-all duration-300 group">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
          {change && (
            <p className={`text-xs mt-2 font-semibold flex items-center gap-1 ${change.startsWith("+") ? "text-emerald-600" : "text-red-500"}`}>
              {change.startsWith("+") ? (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
              ) : (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>
              )}
              {change}
            </p>
          )}
          {subtitle && (
            <p className="text-[11px] text-gray-400 mt-1.5">{subtitle}</p>
          )}
        </div>
        <div className={`w-12 h-12 ${bgColor} rounded-2xl flex items-center justify-center ${color} group-hover:scale-110 transition-transform duration-300`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
