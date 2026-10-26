"use client";

import Link from "next/link";
import React, { useState } from "react";
import Image from "next/image";

import { useLanguage } from "@/contexts/LanguageContext";
import { TRANSLATIONS } from "@/data/locales";

import { IMAGES, IMAGES_RESERVADAS } from "@/data/anatomy";

// A galeria também mostra as imagens reservadas (ainda fora do jogo), como as do gato.
const GALERIA = [...IMAGES, ...IMAGES_RESERVADAS];
const GALLERY_IMAGES = GALERIA.map(img => img.src);

export default function Gallery() {
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [showNames, setShowNames] = useState(false);
  const [hoveredMarker, setHoveredMarker] = useState<number | null>(null);
  const [pinnedMarker, setPinnedMarker] = useState<number | null>(null);
  const { language } = useLanguage();
  const t = TRANSLATIONS[language].gallery;

  const activeMarker = hoveredMarker !== null ? hoveredMarker : pinnedMarker;

  function handleNext() {
    if (viewerIndex !== null) {
      setViewerIndex((viewerIndex + 1) % GALLERY_IMAGES.length);
      setHoveredMarker(null);
      setPinnedMarker(null);
    }
  }

  function handlePrev() {
    if (viewerIndex !== null) {
      setViewerIndex((viewerIndex - 1 + GALLERY_IMAGES.length) % GALLERY_IMAGES.length);
      setHoveredMarker(null);
      setPinnedMarker(null);
    }
  }

  return (
    <div
      className="size-full flex flex-col overflow-hidden min-h-screen"
      style={{ background: "#C8B498", fontFamily: "'Nunito', sans-serif" }}
    >
      <style>{`
        @keyframes gallery-pulse {
          0% { box-shadow: 0 0 0 0 rgba(232, 194, 82, 0.9), 0 4px 12px rgba(0,0,0,0.6); }
          70% { box-shadow: 0 0 0 14px rgba(232, 194, 82, 0), 0 4px 12px rgba(0,0,0,0.6); }
          100% { box-shadow: 0 0 0 0 rgba(232, 194, 82, 0), 0 4px 12px rgba(0,0,0,0.6); }
        }
      `}</style>

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
              onClick={() => {
                setViewerIndex(idx);
                setHoveredMarker(null);
                setPinnedMarker(null);
              }}
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
          background: "rgba(15, 28, 21, 0.94)",
          zIndex: 100,
          display: "flex",
          flexDirection: "column",
        }}>
          {/* Viewer Top Bar */}
          <div style={{
            height: 64,
            padding: "0 32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid rgba(141,201,160,0.15)",
            background: "rgba(28, 53, 40, 0.8)",
            flexShrink: 0,
            zIndex: 110,
          }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "1.1rem", color: "#FFF", lineHeight: 1.1 }}>
                {GALERIA[viewerIndex].titulo[language]}
              </span>
              <span style={{ fontSize: "0.75rem", color: "#8DC9A0", fontStyle: "italic" }}>
                {GALERIA[viewerIndex].especie} · {GALERIA[viewerIndex].markers.length} {t.structures.toLowerCase()}
              </span>
            </div>

            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              <button 
                onClick={() => setShowNames(!showNames)}
                style={{
                  background: showNames ? "#E8C252" : "rgba(255,255,255,0.12)",
                  border: showNames ? "1.5px solid #E8C252" : "1.5px solid rgba(255,255,255,0.2)",
                  color: showNames ? "#1C3528" : "#FFF",
                  fontSize: "0.88rem",
                  fontWeight: 800,
                  padding: "8px 18px",
                  borderRadius: 999,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {showNames ? t.hideNames : t.showNames}
              </button>
              <button 
                onClick={() => {
                  setViewerIndex(null);
                  setShowNames(false);
                  setHoveredMarker(null);
                  setPinnedMarker(null);
                }}
                aria-label="Fechar"
                style={{
                  background: "rgba(255,255,255,0.1)",
                  border: "none",
                  color: "#FFF",
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  fontSize: "1.5rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  lineHeight: 1,
                }}
              >
                &times;
              </button>
            </div>
          </div>
          
          {/* Viewer Main Area: Image + Optional Sidebar */}
          <div style={{ flex: 1, display: "flex", overflow: "hidden", position: "relative" }}>
            {/* Left/Center: Image Canvas */}
            <div
              onClick={() => setPinnedMarker(null)}
              style={{
                flex: 1,
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "24px 64px",
                overflow: "hidden",
              }}
            >
              <button 
                onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                style={{
                  position: "absolute",
                  left: 20,
                  background: "rgba(28, 53, 40, 0.85)",
                  border: "1px solid rgba(141,201,160,0.3)",
                  color: "#FFF",
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  fontSize: "2rem",
                  cursor: "pointer",
                  zIndex: 110,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  lineHeight: 1,
                }}
              >
                &#8249;
              </button>

              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  position: "relative",
                  display: "inline-block",
                  maxWidth: showNames ? "calc(90vw - 360px)" : "85vw",
                  maxHeight: "80vh",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={GALERIA[viewerIndex].src}
                  alt={GALERIA[viewerIndex].titulo[language]}
                  style={{
                    display: "block",
                    maxWidth: "100%",
                    maxHeight: "80vh",
                    width: "auto",
                    height: "auto",
                    borderRadius: 8,
                    boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
                  }}
                />
                {/* Markers Overlay */}
                {GALERIA[viewerIndex].markers.map((marker, i) => {
                  const isActive = activeMarker === i;
                  const isDimmed = activeMarker !== null && !isActive;
                  const isRightSide = marker.x > 0.65;
                  const isTopEdge = marker.y < 0.12;

                  return (
                    <div
                      key={i}
                      onMouseEnter={() => setHoveredMarker(i)}
                      onMouseLeave={() => setHoveredMarker(null)}
                      onClick={(e) => {
                        e.stopPropagation();
                        setPinnedMarker(pinnedMarker === i ? null : i);
                      }}
                      style={{
                        position: "absolute",
                        left: `${marker.x * 100}%`,
                        top: `${marker.y * 100}%`,
                        width: showNames || isActive ? 24 : 16,
                        height: showNames || isActive ? 24 : 16,
                        transform: `translate(-50%, -50%) scale(${isActive ? 1.25 : 1})`,
                        background: isActive ? "#E8C252" : showNames ? "#1C3528" : "#E8C252",
                        color: isActive ? "#1C3528" : "#FFF",
                        border: isActive ? "2.5px solid #FFF" : showNames ? "2px solid #E8C252" : "2px solid #1C3528",
                        borderRadius: "50%",
                        cursor: "pointer",
                        boxShadow: isActive ? "0 0 0 6px rgba(232,194,82,0.45), 0 4px 12px rgba(0,0,0,0.6)" : "0 2px 6px rgba(0,0,0,0.55)",
                        animation: isActive ? "gallery-pulse 1.4s infinite" : "none",
                        zIndex: isActive ? 50 : 20,
                        opacity: isDimmed ? 0.45 : 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "11px",
                        fontWeight: 800,
                        fontFamily: "'Nunito', sans-serif",
                        transition: "all 0.15s ease",
                        userSelect: "none",
                      }}
                    >
                      {(showNames || isActive) && (i + 1)}

                      {/* Floating high-contrast badge only for the active/hovered marker */}
                      {isActive && (
                        <div 
                          style={{
                            position: "absolute",
                            ...(isRightSide ? { right: 30 } : { left: 30 }),
                            ...(isTopEdge ? { top: 0 } : { top: "50%", transform: "translateY(-50%)" }),
                            background: "#1C3528",
                            color: "#FFF",
                            padding: "6px 12px",
                            borderRadius: 6,
                            border: "1.5px solid #E8C252",
                            fontSize: "13px",
                            fontWeight: 800,
                            fontFamily: "'Nunito', sans-serif",
                            whiteSpace: "nowrap",
                            pointerEvents: "none",
                            boxShadow: "0 6px 18px rgba(0,0,0,0.65)",
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            zIndex: 60,
                          }}
                        >
                          <span style={{
                            background: "#E8C252",
                            color: "#1C3528",
                            borderRadius: 4,
                            padding: "1px 6px",
                            fontSize: "11px",
                            fontWeight: 900,
                          }}>
                            #{i + 1}
                          </span>
                          <span>{language === "pt" ? marker.name.pt : marker.name.es}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <button 
                onClick={(e) => { e.stopPropagation(); handleNext(); }}
                style={{
                  position: "absolute",
                  right: 20,
                  background: "rgba(28, 53, 40, 0.85)",
                  border: "1px solid rgba(141,201,160,0.3)",
                  color: "#FFF",
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  fontSize: "2rem",
                  cursor: "pointer",
                  zIndex: 110,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  lineHeight: 1,
                }}
              >
                &#8250;
              </button>
            </div>

            {/* Right: Interactive Structures List when showNames is enabled */}
            {showNames && (
              <aside
                style={{
                  width: 340,
                  background: "#1C3528",
                  borderLeft: "1px solid rgba(141,201,160,0.18)",
                  display: "flex",
                  flexDirection: "column",
                  flexShrink: 0,
                  zIndex: 105,
                }}
              >
                <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(141,201,160,0.15)" }}>
                  <div style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "1.05rem", color: "#E8C252" }}>
                    {t.structures} ({GALERIA[viewerIndex].markers.length})
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#8DC9A0", marginTop: 2 }}>
                    {t.hint}
                  </div>
                </div>

                <div style={{ flex: 1, overflowY: "auto", padding: "12px", display: "flex", flexDirection: "column", gap: 6 }}>
                  {GALERIA[viewerIndex].markers.map((marker, i) => {
                    const isActive = activeMarker === i;
                    const isPinned = pinnedMarker === i;
                    return (
                      <button
                        key={i}
                        onMouseEnter={() => setHoveredMarker(i)}
                        onMouseLeave={() => setHoveredMarker(null)}
                        onClick={() => setPinnedMarker(isPinned ? null : i)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          width: "100%",
                          textAlign: "left",
                          padding: "9px 12px",
                          borderRadius: 8,
                          border: isActive ? "1.5px solid #E8C252" : "1.5px solid transparent",
                          background: isActive ? "rgba(232, 194, 82, 0.16)" : "rgba(255, 255, 255, 0.05)",
                          color: "#FFF",
                          cursor: "pointer",
                          transition: "all 0.12s ease",
                          fontFamily: "'Nunito', sans-serif",
                        }}
                      >
                        <span
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: "50%",
                            background: isActive ? "#E8C252" : "rgba(141,201,160,0.18)",
                            color: isActive ? "#1C3528" : "#E8C252",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "0.75rem",
                            fontWeight: 800,
                            flexShrink: 0,
                          }}
                        >
                          {i + 1}
                        </span>
                        <span style={{
                          fontSize: "0.86rem",
                          fontWeight: isActive ? 800 : 600,
                          color: isActive ? "#E8C252" : "#F5EFE6",
                          lineHeight: 1.25,
                        }}>
                          {language === "pt" ? marker.name.pt : marker.name.es}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </aside>
            )}
          </div>
        </div>
      )}
    </div>
  );
}