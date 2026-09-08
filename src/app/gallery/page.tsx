"use client";

import Link from "next/link";
import React from "react";

export default function Gallery() {
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
            Galeria Anatômica
          </h2>
          <p style={{ fontSize: "0.65rem", color: "rgba(141,201,160,0.5)", fontWeight: 600, marginTop: 1, letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Modo Observação
          </p>
        </div>
      </header>

      {/* Cards area */}
      <main className="flex-1 flex gap-0 overflow-hidden" style={{ minHeight: 0 }}>
        <AnatomyCard
          title="Cachorro"
          subtitle="Canis lupus familiaris"
          accentColor="#3A9E6F"
          dimColor="#2C7A54"
          illustration={<DogSkeletonIllustration />}
          stats={[
            { label: "Ossos", value: "319" },
            { label: "Órgãos", value: "78" },
            { label: "Músculos", value: "700+" },
          ]}
        />

        {/* Center divider */}
        <div style={{ width: 1, background: "rgba(100,70,40,0.22)", flexShrink: 0 }} />

        <AnatomyCard
          title="Gato"
          subtitle="Felis catus"
          accentColor="#C4845A"
          dimColor="#8B5A35"
          illustration={<CatDetailIllustration />}
          stats={[
            { label: "Ossos", value: "244" },
            { label: "Órgãos", value: "75" },
            { label: "Músculos", value: "500+" },
          ]}
        />
      </main>

      {/* Status bar */}
      <div
        className="flex items-center gap-3 px-8 py-2 shrink-0"
        style={{ background: "rgba(100,70,40,0.12)", borderTop: "1px solid rgba(100,70,40,0.2)" }}
      >
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#3A9E6F" }} />
        <p style={{ fontSize: "0.68rem", color: "rgba(92,61,32,0.6)", fontWeight: 600 }}>
          Passe o mouse sobre os modelos para explorar as estruturas anatômicas
        </p>
      </div>
    </div>
  );
}

interface AnatomyCardProps {
  title: string;
  subtitle: string;
  accentColor: string;
  dimColor: string;
  illustration: React.ReactNode;
  stats: { label: string; value: string }[];
}

function AnatomyCard({ title, subtitle, accentColor, dimColor, illustration, stats }: AnatomyCardProps) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ minHeight: 0 }}>
      {/* Card header strip */}
      <div
        className="flex items-center justify-between px-8 py-4 shrink-0"
        style={{
          borderBottom: `2px solid ${accentColor}30`,
          background: "rgba(180,140,100,0.15)",
        }}
      >
        <div>
          <h3
            style={{
              fontFamily: "'Baloo 2', sans-serif",
              fontWeight: 800,
              fontSize: "1.5rem",
              color: "#1A2E22",
              lineHeight: 1,
            }}
          >
            {title}
          </h3>
          <p style={{ fontSize: "0.72rem", color: "#5C3D20", fontStyle: "italic", marginTop: 2, fontWeight: 600 }}>
            {subtitle}
          </p>
        </div>

        {/* Stats inline */}
        <div className="flex items-center gap-5">
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col items-center">
              <span
                style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "1.1rem", color: accentColor }}
              >
                {s.value}
              </span>
              <span style={{ fontSize: "0.6rem", color: "#5C3D20", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Illustration */}
      <div
        className="flex-1 flex items-center justify-center"
        style={{
          background: `radial-gradient(ellipse at center, ${accentColor}0E 0%, transparent 70%)`,
          padding: "24px 32px",
          minHeight: 0,
        }}
      >
        {illustration}
      </div>
    </div>
  );
}

function DogSkeletonIllustration() {
  return (
    <svg viewBox="0 0 420 310" width="100%" height="100%" fill="none" style={{ maxHeight: 300 }}>
      <ellipse cx="210" cy="200" rx="155" ry="85" fill="rgba(58,158,111,0.06)" />
      <path d="M350 180 Q396 158 406 124 Q402 100 384 112 Q394 128 382 148 Q360 170 338 178" stroke="#3A9E6F" strokeWidth="7" strokeLinecap="round" fill="none" />
      <path d="M96 162 Q172 174 252 171 Q300 169 338 164" stroke="#2F5C44" strokeWidth="6.5" strokeLinecap="round" fill="none" />
      {[0,1,2,3,4,5,6].map((i) => (
        <g key={i}>
          <path d={`M${110+i*30} 170 Q${106+i*30} 195 ${112+i*30} 210`} stroke="#3A9E6F" strokeWidth="3.5" strokeLinecap="round" fill="none" />
          <path d={`M${110+i*30} 170 Q${116+i*30} 191 ${108+i*30} 206`} stroke="#3A9E6F" strokeWidth="3.5" strokeLinecap="round" fill="none" />
        </g>
      ))}
      <path d="M112 210 Q210 220 326 210" stroke="#3A9E6F" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <ellipse cx="330" cy="183" rx="24" ry="17" stroke="#3A9E6F" strokeWidth="5" fill="rgba(141,201,160,0.1)" />
      <ellipse cx="100" cy="175" rx="16" ry="10" stroke="#2F5C44" strokeWidth="4" fill="rgba(141,201,160,0.08)" transform="rotate(-10 100 175)" />
      <line x1="92" y1="184" x2="74" y2="222" stroke="#3A9E6F" strokeWidth="6" strokeLinecap="round" />
      <line x1="74" y1="222" x2="62" y2="252" stroke="#3A9E6F" strokeWidth="5" strokeLinecap="round" />
      <path d="M54 252 Q62 262 76 252" stroke="#3A9E6F" strokeWidth="4" strokeLinecap="round" fill="none" />
      <line x1="108" y1="184" x2="128" y2="222" stroke="#3A9E6F" strokeWidth="6" strokeLinecap="round" />
      <line x1="128" y1="222" x2="140" y2="252" stroke="#3A9E6F" strokeWidth="5" strokeLinecap="round" />
      <path d="M132 252 Q140 262 154 252" stroke="#3A9E6F" strokeWidth="4" strokeLinecap="round" fill="none" />
      <circle cx="322" cy="192" r="8" fill="rgba(141,201,160,0.15)" stroke="#3A9E6F" strokeWidth="4" />
      <line x1="316" y1="198" x2="290" y2="236" stroke="#3A9E6F" strokeWidth="6" strokeLinecap="round" />
      <line x1="290" y1="236" x2="274" y2="264" stroke="#3A9E6F" strokeWidth="5" strokeLinecap="round" />
      <path d="M266 264 Q274 272 286 264" stroke="#3A9E6F" strokeWidth="4" strokeLinecap="round" fill="none" />
      <line x1="330" y1="198" x2="354" y2="234" stroke="#3A9E6F" strokeWidth="6" strokeLinecap="round" />
      <line x1="354" y1="234" x2="368" y2="262" stroke="#3A9E6F" strokeWidth="5" strokeLinecap="round" />
      <path d="M360 262 Q368 270 380 262" stroke="#3A9E6F" strokeWidth="4" strokeLinecap="round" fill="none" />
      <path d="M92 158 Q84 132 82 108" stroke="#2F5C44" strokeWidth="7" strokeLinecap="round" fill="none" />
      <ellipse cx="76" cy="86" rx="38" ry="30" fill="rgba(232,194,82,0.06)" stroke="#2F5C44" strokeWidth="5" />
      <path d="M38 92 Q24 96 22 110 Q26 121 40 116 Q46 103 46 94" stroke="#2F5C44" strokeWidth="4" strokeLinecap="round" fill="none" />
      <circle cx="57" cy="78" r="10" stroke="#3A9E6F" strokeWidth="4" fill="rgba(141,201,160,0.07)" />
      <circle cx="57" cy="78" r="4" fill="rgba(30,59,46,0.14)" />
      <path d="M65 56 L74 38 L84 56" stroke="#2F5C44" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M82 54 L92 36 L102 54" stroke="#2F5C44" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M38 104 Q32 118 34 130 Q40 136 52 132 Q58 124 48 113" stroke="#2F5C44" strokeWidth="4" strokeLinecap="round" fill="none" />
      {[0,1,2,3,4].map((i) => (
        <circle key={i} cx={115+i*45} cy={169} r={5} fill="rgba(232,194,82,0.5)" stroke="#E8C252" strokeWidth="2" />
      ))}
      <line x1="76" y1="56" x2="54" y2="28" stroke="#E8C252" strokeWidth="1.5" strokeDasharray="4 3" />
      <text x="16" y="24" fill="#3A9E6F" fontSize="11" fontFamily="'Nunito', sans-serif" fontWeight="700">Crânio</text>
      <line x1="200" y1="168" x2="200" y2="138" stroke="#E8C252" strokeWidth="1.5" strokeDasharray="4 3" />
      <text x="174" y="132" fill="#3A9E6F" fontSize="11" fontFamily="'Nunito', sans-serif" fontWeight="700">Coluna</text>
      <line x1="330" y1="170" x2="362" y2="142" stroke="#E8C252" strokeWidth="1.5" strokeDasharray="4 3" />
      <text x="365" y="138" fill="#3A9E6F" fontSize="11" fontFamily="'Nunito', sans-serif" fontWeight="700">Pelve</text>
    </svg>
  );
}

function CatDetailIllustration() {
  return (
    <svg viewBox="0 0 420 310" width="100%" height="100%" fill="none" style={{ maxHeight: 300 }}>
      <ellipse cx="210" cy="200" rx="155" ry="85" fill="rgba(232,194,82,0.06)" />
      <path d="M344 180 Q392 158 404 118 Q400 96 382 108 Q392 124 380 146 Q358 168 332 178" stroke="#C4845A" strokeWidth="7" strokeLinecap="round" fill="none" />
      <path d="M102 158 Q178 170 256 167 Q304 165 334 160" stroke="#8B5A35" strokeWidth="6.5" strokeLinecap="round" fill="none" />
      {[0,1,2,3,4,5].map((i) => (
        <g key={i}>
          <path d={`M${118+i*34} 166 Q${114+i*34} 190 ${120+i*34} 206`} stroke="#C4845A" strokeWidth="3.5" strokeLinecap="round" fill="none" />
          <path d={`M${118+i*34} 166 Q${124+i*34} 186 ${116+i*34} 202`} stroke="#C4845A" strokeWidth="3.5" strokeLinecap="round" fill="none" />
        </g>
      ))}
      <path d="M120 206 Q210 216 322 206" stroke="#C4845A" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <ellipse cx="322" cy="178" rx="22" ry="16" stroke="#C4845A" strokeWidth="5" fill="rgba(196,132,90,0.1)" />
      <ellipse cx="106" cy="170" rx="15" ry="10" stroke="#8B5A35" strokeWidth="4" fill="rgba(196,132,90,0.08)" transform="rotate(-12 106 170)" />
      <line x1="98" y1="179" x2="80" y2="216" stroke="#C4845A" strokeWidth="6" strokeLinecap="round" />
      <line x1="80" y1="216" x2="68" y2="246" stroke="#C4845A" strokeWidth="5" strokeLinecap="round" />
      <path d="M60 246 Q68 256 82 246" stroke="#C4845A" strokeWidth="4" strokeLinecap="round" fill="none" />
      <line x1="114" y1="179" x2="134" y2="216" stroke="#C4845A" strokeWidth="6" strokeLinecap="round" />
      <line x1="134" y1="216" x2="146" y2="246" stroke="#C4845A" strokeWidth="5" strokeLinecap="round" />
      <path d="M138 246 Q146 256 160 246" stroke="#C4845A" strokeWidth="4" strokeLinecap="round" fill="none" />
      <circle cx="314" cy="186" r="7.5" fill="rgba(196,132,90,0.15)" stroke="#C4845A" strokeWidth="4" />
      <line x1="308" y1="192" x2="282" y2="228" stroke="#C4845A" strokeWidth="6" strokeLinecap="round" />
      <line x1="282" y1="228" x2="264" y2="256" stroke="#C4845A" strokeWidth="5" strokeLinecap="round" />
      <path d="M256 256 Q264 264 278 256" stroke="#C4845A" strokeWidth="4" strokeLinecap="round" fill="none" />
      <line x1="322" y1="192" x2="346" y2="226" stroke="#C4845A" strokeWidth="6" strokeLinecap="round" />
      <line x1="346" y1="226" x2="362" y2="254" stroke="#C4845A" strokeWidth="5" strokeLinecap="round" />
      <path d="M354 254 Q362 262 376 254" stroke="#C4845A" strokeWidth="4" strokeLinecap="round" fill="none" />
      <path d="M98 154 Q90 128 88 104" stroke="#8B5A35" strokeWidth="7" strokeLinecap="round" fill="none" />
      <ellipse cx="82" cy="82" rx="40" ry="32" fill="rgba(232,194,82,0.06)" stroke="#8B5A35" strokeWidth="5" />
      <path d="M42 90 Q28 94 26 108 Q30 118 44 114 Q50 100 50 92" stroke="#8B5A35" strokeWidth="4" strokeLinecap="round" fill="none" />
      <circle cx="62" cy="74" r="11" stroke="#C4845A" strokeWidth="4" fill="rgba(196,132,90,0.07)" />
      <circle cx="62" cy="74" r="4.5" fill="rgba(60,30,10,0.14)" />
      <path d="M70 52 L80 34 L92 52" stroke="#8B5A35" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M90 50 L102 32 L112 50" stroke="#8B5A35" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M42 102 Q36 116 38 128 Q44 134 56 130 Q62 122 52 112" stroke="#8B5A35" strokeWidth="4" strokeLinecap="round" fill="none" />
      {[0,1,2,3,4].map((i) => (
        <circle key={i} cx={122+i*42} cy={165} r={5} fill="rgba(232,194,82,0.5)" stroke="#E8C252" strokeWidth="2" />
      ))}
      <line x1="82" y1="52" x2="60" y2="26" stroke="#E8C252" strokeWidth="1.5" strokeDasharray="4 3" />
      <text x="22" y="22" fill="#C4845A" fontSize="11" fontFamily="'Nunito', sans-serif" fontWeight="700">Crânio</text>
      <line x1="206" y1="164" x2="206" y2="134" stroke="#E8C252" strokeWidth="1.5" strokeDasharray="4 3" />
      <text x="180" y="128" fill="#C4845A" fontSize="11" fontFamily="'Nunito', sans-serif" fontWeight="700">Coluna</text>
      <line x1="322" y1="164" x2="354" y2="138" stroke="#E8C252" strokeWidth="1.5" strokeDasharray="4 3" />
      <text x="357" y="134" fill="#C4845A" fontSize="11" fontFamily="'Nunito', sans-serif" fontWeight="700">Pelve</text>
    </svg>
  );
}