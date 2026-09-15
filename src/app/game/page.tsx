"use client";

import Link from "next/link";
import React, { useState } from "react";
import { IMAGES, type AnatomyImage, type Marker } from "@/data/anatomy";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function normalize(s: string) {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

type Question = { marker: Marker; options: string[]; correct: number };

function buildQuestions(markers: Marker[]): Question[] {
  return shuffle(markers).map((marker) => {
    const distratores = shuffle(
      markers.filter((m) => m.name !== marker.name).map((m) => m.name),
    ).slice(0, 3);
    const options = shuffle([marker.name, ...distratores]);
    return { marker, options, correct: options.indexOf(marker.name) };
  });
}

export default function Game() {
  const [imageId, setImageId] = useState(IMAGES[0].id);
  const image = IMAGES.find((img) => img.id === imageId) ?? IMAGES[0];

  // O sorteio usa Math.random(), então só pode rodar no cliente:
  // gerar durante o SSR faria o servidor e o navegador sortearem
  // ordens diferentes e o React reclamar de hydration mismatch.
  const [questions, setQuestions] = useState<Question[] | null>(null);
  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intencional: sorteio (Math.random) só pode acontecer no cliente
    setQuestions(buildQuestions(image.markers));
  }, [image]);

  const [score, setScore] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [textAnswer, setTextAnswer] = useState("");
  const [showOptions, setShowOptions] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);

  function trocarImagem(id: string) {
    setImageId(id);
    setScore(0);
    setQuestionIndex(0);
    setTextAnswer("");
    setShowOptions(false);
    setSelectedOption(null);
    setFeedback(null);
  }

  if (!questions) {
    return (
      <div
        className="size-full flex items-center justify-center min-h-screen"
        style={{ background: "#C8B498", fontFamily: "'Nunito', sans-serif", color: "#5C3D20", fontWeight: 700 }}
      >
        Carregando…
      </div>
    );
  }

  const question = questions[questionIndex % questions.length];

  function respostaCerta(texto: string) {
    const alvo = [question.marker.name, ...(question.marker.aceita ?? [])].map(normalize);
    return alvo.includes(normalize(texto));
  }

  function proxima() {
    setSelectedOption(null);
    setFeedback(null);
    setShowOptions(false);
    setTextAnswer("");
    setQuestionIndex((i) => i + 1);
  }

  function handleOptionSelect(idx: number) {
    if (selectedOption !== null || feedback) return;
    setSelectedOption(idx);
    const isCorrect = idx === question.correct;
    setFeedback(isCorrect ? "correct" : "wrong");
    if (isCorrect) setScore((s) => s + 10);
    setTimeout(proxima, 1100);
  }

  function handleTextSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (feedback) return;
    const isCorrect = respostaCerta(textAnswer);
    setFeedback(isCorrect ? "correct" : "wrong");
    if (isCorrect) setScore((s) => s + 10);
    setTimeout(proxima, 1100);
  }

  return (
    <div
      className="size-full flex flex-col overflow-hidden min-h-screen"
      style={{ background: "#C8B498", fontFamily: "'Nunito', sans-serif" }}
    >
      <style>{`
        .marker-dot {
          position: absolute;
          top: 0;
          left: 0;
          transform: translate(-50%, -50%);
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #E8C252;
          box-shadow: 0 0 0 3px rgba(28,53,40,0.85), 0 1px 5px rgba(0,0,0,0.35);
        }
        .marker-ping {
          position: absolute;
          top: 0;
          left: 0;
          transform: translate(-50%, -50%);
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: rgba(232,194,82,0.55);
          animation: marker-pulse 1.7s cubic-bezier(0,0,0.25,1) infinite;
        }
        @keyframes marker-pulse {
          0% { transform: translate(-50%, -50%) scale(1); opacity: 0.7; }
          70% { transform: translate(-50%, -50%) scale(3.4); opacity: 0; }
          100% { transform: translate(-50%, -50%) scale(3.4); opacity: 0; }
        }
      `}</style>
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
            textDecoration: "none",
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
          <ScoreTile label="QUESTÃO" value={`${(questionIndex % questions.length) + 1} / ${questions.length}`} color="#E8C252" />
          <div style={{ width: 1, height: 32, background: "rgba(141,201,160,0.15)", margin: "0 8px" }} />
          {IMAGES.length > 1 ? (
            <ImageSelector images={IMAGES} value={imageId} onChange={trocarImagem} />
          ) : (
            <ScoreTile label="ANIMAL" value={image.especie} color="#C4845A" />
          )}
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
              {feedback === "correct" ? "Correto! +10 pts" : `Era: ${question.marker.name}`}
            </span>
          </div>
        ) : (
          <div style={{ width: 140 }} />
        )}
      </header>

      {/* ─── Main: two-column layout ─── */}
      <div className="flex-1 flex overflow-hidden" style={{ minHeight: 0 }}>
        {/* Left: anatomy image */}
        <div
          className="flex flex-col overflow-hidden"
          style={{
            flex: "0 0 68%",
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
                Qual osso está marcado?
              </span>
            </div>
            <span style={{ fontSize: "0.68rem", color: "rgba(92,61,32,0.5)", fontWeight: 600, fontStyle: "italic" }}>
              {image.especie}
            </span>
          </div>

          {/* Image + arrow */}
          <div
            className="flex-1 flex items-center justify-center relative"
            style={{
              minHeight: 0,
              background: "radial-gradient(ellipse at 50% 55%, rgba(141,201,160,0.08) 0%, transparent 65%)",
              padding: "24px",
            }}
          >
            <div style={{ position: "relative", width: "100%", maxWidth: 780 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.src}
                alt={image.titulo}
                style={{ display: "block", width: "100%", borderRadius: 6, background: "rgba(160,120,80,0.14)" }}
              />
              <div
                key={`${imageId}-${questionIndex}`}
                style={{
                  position: "absolute",
                  left: `${question.marker.x * 100}%`,
                  top: `${question.marker.y * 100}%`,
                  width: 0,
                  height: 0,
                  pointerEvents: "none",
                }}
              >
                <span className="marker-ping" />
                <span className="marker-dot" />
              </div>
            </div>
          </div>

          <div className="shrink-0 px-6 py-2" style={{ borderTop: "1px solid rgba(100,70,40,0.18)" }}>
            <span style={{ fontSize: "0.62rem", color: "rgba(92,61,32,0.45)", fontWeight: 600 }}>
              Fonte: {image.fonte}
            </span>
          </div>
        </div>

        {/* Right: answers panel */}
        <div
          className="flex flex-col overflow-hidden"
          style={{
            flex: "0 0 32%",
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
    </div>
  );
}

function ImageSelector({
  images,
  value,
  onChange,
}: {
  images: AnatomyImage[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex flex-col">
      <span style={{ fontSize: "0.55rem", color: "rgba(255,255,255,0.38)", fontWeight: 700, letterSpacing: "0.12em" }}>
        ANIMAL
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          fontFamily: "'Baloo 2', sans-serif",
          fontWeight: 800,
          fontSize: "0.9rem",
          color: "#C4845A",
          background: "transparent",
          border: "none",
          outline: "none",
          cursor: "pointer",
          padding: 0,
        }}
      >
        {images.map((img) => (
          <option key={img.id} value={img.id} style={{ color: "#1A2E22" }}>
            {img.especie}
          </option>
        ))}
      </select>
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
