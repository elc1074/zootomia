"use client";

import Link from "next/link";
import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

const ALL_QUESTIONS = [
  { id: 1, image: "/images/dog_bone.svg", species: "dog", correctAnswer: "Fêmur" },
  { id: 2, image: "/images/dog_bone.svg", species: "dog", correctAnswer: "Crânio" },
  { id: 3, image: "/images/dog_bone.svg", species: "dog", correctAnswer: "Pelve" },
  { id: 4, image: "/images/dog_bone.svg", species: "dog", correctAnswer: "Úmero" },
  { id: 5, image: "/images/dog_bone.svg", species: "dog", correctAnswer: "Rádio" },
  { id: 6, image: "/images/cat_bone.svg", species: "cat", correctAnswer: "Fíbula" },
  { id: 7, image: "/images/cat_bone.svg", species: "cat", correctAnswer: "Esterno" },
  { id: 8, image: "/images/cat_bone.svg", species: "cat", correctAnswer: "Escápula" },
  { id: 9, image: "/images/cat_bone.svg", species: "cat", correctAnswer: "Vértebra" },
  { id: 10, image: "/images/cat_bone.svg", species: "cat", correctAnswer: "Tíbia" },
];

export default function Game() {
  const router = useRouter();
  
  // Game state
  const [questions, setQuestions] = useState<typeof ALL_QUESTIONS>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [gameState, setGameState] = useState<"IN_PROGRESS" | "FINISHED">("IN_PROGRESS");
  const [questionState, setQuestionState] = useState<"AWAITING_TEXT_ANSWER" | "SHOWING_ALTERNATIVES" | "ANSWERED">("AWAITING_TEXT_ANSWER");
  
  // Interaction state
  const [textAnswer, setTextAnswer] = useState("");
  const [emptyError, setEmptyError] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  
  // Modals / Image errors
  const [showExitModal, setShowExitModal] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  // Initialize game
  useEffect(() => {
    // Shuffle and pick 10
    const shuffled = [...ALL_QUESTIONS].sort(() => Math.random() - 0.5).slice(0, 10);
    setQuestions(shuffled);
  }, []);

  const currentQuestion = questions[questionIndex];

  // Generate alternatives for the current question
  const alternatives = useMemo(() => {
    if (!currentQuestion) return [];
    
    // Pick 3 random incorrect answers from ALL_QUESTIONS
    const others = ALL_QUESTIONS
      .filter(q => q.correctAnswer.toLowerCase() !== currentQuestion.correctAnswer.toLowerCase())
      .map(q => q.correctAnswer);
    
    // Shuffle and pick 3 unique
    const uniqueOthers = Array.from(new Set(others)).sort(() => Math.random() - 0.5).slice(0, 3);
    
    // Combine with correct answer
    const combined = [currentQuestion.correctAnswer, ...uniqueOthers];
    
    // Shuffle final options
    return combined.sort(() => Math.random() - 0.5);
  }, [currentQuestion]);

  function advanceQuestion() {
    setTimeout(() => {
      setFeedback(null);
      setSelectedOption(null);
      setTextAnswer("");
      setQuestionState("AWAITING_TEXT_ANSWER");
      setImageError(false);
      
      if (questionIndex + 1 >= questions.length) {
        setGameState("FINISHED");
      } else {
        setQuestionIndex(i => i + 1);
      }
    }, 1100);
  }

  function normalize(str: string) {
    return str.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  function handleTextSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!textAnswer.trim()) {
      setEmptyError(true);
      return;
    }
    setEmptyError(false);
    
    const isCorrect = normalize(textAnswer) === normalize(currentQuestion.correctAnswer);
    
    if (isCorrect) {
      setFeedback("correct");
      setScore(s => s + 10);
      setCorrectCount(c => c + 1);
      setQuestionState("ANSWERED");
      advanceQuestion();
    } else {
      setFeedback("wrong");
      setQuestionState("SHOWING_ALTERNATIVES");
    }
  }

  function handleAlternativeSelect(opt: string) {
    if (questionState === "ANSWERED") return;
    
    const isCorrect = normalize(opt) === normalize(currentQuestion.correctAnswer);
    setSelectedOption(alternatives.indexOf(opt));
    setFeedback(isCorrect ? "correct" : "wrong");
    setQuestionState("ANSWERED");
    
    if (isCorrect) {
      setScore(s => s + 5);
      setCorrectCount(c => c + 1);
    } else {
      setIncorrectCount(c => c + 1);
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

  if (questions.length === 0) return null;

  return (
    <div
      className="size-full flex flex-col overflow-hidden min-h-screen"
      style={{ background: "#C8B498", fontFamily: "'Nunito', sans-serif" }}
    >
      {/* Header */}
      <header
        className="flex items-center justify-between px-8 py-0 shrink-0"
        style={{
          background: "#1C3528",
          height: 56,
          borderBottom: "1px solid rgba(0,0,0,0.25)",
        }}
      >
        <button
          onClick={handleReturnMenu}
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
          }}
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M9 11.5L4 6.5l5-5" stroke="#8DC9A0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Menu
        </button>

        {gameState === "IN_PROGRESS" && (
          <div className="flex items-center gap-1">
            <ScoreTile label="PONTUAÇÃO" value={score} color="#8DC9A0" large />
            <div style={{ width: 1, height: 32, background: "rgba(141,201,160,0.15)", margin: "0 8px" }} />
            <ScoreTile label="QUESTÃO" value={`${questionIndex + 1} / ${questions.length}`} color="#E8C252" />
            <div style={{ width: 1, height: 32, background: "rgba(141,201,160,0.15)", margin: "0 8px" }} />
            <ScoreTile label="RESTANTES" value={questions.length - questionIndex} color="#C4845A" />
          </div>
        )}
        
        {/* Empty space for flex alignment */}
        <div style={{ width: 120 }}></div>
      </header>

      {/* Main Content */}
      {gameState === "IN_PROGRESS" ? (
        <div className="flex-1 flex overflow-hidden" style={{ minHeight: 0 }}>
          {/* Left: Image */}
          <div
            className="flex flex-col overflow-hidden"
            style={{
              flex: "0 0 55%",
              borderRight: "1px solid rgba(100,70,40,0.22)",
              background: "#C0A888",
            }}
          >
            <div className="flex-1 flex items-center justify-center p-6 relative">
              {imageError ? (
                <div style={{ color: "rgba(180,60,40,0.8)", fontWeight: 700, fontSize: "1.2rem" }}>
                  Falha ao carregar imagem
                </div>
              ) : (
                <div className="relative w-full h-full max-w-lg max-h-lg flex items-center justify-center">
                  <Image 
                    src={currentQuestion.image} 
                    alt="Modelo Anatômico"
                    fill
                    style={{ objectFit: "contain" }}
                    onError={() => setImageError(true)}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Right: Controls */}
          <div
            className="flex flex-col overflow-hidden"
            style={{ flex: "0 0 45%", background: "#BEA882" }}
          >
            <div className="flex-1 flex flex-col p-8 gap-6 overflow-y-auto">
              
              {questionState === "AWAITING_TEXT_ANSWER" && (
                <form onSubmit={handleTextSubmit} className="flex flex-col gap-3">
                  <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "#5C3D20", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    Identifique a estrutura:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={textAnswer}
                      onChange={(e) => { setTextAnswer(e.target.value); setEmptyError(false); }}
                      placeholder="Digite sua resposta..."
                      style={{
                        flex: 1,
                        fontFamily: "'Nunito', sans-serif",
                        fontWeight: 600,
                        fontSize: "0.95rem",
                        background: "rgba(255,255,255,0.8)",
                        border: emptyError ? "2px solid #D9534F" : "2px solid rgba(100,70,40,0.28)",
                        borderRadius: 5,
                        color: "#1A2E22",
                        padding: "12px 14px",
                        outline: "none",
                      }}
                    />
                    <button
                      type="submit"
                      style={{
                        fontFamily: "'Nunito', sans-serif",
                        fontWeight: 700,
                        fontSize: "0.9rem",
                        borderRadius: 5,
                        background: "linear-gradient(135deg, #3A9E6F 0%, #2C7A54 100%)",
                        color: "#fff",
                        border: "none",
                        padding: "0 24px",
                        cursor: "pointer",
                      }}
                    >
                      Enviar
                    </button>
                  </div>
                  {emptyError && (
                    <span style={{ color: "#D9534F", fontSize: "0.8rem", fontWeight: 700 }}>
                      É necessário fornecer uma resposta
                    </span>
                  )}
                  {feedback === "correct" && (
                    <div style={{ color: "#3A9E6F", fontWeight: 700, marginTop: 10 }}>Correto! +10 pontos</div>
                  )}
                </form>
              )}

              {questionState !== "AWAITING_TEXT_ANSWER" && (
                <div className="flex flex-col gap-3">
                  <p style={{ fontSize: "0.85rem", fontWeight: 700, color: "#D9534F", textTransform: "uppercase" }}>
                    {questionState === "SHOWING_ALTERNATIVES" && !feedback ? "Incorreto. Escolha uma alternativa:" : ""}
                  </p>
                  
                  {alternatives.map((opt, idx) => {
                    const isSelected = selectedOption === idx;
                    const isCorrect = normalize(opt) === normalize(currentQuestion.correctAnswer);
                    
                    let bg = "rgba(255,255,255,0.6)";
                    let border = "2px solid rgba(100,70,40,0.2)";
                    
                    if (questionState === "ANSWERED") {
                      if (isCorrect) {
                        bg = "rgba(58,158,111,0.2)";
                        border = "2px solid #3A9E6F";
                      } else if (isSelected) {
                        bg = "rgba(217,83,79,0.2)";
                        border = "2px solid #D9534F";
                      }
                    }

                    return (
                      <button
                        key={opt}
                        onClick={() => handleAlternativeSelect(opt)}
                        disabled={questionState === "ANSWERED"}
                        className="text-left w-full"
                        style={{
                          fontFamily: "'Nunito', sans-serif",
                          fontWeight: 700,
                          fontSize: "0.95rem",
                          borderRadius: 6,
                          background: bg,
                          border: border,
                          padding: "14px 16px",
                          color: "#1A2E22",
                          cursor: questionState === "ANSWERED" ? "default" : "pointer",
                        }}
                      >
                        {opt}
                      </button>
                    );
                  })}
                  
                  {questionState === "ANSWERED" && feedback === "correct" && (
                    <div style={{ color: "#3A9E6F", fontWeight: 700, marginTop: 10 }}>Correto! +5 pontos</div>
                  )}
                  {questionState === "ANSWERED" && feedback === "wrong" && (
                    <div style={{ color: "#D9534F", fontWeight: 700, marginTop: 10 }}>Incorreto! 0 pontos</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* FINISHED STATE */
        <div className="flex-1 flex flex-col items-center justify-center" style={{ background: "#C8B498" }}>
          <h2 style={{ fontSize: "2.5rem", fontWeight: 800, color: "#1A2E22", fontFamily: "'Baloo 2', sans-serif" }}>Fim de Jogo!</h2>
          <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "#5C3D20", margin: "20px 0" }}>
            Pontuação Final: <span style={{ color: "#3A9E6F", fontSize: "1.8rem" }}>{score}</span>
          </div>
          
          <div className="flex gap-10 my-8">
            <div className="flex flex-col items-center">
              <span style={{ fontSize: "2rem", fontWeight: 800, color: "#3A9E6F" }}>{correctCount}</span>
              <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#5C3D20", textTransform: "uppercase" }}>Corretas</span>
            </div>
            <div className="flex flex-col items-center">
              <span style={{ fontSize: "2rem", fontWeight: 800, color: "#D9534F" }}>{incorrectCount}</span>
              <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#5C3D20", textTransform: "uppercase" }}>Incorretas</span>
            </div>
          </div>
          
          {/* Simple visual chart */}
          <div style={{ width: 300, height: 24, background: "rgba(0,0,0,0.1)", borderRadius: 12, overflow: "hidden", display: "flex", marginBottom: 40 }}>
            {correctCount > 0 && (
              <div style={{ flex: correctCount, background: "#3A9E6F" }} title="Corretas" />
            )}
            {incorrectCount > 0 && (
              <div style={{ flex: incorrectCount, background: "#D9534F" }} title="Incorretas" />
            )}
          </div>
          
          <button
            onClick={() => router.push("/")}
            style={{
              padding: "12px 32px", borderRadius: 8, background: "#3A9E6F", color: "#FFF", fontWeight: 700, fontSize: "1.1rem", border: "none", cursor: "pointer", fontFamily: "'Nunito', sans-serif"
            }}
          >
            Voltar ao Menu
          </button>
        </div>
      )}

      {/* Exit Modal */}
      {showExitModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <div style={{ background: "#C8B498", padding: 32, borderRadius: 8, boxShadow: "0 10px 30px rgba(0,0,0,0.5)", border: "1px solid rgba(100,70,40,0.2)", maxWidth: 400 }}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#1A2E22", marginBottom: 24, fontFamily: "'Nunito', sans-serif" }}>
              Tem certeza de que deseja voltar à tela principal? Seu progresso não será salvo.
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