"use client";

import Link from "next/link";
import { useSiteSettings } from "@/lib/siteSettings";
import { useEffect, useState } from "react";

// Icon components
const BuildingIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const UsersIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const ShieldIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const CreditCardIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
);

const ChartIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const KeyIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
  </svg>
);

const StarIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const MenuIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const CloseIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export default function LandingPage() {
  const site = useSiteSettings();
  const name = site.companyName || "Hostel Management";
  const logo = site.companyLogo;
  const copyright = site.copyrightText || `© ${new Date().getFullYear()} ${name}. All rights reserved.`;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const features = [
    {
      icon: <BuildingIcon />,
      title: "Multi-Property Management",
      description: "Manage multiple hostels from a single dashboard with floors, rooms, and occupancy tracking."
    },
    {
      icon: <UsersIcon className="w-6 h-6" />,
      title: "Role-Based Access",
      description: "Secure access for Super Admins, Hostel Owners, and Customers with dedicated dashboards."
    },
    {
      icon: <ShieldIcon />,
      title: "Secure & Reliable",
      description: "Enterprise-grade security with data encryption and reliable 99.9% uptime guarantee."
    },
    {
      icon: <CreditCardIcon />,
      title: "Payment Processing",
      description: "Integrated payment system with wallet, subscriptions, and multiple payment gateways."
    },
    {
      icon: <ChartIcon />,
      title: "Analytics & Reports",
      description: "Real-time analytics, occupancy reports, and revenue insights to grow your business."
    },
    {
      icon: <KeyIcon />,
      title: "Easy Booking",
      description: "Seamless room booking experience with instant confirmation and digital receipts."
    }
  ];

  const stats = [
    { value: "500+", label: "Active Hostels", color: "text-blue-600" },
    { value: "10K+", label: "Happy Residents", color: "text-emerald-600" },
    { value: "50+", label: "Cities Covered", color: "text-purple-600" },
    { value: "99.9%", label: "Uptime", color: "text-orange-600" }
  ];

  const testimonials = [
    {
      name: "Rajesh Sharma",
      role: "Owner, Urban Stay Hostel",
      location: "Delhi",
      initials: "RS",
      color: "bg-blue-100 text-blue-600",
      rating: 5,
      text: "This system increased our occupancy by 40% in just 3 months. The dashboard is incredibly easy to use, and the support team is always responsive."
    },
    {
      name: "Priya Patel",
      role: "Owner, Green Living PG",
      location: "Ahmedabad",
      initials: "PP",
      color: "bg-emerald-100 text-emerald-600",
      rating: 5,
      text: "The automated booking system and payment processing have saved us countless hours. We can now focus on providing better services to our guests."
    },
    {
      name: "Arun Kumar",
      role: "Owner, Tech Hub Residency",
      location: "Bangalore",
      initials: "AK",
      color: "bg-purple-100 text-purple-600",
      rating: 5,
      text: "Revenue increased by 60% after implementing this system. The analytics dashboard helps us make data-driven decisions for our business."
    }
  ];

  const howItWorks = [
    {
      step: "01",
      title: "Register Your Hostel",
      description: "Sign up as a hostel owner and submit your property details for verification.",
      icon: <BuildingIcon />
    },
    {
      step: "02",
      title: "Setup Your Property",
      description: "Add floors, rooms, pricing, and amenities. Configure your business settings.",
      icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
    },
    {
      step: "03",
      title: "Start Receiving Bookings",
      description: "Customers can discover and book rooms. Manage everything from your dashboard.",
      icon: <CheckCircleIcon />
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/95 backdrop-blur-md shadow-sm" : "bg-transparent"}`}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              {logo ? (
                <img src={logo} alt={name} className="w-10 h-10 rounded-xl object-contain" />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                  <BuildingIcon />
                </div>
              )}
              <span className={`text-xl font-bold transition-colors ${scrolled ? "text-gray-900" : "text-white"}`}>
                {name}
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-8">
              <a href="#features" className={`text-sm font-medium transition-colors hover:text-blue-500 ${scrolled ? "text-gray-700" : "text-white/90"}`}>
                Features
              </a>
              <a href="#how-it-works" className={`text-sm font-medium transition-colors hover:text-blue-500 ${scrolled ? "text-gray-700" : "text-white/90"}`}>
                How It Works
              </a>
              <a href="#testimonials" className={`text-sm font-medium transition-colors hover:text-blue-500 ${scrolled ? "text-gray-700" : "text-white/90"}`}>
                Testimonials
              </a>
              <a href="#contact" className={`text-sm font-medium transition-colors hover:text-blue-500 ${scrolled ? "text-gray-700" : "text-white/90"}`}>
                Contact
              </a>
            </nav>

            {/* Auth Buttons */}
            <div className="hidden lg:flex items-center space-x-3">
              <Link href="/login">
                <button className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${scrolled ? "text-gray-700 hover:bg-gray-100" : "text-white hover:bg-white/10"}`}>
                  Sign In
                </button>
              </Link>
              <Link href="/register">
                <button className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold rounded-xl hover:from-blue-500 hover:to-indigo-500 transition-all shadow-lg shadow-blue-600/25">
                  Get Started
                </button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              className={`lg:hidden p-2 rounded-lg transition-colors ${scrolled ? "text-gray-700" : "text-white"}`}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden bg-white rounded-2xl shadow-xl mt-2 p-4 border border-gray-100">
              <nav className="space-y-2">
                <a href="#features" className="block px-4 py-2.5 text-gray-700 hover:bg-gray-50 rounded-xl text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
                  Features
                </a>
                <a href="#how-it-works" className="block px-4 py-2.5 text-gray-700 hover:bg-gray-50 rounded-xl text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
                  How It Works
                </a>
                <a href="#testimonials" className="block px-4 py-2.5 text-gray-700 hover:bg-gray-50 rounded-xl text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
                  Testimonials
                </a>
                <a href="#contact" className="block px-4 py-2.5 text-gray-700 hover:bg-gray-50 rounded-xl text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
                  Contact
                </a>
              </nav>
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                <Link href="/login" className="block">
                  <button className="w-full px-4 py-2.5 text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-xl text-sm font-medium transition-all">
                    Sign In
                  </button>
                </Link>
                <Link href="/register" className="block">
                  <button className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-600/25">
                    Get Started
                  </button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-emerald-500 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 relative z-10 pt-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full mb-6">
                <span className="text-blue-400 text-sm font-medium">🚀 India&apos;s Leading Hostel Platform</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                Modern Hostel Management
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
                  Made Simple
                </span>
              </h1>
              <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-2xl mx-auto lg:mx-0">
                Comprehensive solution for hostel management with role-based access, payment processing, room booking, and seamless communication between owners and residents.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link href="/register">
                  <button className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-500 hover:to-indigo-500 transition-all shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2">
                    Start Free Trial
                    <ArrowRightIcon />
                  </button>
                </Link>
                <Link href="/login">
                  <button className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-xl border border-white/20 hover:bg-white/20 transition-all flex items-center justify-center gap-2">
                    View Demo
                  </button>
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="mt-10 flex items-center gap-6 justify-center lg:justify-start">
                <div className="flex -space-x-2">
                  {["bg-blue-500", "bg-emerald-500", "bg-purple-500", "bg-orange-500"].map((color, i) => (
                    <div key={i} className={`w-8 h-8 ${color} rounded-full border-2 border-slate-900 flex items-center justify-center text-white text-xs font-bold`}>
                      {["R", "P", "A", "S"][i]}
                    </div>
                  ))}
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <StarIcon key={i} className="w-4 h-4 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-400 text-xs">Trusted by 500+ hostel owners</p>
                </div>
              </div>
            </div>

            {/* Right - Login Cards */}
            <div className="hidden lg:block">
              <div className="grid grid-cols-1 gap-4 max-w-md mx-auto">
                <Link href="/login/admin" className="group">
                  <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-2xl p-6 flex items-center gap-4 hover:scale-105 transition-all duration-300 shadow-lg shadow-purple-600/20 border border-purple-500/20">
                    <div className="w-14 h-14 bg-purple-500/30 rounded-xl flex items-center justify-center group-hover:bg-purple-500/50 transition-colors">
                      <ShieldIcon />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white">Super Admin</h3>
                      <p className="text-purple-200 text-sm">Full system access & management</p>
                    </div>
                    <ArrowRightIcon />
                  </div>
                </Link>

                <Link href="/login/owner" className="group">
                  <div className="bg-gradient-to-r from-emerald-600 to-emerald-800 rounded-2xl p-6 flex items-center gap-4 hover:scale-105 transition-all duration-300 shadow-lg shadow-emerald-600/20 border border-emerald-500/20">
                    <div className="w-14 h-14 bg-emerald-500/30 rounded-xl flex items-center justify-center group-hover:bg-emerald-500/50 transition-colors">
                      <BuildingIcon />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white">Hostel Owner</h3>
                      <p className="text-emerald-200 text-sm">Manage your properties</p>
                    </div>
                    <ArrowRightIcon />
                  </div>
                </Link>

                <Link href="/login/user" className="group">
                  <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-6 flex items-center gap-4 hover:scale-105 transition-all duration-300 shadow-lg shadow-blue-600/20 border border-blue-500/20">
                    <div className="w-14 h-14 bg-blue-500/30 rounded-xl flex items-center justify-center group-hover:bg-blue-500/50 transition-colors">
                      <UsersIcon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white">Customer</h3>
                      <p className="text-blue-200 text-sm">Browse & book rooms</p>
                    </div>
                    <ArrowRightIcon />
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <svg className="w-6 h-6 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white border-b border-gray-100">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className={`text-3xl md:text-4xl font-bold ${stat.color} mb-2`}>{stat.value}</div>
                <div className="text-gray-600 text-sm font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-blue-50 border border-blue-100 rounded-full mb-4">
              <span className="text-blue-600 text-sm font-medium">✨ Features</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Manage Hostels
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our comprehensive platform provides all the tools you need for efficient hostel management and seamless guest experience.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 group">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform text-white">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-full mb-4">
              <span className="text-emerald-600 text-sm font-medium">🎯 How It Works</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Get Started in 3 Simple Steps
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Setting up your hostel on our platform is quick and easy. Follow these simple steps to get started.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {howItWorks.map((step, index) => (
              <div key={index} className="relative">
                {index < howItWorks.length - 1 && (
                  <div className="hidden md:block absolute top-20 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-emerald-200 to-transparent z-0" />
                )}
                <div className="relative z-10 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl text-white mb-6 shadow-lg shadow-emerald-500/30">
                    {step.icon}
                  </div>
                  <div className="absolute top-0 right-[calc(50%-4rem)] w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                    <span className="text-emerald-600 text-xs font-bold">{step.step}</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                  <p className="text-gray-600">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partner Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Partner with {name}
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Join our network of successful hostel owners and grow your hospitality business with our comprehensive platform
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                {[
                  { icon: <UsersIcon className="w-6 h-6" />, color: "bg-blue-100 text-blue-600", title: "Reach More Customers", desc: "Connect with thousands of students and professionals looking for quality accommodation." },
                  { icon: <ShieldIcon />, color: "bg-emerald-100 text-emerald-600", title: "Secure & Reliable", desc: "Safe payment processing, verified users, and comprehensive data protection." },
                  { icon: <ChartIcon />, color: "bg-purple-100 text-purple-600", title: "Grow Your Revenue", desc: "Advanced analytics, dynamic pricing tools, and marketing support to maximize occupancy." },
                  { icon: <KeyIcon />, color: "bg-orange-100 text-orange-600", title: "Easy Management", desc: "Streamlined booking system, automated operations, and 24/7 support." }
                ].map((item, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className={`w-12 h-12 ${item.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                      {item.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{item.title}</h3>
                      <p className="text-gray-600 text-sm">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-2xl shadow-xl p-8">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BuildingIcon />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Ready to Get Started?</h3>
                  <p className="text-gray-600">Join hundreds of successful hostel owners</p>
                </div>

                <div className="space-y-4 mb-6">
                  {[
                    { label: "Application Process", value: "3-5 days", color: "text-blue-600" },
                    { label: "Setup Support", value: "Free", color: "text-emerald-600" },
                    { label: "Commission", value: "Competitive", color: "text-purple-600" }
                  ].map((item, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">{item.label}</span>
                        <span className={`text-sm font-semibold ${item.color}`}>{item.value}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <Link href="/register/owner" className="block">
                  <button className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-500 hover:to-indigo-500 transition-all shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2">
                    Apply for Partnership
                    <ArrowRightIcon />
                  </button>
                </Link>
                <p className="text-xs text-gray-500 text-center mt-3">
                  Already have an account? <Link href="/login" className="text-blue-600 hover:underline">Sign in here</Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-purple-50 border border-purple-100 rounded-full mb-4">
              <span className="text-purple-600 text-sm font-medium">💬 Testimonials</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Success Stories from Our Partners
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Hear from hostel owners who have transformed their business with our platform
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-gray-50 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all border border-gray-100">
                <div className="flex items-center mb-4">
                  <div className={`w-12 h-12 ${testimonial.color} rounded-full flex items-center justify-center mr-4 font-bold`}>
                    {testimonial.initials}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                    <p className="text-sm text-gray-600">{testimonial.role}, {testimonial.location}</p>
                  </div>
                </div>
                <div className="flex mb-3">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <StarIcon key={i} className="w-4 h-4 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed">&ldquo;{testimonial.text}&rdquo;</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/register">
              <button className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-500 hover:to-indigo-500 transition-all shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 mx-auto">
                Join These Successful Owners
                <ArrowRightIcon />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Dashboard Access Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Access Your Dashboard
            </h2>
            <p className="text-lg text-gray-600">
              Choose your role to access the appropriate management panel
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { href: "/login/admin", gradient: "from-purple-600 to-purple-800", icon: <ShieldIcon />, title: "Super Admin", desc: "System-wide management & analytics", shadow: "shadow-purple-600/20", border: "border-purple-500/20", bg: "bg-purple-500/30", hoverBg: "group-hover:bg-purple-500/50", textColor: "text-purple-200" },
              { href: "/login/owner", gradient: "from-emerald-600 to-emerald-800", icon: <BuildingIcon />, title: "Hostel Owner", desc: "Manage your hostels & bookings", shadow: "shadow-emerald-600/20", border: "border-emerald-500/20", bg: "bg-emerald-500/30", hoverBg: "group-hover:bg-emerald-500/50", textColor: "text-emerald-200" },
              { href: "/login/user", gradient: "from-blue-600 to-blue-800", icon: <UsersIcon className="w-8 h-8" />, title: "Customer", desc: "Browse rooms & make bookings", shadow: "shadow-blue-600/20", border: "border-blue-500/20", bg: "bg-blue-500/30", hoverBg: "group-hover:bg-blue-500/50", textColor: "text-blue-200" }
            ].map((card, index) => (
              <Link key={index} href={card.href} className="group">
                <div className={`bg-gradient-to-r ${card.gradient} rounded-2xl p-8 text-center hover:scale-105 transition-all duration-300 shadow-lg ${card.shadow} border ${card.border} h-full`}>
                  <div className={`inline-flex items-center justify-center w-16 h-16 ${card.bg} rounded-xl mb-5 ${card.hoverBg} transition-colors text-white`}>
                    {card.icon}
                  </div>
                  <h2 className="text-xl font-bold text-white mb-2">{card.title}</h2>
                  <p className={`${card.textColor} text-sm`}>{card.desc}</p>
                  <div className={`mt-5 inline-flex items-center ${card.textColor} text-sm font-medium group-hover:text-white transition-colors`}>
                    Access Panel
                    <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Transform Your Hostel Business?
            </h2>
            <p className="text-lg mb-8 text-white/90 max-w-2xl mx-auto">
              Join thousands of successful hostel owners who have already partnered with us. Start your journey today and unlock your property&apos;s full potential.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <button className="px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl hover:bg-white/90 transition-all shadow-xl flex items-center justify-center gap-2">
                  Get Started Free
                  <ArrowRightIcon />
                </button>
              </Link>
              <Link href="/login">
                <button className="px-8 py-4 bg-transparent border-2 border-white text-white font-semibold rounded-xl hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                  Sign In
                </button>
              </Link>
            </div>
            <p className="text-sm text-white/70 mt-6">
              Questions? Contact us at <a href={`mailto:${site.companyEmail || "info@hostelmanagement.com"}`} className="underline hover:text-white">{site.companyEmail || "info@hostelmanagement.com"}</a> or call {site.companyPhone || "+91 9999999999"}
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="py-12 bg-gray-900 text-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                {logo ? (
                  <img src={logo} alt={name} className="w-8 h-8 rounded-lg object-contain" />
                ) : (
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                    <BuildingIcon />
                  </div>
                )}
                <span className="text-lg font-semibold">{name}</span>
              </div>
              <p className="text-gray-400 text-sm">
                {site.companyDescription || "India's leading hostel management platform connecting property owners with quality tenants."}
              </p>
              {site.companyEmail && (
                <p className="text-gray-400 text-sm">
                  📧 {site.companyEmail}
                </p>
              )}
              {site.companyPhone && (
                <p className="text-gray-400 text-sm">
                  📞 {site.companyPhone}
                </p>
              )}
            </div>

            <div>
              <h3 className="font-semibold mb-4">For Owners</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/register/owner" className="hover:text-white transition-colors">Become a Partner</Link></li>
                <li><Link href="/login/owner" className="hover:text-white transition-colors">Owner Login</Link></li>
                <li><a href="#" className="hover:text-white transition-colors">Success Stories</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">For Residents</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/login/user" className="hover:text-white transition-colors">Find Hostels</Link></li>
                <li><a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Safety & Security</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Support</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#contact" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="text-gray-400 text-sm mb-4 md:mb-0">
                {copyright}
              </div>
              <div className="flex space-x-6">
                {["Facebook", "Twitter", "Instagram", "LinkedIn"].map((social) => (
                  <a key={social} href="#" className="text-gray-400 hover:text-white transition-colors text-sm">
                    {social}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
