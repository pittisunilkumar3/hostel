"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import { apiFetch, getCurrentUser } from "@/lib/auth";
import { getSidebarItems } from "@/app/admin/sidebarItems";
import { useCurrency } from "@/lib/useCurrency";

const sidebarItems = getSidebarItems();

interface Coupon {
  id: number;
  title: string;
  code: string;
  coupon_type: string;
  discount_type: string;
  discount: number;
  max_discount: number;
  min_purchase: number;
  limit_for_same_user: number;
  total_uses: number;
  start_date: string;
  expire_date: string;
  status: number;
  created_at: string;
}

const emptyForm = { title: "", code: "", coupon_type: "default", discount_type: "percent", discount: "", max_discount: "", min_purchase: "", limit_for_same_user: "1", start_date: "", expire_date: "" };

export default function CouponsPage() {
  const [user, setUser] = useState<any>(null);
  const { fc, symbol } = useCurrency();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => { setUser(getCurrentUser()); fetchCoupons(); }, []);

  const fetchCoupons = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (search) params.set("search", search);
      const res = await apiFetch(`/api/coupons?${params}`);
      if (res.success && res.data) {
        setCoupons(res.data.coupons);
        setPagination(res.data.pagination);
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.code) { setMessage({ type: "error", text: "Title and code are required" }); return; }
    setSaving(true); setMessage(null);
    try {
      const url = editId ? `/api/coupons/${editId}` : "/api/coupons";
      const method = editId ? "PUT" : "POST";
      const res = await apiFetch(url, { method, body: JSON.stringify(form) });
      if (res.success) {
        setMessage({ type: "success", text: `✅ Coupon ${editId ? "updated" : "created"} successfully!` });
        resetForm();
        fetchCoupons(pagination.page);
      } else {
        setMessage({ type: "error", text: res.message || "Failed" });
      }
    } catch { setMessage({ type: "error", text: "Network error" }); } finally { setSaving(false); }
  };

  const toggleStatus = async (id: number, current: number) => {
    try {
      await apiFetch(`/api/coupons/${id}`, { method: "PUT", body: JSON.stringify({ status: current ? 0 : 1 }) });
      fetchCoupons(pagination.page);
    } catch {}
  };

  const deleteCoupon = async (id: number) => {
    if (!confirm("Are you sure you want to delete this coupon?")) return;
    try {
      const res = await apiFetch(`/api/coupons/${id}`, { method: "DELETE" });
      if (res.success) { setMessage({ type: "success", text: "✅ Coupon deleted!" }); fetchCoupons(pagination.page); }
    } catch {}
  };

  const startEdit = (c: Coupon) => {
    setEditId(c.id);
    setForm({
      title: c.title, code: c.code, coupon_type: c.coupon_type, discount_type: c.discount_type,
      discount: String(c.discount), max_discount: String(c.max_discount), min_purchase: String(c.min_purchase),
      limit_for_same_user: String(c.limit_for_same_user),
      start_date: c.start_date ? c.start_date.split("T")[0] : "",
      expire_date: c.expire_date ? c.expire_date.split("T")[0] : "",
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setForm(emptyForm); setEditId(null); setShowForm(false);
  };

  return (
    <DashboardShell role="admin" title="Super Admin" items={sidebarItems} accentColor="text-purple-300" accentBg="bg-gradient-to-b from-purple-900 to-purple-950" hoverBg="bg-white/10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Coupons</h1>
          <p className="text-gray-500 mt-1">Manage discount coupons</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(!showForm); }} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-600/20">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          New Coupon
        </button>
      </div>

      {message && <div className={`mb-5 px-4 py-3 rounded-xl text-sm font-medium ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>{message.text}</div>}

      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-6">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
            <h3 className="text-lg font-bold text-gray-900">{editId ? "Edit Coupon" : "Add New Coupon"}</h3>
          </div>
          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title <span className="text-red-500">*</span></label>
                <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g., Summer Discount" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Coupon Code <span className="text-red-500">*</span></label>
                <input type="text" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="e.g., SUMMER25" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 uppercase" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Coupon Type</label>
                <select value={form.coupon_type} onChange={e => setForm(f => ({ ...f, coupon_type: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500/30">
                  <option value="default">Default</option>
                  <option value="first_order">First Order</option>
                  <option value="free_delivery">Free Delivery</option>
                  <option value="zone_wise">Zone Wise</option>
                  <option value="room_wise">Room Wise</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type</label>
                <select value={form.discount_type} onChange={e => setForm(f => ({ ...f, discount_type: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500/30">
                  <option value="percent">Percentage (%)</option>
                  <option value="amount">Fixed Amount</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Discount <span className="text-red-500">*</span></label>
                <input type="number" value={form.discount} onChange={e => setForm(f => ({ ...f, discount: e.target.value }))} placeholder="0" min="0" step="0.01" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Discount</label>
                <input type="number" value={form.max_discount} onChange={e => setForm(f => ({ ...f, max_discount: e.target.value }))} placeholder="0" min="0" step="0.01" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Purchase</label>
                <input type="number" value={form.min_purchase} onChange={e => setForm(f => ({ ...f, min_purchase: e.target.value }))} placeholder="0" min="0" step="0.01" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Limit for Same User</label>
                <input type="number" value={form.limit_for_same_user} onChange={e => setForm(f => ({ ...f, limit_for_same_user: e.target.value }))} placeholder="1" min="1" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expire Date</label>
                <input type="date" value={form.expire_date} onChange={e => setForm(f => ({ ...f, expire_date: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 mt-5 pt-4 border-t border-gray-100">
              <button type="button" onClick={resetForm} className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-all">Cancel</button>
              <button type="submit" disabled={saving} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg shadow-blue-600/20">
                {saving ? <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                {editId ? "Update" : "Submit"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Coupon List */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
          <h5 className="font-bold text-gray-900">Coupon List <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-bold rounded-full">{pagination.total}</span></h5>
          <div className="relative">
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === "Enter" && fetchCoupons(1)} placeholder="Search coupons..." className="pl-4 pr-10 py-2 border border-gray-200 rounded-xl text-sm w-56 focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
            <button onClick={() => fetchCoupons(1)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16"><svg className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg><p className="text-gray-400">Loading...</p></div>
        ) : coupons.length === 0 ? (
          <div className="text-center py-16">
            <svg className="w-16 h-16 mx-auto text-gray-200 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
            <h5 className="text-gray-400 font-medium">No coupons found</h5>
            <p className="text-gray-300 text-sm mt-1">Create your first coupon to get started</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-gray-50 text-gray-600">
                  <th className="px-5 py-3 text-center font-semibold w-12">#</th>
                  <th className="px-5 py-3 text-left font-semibold">Coupon</th>
                  <th className="px-5 py-3 text-left font-semibold">Code</th>
                  <th className="px-5 py-3 text-left font-semibold">Discount</th>
                  <th className="px-5 py-3 text-left font-semibold">Validity</th>
                  <th className="px-5 py-3 text-left font-semibold">Uses</th>
                  <th className="px-5 py-3 text-left font-semibold">Status</th>
                  <th className="px-5 py-3 text-center font-semibold">Action</th>
                </tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {coupons.map((c, idx) => (
                    <tr key={c.id} className="hover:bg-gray-50/50">
                      <td className="px-5 py-3 text-center text-gray-500">{(pagination.page - 1) * 25 + idx + 1}</td>
                      <td className="px-5 py-3">
                        <div>
                          <p className="font-medium text-gray-900">{c.title}</p>
                          <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full font-medium">{c.coupon_type.replace("_", " ")}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className="px-3 py-1 bg-gray-100 text-gray-800 text-xs font-mono font-bold rounded-lg">{c.code}</span>
                      </td>
                      <td className="px-5 py-3 text-gray-700 font-medium">
                        {c.discount_type === "percent" ? `${c.discount}%` : `${fc(c.discount)}`}
                        {c.max_discount > 0 && <p className="text-[10px] text-gray-400">Max: {fc(c.max_discount)}</p>}
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-600">
                        {c.start_date?.split("T")[0]} — {c.expire_date?.split("T")[0]}
                      </td>
                      <td className="px-5 py-3 text-gray-600 text-center">{c.total_uses} / {c.limit_for_same_user}</td>
                      <td className="px-5 py-3">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" checked={!!c.status} onChange={() => toggleStatus(c.id, c.status)} className="sr-only peer" />
                          <div className={`w-10 h-5 rounded-full transition-colors ${c.status ? "bg-green-500" : "bg-gray-300"}`} />
                          <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${c.status ? "translate-x-5" : ""}`} />
                        </label>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => startEdit(c)} className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg" title="Edit">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          </button>
                          <button onClick={() => deleteCoupon(c.id)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Delete">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
                <span className="text-xs text-gray-400">Showing {(pagination.page - 1) * 25 + 1}–{Math.min(pagination.page * 25, pagination.total)} of {pagination.total}</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => fetchCoupons(pagination.page - 1)} disabled={pagination.page <= 1} className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 hover:bg-gray-50 disabled:opacity-50">Prev</button>
                  <span className="px-3 py-1.5 text-xs font-medium text-gray-600">{pagination.page} / {pagination.totalPages}</span>
                  <button onClick={() => fetchCoupons(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages} className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 hover:bg-gray-50 disabled:opacity-50">Next</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardShell>
  );
}
