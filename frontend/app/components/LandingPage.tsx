"use client";

import Link from "next/link";
import { useSiteSettings } from "@/lib/siteSettings";
import { useEffect, useState } from "react";
import { API_URL } from "@/lib/auth";
import PublicHeader from "@/app/components/PublicHeader";
import PublicFooter from "@/app/components/PublicFooter";

export default function LandingPage() {
  const site = useSiteSettings();
  const name = site.companyName || "Hostel Management";
  const [loginUrl, setLoginUrl] = useState("/login/user");
  const [registerUrl, setRegisterUrl] = useState("/register/customer");
  const [searchQuery, setSearchQuery] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("1");

  useEffect(() => {
    const fetchUrls = async () => {
      try {
        const res = await fetch(`${API_URL}/api/settings/login-url-public`);
        const data = await res.json();
        if (data.success && data.data) {
          if (data.data.customer_login_url) setLoginUrl(`/login/${data.data.customer_login_url}`);
        }
      } catch {}
    };
    fetchUrls();
  }, []);

  const popularCities = [
    { name: "Mumbai", properties: "2,450+", image: "🏙️" },
    { name: "Delhi", properties: "1,890+", image: "🏛️" },
    { name: "Bangalore", properties: "1,650+", image: "🌆" },
    { name: "Goa", properties: "980+", image: "🏖️" },
    { name: "Jaipur", properties: "750+", image: "🏰" },
    { name: "Pune", properties: "620+", image: "🏢" },
    { name: "Hyderabad", properties: "580+", image: "🕌" },
    { name: "Chennai", properties: "520+", image: "🌊" },
  ];

  const featuredHostels = [
    { name: "Backpacker's Paradise", location: "Mumbai, Maharashtra", price: "₹499", rating: 4.8, reviews: 324, image: "🏨", tag: "SuperOYO" },
    { name: "Urban Nest Hostel", location: "Delhi, NCR", price: "₹399", rating: 4.6, reviews: 256, image: "🏠", tag: "Premium" },
    { name: "Beach Bunk Hostel", location: "Goa", price: "₹599", rating: 4.9, reviews: 412, image: "🏖️", tag: "Top Rated" },
    { name: "Mountain View Stay", location: "Manali, HP", price: "₹449", rating: 4.7, reviews: 189, image: "⛰️", tag: "Trending" },
    { name: "City Central Hostel", location: "Bangalore, KA", price: "₹349", rating: 4.5, reviews: 198, image: "🌆", tag: "Value" },
    { name: "Heritage Hostel", location: "Jaipur, RJ", price: "₹549", rating: 4.8, reviews: 267, image: "🏰", tag: "Heritage" },
  ];

  const offers = [
    { title: "Flat 60% OFF", subtitle: "On first booking", code: "WELCOME60", color: "from-red-500 to-orange-500" },
    { title: "₹200 OFF", subtitle: "On hostels above ₹999", code: "SAVE200", color: "from-purple-500 to-pink-500" },
    { title: "Weekend Special", subtitle: "Extra 30% OFF", code: "WEEKEND30", color: "from-emerald-500 to-teal-500" },
  ];

  const whyChooseUs = [
    { icon: "💰", title: "Lowest Prices", desc: "Best prices guaranteed on all hostels" },
    { icon: "✅", title: "Verified Properties", desc: "All hostels are verified & safe" },
    { icon: "📞", title: "24/7 Support", desc: "Round the clock customer support" },
    { icon: "🔄", title: "Free Cancellation", desc: "Cancel anytime, get full refund" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <PublicHeader />

      {/* Hero Section with Search */}
      <section className="relative bg-gradient-to-br from-emerald-700 via-teal-600 to-emerald-800 pt-4 pb-12 md:pt-6 md:pb-16">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-emerald-300 rounded-full blur-3xl" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3">
              Find & Book <span className="text-yellow-300">Hostels</span> Near You
            </h1>
            <p className="text-emerald-100 text-lg max-w-2xl mx-auto">
              Discover affordable hostels across India. Book rooms, beds, and dorms at the best prices.
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-2xl shadow-black/20 p-2 flex flex-col md:flex-row gap-2">
              <div className="flex-1 relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by city, locality, or hostel name..."
                  className="w-full pl-12 pr-4 py-4 text-gray-700 placeholder-gray-400 focus:outline-none text-sm rounded-xl"
                />
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <input
                    type="date"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    className="px-4 py-4 text-gray-700 focus:outline-none text-sm rounded-xl border border-gray-200 w-full md:w-40"
                    placeholder="Check-in"
                  />
                </div>
                <div className="relative">
                  <input
                    type="date"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className="px-4 py-4 text-gray-700 focus:outline-none text-sm rounded-xl border border-gray-200 w-full md:w-40"
                    placeholder="Check-out"
                  />
                </div>
                <select
                  value={guests}
                  onChange={(e) => setGuests(e.target.value)}
                  className="px-4 py-4 text-gray-700 focus:outline-none text-sm rounded-xl border border-gray-200 bg-white w-full md:w-32"
                >
                  <option value="1">1 Guest</option>
                  <option value="2">2 Guests</option>
                  <option value="3">3 Guests</option>
                  <option value="4">4+ Guests</option>
                </select>
                <button className="px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-semibold hover:from-emerald-500 hover:to-teal-500 transition-all shadow-lg shadow-emerald-500/30 flex items-center gap-2 whitespace-nowrap">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  Search
                </button>
              </div>
            </div>

            {/* Quick Links */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
              <span className="text-emerald-200 text-sm">Popular:</span>
              {["Mumbai", "Delhi", "Goa", "Bangalore", "Jaipur"].map((city) => (
                <button
                  key={city}
                  onClick={() => setSearchQuery(city)}
                  className="px-3 py-1.5 bg-white/10 backdrop-blur-sm text-white rounded-full text-xs font-medium hover:bg-white/20 transition-all border border-white/20"
                >
                  {city}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-white border-b border-gray-100 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { value: "10,000+", label: "Hostels Listed" },
              { value: "50,000+", label: "Happy Customers" },
              { value: "100+", label: "Cities Covered" },
              { value: "4.8★", label: "Average Rating" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-xl md:text-2xl font-bold text-emerald-600">{stat.value}</div>
                <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Offers Carousel */}
      <section className="py-8 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">Offers For You</h2>
            <Link href="#" className="text-emerald-600 text-sm font-semibold hover:text-emerald-700 flex items-center gap-1">
              View All <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {offers.map((offer, i) => (
              <div key={i} className={`bg-gradient-to-r ${offer.color} rounded-xl p-5 text-white cursor-pointer hover:scale-[1.02] transition-transform`}>
                <div className="text-2xl font-bold mb-1">{offer.title}</div>
                <div className="text-white/80 text-sm mb-3">{offer.subtitle}</div>
                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1.5">
                  <span className="text-xs font-medium">Use code:</span>
                  <span className="text-sm font-bold">{offer.code}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Cities */}
      <section className="py-10 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">Explore Popular Cities</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-4">
            {popularCities.map((city, i) => (
              <button
                key={i}
                className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-emerald-50 transition-all group"
              >
                <span className="text-3xl group-hover:scale-110 transition-transform">{city.image}</span>
                <span className="text-sm font-semibold text-gray-900 group-hover:text-emerald-600">{city.name}</span>
                <span className="text-xs text-gray-500">{city.properties} properties</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Hostels */}
      <section className="py-10 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">Featured Hostels</h2>
              <p className="text-gray-500 text-sm mt-1">Handpicked hostels for your next stay</p>
            </div>
            <Link href={registerUrl} className="text-emerald-600 text-sm font-semibold hover:text-emerald-700 flex items-center gap-1">
              View All <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {featuredHostels.map((hostel, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 group cursor-pointer">
                <div className="relative h-48 bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
                  <span className="text-6xl opacity-50">{hostel.image}</span>
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-1 bg-emerald-600 text-white text-xs font-bold rounded-md shadow-lg">
                      {hostel.tag}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3">
                    <button className="w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-all">
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">{hostel.name}</h3>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                        {hostel.location}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-md">
                      <svg className="w-3.5 h-3.5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                      <span className="text-xs font-bold text-emerald-700">{hostel.rating}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
                    <span>{hostel.reviews} reviews</span>
                    <span>•</span>
                    <span className="text-emerald-600 font-medium">Free cancellation</span>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div>
                      <span className="text-xs text-gray-400 line-through">₹{(parseInt(hostel.price.replace("₹", "")) * 1.5).toFixed(0)}</span>
                      <span className="text-lg font-bold text-gray-900 ml-1">{hostel.price}</span>
                      <span className="text-xs text-gray-500">/night</span>
                    </div>
                    <Link href={registerUrl}>
                      <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-all">
                        Book Now
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-10 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 text-center mb-8">Why Book With {name}?</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {whyChooseUs.map((item, i) => (
              <div key={i} className="text-center p-6 rounded-xl hover:bg-emerald-50 transition-all cursor-pointer group">
                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">{item.icon}</div>
                <h3 className="font-bold text-gray-900 mb-1">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Download App / CTA */}
      <section className="py-12 bg-gradient-to-r from-emerald-700 to-teal-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                Download Our App
              </h2>
              <p className="text-emerald-100 mb-6 max-w-md">
                Get exclusive app-only deals and manage your bookings on the go. Available on iOS & Android.
              </p>
              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                <Link href={registerUrl}>
                  <button className="px-8 py-3.5 bg-white text-emerald-700 rounded-xl font-bold hover:bg-emerald-50 transition-all shadow-lg">
                    Get Started Free
                  </button>
                </Link>
                <Link href={loginUrl}>
                  <button className="px-8 py-3.5 bg-white/10 backdrop-blur-sm text-white rounded-xl font-bold border border-white/30 hover:bg-white/20 transition-all">
                    Sign In
                  </button>
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-32 h-40 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 flex items-center justify-center">
                <span className="text-5xl">📱</span>
              </div>
              <div className="w-32 h-40 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 flex items-center justify-center">
                <span className="text-5xl">💻</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-10 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 text-center mb-8">What Our Customers Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: "Rahul Sharma", location: "Mumbai", rating: 5, text: "Best hostel booking experience! Found a great place in Goa at half the price. Highly recommended!" },
              { name: "Priya Patel", location: "Delhi", rating: 5, text: "Clean rooms, friendly staff, and amazing locations. {name} made my backpacking trip so much easier." },
              { name: "Amit Kumar", location: "Bangalore", rating: 4, text: "Great app for budget travelers. The filters help find exactly what you need. Will use again!" },
            ].map((review, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-1 mb-3">
                  {Array.from({ length: review.rating }).map((_, j) => (
                    <svg key={j} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                  ))}
                </div>
                <p className="text-gray-600 text-sm mb-4 leading-relaxed">&ldquo;{review.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {review.name[0]}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">{review.name}</div>
                    <div className="text-xs text-gray-500">{review.location}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-10 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">Stay Updated</h2>
          <p className="text-gray-500 mb-6">Get exclusive deals and travel tips delivered to your inbox.</p>
          <form className="flex gap-2 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
            />
            <button className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-semibold hover:from-emerald-500 hover:to-teal-500 transition-all shadow-lg shadow-emerald-500/25">
              Subscribe
            </button>
          </form>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
