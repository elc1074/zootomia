"use client";

import Link from "next/link";
import React from "react";

export default function About() {
  return (
    <div
      className="size-full flex flex-col overflow-hidden min-h-screen items-center justify-center"
      style={{ background: "#C8B498", fontFamily: "'Nunito', sans-serif" }}
    >
      <header
        className="flex items-center gap-6 px-8 py-4 shrink-0 w-full"
        style={{
          background: "#1C3528",
          borderBottom: "1px solid rgba(0,0,0,0.2)",
          position: "absolute",
          top: 0
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
          Voltar
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
            Sobre
          </h2>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center mt-20">
        <p style={{ fontSize: "1.2rem", fontWeight: 700, color: "#5C3D20" }}>
          A ser definido
        </p>
      </main>
    </div>
  );
}

