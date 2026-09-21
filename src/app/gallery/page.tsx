"use client";

import Link from "next/link";
import React, { useState } from "react";
import Image from "next/image";

import { useLanguage } from "@/contexts/LanguageContext";
import { TRANSLATIONS } from "@/data/locales";

const GALLERY_IMAGES = [
  "/images/dog_bone.svg",
  "/images/cat_bone.svg",
  "/images/dogsmenu.jpg"
];

export default function Gallery() {
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const { language } = useLanguage();
  const t = TRANSLATIONS[language].gallery;

  function handleNext() {
    if (viewerIndex !== null) {
      setViewerIndex((viewerIndex + 1) % GALLERY_IMAGES.length);
    }
  }

  function handlePrev() {
    if (viewerIndex !== null) {
      setViewerIndex((viewerIndex - 1 + GALLERY_IMAGES.length) % GALLERY_IMAGES.length);
    }
  }

  return (
    <div
      className="size-full flex flex-col overflow-hidden min-h-screen"
      style={{ background: "#C8B498", fontFamily: "'Nunito', sans-serif" }}
    >
      {/* Header */}
      <header
        className="flex items-center gap-6 px-8 py-4 shrink-0"
        style={{
          background: "#1C3528",
          borderBottom: "1px solid rgba(0,0,0,0.2)",
        }}
      >
        <Link
          href="/"
          className="flex items-center gap-2 px-4 py-2 font-semibold"
          style={{
            fontFamily: "'Nunito', sans-serif",
            fontWeight: 700,
            fontSize: "0.82rem",
            borderRadius: 5,
            background: "rgba(141,201,160,0.1)",
            color: "#8DC9A0",
            border: "1px solid rgba(141,201,160,0.2)",
            cursor: "pointer",
            textDecoration: "none"
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "rgba(141,201,160,0.18)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "rgba(141,201,160,0.1)";
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9.5 12L4.5 7l5-5" stroke="#8DC9A0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {t.back}
        </Link>

        <div style={{ width: 1, height: 24, background: "rgba(141,201,160,0.2)" }} />

        <div>
          <h2
            style={{
              fontFamily: "'Baloo 2', sans-serif",
              fontWeight: 800,
              fontSize: "1.25rem",
              color: "#FFFFFF",
              letterSpacing: "-0.02em",
              lineHeight: 1,
            }}
          >
            {t.title}
          </h2>
        </div>
      </header>

      {/* Grid */}
      <main className="flex-1 overflow-y-auto p-8">
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(3, 1fr)", 
          gap: "24px",
          maxWidth: "1200px",
          margin: "0 auto"
        }}>
          {GALLERY_IMAGES.map((src, idx) => (
            <div 
              key={idx}
              onClick={() => setViewerIndex(idx)}
              style={{
                aspectRatio: "1/1",
                position: "relative",
                background: "rgba(100,70,40,0.1)",
                borderRadius: "8px",
                overflow: "hidden",
                cursor: "pointer",
                border: "2px solid rgba(100,70,40,0.2)"
              }}
            >
              <Image 
                src={src}
                alt={`Imagem ${idx + 1}`}
                fill
                style={{ objectFit: "cover" }}
              />
            </div>
          ))}
        </div>
      </main>

      {/* Enlarged Viewer */}
      {viewerIndex !== null && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.9)",
          zIndex: 100,
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <button 
            onClick={() => setViewerIndex(null)}
            style={{ position: "absolute", top: 20, right: 30, background: "none", border: "none", color: "#FFF", fontSize: "2rem", cursor: "pointer", zIndex: 110 }}
          >
            &times;
          </button>
          
          <button 
            onClick={handlePrev}
            style={{ position: "absolute", left: 30, background: "none", border: "none", color: "#FFF", fontSize: "3rem", cursor: "pointer", zIndex: 110 }}
          >
            &#8249;
          </button>
          
          <div style={{ position: "relative", width: "80%", height: "80%" }}>
            <Image 
              src={GALLERY_IMAGES[viewerIndex]}
              alt="Imagem Ampliada"
              fill
              style={{ objectFit: "contain" }}
            />
          </div>
          
          <button 
            onClick={handleNext}
            style={{ position: "absolute", right: 30, background: "none", border: "none", color: "#FFF", fontSize: "3rem", cursor: "pointer", zIndex: 110 }}
          >
            &#8250;
          </button>
        </div>
      )}
    </div>
  );
}