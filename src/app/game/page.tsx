"use client";

import Link from "next/link";
import React, { useState } from "react";

const QUESTIONS = [
  { label: "Fêmur", pointer: { x: 265, y: 228 }, options: ["Fêmur", "Tíbia", "Úmero", "Rádio"], correct: 0 },
  { label: "Crânio", pointer: { x: 72, y: 82 }, options: ["Pelve", "Crânio", "Escápula", "Esterno"], correct: 1 },
  { label: "Pelve", pointer: { x: 310, y: 170 }, options: ["Fíbula", "Escápula", "Vértebra", "Pelve"], correct: 3 },
];

const VIEW_LABELS: Record<number, string> = { 0: "Vista Frontal", 1: "Vista Lateral Esq.", 2: "Vista Dorsal", 3: "Vista Lateral Dir." };

export default function Game() {
  const [score, setScore] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [textAnswer, setTextAnswer] = useState("");
  const [showOptions, setShowOptions] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [viewIndex, setViewIndex] = useState(0);

  function rotateView(dir: "up" | "down" | "left" | "right") {
    setViewIndex((v) => {
      if (dir === "left") return (v + 3) % 4;
      if (dir === "right") return (v + 1) % 4;
      if (dir === "up") return (v + 2) % 4;
      return v; 
    });
  }

  const question = QUESTIONS[questionIndex % QUESTIONS.length];

  function handleOptionSelect(idx: number) {
    if (selectedOption !== null) return;
    setSelectedOption(idx);
    const isCorrect = idx === question.correct;
    setFeedback(isCorrect ? "correct" : "wrong");
    if (isCorrect) setScore((s) => s + 10);
    setTimeout(() => {
      setSelectedOption(null);
      setFeedback(null);
      setShowOptions(false);
      setTextAnswer("");
      setQuestionIndex((i) => i + 1);
    }, 1100);
  }

  function handleTextSubmit(e: React.FormEvent) {
    e.preventDefault();
    const isCorrect = textAnswer.trim().toLowerCase() === question.label.toLowerCase();
    setFeedback(isCorrect ? "correct" : "wrong");
    if (isCorrect) setScore((s) => s + 10);
    setTimeout(() => {
      setFeedback(null);
      setTextAnswer("");
      setShowOptions(false);
      setQuestionIndex((i) => i + 1);
    }, 1100);
  }

  return (
    <div
      className="size-full flex flex-col overflow-hidden min-h-screen"
      style={{ background: "#C8B498", fontFamily: "'Nunito', sans-serif" }}
    >
      {/* ─── Scoreboard header ─── */}
      <header
        className="flex items-center justify-between px-8 py-0 shrink-0"
        style={{
          background: "#1C3528",
          height: 56,
          borderBottom: "1px solid rgba(0,0,0,0.25)",
        }}
      >
        <Link
          href="/"
          className="flex items-center gap-2 px-3 py-1.5"
          style={{
            fontFamily: "'Nunito', sans-serif",
            fontWeight: 700,
            fontSize: "0.78rem",
            borderRadius: 5,
            background: "rgba(141,201,160,0.1)",
            color: "#8DC9A0",
            border: "1px solid rgba(141,201,160,0.18)",
            cursor: "pointer",
            textDecoration: "none"
          }}
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M9 11.5L4 6.5l5-5" stroke="#8DC9A0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Menu
        </Link>

        {/* Score tiles */}
        <div className="flex items-center gap-1">
          <ScoreTile label="PONTUAÇÃO" value={score} color="#8DC9A0" large />
          <div style={{ width: 1, height: 32, background: "rgba(141,201,160,0.15)", margin: "0 8px" }} />
          <ScoreTile label="QUESTÃO" value={`${(questionIndex % QUESTIONS.length) + 1} / ${QUESTIONS.length}`} color="#E8C252" />
          <div style={{ width: 1, height: 32, background: "rgba(141,201,160,0.15)", margin: "0 8px" }} />
          <ScoreTile label="ANIMAL" value="Cachorro" color="#C4845A" />
        </div>

        {/* Feedback inline */}
        {feedback ? (
          <div
            className="flex items-center gap-2 px-4 py-1.5"
            style={{
              borderRadius: 5,
              background: feedback === "correct" ? "rgba(58,158,111,0.2)" : "rgba(180,60,40,0.2)",
              border: `1px solid ${feedback === "correct" ? "rgba(58,158,111,0.4)" : "rgba(180,60,40,0.4)"}`,
            }}
          >
            <span style={{ fontSize: "0.9rem" }}>{feedback === "correct" ? "✓" : "✗"}</span>
            <span style={{ fontSize: "0.78rem", fontWeight: 700, color: feedback === "correct" ? "#8DC9A0" : "#E09080" }}>
              {feedback === "correct" ? "Correto! +10 pts" : `Era: ${question.label}`}
            </span>
          </div>
        ) : (
          <div style={{ width: 140 }} />
        )}
      </header>

      {/* ─── Main: two-column layout ─── */}
      <div className="flex-1 flex overflow-hidden" style={{ minHeight: 0 }}>

        {/* Left: animal model */}
        <div
          className="flex flex-col overflow-hidden"
          style={{
            flex: "0 0 55%",
            borderRight: "1px solid rgba(100,70,40,0.22)",
            background: "#C0A888",
          }}
        >
          {/* Sub-header */}
          <div
            className="flex items-center justify-between px-6 py-3 shrink-0"
            style={{ borderBottom: "1px solid rgba(100,70,40,0.18)" }}
          >
            <div className="flex items-center gap-2">
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#E8C252" }} />
              <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#5C3D20", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                Identifique a estrutura
              </span>
            </div>
            <span style={{ fontSize: "0.68rem", color: "rgba(92,61,32,0.5)", fontWeight: 600, fontStyle: "italic" }}>
              Canis lupus familiaris
            </span>
          </div>

          {/* Model canvas */}
          <div
            className="flex-1 flex items-center justify-center relative"
            style={{
              minHeight: 0,
              background: "radial-gradient(ellipse at 50% 55%, rgba(141,201,160,0.08) 0%, transparent 65%)",
              padding: "16px",
            }}
          >
            <RotateArrow dir="up" onClick={() => rotateView("up")} style={{ position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)" }} />
            <RotateArrow dir="down" onClick={() => rotateView("down")} style={{ position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)" }} />
            <RotateArrow dir="left" onClick={() => rotateView("left")} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
            <RotateArrow dir="right" onClick={() => rotateView("right")} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)" }} />

            <div
              style={{
                width: "100%",
                maxWidth: 360,
                aspectRatio: "4/3",
                background: "rgba(160,120,80,0.14)",
                border: "2px dashed rgba(100,70,40,0.25)",
                borderRadius: 6,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                position: "relative",
              }}
            >
              <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.08 }} preserveAspectRatio="none">
                <line x1="0" y1="0" x2="100%" y2="100%" stroke="#5C3D20" strokeWidth="1" />
                <line x1="100%" y1="0" x2="0" y2="100%" stroke="#5C3D20" strokeWidth="1" />
              </svg>

              <div
                style={{
                  position: "absolute",
                  top: 10, right: 10,
                  background: "rgba(100,70,40,0.16)",
                  border: "1px solid rgba(100,70,40,0.24)",
                  borderRadius: 4,
                  padding: "3px 10px",
                  fontSize: "0.62rem",
                  fontWeight: 700,
                  color: "rgba(92,61,32,0.7)",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
              >
                {VIEW_LABELS[viewIndex]}
              </div>

              <svg width="44" height="44" viewBox="0 0 44 44" fill="none" style={{ opacity: 0.4 }}>
                <rect x="4" y="8" width="36" height="28" rx="3" stroke="#5C3D20" strokeWidth="2" />
                <circle cx="16" cy="20" r="5" stroke="#5C3D20" strokeWidth="2" />
                <path d="M4 30l10-10 7 7 6-6 13 13" stroke="#5C3D20" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p style={{ fontSize: "0.78rem", fontWeight: 700, color: "rgba(92,61,32,0.55)" }}>
                Modelo do Animal
              </p>
              <p style={{ fontSize: "0.65rem", color: "rgba(92,61,32,0.38)", fontWeight: 600 }}>
                Placeholder · Vista {viewIndex + 1} de 4
              </p>

              <div
                style={{
                  position: "absolute",
                  left: "58%",
                  top: "52%",
                  transform: "translate(-50%, -50%)",
                  pointerEvents: "none",
                }}
              >
                <div style={{
                  position: "absolute", inset: -9, borderRadius: "50%",
                  border: "2px solid rgba(232,194,82,0.55)",
                  animation: "ping 1.4s cubic-bezier(0,0,0.2,1) infinite",
                }} />
                <div style={{
                  width: 13, height: 13, borderRadius: "50%",
                  background: "#E8C252",
                  border: "2.5px solid rgba(255,255,255,0.7)",
                  boxShadow: "0 0 10px rgba(232,194,82,0.7)",
                }} />
              </div>
            </div>
          </div>
        </div>

        {/* Right: answers panel */}
        <div
          className="flex flex-col overflow-hidden"
          style={{
            flex: "0 0 45%",
            background: "#BEA882",
          }}
        >
          {/* Sub-header */}
          <div
            className="flex items-center px-6 py-3 shrink-0"
            style={{ borderBottom: "1px solid rgba(100,70,40,0.18)" }}
          >
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#3A9E6F", marginRight: 8 }} />
            <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#5C3D20", letterSpacing: "0.12em", textTransform: "uppercase" }}>
              Resposta
            </span>
          </div>

          {/* Answer content */}
          <div className="flex-1 flex flex-col p-6 gap-5 overflow-y-auto">
            {/* Text input */}
            <form onSubmit={handleTextSubmit} className="flex flex-col gap-3">
              <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "#5C3D20", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Digite o nome da estrutura
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={textAnswer}
                  onChange={(e) => setTextAnswer(e.target.value)}
                  placeholder="Ex: Fêmur, Crânio..."
                  style={{
                    flex: 1,
                    fontFamily: "'Nunito', sans-serif",
                    fontWeight: 600,
                    fontSize: "0.88rem",
                    background: "rgba(180,140,100,0.25)",
                    border: "1.5px solid rgba(100,70,40,0.28)",
                    borderRadius: 5,
                    color: "#1A2E22",
                    padding: "10px 14px",
                    outline: "none",
                  }}
                  onFocus={(e) => {
                    (e.target as HTMLElement).style.borderColor = "#3A9E6F";
                    (e.target as HTMLElement).style.boxShadow = "0 0 0 3px rgba(58,158,111,0.15)";
                  }}
                  onBlur={(e) => {
                    (e.target as HTMLElement).style.borderColor = "rgba(100,70,40,0.28)";
                    (e.target as HTMLElement).style.boxShadow = "none";
                  }}
                />
                <button
                  type="submit"
                  style={{
                    fontFamily: "'Nunito', sans-serif",
                    fontWeight: 700,
                    fontSize: "0.82rem",
                    borderRadius: 5,
                    background: "linear-gradient(135deg, #3A9E6F 0%, #2C7A54 100%)",
                    color: "#fff",
                    border: "none",
                    padding: "10px 18px",
                    cursor: "pointer",
                    boxShadow: "0 3px 12px rgba(58,158,111,0.3)",
                    whiteSpace: "nowrap",
                  }}
                >
                  Confirmar
                </button>
              </div>
            </form>

            {/* Show alternatives button */}
            <button
              onClick={() => setShowOptions((v) => !v)}
              className="flex items-center gap-2 px-4 py-2.5 w-full"
              style={{
                fontFamily: "'Nunito', sans-serif",
                fontWeight: 700,
                fontSize: "0.82rem",
                borderRadius: 5,
                background: showOptions ? "rgba(196,132,90,0.18)" : "rgba(180,140,100,0.22)",
                color: showOptions ? "#8B5A35" : "#5C3D20",
                border: `1.5px solid ${showOptions ? "rgba(196,132,90,0.4)" : "rgba(100,70,40,0.22)"}`,
                cursor: "pointer",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="2.5" cy="3.5" r="1.5" fill="currentColor" />
                <circle cx="2.5" cy="7" r="1.5" fill="currentColor" />
                <circle cx="2.5" cy="10.5" r="1.5" fill="currentColor" />
                <line x1="5.5" y1="3.5" x2="12" y2="3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="5.5" y1="7" x2="12" y2="7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="5.5" y1="10.5" x2="12" y2="10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              Mostrar Alternativas
              <svg
                width="12" height="12" viewBox="0 0 12 12" fill="none"
                style={{ marginLeft: "auto", transform: showOptions ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}
              >
                <path d="M2 4.5L6 7.5l4-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {/* MCQ options */}
            {showOptions && (
              <div className="flex flex-col gap-2">
                <p style={{ fontSize: "0.68rem", fontWeight: 700, color: "rgba(92,61,32,0.55)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 2 }}>
                  Múltipla Escolha
                </p>
                {question.options.map((opt, idx) => {
                  const isSelected = selectedOption === idx;
                  const isCorrect = idx === question.correct;
                  let bg = "rgba(180,140,100,0.18)";
                  let border = "1.5px solid rgba(100,70,40,0.2)";
                  let color = "#1A2E22";
                  if (selectedOption !== null) {
                    if (isCorrect) { bg = "rgba(58,158,111,0.18)"; border = "1.5px solid #3A9E6F"; color = "#2F5C44"; }
                    else if (isSelected) { bg = "rgba(180,60,40,0.15)"; border = "1.5px solid rgba(180,60,40,0.5)"; color = "#7A2010"; }
                  }
                  return (
                    <button
                      key={opt}
                      onClick={() => handleOptionSelect(idx)}
                      className="flex items-center gap-3 px-4 py-3 text-left w-full"
                      style={{
                        fontFamily: "'Nunito', sans-serif",
                        fontWeight: 700,
                        fontSize: "0.88rem",
                        borderRadius: 5,
                        background: bg,
                        border,
                        color,
                        cursor: selectedOption !== null ? "default" : "pointer",
                        transition: "all 0.14s ease",
                      }}
                      onMouseEnter={(e) => {
                        if (selectedOption !== null) return;
                        (e.currentTarget as HTMLElement).style.background = "rgba(58,158,111,0.12)";
                        (e.currentTarget as HTMLElement).style.borderColor = "rgba(58,158,111,0.4)";
                      }}
                      onMouseLeave={(e) => {
                        if (selectedOption !== null) return;
                        (e.currentTarget as HTMLElement).style.background = "rgba(180,140,100,0.18)";
                        (e.currentTarget as HTMLElement).style.borderColor = "rgba(100,70,40,0.2)";
                      }}
                    >
                      <span
                        style={{
                          width: 22, height: 22, borderRadius: 4,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          flexShrink: 0,
                          background: isSelected && selectedOption !== null
                            ? (isCorrect ? "#3A9E6F" : "rgba(180,60,40,0.6)")
                            : "rgba(100,70,40,0.18)",
                          fontSize: "0.68rem",
                          fontWeight: 800,
                          color: isSelected && selectedOption !== null ? "#fff" : "rgba(92,61,32,0.8)",
                        }}
                      >
                        {String.fromCharCode(65 + idx)}
                      </span>
                      {opt}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes ping {
          75%, 100% { transform: scale(2.2); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

function ScoreTile({ label, value, color, large }: { label: string; value: number | string; color: string; large?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div style={{ width: 4, height: 28, borderRadius: 2, background: color, opacity: 0.6 }} />
      <div className="flex flex-col">
        <span style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: large ? "1.4rem" : "1rem", color, lineHeight: 1 }}>
          {value}
        </span>
        <span style={{ fontSize: "0.55rem", color: "rgba(255,255,255,0.38)", fontWeight: 700, letterSpacing: "0.12em" }}>
          {label}
        </span>
      </div>
    </div>
  );
}

interface RotateArrowProps {
  dir: "up" | "down" | "left" | "right";
  onClick: () => void;
  style?: React.CSSProperties;
}

function RotateArrow({ dir, onClick, style }: RotateArrowProps) {
  const rotations = { up: 0, right: 90, down: 180, left: 270 };
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={`Girar ${dir === "up" ? "acima" : dir === "down" ? "abaixo" : dir === "left" ? "esquerda" : "direita"}`}
      style={{
        ...style, width: 36, height: 36, borderRadius: 5,
        border: `1.5px solid ${hovered ? "rgba(58,158,111,0.55)" : "rgba(100,70,40,0.28)"}`,
        background: hovered ? "rgba(58,158,111,0.14)" : "rgba(180,140,100,0.22)",
        color: hovered ? "#2C7A54" : "rgba(92,61,32,0.65)",
        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.14s ease", zIndex: 2, padding: 0,
      }}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ transform: `rotate(${rotations[dir]}deg)` }}>
        <path d="M8 13V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M4 7l4-4 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}