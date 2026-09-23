"use client";

import React, { useState } from "react";
import { useSession } from '@/contexts/SessionContext';
import { ShareCardStory, ShareCardSquare } from './ShareCards';
import { getSharePlatform } from '../../platform/share';
import { toBlob } from 'html-to-image';
import { useLanguage } from "@/contexts/LanguageContext";
import { TRANSLATIONS } from "@/data/locales";
import { useRouter } from "next/navigation";
import { tokens } from "@/styles/tokens";
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

type Name = Marker["name"];

// Uma vista = uma imagem em que o osso está mapeado (com um ou mais marcadores dele).
type View = { image: AnatomyImage; markers: Marker[] };

// Uma questão = um osso (agrupado pelo nome em PT) + todas as imagens em que ele aparece.
type Question = { name: Name; aceita: string[]; views: View[]; options: Name[]; correct: number };

const ESPECIES = [...new Set(IMAGES.map((img) => img.especie))];

function buildQuestions(images: AnatomyImage[]): Question[] {
  const ossos = new Map<string, { name: Name; aceita: Set<string>; views: View[] }>();

  for (const image of images) {
    for (const marker of image.markers) {
      const key = normalize(marker.name.pt);
      let osso = ossos.get(key);
      if (!osso) {
        osso = { name: marker.name, aceita: new Set(), views: [] };
        ossos.set(key, osso);
      }
      marker.aceita?.forEach((a) => osso.aceita.add(a));

      let view = osso.views.find((v) => v.image.id === image.id);
      if (!view) {
        view = { image, markers: [] };
        osso.views.push(view);
      }
      view.markers.push(marker);
    }
  }

  const lista = [...ossos.values()];
  const nomes = lista.map((o) => o.name);
  return shuffle(lista).slice(0, 20).map((osso) => {
    const distratores = shuffle(nomes.filter((n) => n.pt !== osso.name.pt)).slice(0, 3);
    const options = shuffle([osso.name, ...distratores]);
    return {
      name: osso.name,
      aceita: [...osso.aceita],
      views: osso.views,
      options,
      correct: options.findIndex((o) => o.pt === osso.name.pt),
    };
  });
}

export default function Game() {
  const router = useRouter();

  const [especie, setEspecie] = useState(ESPECIES[0]);

  // O sorteio usa Math.random(), então só pode rodar no cliente:
  // gerar durante o SSR faria o servidor e o navegador sortearem
  // ordens diferentes e o React reclamar de hydration mismatch.
  const [questions, setQuestions] = useState<Question[] | null>(null);
  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intencional: sorteio (Math.random) só pode acontecer no cliente
    setQuestions(buildQuestions(IMAGES.filter((img) => img.especie === especie)));
  }, [especie]);

  const [questionIndex, setQuestionIndex] = useState(0);
  const [viewIndex, setViewIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [questionResults, setQuestionResults] = useState<("DIRECT" | "ALTERNATIVE" | "WRONG")[]>([]);
  const [gameState, setGameState] = useState<"IN_PROGRESS" | "FINISHED">("IN_PROGRESS");
  const { addGame, getLastGame, getPreviousGame } = useSession();
  const hasSavedSession = React.useRef(false);

  React.useEffect(() => {
    if (gameState === "IN_PROGRESS") {
      hasSavedSession.current = false;
    }
    if (gameState === "FINISHED" && questions && !hasSavedSession.current) {
      hasSavedSession.current = true;
      addGame({
        imageId: questions[0].views[0].image.id,
        score,
        maxScore: questions.length * 10,
        correctCount,
        incorrectCount,
        finishedAt: new Date()
      });
    }
  }, [gameState, questions, score, correctCount, incorrectCount, addGame]);

  const [questionState, setQuestionState] = useState<"AWAITING_TEXT_ANSWER" | "SHOWING_ALTERNATIVES" | "ANSWERED">("AWAITING_TEXT_ANSWER");

  const [textAnswer, setTextAnswer] = useState("");
  const [emptyError, setEmptyError] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [cardFormat, setCardFormat] = useState<"story" | "square">("story");
  const [showExitModal, setShowExitModal] = useState(false);
  const { language } = useLanguage();
  const t = TRANSLATIONS[language].game;

  function trocarEspecie(nova: string) {
    setEspecie(nova);
    setQuestionIndex(0);
    setViewIndex(0);
    setScore(0);
    setCorrectCount(0);
    setIncorrectCount(0);
    setCurrentStreak(0);
    setBestStreak(0);
    setQuestionResults([]);
    setGameState("IN_PROGRESS");
    setQuestionState("AWAITING_TEXT_ANSWER");
    setTextAnswer("");
    setEmptyError(false);
    setSelectedOption(null);
    setFeedback(null);
    setShowExitModal(false);
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
  if (questions.length === 0) return null;

  const question = questions[questionIndex];
  const totalViews = question.views.length;
  const view = question.views[viewIndex] ?? question.views[0];

  function irParaVista(i: number) {
    setViewIndex(((i % totalViews) + totalViews) % totalViews);
  }

  function respostaCerta(texto: string) {
    const alvo = [question.name.pt, question.name.es, ...question.aceita].map(normalize);
    return alvo.includes(normalize(texto));
  }

  function advanceQuestion() {
    setTimeout(() => {
      setViewIndex(0);
      setSelectedOption(null);
      setFeedback(null);
      setTextAnswer("");
      setEmptyError(false);
      setQuestionState("AWAITING_TEXT_ANSWER");

      if (questionIndex + 1 >= questions!.length) {
        setGameState("FINISHED");
      } else {
        setQuestionIndex((i) => i + 1);
      }
    }, 1100);
  }

  function handleTextSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!textAnswer.trim()) {
      setEmptyError(true);
      return;
    }
    setEmptyError(false);

    if (respostaCerta(textAnswer)) {
      setFeedback("correct");
      setScore((s) => s + 10);
      setCorrectCount((c) => c + 1);
      setCurrentStreak((c) => { const n = c + 1; if (n > bestStreak) setBestStreak(n); return n; });
      setQuestionResults(r => [...r, "DIRECT"]);
      setQuestionState("ANSWERED");
      advanceQuestion();
    } else {
      setFeedback("wrong");
      setQuestionState("SHOWING_ALTERNATIVES");
    }
  }

  function handleAlternativeSelect(idx: number) {
    if (questionState !== "SHOWING_ALTERNATIVES") return;
    setSelectedOption(idx);
    const isCorrect = idx === question.correct;
    setFeedback(isCorrect ? "correct" : "wrong");
    setQuestionState("ANSWERED");
    if (isCorrect) {
      setScore((s) => s + 5);
      setCorrectCount((c) => c + 1);
      setCurrentStreak((c) => { const n = c + 1; if (n > bestStreak) setBestStreak(n); return n; });
      setQuestionResults(r => [...r, "ALTERNATIVE"]);
    } else {
      setIncorrectCount((c) => c + 1);
      setCurrentStreak(0);
      setQuestionResults(r => [...r, "WRONG"]);
    }
    advanceQuestion();
  }

  function handleReturnMenu() {
    if (gameState === "IN_PROGRESS") {
      setShowExitModal(true);
    } else {
      router.push("/");
    }
  }

  const answeredViaTexto = questionState === "ANSWERED" && selectedOption === null;
  const mostrarAlternativas = questionState === "SHOWING_ALTERNATIVES" || (questionState === "ANSWERED" && selectedOption !== null);

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
        @keyframes floatUp { 0%{opacity:0;transform:translateY(10px) scale(.7)} 15%{opacity:1;transform:translateY(0) scale(1.15)} 30%{transform:translateY(-6px) scale(1)} 70%{opacity:1;transform:translateY(-30px)} 100%{opacity:0;transform:translateY(-44px)} }
        @keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px)} 40%{transform:translateX(8px)} 60%{transform:translateX(-6px)} 80%{transform:translateX(5px)} }
        @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.18)} }
        @keyframes flicker { 0%,100%{transform:scaleY(1) rotate(-2deg)} 50%{transform:scaleY(1.08) rotate(2deg)} }
        @keyframes ping { 0%{box-shadow:0 0 0 0 rgba(232,194,82,.9)} 70%{box-shadow:0 0 0 14px rgba(232,194,82,0)} 100%{box-shadow:0 0 0 0 rgba(232,194,82,0)} }
      `}</style>

      {/* ─── Scoreboard header ─── */}
      <header
        className="flex items-center justify-between px-8 py-0 shrink-0"
        style={{
          background: tokens.greenDark,
          height: 76,
          borderBottom: "1px solid rgba(0,0,0,0.25)",
        }}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={handleReturnMenu}
            className="flex items-center gap-2 px-3 py-1.5"
            style={{
              fontFamily: "'Nunito', sans-serif",
              fontWeight: 700,
              fontSize: "0.82rem",
              borderRadius: 5,
              background: "rgba(141,201,160,0.1)",
              color: tokens.greenSoft,
              border: "1px solid rgba(141,201,160,0.18)",
              cursor: "pointer",
            }}
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M9 11.5L4 6.5l5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Menu
          </button>

          {gameState === "IN_PROGRESS" && (
            <div className="flex items-center gap-2">
              <ScoreTile label={t.point} value={`${questionIndex + 1} / ${questions.length}`} valueColor={tokens.gold} />
              <ScoreTile label={t.remaining} value={questions.length - (questionIndex + 1)} valueColor="#FFF" />
              <ScoreTile label={t.score} value={score} valueColor="#FFF" />
              
              {currentStreak >= 3 && (
                <div style={{ background: tokens.streakBg, border: `1.5px solid ${tokens.streak}`, borderRadius: 999, padding: "4px 12px", display: "flex", alignItems: "center", gap: 6, marginLeft: 8 }}>
                  <span style={{ fontSize: "1.1rem" }}>🔥</span>
                  <span style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "1rem", color: "#FFF" }}>×{currentStreak}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {gameState === "IN_PROGRESS" && (
          <div className="flex items-center gap-3">
            <div style={{ textAlign: "right" }}>
               {ESPECIES.length > 1 ? (
                 <SpeciesSelector label={t.animal} especies={ESPECIES} value={especie} onChange={trocarEspecie} />
               ) : (
                 <div style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "20px", color: "#FFF", lineHeight: 1 }}>{especie}</div>
               )}
            </div>
          </div>
        )}
      </header>

      {/* ─── Main content ─── */}
      {gameState === "IN_PROGRESS" ? (
        <div className="flex-1 flex flex-col overflow-hidden" style={{ minHeight: 0 }}>
          <div style={{ height: 42, background: tokens.greenDeep, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, flexShrink: 0 }}>
            {questions.map((q, i) => {
              let bg = "rgba(92,61,32,0.18)";
              let col = "rgba(255,255,255,0.4)";
              let border = "none";
              if (i < questionIndex) {
                 const res = questionResults[i];
                 if (res === "DIRECT") bg = tokens.resultDirect;
                 else if (res === "ALTERNATIVE") bg = tokens.resultAlt;
                 else if (res === "WRONG") bg = tokens.resultWrong;
                 col = "#FFF";
              } else if (i === questionIndex) {
                 bg = tokens.greenDark;
                 col = tokens.gold;
                 border = `1px solid ${tokens.gold}`;
              }
              return (
                <div key={i} style={{ width: 30, height: 30, borderRadius: 8, background: bg, border, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: "12px", color: col }}>
                  {i + 1}
                </div>
              );
            })}
          </div>
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
                  {t.identifyStructure}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span style={{ fontSize: "0.68rem", color: "rgba(92,61,32,0.5)", fontWeight: 600, fontStyle: "italic" }}>
                  {especie}
                </span>
              </div>
            </div>

            {/* Image + marker */}
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
                  src={view.image.src}
                  alt={view.image.titulo[language]}
                  style={{ display: "block", width: "100%", borderRadius: 6, background: "rgba(160,120,80,0.14)" }}
                />
                {view.markers.map((m, i) => (
                  <div
                    key={`${view.image.id}-${questionIndex}-${i}`}
                    style={{
                      position: "absolute",
                      left: `${m.x * 100}%`,
                      top: `${m.y * 100}%`,
                      width: 0,
                      height: 0,
                      pointerEvents: "none",
                    }}
                  >
                    <span className="marker-ping" />
                    <span className="marker-dot" />
                  </div>
                ))}
              </div>
              {totalViews > 1 && (
                <div
                  className="flex items-center gap-2"
                  role="group"
                  aria-label={t.viewGroup}
                  style={{
                    position: "absolute",
                    top: 12,
                    zIndex: 5,
                    left: "50%",
                    transform: "translateX(-50%)",
                    padding: "6px 10px",
                    borderRadius: 999,
                    background: "rgba(28,53,40,0.92)",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.35)",
                  }}
                >
                  <button onClick={() => irParaVista(viewIndex - 1)} aria-label={t.prevView} style={navButtonStyle}>
                    ‹
                  </button>
                  {question.views.map((v, i) => (
                    <button
                      key={v.image.id}
                      onClick={() => irParaVista(i)}
                      aria-label={`${t.view} ${i + 1}: ${v.image.titulo[language]}`}
                      aria-current={i === viewIndex}
                      title={v.image.titulo[language]}
                      style={{
                        ...navButtonStyle,
                        background: i === viewIndex ? "#E8C252" : "rgba(255,255,255,0.12)",
                        color: i === viewIndex ? "#1C3528" : "#E8E0CC",
                      }}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button onClick={() => irParaVista(viewIndex + 1)} aria-label={t.nextView} style={navButtonStyle}>
                    ›
                  </button>
                  <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#8DC9A0", whiteSpace: "nowrap", paddingLeft: 4 }}>
                    {totalViews} {t.anglesAvailable}
                  </span>
                </div>
              )}
            </div>

            <div className="shrink-0 px-6 py-2" style={{ borderTop: "1px solid rgba(100,70,40,0.18)" }}>
              <span style={{ fontSize: "0.62rem", color: "rgba(92,61,32,0.45)", fontWeight: 600 }}>
                {totalViews > 1 && `${t.view} ${viewIndex + 1} ${t.of} ${totalViews} — ${view.image.titulo[language]} · `}
                {t.source}: {view.image.fonte}
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

            <div className="flex-1 flex flex-col p-6 gap-5 overflow-y-auto">
              {questionState === "AWAITING_TEXT_ANSWER" && (
                <form onSubmit={handleTextSubmit} className="flex flex-col gap-3">
                  <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "#5C3D20", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    {t.typeAnswer}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={textAnswer}
                      onChange={(e) => {
                        setTextAnswer(e.target.value);
                        setEmptyError(false);
                      }}
                      placeholder={t.typeAnswerPlaceholder}
                      style={{
                        flex: 1,
                        fontFamily: "'Nunito', sans-serif",
                        fontWeight: 600,
                        fontSize: "0.88rem",
                        background: "rgba(180,140,100,0.25)",
                        border: emptyError ? "1.5px solid #D9534F" : "1.5px solid rgba(100,70,40,0.28)",
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
                        (e.target as HTMLElement).style.borderColor = emptyError ? "#D9534F" : "rgba(100,70,40,0.28)";
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
                  {emptyError && (
                    <span style={{ color: "#D9534F", fontSize: "0.8rem", fontWeight: 700 }}>
                      {t.emptyAnswer}
                    </span>
                  )}
                </form>
              )}

              {answeredViaTexto && (
                <div style={{ color: "#3A9E6F", fontWeight: 700 }}>{t.pts10}</div>
              )}

              {mostrarAlternativas && (
                <div className="flex flex-col gap-2">
                  {questionState === "SHOWING_ALTERNATIVES" && (
                    <p style={{ fontSize: "0.72rem", fontWeight: 700, color: "#D9534F", textTransform: "uppercase" }}>
                      {t.wrongTextChooseAlt}
                    </p>
                  )}
                  {question.options.map((opt, idx) => {
                    const isSelected = selectedOption === idx;
                    const isCorrect = idx === question.correct;
                    let bg = "rgba(180,140,100,0.18)";
                    let border = "1.5px solid rgba(100,70,40,0.2)";
                    let color = "#1A2E22";
                    let anim = "none";
                    let shadow = "none";
                    let delay = "0ms";
                    
                    if (questionState === "ANSWERED") {
                      if (isSelected && isCorrect) {
                        bg = tokens.resultAlt;
                        border = "1.5px solid " + tokens.resultAlt;
                        color = "#FFF";
                        shadow = "0 0 0 6px rgba(217,169,58,.45)";
                      } else if (isSelected && !isCorrect) {
                        bg = tokens.resultWrong;
                        border = "1.5px solid " + tokens.resultWrong;
                        color = "#FFF";
                        anim = "shake 400ms ease-in-out";
                      } else if (!isSelected && isCorrect) {
                        bg = tokens.resultDirect;
                        border = "1.5px solid " + tokens.resultDirect;
                        color = "#FFF";
                        delay = "300ms";
                      }
                    }
                    
                    return (
                      <button
                        key={opt[language]}
                        onClick={() => handleAlternativeSelect(idx)}
                        disabled={questionState === "ANSWERED"}
                        className="flex items-center gap-3 px-4 py-3 text-left w-full"
                        style={{
                          fontFamily: "'Nunito', sans-serif",
                          fontWeight: 700,
                          fontSize: "0.88rem",
                          borderRadius: 5,
                          background: bg,
                          border,
                          color,
                          cursor: questionState === "ANSWERED" ? "default" : "pointer",
                          transition: "all 0.14s ease",
                          transitionDelay: delay,
                          animation: anim,
                          boxShadow: shadow,
                          position: "relative",
                        }}
                      >
                        {isSelected && isCorrect && questionState === "ANSWERED" && (
                          <div style={{ position: "absolute", bottom: "100%", right: 20, color: tokens.gold, fontFamily: "'Baloo 2', sans-serif", fontSize: 44, fontWeight: 800, animation: "floatUp 900ms forwards", pointerEvents: "none", textShadow: "0 2px 10px rgba(0,0,0,0.15)" }}>+5</div>
                        )}
                        <span
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: 4,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            background:
                              questionState === "ANSWERED" && (isSelected || isCorrect)
                                ? "rgba(255,255,255,0.25)"
                                : "rgba(100,70,40,0.18)",
                            fontSize: "0.68rem",
                            fontWeight: 800,
                            transitionDelay: delay,
                            color: questionState === "ANSWERED" && (isSelected || isCorrect) ? "#fff" : "rgba(92,61,32,0.8)",
                          }}
                        >
                          {String.fromCharCode(65 + idx)}
                        </span>
                        {opt[language as "pt" | "es"]}
                      </button>
                    );
                  })}

                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      ) : (
        /* ─── FINISHED STATE ─── */
        <FinishedScreen
          questions={questions}
          questionResults={questionResults}
          score={score}
          correctCount={correctCount}
          incorrectCount={incorrectCount}
          bestStreak={bestStreak}
          cardFormat={cardFormat}
          setCardFormat={setCardFormat}
          handleReturnMenu={() => setShowExitModal(true)}
          language={language}
          especie={especie}
          t={t}
          lastGame={getPreviousGame()}
          playSame={() => {
            setQuestions(buildQuestions(IMAGES.filter((img) => img.especie === especie)));
            setQuestionIndex(0);
            setViewIndex(0);
            setScore(0);
            setCorrectCount(0);
            setIncorrectCount(0);
            setCurrentStreak(0);
            setBestStreak(0);
            setQuestionResults([]);
            setQuestionState("AWAITING_TEXT_ANSWER");
            setTextAnswer("");
            setEmptyError(false);
            setFeedback(null);
            setSelectedOption(null);
            setGameState("IN_PROGRESS");
          }}
        />
      )}

      {/* Exit Modal */}
      {showExitModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ background: "#C8B498", padding: 32, borderRadius: 8, boxShadow: "0 10px 30px rgba(0,0,0,0.5)", border: "1px solid rgba(100,70,40,0.2)", maxWidth: 400 }}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#1A2E22", marginBottom: 24, fontFamily: "'Nunito', sans-serif" }}>
              {t.exitConfirm}
            </h2>
            <div className="flex gap-4 justify-end">
              <button
                onClick={() => setShowExitModal(false)}
                style={{ padding: "8px 16px", borderRadius: 6, background: "rgba(100,70,40,0.15)", color: "#1A2E22", fontWeight: 700, border: "none", cursor: "pointer" }}
              >
                Cancelar
              </button>
              <button
                onClick={() => router.push("/")}
                style={{ padding: "8px 16px", borderRadius: 6, background: "#C4845A", color: "#FFF", fontWeight: 700, border: "none", cursor: "pointer" }}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const navButtonStyle: React.CSSProperties = {
  minWidth: 34,
  height: 34,
  padding: "0 8px",
  fontFamily: "'Nunito', sans-serif",
  fontWeight: 800,
  fontSize: "1rem",
  borderRadius: 999,
  border: "none",
  background: "rgba(255,255,255,0.12)",
  color: "#E8E0CC",
  cursor: "pointer",
};

function SpeciesSelector({
  label,
  especies,
  value,
  onChange,
}: {
  label: string;
  especies: string[];
  value: string;
  onChange: (especie: string) => void;
}) {
  return (
    <div className="flex flex-col">
      <span style={{ fontSize: "0.55rem", color: "rgba(255,255,255,0.38)", fontWeight: 700, letterSpacing: "0.12em" }}>
        {label}
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
        {especies.map((e) => (
          <option key={e} value={e} style={{ color: "#1A2E22" }}>
            {e}
          </option>
        ))}
      </select>
    </div>
  );
}

function ScoreTile({ label, value, valueColor }: { label: string; value: React.ReactNode; valueColor: string }) {
  return (
    <div style={{ background: "rgba(141,201,160,0.1)", borderRadius: 8, padding: "4px 12px", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <span style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "20px", color: valueColor, lineHeight: 1.1 }}>
        {value}
      </span>
      <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: "10px", textTransform: "uppercase", color: tokens.greenSoft, letterSpacing: "0.14em" }}>
        {label}
      </span>
    </div>
  );
}


function getLevel(pct: number) {
  if (pct < 0.3) return { id: "filhote", pt: "Filhote", es: "Cachorro", descPt: "Ainda roendo o básico", descEs: "Todavía royendo lo básico", color: "#A0703F" };
  if (pct < 0.6) return { id: "faro", pt: "Faro Afiado", es: "Olfato Afilado", descPt: "Já fareja os ossos certos", descEs: "Ya olfatea los huesos correctos", color: "#3A7F9E" };
  if (pct < 0.8) return { id: "monitoria", pt: "Monitoria", es: "Ayudantía", descPt: "Pronto pra ajudar a turma", descEs: "Listo para ayudar al curso", color: "#2C7A54" };
  if (pct < 1) return { id: "anatomista", pt: "Anatomista", es: "Anatomista", descPt: "Os ossos não têm segredos", descEs: "Los huesos no tienen secretos", color: "#7A4FA0" };
  return { id: "mestre", pt: "Mestre dos Ossos", es: "Maestro de los Huesos", descPt: "Gabaritou. Lendário.", descEs: "Puntaje perfecto. Legendario.", color: "#C9962E" };
}

function getMedals(results: string[]) {
  const medals = [];
  const allDirect = results.length > 0 && results.every(r => r === "DIRECT");
  const noWrongs = results.length > 0 && !results.some(r => r === "WRONG");
  
  if (allDirect) {
    medals.push({ id: "perfect", pt: "Gabarito", es: "Pleno", color: "#C9962E" });
  } else if (noWrongs) {
    medals.push({ id: "flawless", pt: "Invicto", es: "Invicto", color: "#2C7A54" });
  }

  let currentStreakDirect = 0;
  let maxStreakDirect = 0;
  for (let r of results) {
    if (r === "DIRECT") currentStreakDirect++;
    else {
      if (currentStreakDirect > maxStreakDirect) maxStreakDirect = currentStreakDirect;
      currentStreakDirect = 0;
    }
  }
  if (currentStreakDirect > maxStreakDirect) maxStreakDirect = currentStreakDirect;
  
  if (maxStreakDirect >= 5 && results.length >= 5) {
    medals.push({ id: "onFire", pt: "Em chamas", es: "En llamas", color: "#D9772E" });
  }

  const last3 = results.slice(-3);
  if (last3.length === 3 && last3.every(r => r === "DIRECT") && !allDirect) {
    medals.push({ id: "strongFinish", pt: "Reta final", es: "Recta final", color: "#3A7F9E" });
  }

  return medals;
}

function FinishedScreen({ questions, questionResults, score, correctCount, incorrectCount, bestStreak, cardFormat, setCardFormat, handleReturnMenu, language, especie, t, playSame, lastGame }: any) {
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [feedbackMsg, setFeedbackMsg] = React.useState<string | null>(null);

  const showFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const generateImage = async (): Promise<Blob | null> => {
    setIsGenerating(true);
    await document.fonts.ready;
    
    // Pequeno atraso para garantir renderização do fundo
    await new Promise(r => setTimeout(r, 100));

    const node = document.getElementById(cardFormat === "story" ? "share-card-story" : "share-card-square");
    if (!node) {
      setIsGenerating(false);
      return null;
    }

    try {
      const blob = await toBlob(node, { pixelRatio: cardFormat === "story" ? 2 : 1.8 });
      setIsGenerating(false);
      return blob;
    } catch (err) {
      setIsGenerating(false);
      return null;
    }
  };

  const pad = (n: number) => n.toString().padStart(2, '0');
  const getFileName = () => {
    const d = new Date();
    const dateStr = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
    const timeStr = `${pad(d.getHours())}${pad(d.getMinutes())}`;
    return `zootomia-${questions[0]?.views[0]?.image.id || 'img'}-${dateStr}-${timeStr}-${cardFormat}.png`;
  };

  const handleDownload = async () => {
    if (isGenerating) return;
    const blob = await generateImage();
    if (!blob) {
      showFeedback("Não foi possível gerar a imagem. Tente de novo.");
      return;
    }
    const res = await getSharePlatform().saveImage(blob, getFileName());
    if (res === "saved") showFeedback("Imagem salva!");
    else if (res === "error") showFeedback("Não foi possível gerar a imagem. Tente de novo.");
  };

  const getShareText = () => {
    return language === "pt" 
      ? `Acabei de fazer ${score} pontos no Zootomia! Consegue me superar? zootomia.app`
      : `¡Acabo de lograr ${score} puntos en Zootomia! ¿Puedes superarme? zootomia.app`;
  };

  const handleWhatsApp = async () => {
    if (isGenerating) return;
    const blob = await generateImage();
    if (!blob) {
      showFeedback("Não foi possível gerar a imagem. Tente de novo.");
      return;
    }
    const res = await getSharePlatform().saveImage(blob, getFileName());
    if (res === "saved") {
      showFeedback("Imagem salva. Anexe ela na conversa do WhatsApp.");
      getSharePlatform().openExternal("https://wa.me/?text=" + encodeURIComponent(getShareText()));
    } else if (res === "error") {
      showFeedback("Não foi possível gerar a imagem. Tente de novo.");
    }
  };

  const handleTwitter = async () => {
    if (isGenerating) return;
    const blob = await generateImage();
    if (!blob) {
      showFeedback("Não foi possível gerar a imagem. Tente de novo.");
      return;
    }
    const res = await getSharePlatform().saveImage(blob, getFileName());
    if (res === "saved") {
      showFeedback("Imagem salva. Anexe ela no post.");
      getSharePlatform().openExternal("https://twitter.com/intent/tweet?text=" + encodeURIComponent(getShareText()));
    } else if (res === "error") {
      showFeedback("Não foi possível gerar a imagem. Tente de novo.");
    }
  };

  const handleInstagram = async () => {
    if (isGenerating) return;
    const blob = await generateImage();
    if (!blob) {
      showFeedback("Não foi possível gerar a imagem. Tente de novo.");
      return;
    }
    const res = await getSharePlatform().saveImage(blob, getFileName());
    if (res === "saved") {
      showFeedback("Imagem salva! No Instagram, escolha a opção de postar no Story e selecione a imagem.");
    } else if (res === "error") {
      showFeedback("Não foi possível gerar a imagem. Tente de novo.");
    }
  };

  const handleCopyText = async () => {
    const success = await getSharePlatform().copyText(getShareText());
    if (success) {
      showFeedback("Copiado!");
    }
  };

  const maxScore = questions.length * 10;
  const pct = maxScore > 0 ? score / maxScore : 0;
  const level = getLevel(pct);
  const medals = getMedals(questionResults);

  let deltaInfo = null;
  if (lastGame) {
    const lastPct = lastGame.maxScore > 0 ? lastGame.score / lastGame.maxScore : 0;
    const deltaPct = pct - lastPct;
    const deltaPts = Math.round(deltaPct * maxScore);
    
    if (deltaPts > 0) {
      deltaInfo = { text: `+${deltaPts} vs. partida anterior`, color: tokens.greenSoft, icon: "↗" };
    } else if (deltaPts < 0) {
      deltaInfo = { text: `${deltaPts} vs. partida anterior`, color: tokens.resultWrong, icon: "↘" };
    } else {
      deltaInfo = { text: `= vs. partida anterior`, color: "rgba(255,255,255,0.6)", icon: "-" };
    }
  }

  const cardProps = { questions, questionResults, score, maxScore, correctCount, incorrectCount, bestStreak, level, medals, language, deltaInfo, lastGame, image: questions[0]?.views[0]?.image };

  return (
    <div className="flex-1 flex overflow-hidden" style={{ background: "#C0A888", position: "relative" }}>
      {/* Offscreen cards for rendering */}
      <div style={{ position: "fixed", left: -10000, top: 0, opacity: 0, pointerEvents: "none" }}>
        {cardFormat === "story" ? <ShareCardStory {...cardProps} /> : <ShareCardSquare {...cardProps} />}
      </div>
      
      {/* Feedback Snackbar */}
      {feedbackMsg && feedbackMsg !== "Copiado!" && (
        <div style={{ position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)", background: "rgba(0,0,0,0.8)", color: "#FFF", padding: "10px 20px", borderRadius: 8, fontWeight: 700, fontSize: 14, zIndex: 1000 }}>
          {feedbackMsg}
        </div>
      )}

      <div style={{ width: 440, background: tokens.greenDeep, display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 40, overflowY: "auto" }}>
        <div style={{ display: "flex", background: "rgba(255,255,255,0.1)", borderRadius: 999, padding: 4, marginBottom: 24 }}>
          <button onClick={() => setCardFormat("story")} style={{ padding: "8px 16px", borderRadius: 999, border: "none", cursor: "pointer", background: cardFormat === "story" ? tokens.greenBrand : "transparent", color: cardFormat === "story" ? "#FFF" : "rgba(255,255,255,0.6)", fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.9rem" }}>Story 9:16</button>
          <button onClick={() => setCardFormat("square")} style={{ padding: "8px 16px", borderRadius: 999, border: "none", cursor: "pointer", background: cardFormat === "square" ? tokens.greenBrand : "transparent", color: cardFormat === "square" ? "#FFF" : "rgba(255,255,255,0.6)", fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.9rem" }}>Quadrado 1:1</button>
        </div>
        
        <div style={{ width: cardFormat === "story" ? 324 : 360, height: cardFormat === "story" ? 576 : 360, background: "#1C3528", borderRadius: 14, boxShadow: "0 18px 40px rgba(0,0,0,0.45)", overflow: "hidden" }}>
          <div style={{ transform: `scale(${cardFormat === "story" ? 324/540 : 360/600})`, transformOrigin: "top left", pointerEvents: "none" }}>
            {cardFormat === "story" ? <ShareCardStory {...cardProps} /> : <ShareCardSquare {...cardProps} />}
          </div>
        </div>
        <p style={{ marginTop: 24, fontSize: "12px", color: "rgba(141,201,160,0.7)", fontFamily: "'Nunito', sans-serif" }}>Pré-visualização do card que será baixado</p>
      </div>

      <div className="flex-1 flex flex-col" style={{ position: "relative" }}>
        <div style={{ position: "absolute", inset: 0, background: "rgba(200,180,152,0.85)", backdropFilter: "blur(60px)", zIndex: 0 }} />
        
        <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", height: "100%", overflowY: "auto" }}>
          <header className="flex items-center justify-between px-8" style={{ height: 68, flexShrink: 0, borderBottom: "1px solid rgba(0,0,0,0.1)" }}>
            <button onClick={handleReturnMenu} style={{ background: "rgba(0,0,0,0.05)", border: "none", padding: "8px 16px", borderRadius: 6, fontFamily: "'Nunito', sans-serif", fontWeight: 700, cursor: "pointer", color: tokens.ink }}>Menu</button>
            <h1 style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: 24, fontWeight: 800, color: tokens.ink }}>Fim de jogo!</h1>
            <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.9rem", color: tokens.brown }}>{especie}</span>
          </header>

          <div style={{ flex: 1, padding: "40px", display: "flex", flexDirection: "column", alignItems: "center" }}>
            
            <div style={{ position: "relative", width: "100%", maxWidth: 560, background: tokens.beigePanel, borderRadius: 16, padding: "22px 24px", marginTop: 40, display: "flex", flexDirection: "column", gap: 18 }}>
              
              <div style={{ position: "absolute", top: -60, left: "50%", transform: "translateX(-50%)", width: 118, height: 118, borderRadius: "50%", background: level.color, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 0 6px rgba(255,255,255,.08), 0 0 0 12px rgba(255,255,255,.04)" }}>
                <span style={{ fontSize: "2rem" }}>🦴</span>
              </div>
              
              <div style={{ marginTop: 60, textAlign: "center" }}>
                <div style={{ fontSize: 12, color: tokens.greenSoft, fontWeight: 800, fontFamily: "'Nunito', sans-serif", letterSpacing: "0.1em" }}>NÍVEL</div>
                <div style={{ fontSize: 46, fontWeight: 800, color: level.color, fontFamily: "'Baloo 2', sans-serif", lineHeight: 1.1 }}>{language === "pt" ? level.pt : level.es}</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: tokens.brownText }}>{language === "pt" ? level.descPt : level.descEs}</div>
              </div>

              <div style={{ display: "flex", gap: 16 }}>
                <div style={{ flex: 1, background: tokens.greenDark, borderRadius: 12, padding: "16px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                    <span style={{ fontSize: 44, fontWeight: 800, color: tokens.gold, fontFamily: "'Baloo 2', sans-serif", lineHeight: 1 }}>{score}</span>
                    <span style={{ fontSize: 18, fontWeight: 700, color: "rgba(255,255,255,0.6)", fontFamily: "'Baloo 2', sans-serif" }}>/{maxScore}</span>
                  </div>
                  {deltaInfo && (
                    <span style={{ fontSize: 12, fontWeight: 700, color: deltaInfo.color, fontFamily: "'Nunito', sans-serif" }}>
                      {deltaInfo.icon} {deltaInfo.text}
                    </span>
                  )}
                </div>
                <div style={{ flex: 1, display: "flex", gap: 16 }}>
                  <div style={{ flex: 1, background: "rgba(47,138,94,0.1)", borderRadius: 12, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 32, fontWeight: 800, color: tokens.resultDirect, fontFamily: "'Baloo 2', sans-serif" }}>{correctCount}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: tokens.brownText, letterSpacing: "0.1em" }}>ACERTOS</span>
                  </div>
                  <div style={{ flex: 1, background: "rgba(201,79,61,0.1)", borderRadius: 12, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 32, fontWeight: 800, color: tokens.resultWrong, fontFamily: "'Baloo 2', sans-serif" }}>{incorrectCount}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: tokens.brownText, letterSpacing: "0.1em" }}>ERROS</span>
                  </div>
                </div>
              </div>

              <div style={{ width: "100%", height: 18, borderRadius: 9, display: "flex", overflow: "hidden", position: "relative" }}>
                {correctCount > 0 && <div style={{ flex: correctCount, background: tokens.resultDirect }} />}
                {incorrectCount > 0 && <div style={{ flex: incorrectCount, background: tokens.resultWrong }} />}
              </div>

              {medals.length > 0 && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
                  {medals.map(m => (
                    <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 6, background: "#FFF", border: `1.5px solid ${m.color}`, borderRadius: 999, padding: "2px 10px 2px 2px" }}>
                      <div style={{ width: 22, height: 22, borderRadius: "50%", background: m.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ color: "#FFF", fontSize: 10 }}>★</span>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 800, color: tokens.ink, fontFamily: "'Nunito', sans-serif" }}>{language === "pt" ? m.pt : m.es}</span>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 16 }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: tokens.ink, fontFamily: "'Nunito', sans-serif", textAlign: "center" }}>Compartilhe seu resultado</span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
                  <button onClick={handleDownload} disabled={isGenerating} style={{ padding: "12px 24px", borderRadius: 8, background: tokens.greenButton, color: "#FFF", fontWeight: 700, border: "none", cursor: isGenerating ? "wait" : "pointer", flex: "1 1 100%" }}>{isGenerating ? "Gerando..." : "Baixar imagem"}</button>
                  <button onClick={handleWhatsApp} disabled={isGenerating} style={{ padding: "10px 16px", borderRadius: 8, background: "#FFF", border: "1.5px solid rgba(0,0,0,0.1)", color: tokens.ink, fontWeight: 700, cursor: isGenerating ? "wait" : "pointer", flex: 1 }}>WhatsApp</button>
                  <button onClick={handleTwitter} disabled={isGenerating} style={{ padding: "10px 16px", borderRadius: 8, background: "#FFF", border: "1.5px solid rgba(0,0,0,0.1)", color: tokens.ink, fontWeight: 700, cursor: isGenerating ? "wait" : "pointer", flex: 1 }}>X / Twitter</button>
                  <button onClick={handleInstagram} disabled={isGenerating} style={{ padding: "10px 16px", borderRadius: 8, background: "#FFF", border: "1.5px solid rgba(0,0,0,0.1)", color: tokens.ink, fontWeight: 700, cursor: isGenerating ? "wait" : "pointer", flex: 1 }}>Instagram</button>
                  <button onClick={handleCopyText} disabled={isGenerating} style={{ padding: "10px 16px", borderRadius: 8, background: "#FFF", border: "1.5px solid rgba(0,0,0,0.1)", color: tokens.ink, fontWeight: 700, cursor: isGenerating ? "wait" : "pointer", flex: 1 }}>{feedbackMsg === "Copiado!" ? "Copiado!" : "Copiar texto"}</button>
                </div>
              </div>

            </div>
            {/* Para Revisar */}
            <div style={{ width: "100%", maxWidth: 560, marginTop: 40, display: "flex", flexDirection: "column", gap: 16 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: tokens.ink, fontFamily: "'Baloo 2', sans-serif" }}>Para revisar</h2>
              {questions.map((q: any, i: number) => {
                const res = questionResults[i];
                if (res === "DIRECT") return null;
                const isWrong = res === "WRONG";
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "#FFF", borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                    <div style={{ width: 16, height: 16, borderRadius: 4, background: isWrong ? tokens.resultWrong : tokens.resultAlt, flexShrink: 0 }} />
                    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: tokens.ink, fontFamily: "'Nunito', sans-serif" }}>{q.name[language]}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: tokens.brownText }}>
                        {isWrong ? "Você errou a alternativa." : "Acertou só na alternativa."}
                      </span>
                    </div>
                    <button style={{ background: "transparent", border: "none", color: tokens.greenBrand, fontWeight: 700, fontSize: 12, cursor: "pointer", textDecoration: "underline" }}>
                      Ver na galeria
                    </button>
                  </div>
                );
              })}
              {!questionResults.some((r: string) => r !== "DIRECT") && (
                <div style={{ padding: "16px", background: "rgba(255,255,255,0.4)", borderRadius: 12, textAlign: "center", fontSize: 14, fontWeight: 700, color: tokens.brownText }}>
                  Nada para revisar. Mandou bem!
                </div>
              )}
            </div>

          </div>
          
          <div style={{ display: "flex", justifyContent: "flex-end", padding: "24px 40px", gap: 16 }}>
             <button style={{ padding: "14px 24px", borderRadius: 8, border: `1.5px solid ${tokens.greenButton}`, color: tokens.greenButton, fontWeight: 700, background: "transparent", cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}>Outra imagem</button>
             <button onClick={playSame} style={{ padding: "14px 24px", borderRadius: 8, background: tokens.greenDark, color: "#FFF", fontWeight: 700, border: "none", cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}>Jogar novamente</button>
          </div>

        </div>
      </div>
    </div>
  );
}
