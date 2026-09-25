"use client";

import Link from "next/link";
import React, { useState } from "react";
import Image from "next/image";

import { useLanguage } from "@/contexts/LanguageContext";
import { TRANSLATIONS } from "@/data/locales";

import { IMAGES } from "@/data/anatomy";

const GALLERY_IMAGES = IMAGES.map(img => img.src);

export default function Gallery() {
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [showNames, setShowNames] = useState(false);
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
          <div style={{ position: "absolute", top: 20, right: 30, zIndex: 110, display: "flex", gap: 16, alignItems: "center" }}>
            <button 
              onClick={() => setShowNames(!showNames)}
              style={{ background: showNames ? "#8DC9A0" : "rgba(255,255,255,0.1)", border: "none", color: showNames ? "#1C3528" : "#FFF", fontSize: "0.9rem", fontWeight: 700, padding: "8px 16px", borderRadius: 999, cursor: "pointer" }}
            >
              {showNames ? "Esconder Nomes" : "Mostrar Nomes"}
            </button>
            <button 
              onClick={() => {
                setViewerIndex(null);
                setShowNames(false);
              }}
              style={{ background: "none", border: "none", color: "#FFF", fontSize: "2rem", cursor: "pointer", lineHeight: 1 }}
            >
              &times;
            </button>
          </div>
          
          <button 
            onClick={handlePrev}
            style={{ position: "absolute", left: 30, background: "none", border: "none", color: "#FFF", fontSize: "3rem", cursor: "pointer", zIndex: 110 }}
          >
            &#8249;
          </button>
          
          {/* A caixa tem exatamente a proporção da imagem, para os marcadores (em %) caírem no lugar certo */}
          <div
            style={{
              position: "relative",
              width: `min(90vw, calc(85vh * ${IMAGES[viewerIndex].width / IMAGES[viewerIndex].height}))`,
              aspectRatio: `${IMAGES[viewerIndex].width} / ${IMAGES[viewerIndex].height}`,
            }}
          >
            <img 
              src={IMAGES[viewerIndex].src}
              alt="Imagem Ampliada"
              style={{ display: "block", width: "100%", height: "100%" }}
            />
            {/* Markers Overlay */}
            {IMAGES[viewerIndex].markers.map((marker, i) => (
              <div
                key={i}
                className="group"
                style={{
                  position: "absolute",
                  left: `${marker.x * 100}%`,
                  top: `${marker.y * 100}%`,
                  width: 14,
                  height: 14,
                  transform: "translate(-50%, -50%)",
                  background: "#E8C252",
                  border: "2px solid #1C3528",
                  borderRadius: "50%",
                  cursor: "pointer",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.5)",
                  zIndex: 20
                }}
              >
                {/* Tooltip on hover or permanently visible if showNames is true */}
                <div 
                  className={showNames ? "" : "hidden group-hover:block"}
                  style={{
                    position: "absolute",
                    left: 20,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "rgba(28, 53, 40, 0.85)",
                    color: "#FFF",
                    padding: "4px 8px",
                    borderRadius: 4,
                    fontSize: 12,
                    fontWeight: 700,
                    fontFamily: "'Nunito', sans-serif",
                    whiteSpace: "nowrap",
                    pointerEvents: "none"
                  }}
                >
                  {language === "pt" ? marker.name.pt : marker.name.es}
                </div>
              </div>
            ))}
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