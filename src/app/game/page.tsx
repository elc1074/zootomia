"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "@/contexts/SessionContext";
import { ShareCardStory, ShareCardSquare } from "./ShareCards";
import { getSharePlatform } from "../../platform/share";
import { toBlob } from "html-to-image";
import { useLanguage } from "@/contexts/LanguageContext";
import { TRANSLATIONS } from "@/data/locales";
import { useRouter } from "next/navigation";
import { tokens } from "@/styles/tokens";
import { IMAGES, getMarkerRegion, type AnatomyImage, type Marker, type Region } from "@/data/anatomy";

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
    .replace(/[\u0300-\u036f]/g, "");
}

type Name = Marker["name"];

// Uma vista = uma imagem em que o osso está mapeado (com um ou mais marcadores dele).
type View = { image: AnatomyImage; markers: Marker[] };

// Uma questão = um osso (agrupado pelo nome em PT) + todas as imagens em que ele aparece.
type Question = { name: Name; aceita: string[]; views: View[]; options: Name[]; correct: number; regiao: Region };

export type AnswerMode = "standard" | "alternatives" | "typing";

export type GameSetupConfig = {
  sistema: "esqueletico" | "nervoso";
  especie: string;
  regions: Region[];
  questionCount: number | "all";
  answerMode: AnswerMode;
  timerEnabled: boolean;
};

type OssoEntry = {
  key: string;
  name: Name;
  aceita: Set<string>;
  views: View[];
  regiao: Region;
};

function getUniqueStructuresForSpecies(especie: string): OssoEntry[] {
  const images = IMAGES.filter((img) => img.especie === especie);
  const ossos = new Map<string, OssoEntry>();

  for (const image of images) {
    for (const marker of image.markers) {
      const reg = getMarkerRegion(marker, image.id);
      const normName = normalize(marker.name.pt);
      // Para Falanges que aparecem no membro torácico e pélvico, agrupamos pelo nome normalizado
      let osso = ossos.get(normName);
      if (!osso) {
        osso = { key: normName, name: marker.name, aceita: new Set(), views: [], regiao: reg };
        ossos.set(normName, osso);
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

  return [...ossos.values()];
}

function buildQuestionsFromConfig(config: GameSetupConfig): Question[] {
  const allStructures = getUniqueStructuresForSpecies(config.especie);
  const filtered = allStructures.filter((o) => config.regions.includes(o.regiao));
  if (filtered.length === 0) return [];

  const allNames = allStructures.map((o) => o.name);
  const targetCount = config.questionCount === "all"
    ? filtered.length
    : Math.min(config.questionCount, filtered.length);

  // Garantimos pelo menos uma estrutura de cada região marcada (quando possível), o resto é sorteio livre
  const chosen: OssoEntry[] = [];
  const chosenKeys = new Set<string>();

  for (const reg of shuffle(config.regions)) {
    if (chosen.length >= targetCount) break;
    const candidates = filtered.filter((o) => o.regiao === reg && !chosenKeys.has(o.key));
    if (candidates.length > 0) {
      const pick = candidates[Math.floor(Math.random() * candidates.length)];
      chosen.push(pick);
      chosenKeys.add(pick.key);
    }
  }

  const remainingPool = shuffle(filtered.filter((o) => !chosenKeys.has(o.key)));
  for (const item of remainingPool) {
    if (chosen.length >= targetCount) break;
    chosen.push(item);
    chosenKeys.add(item.key);
  }

  return shuffle(chosen).map((osso) => {
    const sameRegionNames = filtered
      .filter((o) => o.name.pt !== osso.name.pt)
      .map((o) => o.name);
    const poolNames = sameRegionNames.length >= 3
      ? sameRegionNames
      : allNames.filter((n) => n.pt !== osso.name.pt);
    const distratores = shuffle(poolNames).slice(0, 3);
    const options = shuffle([osso.name, ...distratores]);
    return {
      name: osso.name,
      aceita: [...osso.aceita],
      views: osso.views,
      options,
      correct: options.findIndex((o) => o.pt === osso.name.pt),
      regiao: osso.regiao,
    };
  });
}

export default function Game() {
  const router = useRouter();
  const { language, setLanguage } = useLanguage();
  const t = TRANSLATIONS[language].game;
  const tSetup = TRANSLATIONS[language].setup;

  const [gameState, setGameState] = useState<"SETUP" | "IN_PROGRESS" | "FINISHED">("SETUP");
  const [setupConfig, setSetupConfig] = useState<GameSetupConfig>({
    sistema: "esqueletico",
    especie: "Canis lupus familiaris",
    regions: ["axial", "toracico", "pelvico"],
    questionCount: 10,
    answerMode: "standard",
    timerEnabled: false,
  });

  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [viewIndex, setViewIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [questionResults, setQuestionResults] = useState<("DIRECT" | "ALTERNATIVE" | "WRONG")[]>([]);
  const { addGame, getPreviousGame } = useSession();
  const hasSavedSession = React.useRef(false);

  const [questionState, setQuestionState] = useState<"AWAITING_TEXT_ANSWER" | "SHOWING_ALTERNATIVES" | "ANSWERED">("AWAITING_TEXT_ANSWER");
  const [textAnswer, setTextAnswer] = useState("");
  const [emptyError, setEmptyError] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | "timeout" | null>(null);
  const [cardFormat, setCardFormat] = useState<"story" | "square">("story");
  const [showExitModal, setShowExitModal] = useState(false);
  const [showRestartModal, setShowRestartModal] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);

  const advanceTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (gameState === "IN_PROGRESS") {
      hasSavedSession.current = false;
    }
    if (gameState === "FINISHED" && questions && questions.length > 0 && !hasSavedSession.current) {
      hasSavedSession.current = true;
      addGame({
        imageId: questions[0].views[0].image.id,
        score,
        maxScore: questions.length * 10,
        correctCount,
        incorrectCount,
        finishedAt: new Date(),
      });
    }
  }, [gameState, questions, score, correctCount, incorrectCount, addGame]);

  function startNewGame(config: GameSetupConfig) {
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    const built = buildQuestionsFromConfig(config);
    const initialQState = config.answerMode === "alternatives" ? "SHOWING_ALTERNATIVES" : "AWAITING_TEXT_ANSWER";
    setSetupConfig(config);
    setQuestions(built);
    setQuestionIndex(0);
    setViewIndex(0);
    setScore(0);
    setCorrectCount(0);
    setIncorrectCount(0);
    setCurrentStreak(0);
    setBestStreak(0);
    setQuestionResults([]);
    setQuestionState(initialQState);
    setTextAnswer("");
    setEmptyError(false);
    setFeedback(null);
    setSelectedOption(null);
    setTimeLeft(30);
    setShowExitModal(false);
    setShowRestartModal(false);
    setGameState("IN_PROGRESS");
  }

  function advanceQuestion(delayMs = 1100) {
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    advanceTimerRef.current = setTimeout(() => {
      setViewIndex(0);
      setSelectedOption(null);
      setFeedback(null);
      setTextAnswer("");
      setEmptyError(false);
      setTimeLeft(30);
      setQuestionState(setupConfig.answerMode === "alternatives" ? "SHOWING_ALTERNATIVES" : "AWAITING_TEXT_ANSWER");

      if (!questions || questionIndex + 1 >= questions.length) {
        setGameState("FINISHED");
      } else {
        setQuestionIndex((i) => i + 1);
      }
    }, delayMs);
  }

  // Cronômetro de 30s por questão
  useEffect(() => {
    if (gameState !== "IN_PROGRESS" || !setupConfig.timerEnabled || questionState === "ANSWERED") {
      return;
    }
    if (timeLeft <= 0) {
      // Tempo esgotado -> conta como erro imediatamente
      setFeedback("timeout");
      setQuestionState("ANSWERED");
      setIncorrectCount((c) => c + 1);
      setCurrentStreak(0);
      setQuestionResults((r) => [...r, "WRONG"]);
      advanceQuestion(2500);
      return;
    }
    const id = setTimeout(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState, setupConfig.timerEnabled, questionState, timeLeft]);

  if (gameState === "SETUP") {
    return (
      <SetupScreen
        config={setupConfig}
        setConfig={setSetupConfig}
        onStart={startNewGame}
        onReturnMenu={() => router.push("/")}
        language={language}
        setLanguage={setLanguage}
        tSetup={tSetup}
      />
    );
  }

  if (!questions || questions.length === 0) {
    return (
      <div
        className="size-full flex items-center justify-center min-h-screen"
        style={{ background: "#C8B498", fontFamily: "'Nunito', sans-serif", color: "#5C3D20", fontWeight: 700 }}
      >
        {t.loading}
      </div>
    );
  }

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

  function handleTextSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (questionState !== "AWAITING_TEXT_ANSWER") return;
    if (!textAnswer.trim()) {
      setEmptyError(true);
      return;
    }
    setEmptyError(false);

    if (respostaCerta(textAnswer)) {
      setFeedback("correct");
      setScore((s) => s + 10);
      setCorrectCount((c) => c + 1);
      setCurrentStreak((c) => {
        const n = c + 1;
        if (n > bestStreak) setBestStreak(n);
        return n;
      });
      setQuestionResults((r) => [...r, "DIRECT"]);
      setQuestionState("ANSWERED");
      advanceQuestion(1100);
    } else if (setupConfig.answerMode === "typing") {
      // Modo "Só digitar": sem alternativas, sem segunda chance
      setFeedback("wrong");
      setIncorrectCount((c) => c + 1);
      setCurrentStreak(0);
      setQuestionResults((r) => [...r, "WRONG"]);
      setQuestionState("ANSWERED");
      advanceQuestion(2500);
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
      const pts = setupConfig.answerMode === "alternatives" ? 10 : 5;
      const resultType = setupConfig.answerMode === "alternatives" ? "DIRECT" : "ALTERNATIVE";
      setScore((s) => s + pts);
      setCorrectCount((c) => c + 1);
      setCurrentStreak((c) => {
        const n = c + 1;
        if (n > bestStreak) setBestStreak(n);
        return n;
      });
      setQuestionResults((r) => [...r, resultType]);
      advanceQuestion(1100);
    } else {
      setIncorrectCount((c) => c + 1);
      setCurrentStreak(0);
      setQuestionResults((r) => [...r, "WRONG"]);
      advanceQuestion(2500);
    }
  }

  function handleReturnMenu() {
    setShowExitModal(true);
  }

  const answeredViaTexto =
    questionState === "ANSWERED" &&
    selectedOption === null &&
    setupConfig.answerMode !== "alternatives" &&
    feedback === "correct";

  const answeredWrongTypingOnly =
    questionState === "ANSWERED" &&
    selectedOption === null &&
    (setupConfig.answerMode === "typing" || feedback === "timeout") &&
    feedback !== "correct";

  const mostrarAlternativas =
    questionState === "SHOWING_ALTERNATIVES" ||
    (questionState === "ANSWERED" && (selectedOption !== null || (setupConfig.answerMode === "standard" && feedback === "timeout")));

  const animalLabel = setupConfig.especie === "Felis catus" ? tSetup.cat : tSetup.dog;

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
            {t.menuBtn}
          </button>

          {gameState === "IN_PROGRESS" && (
            <div className="flex items-center gap-2">
              <ScoreTile label={t.point} value={`${questionIndex + 1} / ${questions.length}`} valueColor={tokens.gold} />
              <ScoreTile label={t.remaining} value={questions.length - (questionIndex + 1)} valueColor="#FFF" />
              <ScoreTile label={t.score} value={score} valueColor="#FFF" />

              {setupConfig.timerEnabled && (
                <ScoreTile
                  label={t.timer}
                  value={`${timeLeft}s`}
                  valueColor={timeLeft <= 5 ? tokens.resultWrong : timeLeft <= 10 ? tokens.gold : "#FFF"}
                />
              )}

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
              <div style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "18px", color: "#FFF", lineHeight: 1.1 }}>
                {animalLabel}
              </div>
              <div style={{ fontSize: "0.7rem", color: tokens.greenSoft, fontStyle: "italic" }}>
                {setupConfig.especie}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ─── Main content ─── */}
      {gameState === "IN_PROGRESS" ? (
        <div className="flex-1 flex flex-col overflow-hidden" style={{ minHeight: 0 }}>
          <div style={{ height: 42, background: tokens.greenDeep, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, flexShrink: 0, padding: "0 16px", overflowX: "auto" }}>
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
                <div key={i} style={{ width: 28, height: 28, borderRadius: 7, background: bg, border, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: "11px", color: col, flexShrink: 0 }}>
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
                    {setupConfig.especie}
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
                  containerType: "size",
                }}
              >
                <div
                  style={{
                    position: "relative",
                    width: `min(100cqw, 780px, calc(100cqh * ${view.image.width / view.image.height}))`,
                    aspectRatio: `${view.image.width} / ${view.image.height}`,
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={view.image.src}
                    alt={view.image.titulo[language]}
                    style={{ display: "block", width: "100%", height: "100%", borderRadius: 6, background: "rgba(160,120,80,0.14)" }}
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
                className="flex items-center justify-between px-6 py-3 shrink-0"
                style={{ borderBottom: "1px solid rgba(100,70,40,0.18)" }}
              >
                <div className="flex items-center">
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#3A9E6F", marginRight: 8 }} />
                  <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#5C3D20", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                    {t.answer}
                  </span>
                </div>
                {setupConfig.timerEnabled && (
                  <span
                    style={{
                      fontSize: "0.78rem",
                      fontWeight: 800,
                      color: timeLeft <= 5 ? "#C94F3D" : "#1C3528",
                      background: timeLeft <= 5 ? "rgba(201,79,61,0.18)" : "rgba(28,53,40,0.1)",
                      padding: "2px 10px",
                      borderRadius: 999,
                    }}
                  >
                    ⏱ {timeLeft}s
                  </span>
                )}
              </div>

              <div className="flex-1 flex flex-col p-6 gap-5 overflow-y-auto">
                {setupConfig.answerMode !== "alternatives" && (
                  <form onSubmit={handleTextSubmit} className="flex flex-col gap-3">
                    <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "#5C3D20", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                      {t.typeAnswer}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={textAnswer}
                        disabled={questionState !== "AWAITING_TEXT_ANSWER"}
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
                          background: answeredViaTexto ? "#DDF1E4" : "rgba(180,140,100,0.25)",
                          border: emptyError
                            ? "1.5px solid #D9534F"
                            : answeredViaTexto
                            ? `1.5px solid ${tokens.resultDirect}`
                            : answeredWrongTypingOnly
                            ? `1.5px solid ${tokens.resultWrong}`
                            : "1.5px solid rgba(100,70,40,0.28)",
                          borderRadius: 5,
                          color: "#1A2E22",
                          padding: "10px 14px",
                          outline: "none",
                        }}
                      />
                      <button
                        type="submit"
                        disabled={questionState !== "AWAITING_TEXT_ANSWER"}
                        style={{
                          fontFamily: "'Nunito', sans-serif",
                          fontWeight: 700,
                          fontSize: "0.82rem",
                          borderRadius: 5,
                          background: "linear-gradient(135deg, #3A9E6F 0%, #2C7A54 100%)",
                          color: "#fff",
                          border: "none",
                          padding: "10px 18px",
                          cursor: questionState === "AWAITING_TEXT_ANSWER" ? "pointer" : "default",
                          opacity: questionState === "AWAITING_TEXT_ANSWER" ? 1 : 0.6,
                          boxShadow: "0 3px 12px rgba(58,158,111,0.3)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {t.confirmBtn}
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
                  <div style={{ color: "#2F8A5E", fontWeight: 800, fontSize: "0.95rem" }}>{t.pts10}</div>
                )}

                {feedback === "timeout" && (
                  <div style={{ background: "rgba(201,79,61,0.15)", border: `1.5px solid ${tokens.resultWrong}`, borderRadius: 8, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{ color: tokens.resultWrong, fontWeight: 800, fontSize: "0.88rem" }}>{t.timeUp} (0 {t.pts})</span>
                    <span style={{ color: "#1A2E22", fontWeight: 700, fontSize: "0.9rem" }}>
                      {t.was} <strong style={{ color: tokens.resultDirect }}>{question.name[language]}</strong>
                    </span>
                  </div>
                )}

                {answeredWrongTypingOnly && feedback !== "timeout" && (
                  <div style={{ background: "rgba(201,79,61,0.15)", border: `1.5px solid ${tokens.resultWrong}`, borderRadius: 8, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 4, animation: "shake 400ms ease-in-out" }}>
                    <span style={{ color: tokens.resultWrong, fontWeight: 800, fontSize: "0.88rem" }}>{t.pts0}</span>
                    <span style={{ color: "#1A2E22", fontWeight: 700, fontSize: "0.9rem" }}>
                      {t.was} <strong style={{ color: tokens.resultDirect }}>{question.name[language]}</strong>
                    </span>
                  </div>
                )}

                {mostrarAlternativas && (
                  <div className="flex flex-col gap-2">
                    {questionState === "SHOWING_ALTERNATIVES" && (
                      <p style={{ fontSize: "0.72rem", fontWeight: 700, color: setupConfig.answerMode === "alternatives" ? "#5C3D20" : "#D9534F", textTransform: "uppercase" }}>
                        {setupConfig.answerMode === "alternatives" ? t.chooseAlt : t.wrongTextChooseAlt}
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
                          bg = setupConfig.answerMode === "alternatives" ? tokens.resultDirect : tokens.resultAlt;
                          border = "1.5px solid " + bg;
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

                      const popupPts = setupConfig.answerMode === "alternatives" ? "+10" : "+5";

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
                            <div style={{ position: "absolute", bottom: "100%", right: 20, color: tokens.gold, fontFamily: "'Baloo 2', sans-serif", fontSize: 44, fontWeight: 800, animation: "floatUp 900ms forwards", pointerEvents: "none", textShadow: "0 2px 10px rgba(0,0,0,0.15)" }}>
                              {popupPts}
                            </div>
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
          especie={setupConfig.especie}
          t={t}
          lastGame={getPreviousGame()}
          playSame={() => setShowRestartModal(true)}
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
                {TRANSLATIONS[language].menu.cancel}
              </button>
              <button
                onClick={() => router.push("/")}
                style={{ padding: "8px 16px", borderRadius: 6, background: "#C4845A", color: "#FFF", fontWeight: 700, border: "none", cursor: "pointer" }}
              >
                {TRANSLATIONS[language].menu.confirm}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Restart Modal -> returns to Setup screen */}
      {showRestartModal && (
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
              {t.playAgainConfirm}
            </h2>
            <div className="flex gap-4 justify-end">
              <button
                onClick={() => setShowRestartModal(false)}
                style={{ padding: "8px 16px", borderRadius: 6, background: "rgba(100,70,40,0.15)", color: "#1A2E22", fontWeight: 700, border: "none", cursor: "pointer" }}
              >
                {TRANSLATIONS[language].menu.cancel}
              </button>
              <button
                onClick={() => {
                  setShowRestartModal(false);
                  setGameState("SETUP");
                }}
                style={{ padding: "8px 16px", borderRadius: 6, background: "#C4845A", color: "#FFF", fontWeight: 700, border: "none", cursor: "pointer" }}
              >
                {TRANSLATIONS[language].menu.confirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── SETUP SCREEN COMPONENT ─── */
function SetupScreen({
  config,
  setConfig,
  onStart,
  onReturnMenu,
  language,
  setLanguage,
  tSetup,
}: {
  config: GameSetupConfig;
  setConfig: React.Dispatch<React.SetStateAction<GameSetupConfig>>;
  onStart: (cfg: GameSetupConfig) => void;
  onReturnMenu: () => void;
  language: "pt" | "es";
  setLanguage: (lang: "pt" | "es") => void;
  tSetup: any;
}) {
  const dogImages = IMAGES.filter((img) => img.especie === "Canis lupus familiaris");
  const catImages = IMAGES.filter((img) => img.especie === "Felis catus");

  const dogStructures = getUniqueStructuresForSpecies("Canis lupus familiaris");
  const catStructures = getUniqueStructuresForSpecies("Felis catus");

  const currentSpeciesStructures = config.especie === "Felis catus" ? catStructures : dogStructures;

  const axialCount = currentSpeciesStructures.filter((s) => s.regiao === "axial").length;
  const toracicoCount = currentSpeciesStructures.filter((s) => s.regiao === "toracico").length;
  const pelvicoCount = currentSpeciesStructures.filter((s) => s.regiao === "pelvico").length;

  const poolStructures = currentSpeciesStructures.filter((s) => config.regions.includes(s.regiao));
  const poolCount = poolStructures.length;

  const effectiveQuestionCount =
    config.questionCount === "all" ? poolCount : Math.min(config.questionCount, poolCount);

  const maxScore = effectiveQuestionCount * 10;

  const allRegionsSelected = config.regions.length === 3;

  function toggleRegion(reg: Region) {
    setConfig((prev) => {
      const exists = prev.regions.includes(reg);
      if (exists && prev.regions.length === 1) {
        // Deve manter pelo menos uma região marcada
        return prev;
      }
      const nextRegions = exists
        ? prev.regions.filter((r) => r !== reg)
        : [...prev.regions, reg];
      const nextPoolCount = currentSpeciesStructures.filter((s) => nextRegions.includes(s.regiao)).length;
      let nextQCount = prev.questionCount;
      if (typeof nextQCount === "number" && nextQCount > nextPoolCount) {
        nextQCount = "all";
      }
      return { ...prev, regions: nextRegions, questionCount: nextQCount };
    });
  }

  function toggleAllRegions() {
    setConfig((prev) => ({
      ...prev,
      regions: ["axial", "toracico", "pelvico"],
    }));
  }

  function selectSpecies(especie: string) {
    const structs = especie === "Felis catus" ? catStructures : dogStructures;
    const nextPoolCount = structs.filter((s) => config.regions.includes(s.regiao)).length;
    let nextQCount = config.questionCount;
    if (typeof nextQCount === "number" && nextQCount > nextPoolCount) {
      nextQCount = "all";
    }
    setConfig((prev) => ({ ...prev, especie, questionCount: nextQCount }));
  }

  // Cálculo aproximado de questões por região para o Resumo da Partida
  const regionDistribution = (reg: Region, countInReg: number) => {
    if (!config.regions.includes(reg) || poolCount === 0 || effectiveQuestionCount === 0) return 0;
    const raw = (countInReg / poolCount) * effectiveQuestionCount;
    return Math.max(1, Math.round(raw));
  };

  const estAxial = regionDistribution("axial", axialCount);
  const estToracico = regionDistribution("toracico", toracicoCount);
  const estPelvico = regionDistribution("pelvico", pelvicoCount);

  const regionsSummaryLabel = allRegionsSelected
    ? tSetup.allRegions
    : config.regions
        .map((r) => (r === "axial" ? tSetup.axial : r === "toracico" ? tSetup.thoracic : tSetup.pelvic))
        .join(", ");

  return (
    <div
      className="size-full flex flex-col overflow-hidden min-h-screen"
      style={{ background: "#D9CBB5", fontFamily: "'Nunito', sans-serif", color: "#1A2E22" }}
    >
      {/* Top Header */}
      <header
        className="flex items-center justify-between px-8 shrink-0"
        style={{
          height: 64,
          background: "#1C3528",
          borderBottom: "1px solid rgba(0,0,0,0.25)",
        }}
      >
        <button
          onClick={onReturnMenu}
          className="flex items-center gap-2 px-4 py-1.5"
          style={{
            fontFamily: "'Nunito', sans-serif",
            fontWeight: 700,
            fontSize: "0.85rem",
            borderRadius: 8,
            background: "rgba(255,255,255,0.06)",
            color: "#E8E0CC",
            border: "1px solid rgba(255,255,255,0.18)",
            cursor: "pointer",
          }}
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M8.5 11L4 6.5L8.5 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Menu
        </button>

        <h1
          style={{
            fontFamily: "'Baloo 2', sans-serif",
            fontWeight: 800,
            fontSize: "1.55rem",
            color: "#FFFFFF",
            margin: 0,
          }}
        >
          {tSetup.title}
        </h1>

        {/* Language Toggle */}
        <div
          className="flex items-center"
          style={{
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: 999,
            padding: 3,
          }}
        >
          <button
            onClick={() => setLanguage("pt")}
            style={{
              background: language === "pt" ? "#3A9E6F" : "transparent",
              color: language === "pt" ? "#FFF" : "rgba(255,255,255,0.65)",
              border: "none",
              borderRadius: 999,
              padding: "4px 12px",
              fontSize: "0.75rem",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            PT
          </button>
          <button
            onClick={() => setLanguage("es")}
            style={{
              background: language === "es" ? "#3A9E6F" : "transparent",
              color: language === "es" ? "#FFF" : "rgba(255,255,255,0.65)",
              border: "none",
              borderRadius: 999,
              padding: "4px 12px",
              fontSize: "0.75rem",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            ES
          </button>
        </div>
      </header>

      {/* Main Content + Right Summary Sidebar */}
      <div className="flex-1 flex overflow-hidden" style={{ minHeight: 0 }}>
        {/* Left Configuration Area */}
        <div
          className="flex-1 overflow-y-auto"
          style={{ padding: "28px 36px", display: "flex", flexDirection: "column", gap: 22 }}
        >
          {/* Row 1: SISTEMA + ANIMAL */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            {/* SISTEMA */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <span style={sectionLabelStyle}>{tSetup.system}</span>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {/* Esquelético (Active) */}
                <button
                  type="button"
                  onClick={() => setConfig((prev) => ({ ...prev, sistema: "esqueletico" }))}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "14px 16px",
                    borderRadius: 12,
                    background: "#1C3528",
                    color: "#FFFFFF",
                    border: "2px solid #1C3528",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <RadioCircle selected={true} darkBg={true} />
                  <div>
                    <div style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "1.1rem", lineHeight: 1.1 }}>
                      {tSetup.skeletal}
                    </div>
                    <div style={{ fontSize: "0.76rem", color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>
                      {tSetup.skeletalSub}
                    </div>
                  </div>
                </button>

                {/* Nervoso (Disabled / Future) */}
                <button
                  type="button"
                  disabled
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "14px 16px",
                    borderRadius: 12,
                    background: "#EFE4D2",
                    color: "#1A2E22",
                    border: "1.5px solid rgba(100,70,40,0.18)",
                    cursor: "not-allowed",
                    opacity: 0.65,
                    textAlign: "left",
                  }}
                >
                  <RadioCircle selected={false} darkBg={false} />
                  <div>
                    <div style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "1.1rem", lineHeight: 1.1 }}>
                      {tSetup.nervous}
                    </div>
                    <div style={{ fontSize: "0.76rem", color: "#6B4A2A", fontWeight: 600 }}>
                      {tSetup.nervousSub}
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* ANIMAL */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <span style={sectionLabelStyle}>{tSetup.animal}</span>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {/* Cão */}
                {(() => {
                  const isDog = config.especie === "Canis lupus familiaris";
                  return (
                    <button
                      type="button"
                      onClick={() => selectSpecies("Canis lupus familiaris")}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "14px 16px",
                        borderRadius: 12,
                        background: isDog ? "#1C3528" : "#EFE4D2",
                        color: isDog ? "#FFFFFF" : "#1A2E22",
                        border: isDog ? "2px solid #1C3528" : "1.5px solid rgba(100,70,40,0.18)",
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <RadioCircle selected={isDog} darkBg={isDog} />
                      <div>
                        <div style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "1.1rem", lineHeight: 1.1 }}>
                          {tSetup.dog}
                        </div>
                        <div style={{ fontSize: "0.76rem", color: isDog ? "rgba(255,255,255,0.72)" : "#6B4A2A", fontWeight: 600 }}>
                          {dogImages.length} {tSetup.imagesCount} · {dogStructures.length}
                        </div>
                      </div>
                    </button>
                  );
                })()}

                {/* Gato */}
                {(() => {
                  const isCat = config.especie === "Felis catus";
                  return (
                    <button
                      type="button"
                      onClick={() => selectSpecies("Felis catus")}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "14px 16px",
                        borderRadius: 12,
                        background: isCat ? "#1C3528" : "#EFE4D2",
                        color: isCat ? "#FFFFFF" : "#1A2E22",
                        border: isCat ? "2px solid #1C3528" : "1.5px solid rgba(100,70,40,0.18)",
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <RadioCircle selected={isCat} darkBg={isCat} />
                      <div>
                        <div style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "1.1rem", lineHeight: 1.1 }}>
                          {tSetup.cat}
                        </div>
                        <div style={{ fontSize: "0.76rem", color: isCat ? "rgba(255,255,255,0.72)" : "#6B4A2A", fontWeight: 600 }}>
                          {catImages.length} {tSetup.imagesCount} · {catStructures.length}
                        </div>
                      </div>
                    </button>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Row 2: REGIÕES DO ESQUELETO */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div className="flex items-center justify-between">
              <div className="flex items-baseline gap-2">
                <span style={sectionLabelStyle}>{tSetup.regionsTitle}</span>
                <span style={{ fontSize: "0.74rem", color: "#6B4A2A", fontWeight: 600 }}>{tSetup.regionsHint}</span>
              </div>
              <button
                type="button"
                onClick={toggleAllRegions}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  background: allRegionsSelected ? "#2C7A54" : "rgba(44,122,84,0.15)",
                  color: allRegionsSelected ? "#FFF" : "#1C3528",
                  border: "none",
                  borderRadius: 999,
                  padding: "5px 14px",
                  fontSize: "0.78rem",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                <span
                  style={{
                    width: 15,
                    height: 15,
                    borderRadius: 4,
                    background: allRegionsSelected ? "#FFF" : "transparent",
                    border: allRegionsSelected ? "none" : "1.5px solid #1C3528",
                    color: "#2C7A54",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "10px",
                    fontWeight: 900,
                  }}
                >
                  {allRegionsSelected ? "✓" : ""}
                </span>
                {tSetup.allRegions}
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
              {[
                { id: "axial" as Region, title: tSetup.axial, sub: tSetup.axialSub, count: axialCount },
                { id: "toracico" as Region, title: tSetup.thoracic, sub: tSetup.thoracicSub, count: toracicoCount },
                { id: "pelvico" as Region, title: tSetup.pelvic, sub: tSetup.pelvicSub, count: pelvicoCount },
              ].map((reg) => {
                const checked = config.regions.includes(reg.id);
                return (
                  <button
                    key={reg.id}
                    type="button"
                    onClick={() => toggleRegion(reg.id)}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                      padding: "14px 18px",
                      borderRadius: 12,
                      background: "#EFE4D2",
                      border: checked ? "2px solid #2C7A54" : "1.5px solid rgba(100,70,40,0.2)",
                      cursor: "pointer",
                      textAlign: "left",
                      opacity: checked ? 1 : 0.65,
                      transition: "all 0.15s ease",
                    }}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: 5,
                          background: checked ? "#2C7A54" : "transparent",
                          border: checked ? "none" : "1.5px solid rgba(92,61,32,0.45)",
                          color: "#FFF",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "12px",
                          fontWeight: 900,
                          flexShrink: 0,
                        }}
                      >
                        {checked ? "✓" : ""}
                      </span>
                      <span style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "1.05rem", color: "#1A2E22" }}>
                        {reg.title}
                      </span>
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "#6B4A2A", fontWeight: 600, paddingLeft: 2 }}>
                      {reg.sub}
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "#2C7A54", fontWeight: 800, paddingLeft: 2, marginTop: 2 }}>
                      {reg.count} {tSetup.structuresCount}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 3: QUANTAS QUESTÕES */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span style={sectionLabelStyle}>{tSetup.howManyQuestions}</span>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
              {([5, 10, 15, 20, "all"] as const).map((qOpt) => {
                const isAll = qOpt === "all";
                const disabled = !isAll && qOpt > poolCount;
                const active = config.questionCount === qOpt;
                return (
                  <button
                    key={String(qOpt)}
                    type="button"
                    disabled={disabled}
                    onClick={() => setConfig((prev) => ({ ...prev, questionCount: qOpt }))}
                    style={{
                      padding: "12px 10px",
                      borderRadius: 12,
                      background: active ? "#2C7A54" : "#EFE4D2",
                      color: active ? "#FFFFFF" : "#1A2E22",
                      border: active ? "2px solid #2C7A54" : "1.5px solid rgba(100,70,40,0.18)",
                      cursor: disabled ? "not-allowed" : "pointer",
                      opacity: disabled ? 0.4 : 1,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <span style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "1.35rem", lineHeight: 1.1 }}>
                      {isAll ? tSetup.allQuestions : qOpt}
                    </span>
                    <span style={{ fontSize: "0.74rem", fontWeight: 600, color: active ? "rgba(255,255,255,0.8)" : "#6B4A2A" }}>
                      {isAll ? `${poolCount} ${tSetup.questionsWord}` : tSetup.questionsWord}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 4: COMO RESPONDER */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span style={sectionLabelStyle}>{tSetup.howToAnswer}</span>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                {
                  id: "standard" as AnswerMode,
                  title: tSetup.modeStandard,
                  sub: tSetup.modeStandardSub,
                  ptsLabel: "10 / 5 pts",
                },
                {
                  id: "alternatives" as AnswerMode,
                  title: tSetup.modeAlternatives,
                  sub: tSetup.modeAlternativesSub,
                  ptsLabel: "10 pts",
                },
                {
                  id: "typing" as AnswerMode,
                  title: tSetup.modeTyping,
                  sub: tSetup.modeTypingSub,
                  ptsLabel: "10 pts",
                },
              ].map((m) => {
                const selected = config.answerMode === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setConfig((prev) => ({ ...prev, answerMode: m.id }))}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "13px 18px",
                      borderRadius: 12,
                      background: selected ? "#EFE4D2" : "rgba(239,228,210,0.65)",
                      border: selected ? "2px solid #2C7A54" : "1.5px solid rgba(100,70,40,0.18)",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <div className="flex items-center gap-3.5">
                      <RadioCircle selected={selected} darkBg={false} greenAccent={true} />
                      <div>
                        <div style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "1.02rem", color: "#1A2E22", lineHeight: 1.15 }}>
                          {m.title}
                        </div>
                        <div style={{ fontSize: "0.78rem", color: "#6B4A2A", fontWeight: 600 }}>
                          {m.sub}
                        </div>
                      </div>
                    </div>
                    <span style={{ fontSize: "0.85rem", fontWeight: 800, color: selected ? "#2C7A54" : "#5C3D20" }}>
                      {m.ptsLabel}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 5: EXTRA (Cronômetro) */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span style={sectionLabelStyle}>{tSetup.extra}</span>
            <button
              type="button"
              onClick={() => setConfig((prev) => ({ ...prev, timerEnabled: !prev.timerEnabled }))}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 18px",
                borderRadius: 12,
                background: config.timerEnabled ? "#EFE4D2" : "rgba(239,228,210,0.65)",
                border: config.timerEnabled ? "2px solid #2C7A54" : "1.5px solid rgba(100,70,40,0.18)",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.15s ease",
              }}
            >
              <div className="flex items-center gap-3.5">
                {/* Toggle Switch */}
                <div
                  style={{
                    width: 44,
                    height: 24,
                    borderRadius: 999,
                    background: config.timerEnabled ? "#2C7A54" : "rgba(100,70,40,0.32)",
                    padding: 3,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: config.timerEnabled ? "flex-end" : "flex-start",
                    transition: "all 0.15s ease",
                    flexShrink: 0,
                  }}
                >
                  <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#FFF" }} />
                </div>
                <div>
                  <div style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "1.02rem", color: "#1A2E22", lineHeight: 1.15 }}>
                    {tSetup.timerTitle}
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "#6B4A2A", fontWeight: 600 }}>
                    {tSetup.timerSub}
                  </div>
                </div>
              </div>
              <span style={{ fontSize: "0.84rem", fontWeight: 800, color: config.timerEnabled ? "#2C7A54" : "#6B4A2A" }}>
                {config.timerEnabled ? tSetup.timerOn : tSetup.timerOff}
              </span>
            </button>
          </div>
        </div>

        {/* Right Summary Panel */}
        <aside
          style={{
            width: 390,
            background: "#142A1E",
            color: "#FFFFFF",
            padding: "28px 28px 22px 28px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            flexShrink: 0,
            overflowY: "auto",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#8DC9A0", letterSpacing: "0.14em", textTransform: "uppercase" }}>
              {tSetup.summaryTitle}
            </div>

            {/* Summary Table */}
            <div style={{ display: "flex", flexDirection: "column" }}>
              {[
                { label: tSetup.summarySystem, value: tSetup.skeletal },
                { label: tSetup.summaryAnimal, value: config.especie === "Felis catus" ? tSetup.cat : tSetup.dog },
                { label: tSetup.summaryRegions, value: regionsSummaryLabel },
                { label: tSetup.summaryInPool, value: `${poolCount} ${tSetup.structuresCount}` },
                { label: tSetup.summaryQuestions, value: String(effectiveQuestionCount) },
                { label: tSetup.summaryTimer, value: config.timerEnabled ? "30 s" : tSetup.timerOff },
              ].map((row, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "9px 0",
                    borderBottom: "1px solid rgba(141,201,160,0.12)",
                    fontSize: "0.86rem",
                  }}
                >
                  <span style={{ color: "rgba(255,255,255,0.65)", fontWeight: 600 }}>{row.label}</span>
                  <span style={{ color: "#FFFFFF", fontWeight: 800 }}>{row.value}</span>
                </div>
              ))}
            </div>

            {/* Questions by Region Breakdown */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
              <div style={{ fontSize: "0.72rem", fontWeight: 800, color: "#8DC9A0", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                {tSetup.questionsByRegion}
              </div>

              {[
                { id: "axial" as Region, label: tSetup.axial, est: estAxial },
                { id: "toracico" as Region, label: tSetup.thoracic, est: estToracico },
                { id: "pelvico" as Region, label: tSetup.pelvic, est: estPelvico },
              ].map((r) => {
                const pctBar = effectiveQuestionCount > 0 ? Math.min(100, (r.est / effectiveQuestionCount) * 100) : 0;
                return (
                  <div key={r.id} style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    <div className="flex justify-between items-center" style={{ fontSize: "0.82rem" }}>
                      <span style={{ fontWeight: 700, color: r.est > 0 ? "#FFF" : "rgba(255,255,255,0.4)" }}>{r.label}</span>
                      <span style={{ fontWeight: 800, color: r.est > 0 ? "#E8C252" : "rgba(255,255,255,0.35)" }}>
                        ~{r.est} {tSetup.questionsWord}
                      </span>
                    </div>
                    <div style={{ height: 6, borderRadius: 999, background: "rgba(255,255,255,0.1)", overflow: "hidden" }}>
                      <div style={{ width: `${pctBar}%`, height: "100%", background: "#3A9E6F", borderRadius: 999, transition: "width 0.2s ease" }} />
                    </div>
                  </div>
                );
              })}

              <p style={{ fontSize: "0.74rem", color: "rgba(141,201,160,0.65)", lineHeight: 1.4, marginTop: 4 }}>
                {tSetup.regionGuarantee}
              </p>
            </div>

            {/* Max Score Box */}
            <div
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(141,201,160,0.14)",
                borderRadius: 12,
                padding: "16px 20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#8DC9A0", letterSpacing: "0.12em", maxWidth: 120, lineHeight: 1.3 }}>
                {tSetup.maxScore}
              </span>
              <span style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "2.8rem", color: "#E8C252", lineHeight: 1 }}>
                {maxScore}
              </span>
            </div>

            {/* Start Button */}
            <button
              type="button"
              onClick={() => onStart(config)}
              style={{
                width: "100%",
                padding: "15px 24px",
                borderRadius: 12,
                background: "#3A9E6F",
                color: "#FFFFFF",
                border: "none",
                fontFamily: "'Baloo 2', sans-serif",
                fontWeight: 800,
                fontSize: "1.15rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                boxShadow: "0 6px 20px rgba(58,158,111,0.35)",
              }}
            >
              {tSetup.startBtn}
              <span>→</span>
            </button>
          </div>

          {/* Footer info */}
          <div className="flex items-start gap-2 pt-4" style={{ fontSize: "0.72rem", color: "rgba(141,201,160,0.6)", lineHeight: 1.35 }}>
            <span>ⓘ</span>
            <span>{tSetup.footerNote}</span>
          </div>
        </aside>
      </div>
    </div>
  );
}

const sectionLabelStyle: React.CSSProperties = {
  fontSize: "0.72rem",
  fontWeight: 800,
  color: "#5C3D20",
  letterSpacing: "0.14em",
  textTransform: "uppercase",
};

function RadioCircle({ selected, darkBg, greenAccent }: { selected: boolean; darkBg?: boolean; greenAccent?: boolean }) {
  const activeColor = greenAccent ? "#2C7A54" : darkBg ? "#E8C252" : "#1C3528";
  const borderColor = selected ? activeColor : darkBg ? "rgba(255,255,255,0.4)" : "rgba(92,61,32,0.38)";
  return (
    <span
      style={{
        width: 20,
        height: 20,
        borderRadius: "50%",
        border: `2px solid ${borderColor}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {selected && (
        <span
          style={{
            width: 9,
            height: 9,
            borderRadius: "50%",
            background: activeColor,
          }}
        />
      )}
    </span>
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
  const allDirect = results.length > 0 && results.every((r) => r === "DIRECT");
  const noWrongs = results.length > 0 && !results.some((r) => r === "WRONG");

  if (allDirect) {
    medals.push({ id: "perfect", pt: "Gabarito", es: "Pleno", color: "#C9962E" });
  } else if (noWrongs) {
    medals.push({ id: "flawless", pt: "Invicto", es: "Invicto", color: "#2C7A54" });
  }

  let currentStreakDirect = 0;
  let maxStreakDirect = 0;
  for (const r of results) {
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
  if (last3.length === 3 && last3.every((r) => r === "DIRECT") && !allDirect) {
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
    await new Promise((r) => setTimeout(r, 100));

    const node = document.getElementById(cardFormat === "story" ? "share-card-story" : "share-card-square");
    if (!node) {
      setIsGenerating(false);
      return null;
    }

    try {
      const blob = await toBlob(node, { pixelRatio: cardFormat === "story" ? 2 : 1.8 });
      setIsGenerating(false);
      return blob;
    } catch {
      setIsGenerating(false);
      return null;
    }
  };

  const pad = (n: number) => n.toString().padStart(2, "0");
  const getFileName = () => {
    const d = new Date();
    const dateStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const timeStr = `${pad(d.getHours())}${pad(d.getMinutes())}`;
    return `zootomia-${questions[0]?.views[0]?.image.id || "img"}-${dateStr}-${timeStr}-${cardFormat}.png`;
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
          <div style={{ transform: `scale(${cardFormat === "story" ? 324 / 540 : 360 / 600})`, transformOrigin: "top left", pointerEvents: "none" }}>
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
                  {medals.map((m) => (
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
            <button onClick={playSame} style={{ padding: "14px 24px", borderRadius: 8, background: tokens.greenDark, color: "#FFF", fontWeight: 700, border: "none", cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}>Jogar novamente</button>
          </div>
        </div>
      </div>
    </div>
  );
}
