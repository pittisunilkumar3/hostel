"use client";

import Link from "next/link";
import { useSiteSettings } from "@/lib/siteSettings";
import { useState } from "react";
import PublicHeader from "@/app/components/PublicHeader";
import PublicFooter from "@/app/components/PublicFooter";

export default function LandingPage() {
  const site = useSiteSettings();
  const name = site.companyName || "Hostel Management";
  const [activeTab, setActiveTab] = useState(0);

  const tabs = [
    {
      id: "booking",
      label: "Easy Booking",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      title1: "Find Your Perfect Room",
      desc1: "Browse through verified hostels with detailed room information, photos, and pricing. Filter by location, amenities, and budget to find your ideal accommodation.",
      title2: "Instant Confirmation",
      desc2: "Book your room with instant confirmation. Receive digital receipts and move-in instructions directly on your phone. No more waiting or uncertainty.",
      image: (
        <svg className="w-full h-auto max-w-md" viewBox="0 0 400 300" fill="none">
          <rect x="50" y="40" width="300" height="220" rx="20" fill="#ECFDF5" stroke="#10B981" strokeWidth="2"/>
          <rect x="70" y="70" width="120" height="80" rx="10" fill="#A7F3D0"/>
          <rect x="210" y="70" width="120" height="80" rx="10" fill="#6EE7B7"/>
          <circle cx="130" cy="110" r="20" fill="#34D399"/>
          <path d="M120 110l10 10 20-20" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          <rect x="70" y="170" width="260" height="40" rx="8" fill="#10B981"/>
          <text x="200" y="195" textAnchor="middle" fill="white" fontSize="14" fontWeight="600">Book Now</text>
          <circle cx="320" cy="60" r="25" fill="#FCD34D"/>
          <text x="320" y="65" textAnchor="middle" fill="#92400E" fontSize="12" fontWeight="bold">NEW</text>
        </svg>
      ),
    },
    {
      id: "manage",
      label: "Manage Property",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      title1: "Complete Property Management",
      desc1: "Manage multiple hostels from a single dashboard. Add floors, rooms, set pricing, and track occupancy in real-time. Everything you need at your fingertips.",
      title2: "Automated Operations",
      desc2: "Automate rent collection, payment reminders, and maintenance requests. Save time and reduce manual work with smart automation tools.",
      image: (
        <svg className="w-full h-auto max-w-md" viewBox="0 0 400 300" fill="none">
          <rect x="40" y="30" width="320" height="240" rx="16" fill="#F0FDF4" stroke="#22C55E" strokeWidth="2"/>
          <rect x="60" y="50" width="140" height="30" rx="6" fill="#BBF7D0"/>
          <rect x="60" y="90" width="100" height="20" rx="4" fill="#86EFAC"/>
          <rect x="60" y="120" width="120" height="20" rx="4" fill="#86EFAC"/>
          <rect x="60" y="150" width="80" height="20" rx="4" fill="#86EFAC"/>
          <rect x="220" y="50" width="120" height="120" rx="10" fill="#DCFCE7"/>
          <circle cx="280" cy="100" r="30" fill="#22C55E"/>
          <path d="M270 100l10 10 20-20" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          <rect x="60" y="190" width="280" height="60" rx="8" fill="#15803D"/>
          <text x="200" y="225" textAnchor="middle" fill="white" fontSize="14" fontWeight="600">Dashboard</text>
        </svg>
      ),
    },
    {
      id: "earn",
      label: "Grow Revenue",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title1: "Maximize Your Earnings",
      desc1: "Use dynamic pricing tools and analytics to optimize your room rates. Track revenue trends and identify opportunities to increase your income.",
      title2: "Secure Payments",
      desc2: "Accept payments through multiple gateways with instant settlement. Built-in wallet system for easy refunds and transactions. Zero hidden fees.",
      image: (
        <svg className="w-full h-auto max-w-md" viewBox="0 0 400 300" fill="none">
          <rect x="50" y="40" width="300" height="220" rx="16" fill="#ECFDF5" stroke="#10B981" strokeWidth="2"/>
          <path d="M80 200 L140 160 L200 180 L260 120 L320 100" stroke="#10B981" strokeWidth="3" fill="none"/>
          <path d="M80 200 L140 160 L200 180 L260 120 L320 100 L320 220 L80 220 Z" fill="#10B981" fillOpacity="0.2"/>
          <circle cx="140" cy="160" r="6" fill="#10B981"/>
          <circle cx="200" cy="180" r="6" fill="#10B981"/>
          <circle cx="260" cy="120" r="6" fill="#10B981"/>
          <circle cx="320" cy="100" r="6" fill="#10B981"/>
          <rect x="80" y="60" width="100" height="40" rx="8" fill="#059669"/>
          <text x="130" y="85" textAnchor="middle" fill="white" fontSize="18" fontWeight="bold">₹4.2L</text>
          <text x="130" y="65" textAnchor="middle" fill="#A7F3D0" fontSize="10">Monthly Revenue</text>
          <rect x="220" y="60" width="100" height="40" rx="8" fill="#047857"/>
          <text x="270" y="85" textAnchor="middle" fill="white" fontSize="18" fontWeight="bold">85%</text>
          <text x="270" y="65" textAnchor="middle" fill="#A7F3D0" fontSize="10">Occupancy Rate</text>
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />

      {/* ===== BANNER SECTION ===== */}
      <section className="relative pt-20 lg:pt-24 pb-16 lg:pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50" />
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-emerald-100/50 to-transparent" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left py-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 border border-emerald-200 rounded-full mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-emerald-700 text-sm font-medium">India&apos;s Leading Hostel Platform</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Modern Hostel
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">
                  Management
                </span>
                <span className="block text-3xl sm:text-4xl lg:text-5xl text-gray-700 mt-2">
                  Made Simple
                </span>
              </h1>

              <p className="text-lg lg:text-xl text-gray-600 mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Comprehensive solution for hostel management with role-based access, payment processing, room booking, and seamless communication.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-10">
                <Link href="/register">
                  <button className="group px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold rounded-2xl hover:from-emerald-500 hover:to-teal-500 transition-all shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-3">
                    Start Free Trial
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                </Link>
                <Link href="/pages/about-us">
                  <button className="px-8 py-4 bg-white text-gray-700 font-semibold rounded-2xl border border-gray-200 hover:border-emerald-300 hover:text-emerald-600 transition-all flex items-center justify-center gap-3">
                    Learn More
                  </button>
                </Link>
              </div>

              <div className="flex items-center gap-8 justify-center lg:justify-start">
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-600">500+</div>
                  <div className="text-sm text-gray-500">Active Hostels</div>
                </div>
                <div className="w-px h-10 bg-gray-200" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-600">10K+</div>
                  <div className="text-sm text-gray-500">Happy Residents</div>
                </div>
                <div className="w-px h-10 bg-gray-200" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-600">50+</div>
                  <div className="text-sm text-gray-500">Cities</div>
                </div>
              </div>
            </div>

            <div className="hidden lg:block">
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-3xl blur-2xl" />
                <div className="relative space-y-4">
                  <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wider mb-6 text-center">
                    Choose Your Portal
                  </h3>

                  {[
                    { href: "/login/admin", label: "Super Admin", desc: "Full system control & analytics", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z", gradient: "from-purple-500 to-violet-600", shadow: "shadow-purple-500/25", hover: "hover:border-purple-200 hover:shadow-purple-500/10", textHover: "group-hover:text-purple-600", bg: "bg-purple-50", bgHover: "group-hover:bg-purple-100", iconColor: "text-purple-500" },
                    { href: "/login/owner", label: "Hostel Owner", desc: "Manage properties & bookings", icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4", gradient: "from-emerald-500 to-teal-600", shadow: "shadow-emerald-500/25", hover: "hover:border-emerald-200 hover:shadow-emerald-500/10", textHover: "group-hover:text-emerald-600", bg: "bg-emerald-50", bgHover: "group-hover:bg-emerald-100", iconColor: "text-emerald-500" },
                    { href: "/login/user", label: "Customer", desc: "Browse & book rooms easily", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z", gradient: "from-blue-500 to-cyan-600", shadow: "shadow-blue-500/25", hover: "hover:border-blue-200 hover:shadow-blue-500/10", textHover: "group-hover:text-blue-600", bg: "bg-blue-50", bgHover: "group-hover:bg-blue-100", iconColor: "text-blue-500" },
                  ].map((portal) => (
                    <Link key={portal.href} href={portal.href} className="group block">
                      <div className={`bg-white rounded-2xl p-6 flex items-center gap-5 border border-gray-100 ${portal.hover} hover:shadow-xl transition-all duration-300`}>
                        <div className={`w-14 h-14 bg-gradient-to-br ${portal.gradient} rounded-xl flex items-center justify-center shadow-lg ${portal.shadow}`}>
                          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={portal.icon} />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h4 className={`text-lg font-bold text-gray-900 ${portal.textHover} transition-colors`}>{portal.label}</h4>
                          <p className="text-gray-500 text-sm">{portal.desc}</p>
                        </div>
                        <div className={`w-10 h-10 ${portal.bg} rounded-xl flex items-center justify-center ${portal.bgHover} transition-colors`}>
                          <svg className={`w-5 h-5 ${portal.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </div>
                      </div>
                    </Link>
                  ))}

                  <p className="text-center text-gray-400 text-sm mt-6">
                    Don&apos;t have an account?{" "}
                    <Link href="/register" className="text-emerald-600 hover:text-emerald-700 font-medium">
                      Register here
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FEATURES SECTION ===== */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Our <span className="text-emerald-600">Features</span>
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Everything you need to manage hostels efficiently
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: "🏢", title: "Multi-Property", desc: "Manage unlimited hostels from one dashboard" },
              { icon: "👥", title: "Role-Based Access", desc: "Secure access for Admins, Owners & Customers" },
              { icon: "💳", title: "Payments", desc: "Integrated wallet & multiple payment gateways" },
              { icon: "📊", title: "Analytics", desc: "Real-time insights & revenue reports" },
              { icon: "🔑", title: "Easy Booking", desc: "Instant booking with digital receipts" },
              { icon: "💬", title: "Communication", desc: "Built-in messaging & notifications" },
              { icon: "🔒", title: "Secure", desc: "Enterprise-grade data protection" },
              { icon: "📱", title: "Mobile Ready", desc: "Access from any device, anywhere" },
            ].map((feature, i) => (
              <div key={i} className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 text-center hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300 border border-emerald-100 group">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-emerald-600 transition-colors">{feature.title}</h3>
                <p className="text-gray-500 text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== SERVICES SECTION (TABS) ===== */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Our <span className="text-emerald-600">Services</span>
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Choose a service to learn more about what we offer
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {tabs.map((tab, i) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(i)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === i
                    ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/25"
                    : "bg-white text-gray-600 hover:text-emerald-600 border border-gray-200 hover:border-emerald-200"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="grid lg:grid-cols-2 gap-0">
              <div className="p-8 lg:p-12">
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{tabs[activeTab].title1}</h3>
                  <p className="text-gray-600 leading-relaxed">{tabs[activeTab].desc1}</p>
                </div>
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{tabs[activeTab].title2}</h3>
                  <p className="text-gray-600 leading-relaxed">{tabs[activeTab].desc2}</p>
                </div>
                <Link href="/register">
                  <button className="group px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-xl hover:from-emerald-500 hover:to-teal-500 transition-all shadow-lg shadow-emerald-500/25 flex items-center gap-2">
                    Get Started
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                </Link>
              </div>

              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-8 lg:p-12 flex items-center justify-center border-l border-emerald-100">
                {tabs[activeTab].image}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== WHY CHOOSE US ===== */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Why Choose <span className="text-emerald-600">{name}</span>?
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Join hundreds of successful hostel owners who trust our platform
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { num: "01", title: "Easy Setup", desc: "Get started in minutes with our intuitive setup process" },
              { num: "02", title: "24/7 Support", desc: "Round-the-clock support to help you whenever you need" },
              { num: "03", title: "Secure Platform", desc: "Enterprise-grade security to protect your data" },
              { num: "04", title: "Affordable", desc: "Competitive pricing with no hidden fees" },
            ].map((item, i) => (
              <div key={i} className="relative bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-100 hover:shadow-xl hover:shadow-emerald-500/10 transition-all group">
                <div className="absolute top-4 right-4 text-5xl font-bold text-emerald-100 group-hover:text-emerald-200 transition-colors">
                  {item.num}
                </div>
                <div className="relative">
                  <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-emerald-600 transition-colors">{item.title}</h3>
                  <p className="text-gray-500 text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section className="py-20 bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 right-20 w-96 h-96 bg-emerald-500 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-20 w-80 h-80 bg-teal-500 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              What Our <span className="text-emerald-300">Partners</span> Say
            </h2>
            <p className="text-lg text-white/60 max-w-2xl mx-auto">
              Real stories from hostel owners who transformed their business
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: "Rajesh Sharma", role: "Owner, Urban Stay Hostel", location: "Delhi", text: "This system increased our occupancy by 40% in just 3 months. The dashboard is incredibly easy to use.", rating: 5 },
              { name: "Priya Patel", role: "Owner, Green Living PG", location: "Ahmedabad", text: "The automated booking system saved us countless hours. We can now focus on better services.", rating: 5 },
              { name: "Arun Kumar", role: "Owner, Tech Hub Residency", location: "Bangalore", text: "Revenue increased by 60% after implementing this system. The analytics are a game-changer.", rating: 5 },
            ].map((testimonial, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-sm rounded-2xl p-7 border border-white/10 hover:border-emerald-400/30 transition-all">
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, j) => (
                    <svg key={j} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-white/80 text-sm leading-relaxed mb-6">&ldquo;{testimonial.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {testimonial.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div>
                    <h4 className="text-white font-semibold text-sm">{testimonial.name}</h4>
                    <p className="text-white/50 text-xs">{testimonial.role}, {testimonial.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA SECTION ===== */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-3xl p-12 lg:p-16 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`, backgroundSize: '20px 20px' }} />
            <div className="relative text-center">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Ready to Transform Your Business?
              </h2>
              <p className="text-emerald-100 text-lg mb-8 max-w-2xl mx-auto">
                Join 500+ hostel owners who trust our platform. Start your free trial today.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/register">
                  <button className="group px-8 py-4 bg-white text-emerald-700 font-bold rounded-2xl hover:bg-emerald-50 transition-all shadow-2xl flex items-center justify-center gap-3">
                    Get Started Free
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                </Link>
                <Link href="/login">
                  <button className="px-8 py-4 bg-white/10 text-white font-semibold rounded-2xl border border-white/20 hover:bg-white/20 transition-all flex items-center justify-center gap-3">
                    Sign In
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
