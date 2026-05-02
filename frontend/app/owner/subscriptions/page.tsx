"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import { apiFetch, getCurrentUser } from "@/lib/auth";
import { getSidebarItems } from "@/app/owner/sidebarItems";
import { useRouter } from "next/navigation";
import { useCurrency } from "@/lib/useCurrency";

const sidebarItems = getSidebarItems();

interface Plan {
  id: number;
  name: string;
  description: string | null;
  plan_type: string;
  amount: number;
  discount_percent: number;
  grace_period_days: number;
  features: string[];
}

interface Subscription {
  id: number;
  hostel_id: number;
  plan_id: number;
  plan_name: string;
  plan_type: string;
  plan_amount: number;
  discount_percent: number;
  grace_period_days: number;
  start_date: string;
  end_date: string;
  amount_paid: number;
  status: string;
  payment_status: string;
  hostel_name: string;
  computed_status: string;
  days_remaining: number;
  grace_days_remaining: number;
}

interface Hostel {
  id: number;
  name: string;
  business_model: string;
  status: string;
}

const planTypeLabels: Record<string, string> = {
  monthly: "Monthly",
  quarterly: "Quarterly",
  half_yearly: "Half Yearly",
  yearly: "Yearly",
};

export default function OwnerSubscriptions() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [selectedHostel, setSelectedHostel] = useState<number | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const u = getCurrentUser();
    if (!u) {
      router.push("/login/owner");
      return;
    }
    setUser(u);
    fetchData();
  }, [router]);

  const fetchData = async () => {
    try {
      const [plansRes, subsRes, hostelsRes] = await Promise.all([
        apiFetch("/api/owner/subscriptions/plans"),
        apiFetch("/api/owner/subscriptions"),
        apiFetch("/api/hostels/owner/my-hostels"),
      ]);

      if (plansRes.success) setPlans(plansRes.data || []);
      if (subsRes.success) setSubscriptions(subsRes.data || []);
      if (hostelsRes.success) {
        const allHostels = hostelsRes.data || [];
        setHostels(allHostels.filter((h: Hostel) => h.status === "APPROVED"));
      }
    } catch (e) {
      console.error(e);
      setMessage({ type: "error", text: "Failed to load data" });
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = (plan: Plan) => {
    setSelectedPlan(plan);
    setShowConfirm(true);
    setMessage(null);
  };

  const confirmSubscribe = async () => {
    if (!selectedPlan || !selectedHostel) {
      setMessage({ type: "error", text: "Please select a hostel" });
      return;
    }

    setSubscribing(true);
    setMessage(null);

    try {
      const res = await apiFetch("/api/owner/subscriptions", {
        method: "POST",
        body: JSON.stringify({
          plan_id: selectedPlan.id,
          hostel_id: selectedHostel,
        }),
      });

      if (res.success) {
        setMessage({ type: "success", text: "🎉 Subscription activated successfully!" });
        setShowConfirm(false);
        setSelectedPlan(null);
        setSelectedHostel(null);
        fetchData();
      } else {
        setMessage({ type: "error", text: res.message || "Failed to subscribe" });
      }
    } catch (e: any) {
      setMessage({ type: "error", text: e.message || "Failed to subscribe" });
    } finally {
      setSubscribing(false);
    }
  };

  const handleCancel = async (subscriptionId: number) => {
    if (!confirm("Are you sure you want to cancel this subscription? Your hostel will revert to the commission model.")) return;

    try {
      const res = await apiFetch(`/api/owner/subscriptions?id=${subscriptionId}`, { method: "DELETE" });
      if (res.success) {
        setMessage({ type: "success", text: "Subscription cancelled successfully" });
        fetchData();
      } else {
        setMessage({ type: "error", text: res.message || "Failed to cancel" });
      }
    } catch (e: any) {
      setMessage({ type: "error", text: e.message || "Failed to cancel subscription" });
    }
  };

  const { fc: formatCurrency } = useCurrency();

  const formatDate = (d: string) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: "bg-emerald-100 text-emerald-700 border-emerald-200",
      grace: "bg-amber-100 text-amber-700 border-amber-200",
      expired: "bg-red-100 text-red-700 border-red-200",
      cancelled: "bg-gray-100 text-gray-700 border-gray-200",
      pending: "bg-blue-100 text-blue-700 border-blue-200",
      expiring_soon: "bg-orange-100 text-orange-700 border-orange-200",
    };
    return colors[status] || "bg-gray-100 text-gray-700 border-gray-200";
  };

  // Find hostel's current active subscription
  const getHostelSubscription = (hostelId: number) => {
    return subscriptions.find(
      (s) => s.hostel_id === hostelId && (s.computed_status === "active" || s.computed_status === "expiring_soon" || s.computed_status === "grace")
    );
  };

  // Hostels available for new subscription (not subscribed or expired)
  const availableHostels = hostels.filter((h) => {
    const sub = getHostelSubscription(h.id);
    return !sub || sub.computed_status === "expired" || sub.computed_status === "cancelled";
  });

  if (loading) {
    return (
      <DashboardShell role="owner" title="Hostel Owner" items={sidebarItems} accentColor="text-emerald-300" accentBg="bg-gradient-to-b from-emerald-900 to-emerald-950" hoverBg="bg-white/10">
        <div className="text-center py-20">
          <svg className="animate-spin h-8 w-8 text-emerald-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-gray-400">Loading subscriptions...</p>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell role="owner" title="Hostel Owner" items={sidebarItems} accentColor="text-emerald-300" accentBg="bg-gradient-to-b from-emerald-900 to-emerald-950" hoverBg="bg-white/10">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Subscription Plans</h1>
        <p className="text-gray-500 text-sm mt-1">Choose a subscription plan for your hostel to access all platform features</p>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-5 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 ${message.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {message.text}
          <button onClick={() => setMessage(null)} className="ml-auto">
            <svg className="w-4 h-4 opacity-50 hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Active Subscriptions */}
      {subscriptions.filter((s) => s.computed_status !== "expired" && s.computed_status !== "cancelled").length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Your Active Subscriptions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {subscriptions
              .filter((s) => s.computed_status !== "expired" && s.computed_status !== "cancelled")
              .map((sub) => (
                <div key={sub.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  <div className={`px-6 py-4 ${sub.computed_status === "grace" ? "bg-gradient-to-r from-amber-500 to-orange-600" : sub.computed_status === "expiring_soon" ? "bg-gradient-to-r from-orange-500 to-amber-600" : "bg-gradient-to-r from-emerald-600 to-teal-700"} text-white`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-white/80">{sub.hostel_name}</p>
                        <h3 className="text-lg font-bold">{sub.plan_name}</h3>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(sub.computed_status)}`}>
                        {sub.computed_status === "grace" ? "Grace Period" : sub.computed_status === "expiring_soon" ? "Expiring Soon" : sub.computed_status.charAt(0).toUpperCase() + sub.computed_status.slice(1)}
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-400">Amount Paid</p>
                        <p className="text-sm font-bold text-gray-900">{formatCurrency(sub.amount_paid)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Plan Type</p>
                        <p className="text-sm font-bold text-gray-900">{planTypeLabels[sub.plan_type]}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Start Date</p>
                        <p className="text-sm font-semibold text-gray-700">{formatDate(sub.start_date)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">End Date</p>
                        <p className="text-sm font-semibold text-gray-700">{formatDate(sub.end_date)}</p>
                      </div>
                    </div>

                    {sub.computed_status === "active" && sub.days_remaining > 0 && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-4">
                        <p className="text-sm text-emerald-700 font-medium">
                          ⏰ {sub.days_remaining} day{sub.days_remaining !== 1 ? "s" : ""} remaining
                        </p>
                      </div>
                    )}

                    {sub.computed_status === "expiring_soon" && (
                      <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 mb-4">
                        <p className="text-sm text-orange-700 font-medium">
                          ⚠️ Expiring in {sub.days_remaining} day{sub.days_remaining !== 1 ? "s" : ""}! Consider renewing.
                        </p>
                      </div>
                    )}

                    {sub.computed_status === "grace" && (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
                        <p className="text-sm text-amber-700 font-medium">
                          ⚠️ Grace period: {sub.grace_days_remaining} day{sub.grace_days_remaining !== 1 ? "s" : ""} left before access is blocked!
                        </p>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const plan = plans.find((p) => p.id === sub.plan_id);
                          if (plan) handleSubscribe(plan);
                        }}
                        className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-all"
                      >
                        Renew
                      </button>
                      <button
                        onClick={() => handleCancel(sub.id)}
                        className="px-4 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm font-semibold hover:bg-red-100 transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Available Plans */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-1">Available Plans</h2>
        <p className="text-sm text-gray-500 mb-4">Select a plan to subscribe your hostel</p>
      </div>

      {plans.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          </div>
          <p className="text-gray-500 font-medium">No plans available</p>
          <p className="text-gray-400 text-sm mt-1">Please check back later for subscription plans</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const originalAmount = plan.amount;
            const discount = (originalAmount * (plan.discount_percent || 0)) / 100;
            const finalAmount = originalAmount - discount;

            return (
              <div
                key={plan.id}
                className={`bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all ${
                  selectedPlan?.id === plan.id ? "ring-2 ring-emerald-500" : ""
                }`}
              >
                {/* Plan Header */}
                <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-5 text-white">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2.5 py-0.5 bg-white/20 rounded-lg text-xs font-semibold">
                      {planTypeLabels[plan.plan_type]}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold">{plan.name}</h3>
                  {plan.description && (
                    <p className="text-emerald-100 text-sm mt-1">{plan.description}</p>
                  )}
                </div>

                {/* Pricing */}
                <div className="p-5">
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-3xl font-bold text-gray-900">{formatCurrency(finalAmount)}</span>
                    {plan.discount_percent > 0 && (
                      <>
                        <span className="text-lg text-gray-400 line-through">{formatCurrency(originalAmount)}</span>
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold">
                          {plan.discount_percent}% OFF
                        </span>
                      </>
                    )}
                  </div>

                  {/* Features */}
                  {plan.features && plan.features.length > 0 && (
                    <div className="space-y-2 mb-5">
                      {plan.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-sm text-gray-600">{feature}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Grace Period */}
                  <div className="flex items-center gap-2 mb-5 p-3 bg-gray-50 rounded-xl">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-xs text-gray-600">{plan.grace_period_days}-day grace period after expiry</span>
                  </div>

                  {/* Subscribe Button */}
                  <button
                    onClick={() => handleSubscribe(plan)}
                    className="w-full px-4 py-3 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                    Subscribe Now
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirm && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-5 text-white">
              <h3 className="text-lg font-bold">Confirm Subscription</h3>
              <p className="text-emerald-100 text-sm mt-1">Review your selection before proceeding</p>
            </div>
            <div className="p-6">
              {/* Plan Summary */}
              <div className="bg-gray-50 rounded-xl p-4 mb-5">
                <p className="text-xs text-gray-400 mb-1">Selected Plan</p>
                <p className="text-lg font-bold text-gray-900">{selectedPlan.name}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs font-semibold">
                    {planTypeLabels[selectedPlan.plan_type]}
                  </span>
                  <span className="text-sm font-bold text-gray-900">
                    {formatCurrency(selectedPlan.amount - (selectedPlan.amount * (selectedPlan.discount_percent || 0)) / 100)}
                  </span>
                </div>
              </div>

              {/* Hostel Selection */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Hostel <span className="text-red-500">*</span>
                </label>
                {hostels.length === 0 ? (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <p className="text-sm text-amber-700">No approved hostels found. Please register and get your hostel approved first.</p>
                  </div>
                ) : (
                  <select
                    value={selectedHostel || ""}
                    onChange={(e) => setSelectedHostel(parseInt(e.target.value) || null)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  >
                    <option value="">-- Select a hostel --</option>
                    {hostels.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name} {h.business_model === "subscription" ? "(Currently subscribed)" : "(Commission model)"}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5">
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-xs text-blue-700">
                    After subscribing, your hostel will use the subscription model instead of commission. You can cancel anytime.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <button
                  onClick={confirmSubscribe}
                  disabled={subscribing || !selectedHostel || hostels.length === 0}
                  className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {subscribing ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Confirm Subscription
                    </>
                  )}
                </button>
                <button
                  onClick={() => { setShowConfirm(false); setSelectedPlan(null); setSelectedHostel(null); setMessage(null); }}
                  className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}

function getStatusBadge(status: string) {
  const styles: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-700 border-emerald-200",
    grace: "bg-amber-100 text-amber-700 border-amber-200",
    expired: "bg-red-100 text-red-700 border-red-200",
    cancelled: "bg-gray-100 text-gray-700 border-gray-200",
    pending: "bg-blue-100 text-blue-700 border-blue-200",
    expiring_soon: "bg-orange-100 text-orange-700 border-orange-200",
  };
  return styles[status] || "bg-gray-100 text-gray-700 border-gray-200";
}
