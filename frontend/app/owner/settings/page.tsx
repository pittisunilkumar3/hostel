"use client";

import { useEffect, useState, useRef } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import { apiFetch, getCurrentUser } from "@/lib/auth";
import { getSidebarItems } from "@/app/owner/sidebarItems";
import { useI18n } from "@/lib/i18n";

const sidebarItems = getSidebarItems();

export default function OwnerSettings() {
  const { t } = useI18n();
  const [user, setUser] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Profile fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [image, setImage] = useState("");
  const [imagePreview, setImagePreview] = useState("");

  // Password fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Section nav
  const [section, setSection] = useState<"general" | "password">("general");

  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await apiFetch("/api/owner/profile");
      if (res.success && res.data) {
        const u = res.data;
        setUser(u);
        setFirstName(u.name?.split(" ")[0] || "");
        setLastName(u.name?.split(" ").slice(1).join(" ") || "");
        setEmail(u.email || "");
        setPhone(u.phone || "");
        setImage(u.avatar || "");
        setImagePreview(u.avatar ? `http://localhost:3001${u.avatar}` : "");

        // Update localStorage with fresh data
        const localUser = getCurrentUser();
        if (localUser) {
          localUser.name = u.name;
          localUser.email = u.email;
          localUser.phone = u.phone;
          localUser.avatar = u.avatar;
          localStorage.setItem("user", JSON.stringify(localUser));
        }
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      // Fallback to localStorage
      const u = getCurrentUser();
      if (u) {
        setUser(u);
        setFirstName(u.name?.split(" ")[0] || "");
        setLastName(u.name?.split(" ").slice(1).join(" ") || "");
        setEmail(u.email || "");
        setPhone(u.phone || "");
        setImage(u.avatar || "");
        setImagePreview(u.avatar || "");
      }
    }
  };

  const msg = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  // Save profile
  const saveProfile = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      msg("error", "First name, last name and email are required");
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const body: any = {
        f_name: firstName.trim(),
        l_name: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
      };
      if (image && image.startsWith("data:")) body.image = image;

      const res = await apiFetch("/api/owner/profile", {
        method: "PUT",
        body: JSON.stringify(body),
      });

      if (res.success) {
        msg("success", "✅ Profile updated successfully!");
        if (res.data) {
          const u = res.data;
          setUser(u);
          if (u.avatar) {
            setImagePreview(`http://localhost:3001${u.avatar}`);
            setImage(u.avatar);
          }
          // Update localStorage
          const localUser = getCurrentUser();
          if (localUser) {
            localUser.name = u.name;
            localUser.email = u.email;
            localUser.phone = u.phone;
            localUser.avatar = u.avatar;
            localStorage.setItem("user", JSON.stringify(localUser));
          }
        }
      } else {
        msg("error", res.message || "Failed to update profile");
      }
    } catch {
      msg("error", "Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Change password
  const changePassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      msg("error", "Password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      msg("error", "Passwords do not match");
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const res = await apiFetch("/api/owner/profile/password", {
        method: "PUT",
        body: JSON.stringify({
          current_password: currentPassword || undefined,
          password: newPassword,
          confirm_password: confirmPassword,
        }),
      });

      if (res.success) {
        msg("success", "✅ Password changed successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        msg("error", res.message || "Failed to change password");
      }
    } catch {
      msg("error", "Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Image upload handler
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      msg("error", "Image size must be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setImage(result);
      setImagePreview(result);
    };
    reader.readAsDataURL(file);
  };

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "O";

  return (
    <DashboardShell
      role="owner"
      title="Hostel Owner"
      items={sidebarItems}
      accentColor="text-emerald-300"
      accentBg="bg-gradient-to-b from-emerald-900 to-emerald-950"
      hoverBg="bg-white/10"
    >
      {/* Page Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <svg
              className="w-6 h-6 text-emerald-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            {t("settings", "Profile Settings")}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your account settings and preferences
          </p>
        </div>
        <a
          href="/owner/dashboard"
          className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-lg shadow-emerald-600/20"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
          {t("dashboard", "Dashboard")}
        </a>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`mb-5 px-4 py-3 rounded-xl text-sm font-medium ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Content */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left: Nav menu */}
        <div className="w-full lg:w-64 shrink-0">
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden lg:sticky lg:top-24">
            <div className="p-4">
              <h3 className="text-sm font-bold text-gray-900 mb-3">
                {t("nav_menu", "Settings Menu")}
              </h3>
              <div className="space-y-1">
                <button
                  onClick={() => setSection("general")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    section === "general"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  {t("basic_information", "Basic Information")}
                </button>
                <button
                  onClick={() => setSection("password")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    section === "password"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                  {t("password", "Change Password")}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Content */}
        <div className="flex-1 space-y-5">
          {/* Profile cover + avatar card */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="h-28 bg-gradient-to-r from-emerald-500 to-teal-600 relative">
              <div className="absolute -bottom-10 left-6">
                <label htmlFor="avatarUploader" className="cursor-pointer group">
                  <div className="w-20 h-20 rounded-2xl border-4 border-white shadow-lg overflow-hidden bg-white">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-2xl font-bold">
                        {initials}
                      </div>
                    )}
                  </div>
                  <div className="absolute bottom-0 left-14 w-7 h-7 bg-white rounded-full shadow-md flex items-center justify-center group-hover:bg-emerald-50 transition-colors">
                    <svg
                      className="w-3.5 h-3.5 text-emerald-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                </label>
                <input
                  ref={fileRef}
                  type="file"
                  id="avatarUploader"
                  accept=".jpg,.png,.jpeg,.gif,.bmp,.tif,.tiff,image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>
            </div>
            <div className="pt-14 pb-5 px-6">
              <h3 className="text-lg font-bold text-gray-900">
                {firstName} {lastName}
              </h3>
              <p className="text-sm text-gray-400">{email}</p>
              {user?.role && (
                <span className="inline-block mt-2 px-3 py-1 bg-emerald-50 text-emerald-600 text-xs font-medium rounded-full">
                  Hostel Owner
                </span>
              )}
            </div>
          </div>

          {/* Basic Information */}
          {section === "general" && (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-emerald-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-gray-900">
                  {t("basic_information", "Basic Information")}
                </h3>
              </div>
              <div className="p-6 space-y-5">
                {/* Full Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      {t("first_name", "First Name")}{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="John"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      {t("last_name", "Last Name")}{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Doe"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {t("phone", "Phone")}{" "}
                    <span className="text-gray-400 text-xs">
                      ({t("optional", "optional")})
                    </span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+(880)00-000-00000"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {t("email", "Email")}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="owner@hostel.com"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all"
                  />
                </div>

                {/* Save button */}
                <div className="flex justify-end pt-2">
                  <button
                    onClick={saveProfile}
                    disabled={saving}
                    className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl text-sm font-semibold hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg shadow-emerald-600/25"
                  >
                    {saving ? (
                      <>
                        <svg
                          className="animate-spin h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Saving...
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        {t("save", "Save Changes")}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Change Password */}
          {section === "password" && (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-emerald-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-gray-900">
                  {t("change_your_password", "Change Your Password")}
                </h3>
              </div>
              <div className="p-6 space-y-5">
                {/* Current Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Current Password{" "}
                    <span className="text-gray-400 text-xs">
                      ({t("optional", "optional")})
                    </span>
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all"
                  />
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {t("new_password", "New Password")}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={t("password_length", "8+ characters")}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all"
                  />
                  <p className="text-[11px] text-gray-400 mt-1.5">
                    {t(
                      "password_hint",
                      "Must contain at least one number, one uppercase, one lowercase letter, and at least 8 characters."
                    )}
                  </p>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {t("confirm_password", "Confirm Password")}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t("password_length", "8+ characters")}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all"
                  />
                </div>

                {/* Save button */}
                <div className="flex justify-end pt-2">
                  <button
                    onClick={changePassword}
                    disabled={saving}
                    className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl text-sm font-semibold hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg shadow-emerald-600/25"
                  >
                    {saving ? (
                      <>
                        <svg
                          className="animate-spin h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Saving...
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        {t("save", "Update Password")}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
