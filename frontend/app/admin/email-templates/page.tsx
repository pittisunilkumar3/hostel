"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import { apiFetch } from "@/lib/auth";
import { getSidebarItems } from "@/app/admin/sidebarItems";

const sidebarItems = getSidebarItems();

/* ─── Types ─────────────────────────────────────────────────── */
interface EmailTemplate {
  id: number;
  title: string | null;
  body: string | null;
  body_2: string | null;
  icon: string | null;
  logo: string | null;
  banner_image: string | null;
  button_name: string | null;
  button_url: string | null;
  footer_text: string | null;
  copyright_text: string | null;
  email_type: string | null;
  template_type: string;
  email_template: string;
  privacy: number;
  refund: number;
  cancelation: number;
  contact: number;
  facebook: number;
  instagram: number;
  twitter: number;
  linkedin: number;
  pinterest: number;
  status: number;
}

type MailCategory = "user" | "admin";

/* ─── Category definitions (matches reference mail-route-selector) ── */
const CATEGORIES: { key: MailCategory; label: string }[] = [
  { key: "user", label: "Customer Mail Templates" },
  { key: "admin", label: "Admin Mail Templates" },
];

/* ─── Tab definitions per category (matches reference exactly) ── */
const TABS: Record<MailCategory, { key: string; label: string }[]> = {
  user: [
    { key: "registration", label: "New Customer Registration" },
    { key: "forgot_password", label: "Forgot Password" },
    { key: "registration_otp", label: "Registration OTP" },
    { key: "login_otp", label: "Login OTP" },
    { key: "booking_confirmation", label: "Booking Confirmation" },
    { key: "booking_status", label: "Booking Status Update" },
  ],
  admin: [
    { key: "registration", label: "Customer Registration" },
    { key: "new_booking", label: "New Booking" },
    { key: "owner_registration", label: "Owner Registration" },
  ],
};

/* ─── Safe image helper ── */
function SafeImg({
  src,
  alt,
  style,
  className,
}: {
  src: string | null | undefined;
  alt: string;
  style?: React.CSSProperties;
  className?: string;
}) {
  if (!src) return null;
  return (
    <img
      src={src}
      alt={alt}
      style={style}
      className={className}
      onError={(e) => {
        (e.target as HTMLImageElement).style.display = "none";
      }}
    />
  );
}

/* ─── Email Preview Component ────────────────────────────────── */
function EmailPreview({
  title,
  body,
  body2,
  footerText,
  copyrightText,
  buttonName,
  buttonUrl,
  icon,
  logo,
  bannerImage,
  templateFormat,
  privacy,
  refund,
  cancelation,
  contact,
  facebook,
  instagram,
  twitter,
  linkedin,
  pinterest,
}: {
  title: string;
  body: string;
  body2: string;
  footerText: string;
  copyrightText: string;
  buttonName: string;
  buttonUrl: string;
  icon: string;
  logo: string;
  bannerImage: string;
  templateFormat: string;
  privacy: boolean;
  refund: boolean;
  cancelation: boolean;
  contact: boolean;
  facebook: boolean;
  instagram: boolean;
  twitter: boolean;
  linkedin: boolean;
  pinterest: boolean;
}) {
  const socialIcons = [
    { show: facebook, src: "https://img.icons8.com/color/24/facebook.png", alt: "Facebook" },
    { show: instagram, src: "https://img.icons8.com/color/24/instagram.png", alt: "Instagram" },
    { show: twitter, src: "https://img.icons8.com/color/24/twitter.png", alt: "Twitter" },
    { show: linkedin, src: "https://img.icons8.com/color/24/linkedin.png", alt: "LinkedIn" },
    { show: pinterest, src: "https://img.icons8.com/color/24/pinterest.png", alt: "Pinterest" },
  ];

  const fmt = parseInt(templateFormat) || 5;

  /* ── Shared footer block ── */
  const Footer = () => (
    <>
      {/* Privacy / Refund / Cancelation / Contact links */}
      <span
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          margin: "10px 0",
        }}
      >
        {privacy && (
          <a href="#" style={{ textDecoration: "none", color: "#334257", fontSize: 12 }}>
            Privacy Policy
          </a>
        )}
        {refund && (
          <a href="#" style={{ textDecoration: "none", color: "#334257", fontSize: 12 }}>
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#334257",
                display: "inline-block",
                margin: "0 5px",
              }}
            />
            Refund Policy
          </a>
        )}
        {cancelation && (
          <a href="#" style={{ textDecoration: "none", color: "#334257", fontSize: 12 }}>
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#334257",
                display: "inline-block",
                margin: "0 5px",
              }}
            />
            Cancelation Policy
          </a>
        )}
        {contact && (
          <a href="#" style={{ textDecoration: "none", color: "#334257", fontSize: 12 }}>
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#334257",
                display: "inline-block",
                margin: "0 5px",
              }}
            />
            Contact us
          </a>
        )}
      </span>

      {/* Social icons */}
      <span style={{ display: "block", textAlign: "center", margin: "15px 0 8px" }}>
        {socialIcons
          .filter((s) => s.show)
          .map((s, i) => (
            <a key={i} href="#" style={{ margin: "0 5px", textDecoration: "none" }}>
              <img src={s.src} alt={s.alt} style={{ width: 24, height: 24 }} />
            </a>
          ))}
      </span>

      {/* Copyright */}
      <span style={{ textAlign: "center", display: "block", color: "#aaa", fontSize: 11, marginTop: 8 }}>
        {copyrightText || "Copyright 2025 Hostel. All rights reserved."}
      </span>
    </>
  );

  /* ── Button helper ── */
  const ButtonEl = () =>
    buttonName ? (
      <span style={{ display: "block", textAlign: "center", marginTop: 16 }}>
        <a
          href={buttonUrl || "#"}
          style={{
            background: "#ffa726",
            color: "#fff",
            padding: "8px 20px",
            display: "inline-block",
            textDecoration: "none",
            fontSize: 14,
          }}
        >
          {buttonName}
        </a>
      </span>
    ) : null;

  /* ── Common wrapper table ── */
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <table
      style={{
        width: "100%",
        maxWidth: 500,
        margin: "0 auto",
        textAlign: "center",
        background: "#fff",
      }}
    >
      {children}
    </table>
  );

  /* ── Format 1: Logo → Title → Body → Banner → Button ── */
  if (fmt === 1) {
    return (
      <Wrapper>
        <tbody>
          <tr>
            <td style={{ padding: "30px 30px 0" }}>
              <SafeImg src={logo} alt="logo" style={{ width: 140, height: 60, objectFit: "contain" }} />
              <h3 style={{ fontSize: 17, fontWeight: 500, color: "#334257", marginTop: 8 }}>
                {title || "Main Title"}
              </h3>
              <span
                style={{ fontWeight: 500, display: "block", margin: "20px 0 11px", color: "#737883", fontSize: 13, lineHeight: "21px" }}
                dangerouslySetInnerHTML={{ __html: body || "Mail body content..." }}
              />
              <SafeImg src={bannerImage} alt="banner" style={{ width: "100%", height: 172, objectFit: "cover", marginBottom: 10 }} />
              <ButtonEl />
              <span style={{ borderTop: "1px solid #e9ecef", display: "block", marginTop: 16 }} />
              <span style={{ display: "block", marginBottom: 14, color: "#737883", fontSize: 13, lineHeight: "21px" }}>
                {footerText || "Please contact us for any queries, we're always happy to help."}
              </span>
              <span style={{ display: "block", color: "#334257", fontSize: 13 }}>Thanks &amp; Regards,</span>
              <span style={{ display: "block", color: "#334257", fontSize: 13, marginBottom: 20 }}>Hostel System</span>
            </td>
          </tr>
          <tr>
            <td>
              <Footer />
            </td>
          </tr>
        </tbody>
      </Wrapper>
    );
  }

  /* ── Format 2: Logo → Title → Body → Button (no banner) ── */
  if (fmt === 2) {
    return (
      <Wrapper>
        <tbody>
          <tr>
            <td style={{ padding: "30px 30px 0" }}>
              <SafeImg src={logo} alt="logo" style={{ width: 140, height: 60, objectFit: "contain" }} />
              <h3 style={{ fontSize: 17, fontWeight: 500, color: "#334257", marginTop: 8 }}>
                {title || "Main Title"}
              </h3>
              <span
                style={{ fontWeight: 500, display: "block", margin: "20px 0 11px", color: "#737883", fontSize: 13, lineHeight: "21px" }}
                dangerouslySetInnerHTML={{ __html: body || "Mail body content..." }}
              />
              <ButtonEl />
              <span style={{ borderTop: "1px solid #e9ecef", display: "block", marginTop: 16 }} />
              <span style={{ display: "block", marginBottom: 14, color: "#737883", fontSize: 13 }}>
                {footerText || "Please contact us for any queries, we're always happy to help."}
              </span>
              <span style={{ display: "block", color: "#334257", fontSize: 13 }}>Thanks &amp; Regards,</span>
              <span style={{ display: "block", color: "#334257", fontSize: 13, marginBottom: 20 }}>Hostel System</span>
            </td>
          </tr>
          <tr>
            <td>
              <Footer />
            </td>
          </tr>
        </tbody>
      </Wrapper>
    );
  }

  /* ── Format 3: Title → Body → Button → Green Section ── */
  if (fmt === 3) {
    return (
      <Wrapper>
        <tbody>
          <tr>
            <td style={{ padding: "30px 30px 0" }}>
              <h3 style={{ fontSize: 17, fontWeight: 500, color: "#334257", marginBottom: 15 }}>
                {title || "Main Title"}
              </h3>
              <span
                style={{ fontWeight: 500, display: "block", margin: "20px 0 11px", color: "#737883", fontSize: 13 }}
                dangerouslySetInnerHTML={{ __html: body || "Mail body content..." }}
              />
              <ButtonEl />
              <table style={{ background: "#E3F5F1", padding: 10, width: "100%", textAlign: "center" }}>
                <tbody>
                  <tr>
                    <td style={{ padding: 10, textAlign: "center" }}>
                      <SafeImg src={logo} alt="logo" style={{ width: 130, height: 45, objectFit: "contain", marginBottom: 10 }} />
                      <h3 style={{ margin: 0, marginBottom: 15, color: "#334257" }}>Order Info</h3>
                    </td>
                  </tr>
                </tbody>
              </table>
              <span style={{ borderTop: "1px solid #e9ecef", display: "block", marginTop: 16 }} />
              <span style={{ display: "block", marginBottom: 14, color: "#737883", fontSize: 13 }}>
                {footerText || "Please contact us for any queries, we're always happy to help."}
              </span>
              <span style={{ display: "block", color: "#334257", fontSize: 13 }}>Thanks &amp; Regards,</span>
              <span style={{ display: "block", color: "#334257", fontSize: 13, marginBottom: 20 }}>Hostel System</span>
            </td>
          </tr>
          <tr>
            <td>
              <Footer />
            </td>
          </tr>
        </tbody>
      </Wrapper>
    );
  }

  /* ── Format 4: Icon centered → Title → Body → Code → Button ── */
  if (fmt === 4) {
    return (
      <Wrapper>
        <tbody>
          <tr>
            <td style={{ padding: "30px 30px 0", textAlign: "center" }}>
              <SafeImg src={icon} alt="icon" style={{ width: 130, height: 45, objectFit: "contain" }} />
              <h3 style={{ fontSize: 17, fontWeight: 500, color: "#334257", marginTop: 8 }}>
                {title || "Main Title"}
              </h3>
              <span
                style={{ fontWeight: 500, display: "block", margin: "20px 0 11px", color: "#737883", fontSize: 13 }}
                dangerouslySetInnerHTML={{ __html: body || "Mail body content..." }}
              />
              <h2 style={{ fontSize: 26, margin: 0, letterSpacing: 4, color: "#334257" }}>123456</h2>
            </td>
          </tr>
          <tr>
            <td style={{ padding: "0 30px 30px" }}>
              <ButtonEl />
              <span style={{ borderTop: "1px solid #e9ecef", display: "block", marginTop: 16 }} />
              <span style={{ display: "block", marginBottom: 14, color: "#737883", fontSize: 13 }}>
                {footerText || "Please contact us for any queries, we're always happy to help."}
              </span>
              <span style={{ display: "block", color: "#334257", fontSize: 13 }}>Thanks &amp; Regards,</span>
              <span style={{ display: "block", color: "#334257", fontSize: 13, marginBottom: 20 }}>Hostel System</span>
            </td>
          </tr>
          <tr>
            <td>
              <Footer />
            </td>
          </tr>
        </tbody>
      </Wrapper>
    );
  }

  /* ── Format 5 (default): Icon centered → Title → Body → Link → Footer ── */
  if (fmt === 5) {
    return (
      <Wrapper>
        <tbody>
          <tr>
            <td style={{ padding: "30px 30px 0", textAlign: "center" }}>
              <SafeImg src={icon} alt="icon" style={{ width: 130, height: 45, objectFit: "contain" }} />
              <h3 style={{ fontSize: 17, fontWeight: 500, color: "#334257", marginTop: 8 }}>
                {title || "Main Title or Subject of the Mail"}
              </h3>
            </td>
          </tr>
          <tr>
            <td style={{ padding: "0 30px 30px", textAlign: "left" }}>
              <span
                style={{ fontWeight: 500, display: "block", margin: "20px 0 11px", color: "#737883", fontSize: 13 }}
                dangerouslySetInnerHTML={{ __html: body || "Please click the link below to change your password" }}
              />
              <span style={{ display: "block", marginBottom: 14 }}>
                <a href="#" style={{ color: "#0177CD" }}>generated_link</a>
              </span>
              <span style={{ borderTop: "1px solid #e9ecef", display: "block" }} />
              <span style={{ display: "block", marginBottom: 14, color: "#737883", fontSize: 13 }}>
                {footerText || "Please contact us for any queries, we're always happy to help."}
              </span>
              <span style={{ display: "block", color: "#334257", fontSize: 13 }}>Thanks &amp; Regards,</span>
              <span style={{ display: "block", color: "#334257", fontSize: 13, marginBottom: 20 }}>Hostel System</span>
              <SafeImg
                src={logo}
                alt="logo"
                style={{ width: 100, display: "block", margin: "10px auto" }}
              />
            </td>
          </tr>
          <tr>
            <td>
              <Footer />
            </td>
          </tr>
        </tbody>
      </Wrapper>
    );
  }

  /* ── Format 6: Icon → Title → Body → Transaction Table ── */
  if (fmt === 6) {
    return (
      <Wrapper>
        <tbody>
          <tr>
            <td style={{ padding: "30px 30px 0", textAlign: "center" }}>
              <SafeImg src={icon} alt="icon" style={{ width: 130, height: 45, objectFit: "contain" }} />
              <h3 style={{ fontSize: 17, fontWeight: 500, color: "#334257", marginTop: 8 }}>
                {title || "Main Title"}
              </h3>
              <span
                style={{ fontWeight: 500, display: "block", margin: "20px 0 11px", color: "#737883", fontSize: 13 }}
                dangerouslySetInnerHTML={{ __html: body || "Mail body content..." }}
              />
            </td>
          </tr>
          <tr>
            <td style={{ padding: "0 30px" }}>
              <table style={{ background: "#E3F5F1", padding: 10, width: "100%", textAlign: "center" }}>
                <thead>
                  <tr>
                    <th style={{ padding: 5 }}>SL</th>
                    <th style={{ padding: 5 }}>Transaction ID</th>
                    <th style={{ padding: 5 }}>Time</th>
                    <th style={{ padding: 5 }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: 5 }}>1</td>
                    <td style={{ padding: 5 }}>TXN123456</td>
                    <td style={{ padding: 5 }}>2025-01-01</td>
                    <td style={{ padding: 5 }}>$100.00</td>
                  </tr>
                </tbody>
              </table>
              <ButtonEl />
              <span style={{ borderTop: "1px solid #e9ecef", display: "block", marginTop: 16 }} />
              <span style={{ display: "block", marginBottom: 14, color: "#737883", fontSize: 13 }}>
                {footerText || "Please contact us for any queries, we're always happy to help."}
              </span>
              <span style={{ display: "block", color: "#334257", fontSize: 13 }}>Thanks &amp; Regards,</span>
              <span style={{ display: "block", color: "#334257", fontSize: 13, marginBottom: 20 }}>Hostel System</span>
            </td>
          </tr>
          <tr>
            <td>
              <Footer />
            </td>
          </tr>
        </tbody>
      </Wrapper>
    );
  }

  /* ── Format 7: Logo → Title → Body → Banner (no button) ── */
  if (fmt === 7) {
    return (
      <Wrapper>
        <tbody>
          <tr>
            <td style={{ padding: "30px 30px 0" }}>
              <SafeImg src={logo} alt="logo" style={{ width: 140, height: 60, objectFit: "contain" }} />
              <h3 style={{ fontSize: 17, fontWeight: 500, color: "#334257", marginTop: 8 }}>
                {title || "Main Title"}
              </h3>
              <span
                style={{ fontWeight: 500, display: "block", margin: "20px 0 11px", color: "#737883", fontSize: 13 }}
                dangerouslySetInnerHTML={{ __html: body || "Mail body content..." }}
              />
              <SafeImg src={bannerImage} alt="banner" style={{ width: "100%", height: 172, objectFit: "cover", marginBottom: 10 }} />
              <span style={{ borderTop: "1px solid #e9ecef", display: "block", marginTop: 16 }} />
              <span style={{ display: "block", marginBottom: 14, color: "#737883", fontSize: 13 }}>
                {footerText || "Please contact us for any queries, we're always happy to help."}
              </span>
              <span style={{ display: "block", color: "#334257", fontSize: 13 }}>Thanks &amp; Regards,</span>
              <span style={{ display: "block", color: "#334257", fontSize: 13, marginBottom: 20 }}>Hostel System</span>
            </td>
          </tr>
          <tr>
            <td>
              <Footer />
            </td>
          </tr>
        </tbody>
      </Wrapper>
    );
  }

  /* ── Format 8: Logo → Title → Body → Banner → Button ── */
  if (fmt === 8) {
    return (
      <Wrapper>
        <tbody>
          <tr>
            <td style={{ padding: "30px 30px 0" }}>
              <SafeImg src={logo} alt="logo" style={{ width: 140, height: 60, objectFit: "contain" }} />
              <h3 style={{ fontSize: 17, fontWeight: 500, color: "#334257", marginTop: 8 }}>
                {title || "Main Title"}
              </h3>
              <span
                style={{ fontWeight: 500, display: "block", margin: "20px 0 11px", color: "#737883", fontSize: 13 }}
                dangerouslySetInnerHTML={{ __html: body || "Mail body content..." }}
              />
              <SafeImg src={bannerImage} alt="banner" style={{ width: "100%", height: 172, objectFit: "cover", marginBottom: 10 }} />
              <ButtonEl />
              <span style={{ borderTop: "1px solid #e9ecef", display: "block", marginTop: 16 }} />
              <span style={{ display: "block", marginBottom: 14, color: "#737883", fontSize: 13 }}>
                {footerText || "Please contact us for any queries, we're always happy to help."}
              </span>
              <span style={{ display: "block", color: "#334257", fontSize: 13 }}>Thanks &amp; Regards,</span>
              <span style={{ display: "block", color: "#334257", fontSize: 13, marginBottom: 20 }}>Hostel System</span>
            </td>
          </tr>
          <tr>
            <td>
              <Footer />
            </td>
          </tr>
        </tbody>
      </Wrapper>
    );
  }

  /* ── Format 9: Title → Body → Green Section → Order Info ── */
  if (fmt === 9) {
    return (
      <Wrapper>
        <tbody>
          <tr>
            <td style={{ padding: "30px 30px 0" }}>
              <h3 style={{ fontSize: 17, fontWeight: 500, color: "#334257", marginBottom: 15 }}>
                {title || "Main Title"}
              </h3>
              <span
                style={{ fontWeight: 500, display: "block", margin: "20px 0 11px", color: "#737883", fontSize: 13 }}
                dangerouslySetInnerHTML={{ __html: body || "Mail body content..." }}
              />
              <table style={{ background: "#E3F5F1", padding: 10, width: "100%" }}>
                <tbody>
                  <tr>
                    <td style={{ padding: 10, textAlign: "center" }}>
                      <SafeImg src={logo} alt="logo" style={{ width: 130, height: 45, objectFit: "contain", marginBottom: 10 }} />
                      <h3 style={{ margin: 0, marginBottom: 15, color: "#334257" }}>Order Info</h3>
                    </td>
                  </tr>
                </tbody>
              </table>
              <span style={{ borderTop: "1px solid #e9ecef", display: "block", marginTop: 16 }} />
              <span style={{ display: "block", marginBottom: 14, color: "#737883", fontSize: 13 }}>
                {footerText || "Please contact us for any queries, we're always happy to help."}
              </span>
              <span style={{ display: "block", color: "#334257", fontSize: 13 }}>Thanks &amp; Regards,</span>
              <span style={{ display: "block", color: "#334257", fontSize: 13, marginBottom: 20 }}>Hostel System</span>
            </td>
          </tr>
          <tr>
            <td>
              <Footer />
            </td>
          </tr>
        </tbody>
      </Wrapper>
    );
  }

  /* ── Format 10: Icon → Title → Body → Banner → Credentials ── */
  if (fmt === 10) {
    return (
      <Wrapper>
        <tbody>
          <tr>
            <td style={{ padding: "30px 30px 0" }}>
              <SafeImg src={icon} alt="icon" style={{ width: 140, height: 60, objectFit: "contain" }} />
              <h3 style={{ fontSize: 17, fontWeight: 500, color: "#334257", marginTop: 8 }}>
                {title || "Main Title"}
              </h3>
              <span
                style={{ fontWeight: 500, display: "block", margin: "20px 0 11px", color: "#737883", fontSize: 13 }}
                dangerouslySetInnerHTML={{ __html: body || "Mail body content..." }}
              />
              <SafeImg src={bannerImage} alt="banner" style={{ width: "100%", height: 172, objectFit: "cover", marginBottom: 10 }} />
              <ButtonEl />
              <span style={{ display: "block", marginBottom: 5 }}>
                <span style={{ display: "block", color: "#737883", fontSize: 13 }}>Your account credentials:</span>
                <h6 style={{ color: "#334257", margin: "5px 0" }}>Email: john@example.com</h6>
                <h6 style={{ color: "#334257", margin: "5px 0" }}>Password: ********</h6>
              </span>
              {body2 && (
                <span
                  style={{ display: "block", marginBottom: 5, color: "#737883", fontSize: 13 }}
                  dangerouslySetInnerHTML={{ __html: body2 }}
                />
              )}
              <span style={{ borderTop: "1px solid #e9ecef", display: "block", marginTop: 16 }} />
              <span style={{ display: "block", marginBottom: 14, color: "#737883", fontSize: 13 }}>
                {footerText || "Please contact us for any queries, we're always happy to help."}
              </span>
              <span style={{ display: "block", color: "#334257", fontSize: 13 }}>Thanks &amp; Regards,</span>
              <span style={{ display: "block", color: "#334257", fontSize: 13, marginBottom: 20 }}>Hostel System</span>
            </td>
          </tr>
          <tr>
            <td>
              <Footer />
            </td>
          </tr>
        </tbody>
      </Wrapper>
    );
  }

  /* ── Format 11: Icon centered → Title → Body → Button ── */
  return (
    <Wrapper>
      <tbody>
        <tr>
          <td style={{ padding: "30px 30px 0", textAlign: "center" }}>
            <SafeImg src={icon} alt="icon" style={{ width: 130, height: 45, objectFit: "contain" }} />
            <h3 style={{ fontSize: 17, fontWeight: 500, color: "#334257", marginTop: 8, marginBottom: 10 }}>
              {title || "Main Title"}
            </h3>
          </td>
        </tr>
        <tr>
          <td style={{ padding: "0 30px 30px", textAlign: "left" }}>
            <span
              style={{ fontWeight: 500, display: "block", margin: "0 0 11px", color: "#737883", fontSize: 13 }}
              dangerouslySetInnerHTML={{ __html: body || "Mail body content..." }}
            />
            <ButtonEl />
            <span style={{ borderTop: "1px solid #e9ecef", display: "block", marginTop: 16 }} />
            <span style={{ display: "block", marginBottom: 14, color: "#737883", fontSize: 13 }}>
              {footerText || "Please contact us for any queries, we're always happy to help."}
            </span>
            <span style={{ display: "block", color: "#334257", fontSize: 13 }}>Thanks &amp; Regards,</span>
            <span style={{ display: "block", color: "#334257", fontSize: 13, marginBottom: 20 }}>Hostel System</span>
          </td>
        </tr>
        <tr>
          <td>
            <Footer />
          </td>
        </tr>
      </tbody>
    </Wrapper>
  );
}

/* ─── Main Page ─────────────────────────────────────────────── */
export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  /* Category (user / admin) — matches reference mail-route-selector */
  const [category, setCategory] = useState<MailCategory>("user");

  /* Active tab within category */
  const [activeTab, setActiveTab] = useState<string>("registration");

  const [editTemplate, setEditTemplate] = useState<EmailTemplate | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    body: "",
    body_2: "",
    button_name: "",
    button_url: "",
    footer_text: "",
    copyright_text: "",
    icon: "",
    logo: "",
    banner_image: "",
    email_template: "5",
    privacy: false,
    refund: false,
    cancelation: false,
    contact: false,
    facebook: false,
    instagram: false,
    twitter: false,
    linkedin: false,
    pinterest: false,
    status: true,
  });

  /* ── Fetch templates when category changes ── */
  useEffect(() => {
    fetchTemplates();
  }, [category]);

  /* ── Auto-select first tab's template when data loads ── */
  useEffect(() => {
    if (templates.length > 0) {
      const tpl = templates.find((t) => t.email_type === activeTab);
      if (tpl) {
        selectTemplate(tpl);
      }
    }
  }, [templates, activeTab]);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/email-templates?type=${category}`);
      if (res.success && res.data) {
        setTemplates(res.data);
        /* Auto-select first tab */
        const tabs = TABS[category];
        const firstMatch = res.data.find((t: EmailTemplate) => t.email_type === tabs[0].key);
        if (firstMatch) {
          setActiveTab(tabs[0].key);
          selectTemplate(firstMatch);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const selectTemplate = (t: EmailTemplate) => {
    setEditTemplate(t);
    setFormData({
      title: t.title || "",
      body: t.body || "",
      body_2: t.body_2 || "",
      button_name: t.button_name || "",
      button_url: t.button_url || "",
      footer_text: t.footer_text || "",
      copyright_text: t.copyright_text || "",
      icon: t.icon || "",
      logo: t.logo || "",
      banner_image: t.banner_image || "",
      email_template: t.email_template || "5",
      privacy: !!t.privacy,
      refund: !!t.refund,
      cancelation: !!t.cancelation,
      contact: !!t.contact,
      facebook: !!t.facebook,
      instagram: !!t.instagram,
      twitter: !!t.twitter,
      linkedin: !!t.linkedin,
      pinterest: !!t.pinterest,
      status: !!t.status,
    });
  };

  /* ── Switch tab ── */
  const handleTabSwitch = (tabKey: string) => {
    setActiveTab(tabKey);
    setMessage(null);
    const tpl = templates.find((t) => t.email_type === tabKey);
    if (tpl) {
      selectTemplate(tpl);
    } else {
      setEditTemplate(null);
    }
  };

  /* ── Switch category ── */
  const handleCategorySwitch = (cat: MailCategory) => {
    setCategory(cat);
    setActiveTab(TABS[cat][0].key);
    setEditTemplate(null);
    setMessage(null);
  };

  const handleSave = async () => {
    if (!editTemplate) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await apiFetch(`/api/email-templates/${editTemplate.id}`, {
        method: "PUT",
        body: JSON.stringify({
          ...formData,
          privacy: formData.privacy ? 1 : 0,
          refund: formData.refund ? 1 : 0,
          cancelation: formData.cancelation ? 1 : 0,
          contact: formData.contact ? 1 : 0,
          facebook: formData.facebook ? 1 : 0,
          instagram: formData.instagram ? 1 : 0,
          twitter: formData.twitter ? 1 : 0,
          linkedin: formData.linkedin ? 1 : 0,
          pinterest: formData.pinterest ? 1 : 0,
          status: formData.status ? 1 : 0,
        }),
      });
      if (res.success) {
        setMessage({ type: "success", text: "✅ Email template saved successfully!" });
        fetchTemplates();
      } else {
        setMessage({ type: "error", text: res.message || "Failed to save" });
      }
    } catch {
      setMessage({ type: "error", text: "Network error" });
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = (field: "icon" | "logo" | "banner_image", file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setFormData((prev) => ({ ...prev, [field]: e.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

  /* ── Status toggle ── */
  const handleToggleStatus = async () => {
    if (!editTemplate) return;
    const newStatus = formData.status ? 0 : 1;
    try {
      const res = await apiFetch(`/api/email-templates/${editTemplate.id}/toggle`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.success) {
        setFormData((p) => ({ ...p, status: !p.status }));
        setMessage({ type: "success", text: newStatus ? "✅ Email enabled" : "✅ Email disabled" });
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <DashboardShell
      role="admin"
      title="Super Admin"
      items={sidebarItems}
      accentColor="text-purple-300"
      accentBg="bg-gradient-to-b from-purple-900 to-purple-950"
      hoverBg="bg-white/10"
    >
      {/* ── Page Header (matches reference page-header) ── */}
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Email Templates</h1>
            <p className="text-sm text-gray-500">Configure email templates for all system notifications</p>
          </div>
        </div>

        {/* ── Category Selector (matches reference mail-route-selector) ── */}
        <select
          value={category}
          onChange={(e) => handleCategorySwitch(e.target.value as MailCategory)}
          className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400"
        >
          {CATEGORIES.map((cat) => (
            <option key={cat.key} value={cat.key}>
              {cat.label}
            </option>
          ))}
        </select>
      </div>

      {/* ── Status Toggle Bar (matches reference maintainance-mode-toggle-bar) ── */}
      {editTemplate && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-900">
              {category === "user"
                ? "Receive Mail On Customer Registration"
                : "Admin Notification Emails"}
            </span>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <button
            onClick={handleToggleStatus}
            className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
              formData.status ? "bg-purple-600" : "bg-gray-300"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                formData.status ? "translate-x-5" : ""
              }`}
            />
          </button>
        </div>
      )}

      {/* ── Message ── */}
      {message && (
        <div
          className={`mb-5 px-4 py-3 rounded-xl text-sm font-medium ${
            message.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {loading ? (
        <div className="text-center py-20">
          <svg className="animate-spin h-8 w-8 text-purple-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-gray-400">Loading templates...</p>
        </div>
      ) : (
        <>
          {/* ── Horizontal Tabs (matches reference user-email-template-setting-links) ── */}
          <div className="flex flex-wrap gap-2 mb-6 overflow-x-auto pb-2">
            {TABS[category].map((tab) => {
              const tpl = templates.find((t) => t.email_type === tab.key);
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => handleTabSwitch(tab.key)}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${
                    isActive
                      ? "bg-purple-600 text-white border-purple-600 shadow"
                      : "bg-white text-gray-600 border-gray-200 hover:border-purple-300 hover:text-purple-600"
                  }`}
                >
                  {tab.label}
                  {tpl?.status ? (
                    <span className="ml-1.5 inline-block w-1.5 h-1.5 bg-green-400 rounded-full" />
                  ) : (
                    <span className="ml-1.5 inline-block w-1.5 h-1.5 bg-gray-300 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>

          {/* ── Main Content: Left Preview + Right Editor (matches reference email-format-wrapper) ── */}
          {editTemplate ? (
            <div className="flex flex-col lg:flex-row gap-6">
              {/* ═══════════════════════════════════════════
                   LEFT SIDE: Live Email Preview
                   ═══════════════════════════════════════════ */}
              <div className="lg:w-[520px] shrink-0">
                <div className="bg-gray-200 rounded-2xl p-6">
                  <div className="max-w-[500px] mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
                    <EmailPreview
                      title={formData.title}
                      body={formData.body}
                      body2={formData.body_2}
                      footerText={formData.footer_text}
                      copyrightText={formData.copyright_text}
                      buttonName={formData.button_name}
                      buttonUrl={formData.button_url}
                      icon={formData.icon}
                      logo={formData.logo}
                      bannerImage={formData.banner_image}
                      templateFormat={formData.email_template}
                      privacy={formData.privacy}
                      refund={formData.refund}
                      cancelation={formData.cancelation}
                      contact={formData.contact}
                      facebook={formData.facebook}
                      instagram={formData.instagram}
                      twitter={formData.twitter}
                      linkedin={formData.linkedin}
                      pinterest={formData.pinterest}
                    />
                  </div>
                </div>
              </div>

              {/* ═══════════════════════════════════════════
                   RIGHT SIDE: Editor Form
                   ═══════════════════════════════════════════ */}
              <div className="flex-1 min-w-0 space-y-5">
                {/* ── Template Format Selector ── */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                  <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                    Email Format
                  </h4>
                  <select
                    value={formData.email_template}
                    onChange={(e) => setFormData((p) => ({ ...p, email_template: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 bg-white"
                  >
                    <option value="1">Template 1 – Logo, Title, Body, Banner, Button</option>
                    <option value="2">Template 2 – Logo, Title, Body, Button</option>
                    <option value="3">Template 3 – Title, Body, Button, Green Section</option>
                    <option value="4">Template 4 – Icon, Title, Body, Code, Button</option>
                    <option value="5">Template 5 – Icon, Title, Body, Link (Default)</option>
                    <option value="6">Template 6 – Icon, Title, Body, Transaction Table</option>
                    <option value="7">Template 7 – Logo, Title, Body, Banner (No Button)</option>
                    <option value="8">Template 8 – Logo, Title, Body, Banner, Button</option>
                    <option value="9">Template 9 – Title, Body, Green Section, Order Info</option>
                    <option value="10">Template 10 – Icon, Title, Body, Banner, Credentials</option>
                    <option value="11">Template 11 – Icon Centered, Title, Body, Button</option>
                  </select>
                </div>

                {/* ── Icon Upload (matches reference) ── */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                  <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                    Icon
                    <span className="text-xs text-gray-400 font-normal ml-1">(1:1 ratio recommended)</span>
                  </h4>
                  <div className="flex items-center gap-4">
                    {formData.icon && (
                      <img
                        src={formData.icon}
                        alt="Icon preview"
                        className="w-16 h-16 rounded-lg object-contain border border-gray-100"
                      />
                    )}
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleImageUpload("icon", f);
                        }}
                        className="block w-full text-xs text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 cursor-pointer"
                      />
                      {formData.icon && (
                        <button
                          onClick={() => setFormData((p) => ({ ...p, icon: "" }))}
                          className="text-xs text-red-500 mt-1 hover:underline"
                        >
                          Remove icon
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── Header Content ── */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                  <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                    </svg>
                    Header Content
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Main Title</label>
                      <input
                        type="text"
                        maxLength={45}
                        value={formData.title}
                        onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                        placeholder="e.g. Your registration was successful!"
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400"
                      />
                      <p className="text-xs text-gray-400 mt-1">Max 45 characters</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mail Body Message
                        <span className="text-gray-400 text-xs ml-2">(HTML supported, use {"{{variable}}"} placeholders)</span>
                      </label>
                      <textarea
                        value={formData.body}
                        onChange={(e) => setFormData((p) => ({ ...p, body: e.target.value }))}
                        rows={5}
                        placeholder={`Hi {{name}},\n\nThank you for registering with us!`}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 font-mono resize-y"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Body 2 <span className="text-gray-400 text-xs">(Optional, used in some formats)</span>
                      </label>
                      <textarea
                        value={formData.body_2}
                        onChange={(e) => setFormData((p) => ({ ...p, body_2: e.target.value }))}
                        rows={3}
                        placeholder="Additional content..."
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 font-mono resize-y"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Button Name</label>
                        <input
                          type="text"
                          maxLength={50}
                          value={formData.button_name}
                          onChange={(e) => setFormData((p) => ({ ...p, button_name: e.target.value }))}
                          placeholder="e.g. View Booking"
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Button URL</label>
                        <input
                          type="text"
                          value={formData.button_url}
                          onChange={(e) => setFormData((p) => ({ ...p, button_url: e.target.value }))}
                          placeholder="https://example.com"
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Footer Content (matches reference social-media-and-footer-section) ── */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                  <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    Footer Content
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Footer Text</label>
                      <input
                        type="text"
                        maxLength={75}
                        value={formData.footer_text}
                        onChange={(e) => setFormData((p) => ({ ...p, footer_text: e.target.value }))}
                        placeholder="Please contact us for any queries, we are always happy to help."
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400"
                      />
                    </div>

                    {/* Page Links checkboxes (matches reference) */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Page Links</label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { key: "privacy" as const, label: "Privacy Policy" },
                          { key: "refund" as const, label: "Refund Policy" },
                          { key: "cancelation" as const, label: "Cancelation Policy" },
                          { key: "contact" as const, label: "Contact Us" },
                        ].map((item) => (
                          <label key={item.key} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50">
                            <input
                              type="checkbox"
                              checked={formData[item.key]}
                              onChange={(e) => setFormData((p) => ({ ...p, [item.key]: e.target.checked }))}
                              className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                            />
                            <span className="text-xs text-gray-600">{item.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Social Media Links checkboxes (matches reference) */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Social Media Links</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { key: "facebook" as const, label: "Facebook" },
                          { key: "instagram" as const, label: "Instagram" },
                          { key: "twitter" as const, label: "Twitter" },
                          { key: "linkedin" as const, label: "LinkedIn" },
                          { key: "pinterest" as const, label: "Pinterest" },
                        ].map((item) => (
                          <label key={item.key} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50">
                            <input
                              type="checkbox"
                              checked={formData[item.key]}
                              onChange={(e) => setFormData((p) => ({ ...p, [item.key]: e.target.checked }))}
                              className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                            />
                            <span className="text-xs text-gray-600">{item.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Copyright Content</label>
                      <input
                        type="text"
                        maxLength={50}
                        value={formData.copyright_text}
                        onChange={(e) => setFormData((p) => ({ ...p, copyright_text: e.target.value }))}
                        placeholder="Copyright 2025 Hostel. All rights reserved."
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400"
                      />
                    </div>
                  </div>
                </div>

                {/* ── Variables Info ── */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <p className="text-sm font-medium text-amber-800 mb-1">Available Variables</p>
                  <p className="text-xs text-amber-600 leading-relaxed">
                    <code className="bg-amber-100 px-1 rounded">{"{{name}}"}</code>{" "}
                    <code className="bg-amber-100 px-1 rounded">{"{{email}}"}</code>{" "}
                    <code className="bg-amber-100 px-1 rounded">{"{{otp}}"}</code>{" "}
                    <code className="bg-amber-100 px-1 rounded">{"{{room_name}}"}</code>{" "}
                    <code className="bg-amber-100 px-1 rounded">{"{{check_in}}"}</code>{" "}
                    <code className="bg-amber-100 px-1 rounded">{"{{check_out}}"}</code>{" "}
                    <code className="bg-amber-100 px-1 rounded">{"{{status}}"}</code>{" "}
                    <code className="bg-amber-100 px-1 rounded">{"{{amount}}"}</code>{" "}
                    <code className="bg-amber-100 px-1 rounded">{"{{phone}}"}</code>{" "}
                    <code className="bg-amber-100 px-1 rounded">{"{{hostel_name}}"}</code>{" "}
                    <code className="bg-amber-100 px-1 rounded">{"{{customer_name}}"}</code>
                  </p>
                </div>

                {/* ── Action Buttons ── */}
                <div className="flex justify-end gap-3 pt-2 pb-4">
                  <button
                    onClick={() => editTemplate && selectTemplate(editTemplate)}
                    className="px-6 py-2.5 bg-white text-gray-600 border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Reset
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-8 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-purple-600/20 transition-colors"
                  >
                    {saving ? (
                      <>
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Saving...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Save Template
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
              <svg className="w-16 h-16 text-gray-200 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <h3 className="text-lg font-bold text-gray-400">Select a Template</h3>
              <p className="text-sm text-gray-300 mt-1">Click a tab above to start editing</p>
            </div>
          )}
        </>
      )}
    </DashboardShell>
  );
}
