"use client";

import Link from "next/link";
import React from "react";
import Image from "next/image"

import { useLanguage } from "@/contexts/LanguageContext";
import { TRANSLATIONS } from "@/data/locales";

const NAV_ITEMS = [
  { labelKey: "play", icon: <PlayIcon />, href: "/game", primary: true },
  { labelKey: "gallery", icon: <GalleryIcon />, href: "/gallery", primary: false },
  { labelKey: "about", icon: <InfoIcon />, href: "/about", primary: false },
  { labelKey: "exit", icon: <ExitIcon />, href: "#", primary: false },
] as const;

export default function Home() {
  const [showExitModal, setShowExitModal] = React.useState(false);
  const { language, setLanguage } = useLanguage();
  const t = TRANSLATIONS[language].menu;

  return (
    <div
      className="size-full flex overflow-hidden min-h-screen"
      style={{ background: "#C8B498", fontFamily: "'Nunito', sans-serif" }}
    >
      {/* ─── Sidebar ─── */}
      <aside
        className="flex flex-col py-10 shrink-0"
        style={{
          width: "340px",
          background: "linear-gradient(180deg, #1C3528 0%, #142A1E 100%)",
          boxShadow: "4px 0 32px rgba(0,0,0,0.28)",
          padding: "40px 32px",
        }}
      >
        {/* Brand */}
        <div className="flex flex-col gap-1 mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div
              style={{
                width: 44, height: 44,
                background: "#3A9E6F",
                borderRadius: 8,
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 4px 14px rgba(58,158,111,0.45)",
              }}
            >
              <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                <ellipse cx="13" cy="17" rx="8" ry="6" fill="#8DC9A0" opacity="0.7" />
                <circle cx="13" cy="9" r="5" fill="#8DC9A0" />
                <circle cx="8.5" cy="6.5" r="2.5" fill="#8DC9A0" />
                <circle cx="17.5" cy="6.5" r="2.5" fill="#8DC9A0" />
                <circle cx="11.2" cy="9" r="0.9" fill="#1C3528" />
                <circle cx="14.8" cy="9" r="0.9" fill="#1C3528" />
              </svg>
            </div>
            <h1
              style={{
                fontFamily: "'Baloo 2', sans-serif",
                fontWeight: 800,
                fontSize: "2.2rem",
                color: "#FFFFFF",
                letterSpacing: "-0.03em",
                lineHeight: 1,
              }}
            >
              Zoo<span style={{ color: "#E8C252" }}>tomia</span>
            </h1>
          </div>
          <p style={{ fontSize: "0.68rem", color: "rgba(141,201,160,0.55)", letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 700 }}>
            {t.subtitle}
          </p>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "rgba(141,201,160,0.15)", marginBottom: 32 }} />

        {/* Nav */}
        <nav className="flex flex-col gap-2 flex-1">
          {NAV_ITEMS.map((item) => {
            const isExit = item.labelKey === "exit";
            const label = t[item.labelKey];
            return (
            <Link
              key={item.labelKey}
              href={isExit ? "#" : item.href}
              onClick={(e) => {
                if (isExit) {
                  e.preventDefault();
                  setShowExitModal(true);
                }
              }}
              className="flex items-center gap-3 px-5 py-3 font-semibold w-full text-left"
              style={{
                fontFamily: "'Nunito', sans-serif",
                fontWeight: item.primary ? 700 : 600,
                fontSize: "1rem",
                borderRadius: 6,
                background: item.primary
                  ? "linear-gradient(135deg, #3A9E6F 0%, #2C7A54 100%)"
                  : "transparent",
                color: item.primary ? "#FFFFFF" : "rgba(141,201,160,0.75)",
                border: item.primary ? "none" : "1px solid rgba(141,201,160,0.1)",
                cursor: "pointer",
                boxShadow: item.primary ? "0 3px 14px rgba(58,158,111,0.35)" : "none",
                textDecoration: "none" // Garante que o Link não fique sublinhado
              }}
              onMouseEnter={(e) => {
                if (!item.primary) {
                  (e.currentTarget as HTMLElement).style.background = "rgba(141,201,160,0.1)";
                  (e.currentTarget as HTMLElement).style.color = "#FFFFFF";
                }
              }}
              onMouseLeave={(e) => {
                if (!item.primary) {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                  (e.currentTarget as HTMLElement).style.color = "rgba(141,201,160,0.75)";
                }
              }}
            >
              <span className="shrink-0" style={{ opacity: 0.85 }}>{item.icon}</span>
              {label}
            </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div style={{ height: 1, background: "rgba(141,201,160,0.12)", marginBottom: 20 }} />
        <p style={{ fontSize: "0.62rem", color: "rgba(141,201,160,0.3)", letterSpacing: "0.08em" }}>
          {t.footer}
        </p>
      </aside>

      {/* ─── Main image area ─── */}
      <main
        className="flex-1 flex flex-col overflow-hidden"
        style={{ background: "#C8B498" }}
      >
        {/* Top bar */}
        <div
          className="flex items-center justify-between px-8 py-4 shrink-0"
          style={{ borderBottom: "1px solid rgba(100,70,40,0.18)" }}
        >
          <div className="flex items-center gap-2">
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#3A9E6F" }} />
            <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#5C3D20", letterSpacing: "0.14em", textTransform: "uppercase" }}>
              {t.featuredModel}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span style={{ fontSize: "0.7rem", color: "rgba(92,61,32,0.55)", fontWeight: 600 }}>
              Canis lupus familiaris
            </span>
            {/* Language Toggle */}
            <div className="flex items-center gap-1" style={{ background: "rgba(100,70,40,0.1)", borderRadius: 16, padding: 4 }}>
              <button 
                onClick={() => setLanguage("pt")}
                style={{ 
                  background: language === "pt" ? "#3A9E6F" : "transparent",
                  color: language === "pt" ? "#FFF" : "rgba(92,61,32,0.6)",
                  border: "none", borderRadius: 12, padding: "2px 8px", fontSize: "0.65rem", fontWeight: 700, cursor: "pointer"
                }}
              >PT</button>
              <button 
                onClick={() => setLanguage("es")}
                style={{ 
                  background: language === "es" ? "#3A9E6F" : "transparent",
                  color: language === "es" ? "#FFF" : "rgba(92,61,32,0.6)",
                  border: "none", borderRadius: 12, padding: "2px 8px", fontSize: "0.65rem", fontWeight: 700, cursor: "pointer"
                }}
              >ES</button>
            </div>
          </div>
        </div>

        {/* Image placeholder */}
          <div className="flex-1 flex items-center justify-center p-10" style={{ minHeight: 0 }}>
          <div
            className="relative flex flex-col items-center justify-center overflow-hidden"
            style={{
              width: "100%",
              height: "100%",
              maxWidth: 640,
              maxHeight: 420,
              borderRadius: 8,
              boxShadow: "0 10px 30px rgba(0,0,0,0.15)"
            }}
          >
            <Image 
              src="/images/dogsmenu.jpg" 
              alt="Diferentes cachorros"
              fill
              style={{ objectFit: "cover" }}
              priority
            />
          </div>
        </div>
        {/* Bottom caption bar */}
        <div
          className="flex items-center gap-6 px-8 py-3 shrink-0"
          style={{ borderTop: "1px solid rgba(100,70,40,0.18)" }}
        >
          <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "rgba(92,61,32,0.45)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            {t.exploreText}
          </span>
          <div style={{ flex: 1, height: 1, background: "rgba(100,70,40,0.12)" }} />
          <span style={{ fontSize: "0.68rem", fontWeight: 600, color: "rgba(92,61,32,0.35)" }}>
            {t.selectOption}
          </span>
        </div>
      </main>

      {showExitModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <div style={{ background: "#C8B498", padding: 32, borderRadius: 8, boxShadow: "0 10px 30px rgba(0,0,0,0.5)", border: "1px solid rgba(100,70,40,0.2)" }}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#1A2E22", marginBottom: 24, fontFamily: "'Nunito', sans-serif" }}>
              {t.exitConfirm}
            </h2>
            <div className="flex gap-4 justify-end">
              <button 
                onClick={() => setShowExitModal(false)}
                style={{ padding: "8px 16px", borderRadius: 6, background: "rgba(100,70,40,0.15)", color: "#1A2E22", fontWeight: 700, border: "none", cursor: "pointer" }}
              >
                {t.cancel}
              </button>
              <button 
                onClick={() => {
                  // @ts-expect-error - Simulate exit mechanism for electron
                  if (typeof window !== "undefined" && window.electron) {
                    // @ts-expect-error - Simulate exit mechanism for electron
                    window.electron.exit();
                  } else {
                    window.close();
                  }
                }}
                style={{ padding: "8px 16px", borderRadius: 6, background: "#C4845A", color: "#FFF", fontWeight: 700, border: "none", cursor: "pointer" }}
              >
                {t.confirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PlayIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M5 3.5L12.5 8L5 12.5V3.5Z" fill="currentColor" />
    </svg>
  );
}
function GalleryIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="9" y="1.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="1.5" y="9" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="9" y="9" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
function InfoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" />
      <line x1="8" y1="7" x2="8" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="8" cy="4.5" r="1" fill="currentColor" />
    </svg>
  );
}
function ExitIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M6.5 2.5H3A1 1 0 002 3.5v9a1 1 0 001 1h3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M11 11.5L14.5 8 11 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="14.5" y1="8" x2="6.5" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}