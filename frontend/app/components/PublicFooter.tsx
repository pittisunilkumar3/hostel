"use client";

import Link from "next/link";
import { useSiteSettings } from "@/lib/siteSettings";

export default function PublicFooter() {
  const site = useSiteSettings();
  const name = site.companyName || "Hostel Management";
  const logo = site.companyLogo;
  const copyright = site.copyrightText || `© ${new Date().getFullYear()} ${name}. All rights reserved.`;

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-3 mb-4">
              {logo ? (
                <img src={logo} alt={name} className="w-10 h-10 rounded-xl object-contain" />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              )}
              <span className="text-xl font-bold">{name}</span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed mb-4">
              {site.companyDescription || "The complete hostel management solution for modern accommodation providers."}
            </p>
            {site.companyEmail && (
              <a href={`mailto:${site.companyEmail}`} className="text-gray-400 hover:text-emerald-400 text-sm flex items-center gap-2 mb-2 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {site.companyEmail}
              </a>
            )}
            {site.companyPhone && (
              <a href={`tel:${site.companyPhone}`} className="text-gray-400 hover:text-emerald-400 text-sm flex items-center gap-2 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                {site.companyPhone}
              </a>
            )}
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-5">Quick Links</h4>
            <ul className="space-y-3">
              <li><Link href="/" className="text-gray-400 hover:text-emerald-400 text-sm transition-colors">Home</Link></li>
              <li><Link href="/pages/about-us" className="text-gray-400 hover:text-emerald-400 text-sm transition-colors">About Us</Link></li>
              <li><Link href="/login" className="text-gray-400 hover:text-emerald-400 text-sm transition-colors">Sign In</Link></li>
              <li><Link href="/register" className="text-gray-400 hover:text-emerald-400 text-sm transition-colors">Register</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-5">Legal</h4>
            <ul className="space-y-3">
              <li><Link href="/pages/privacy-policy" className="text-gray-400 hover:text-emerald-400 text-sm transition-colors">Privacy Policy</Link></li>
              <li><Link href="/pages/terms-and-conditions" className="text-gray-400 hover:text-emerald-400 text-sm transition-colors">Terms & Conditions</Link></li>
              <li><Link href="/pages/refund-policy" className="text-gray-400 hover:text-emerald-400 text-sm transition-colors">Refund Policy</Link></li>
              <li><Link href="/pages/cancellation-policy" className="text-gray-400 hover:text-emerald-400 text-sm transition-colors">Cancellation Policy</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-5">Contact</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/contact" className="text-gray-400 hover:text-emerald-400 text-sm transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-400 hover:text-emerald-400 text-sm transition-colors">
                  Support
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-sm">{copyright}</p>
          <div className="flex items-center gap-4">
            {["Facebook", "Twitter", "Instagram", "LinkedIn"].map((social) => (
              <a key={social} href="#" className="w-9 h-9 bg-gray-800 hover:bg-emerald-600 rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition-all">
                <span className="text-xs font-bold">{social[0]}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
