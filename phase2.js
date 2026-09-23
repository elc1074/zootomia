const fs = require('fs');

let content = fs.readFileSync('src/app/game/page.tsx', 'utf-8');

if (!content.includes('const [cardFormat, setCardFormat]')) {
  const stateHookIdx = content.indexOf('const [showExitModal, setShowExitModal] = useState(false);');
  if (stateHookIdx !== -1) {
      const formatState = `const [cardFormat, setCardFormat] = useState<"story" | "square">("story");\n  `;
      content = content.slice(0, stateHookIdx) + formatState + content.slice(stateHookIdx);
  }
}

const FINISHED_START = content.indexOf('{/* ─── FINISHED STATE ─── */}');
const EXIT_MODAL_START = content.indexOf('{/* Exit Modal */}');

if (FINISHED_START !== -1 && EXIT_MODAL_START !== -1) {
    const finishedStateStr = `{/* ─── FINISHED STATE ─── */}
        <FinishedScreen
          questions={questions}
          questionResults={questionResults}
          score={score}
          correctCount={correctCount}
          incorrectCount={incorrectCount}
          bestStreak={bestStreak}
          cardFormat={cardFormat}
          setCardFormat={setCardFormat}
          handleReturnMenu={handleReturnMenu}
          language={language}
          especie={especie}
          t={t}
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
      
      `;
    content = content.slice(0, FINISHED_START) + finishedStateStr + content.slice(EXIT_MODAL_START);
}

const finishedScreenCode = `
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

function FinishedScreen({ questions, questionResults, score, correctCount, incorrectCount, bestStreak, cardFormat, setCardFormat, handleReturnMenu, language, especie, t, playSame }: any) {
  const maxScore = questions.length * 10;
  const pct = maxScore > 0 ? score / maxScore : 0;
  const level = getLevel(pct);
  const medals = getMedals(questionResults);

  return (
    <div className="flex-1 flex overflow-hidden" style={{ background: "#C0A888" }}>
      <div style={{ width: 440, background: tokens.greenDeep, display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 40, overflowY: "auto" }}>
        <div style={{ display: "flex", background: "rgba(255,255,255,0.1)", borderRadius: 999, padding: 4, marginBottom: 24 }}>
          <button onClick={() => setCardFormat("story")} style={{ padding: "8px 16px", borderRadius: 999, border: "none", cursor: "pointer", background: cardFormat === "story" ? tokens.greenBrand : "transparent", color: cardFormat === "story" ? "#FFF" : "rgba(255,255,255,0.6)", fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.9rem" }}>Story 9:16</button>
          <button onClick={() => setCardFormat("square")} style={{ padding: "8px 16px", borderRadius: 999, border: "none", cursor: "pointer", background: cardFormat === "square" ? tokens.greenBrand : "transparent", color: cardFormat === "square" ? "#FFF" : "rgba(255,255,255,0.6)", fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.9rem" }}>Quadrado 1:1</button>
        </div>
        
        <div style={{ width: cardFormat === "story" ? 324 : 360, height: cardFormat === "story" ? 576 : 360, background: "#1C3528", borderRadius: 14, boxShadow: "0 18px 40px rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", color: "#FFF" }}>
          <span style={{ fontSize: "2rem", opacity: 0.5 }}>[Card]</span>
        </div>
        <p style={{ marginTop: 24, fontSize: "12px", color: "rgba(141,201,160,0.7)", fontFamily: "'Nunito', sans-serif" }}>Pré-visualização do card que será baixado</p>
      </div>

      <div className="flex-1 flex flex-col" style={{ position: "relative" }}>
        <div style={{ position: "absolute", inset: 0, background: "rgba(200,180,152,0.85)", backdropFilter: "blur(60px)", zIndex: 0 }} />
        
        <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", height: "100%", overflowY: "auto" }}>
          <header className="flex items-center justify-between px-8" style={{ height: 68, shrink: 0, borderBottom: "1px solid rgba(0,0,0,0.1)" }}>
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
                <div style={{ flex: 1, background: tokens.greenDark, borderRadius: 12, padding: "16px", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <span style={{ fontSize: 44, fontWeight: 800, color: tokens.gold, fontFamily: "'Baloo 2', sans-serif", lineHeight: 1 }}>{score}</span>
                  <span style={{ fontSize: 18, fontWeight: 700, color: "rgba(255,255,255,0.6)", fontFamily: "'Baloo 2', sans-serif" }}>/{maxScore}</span>
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
                    <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 6, background: "#FFF", border: \`1.5px solid \${m.color}\`, borderRadius: 999, padding: "2px 10px 2px 2px" }}>
                      <div style={{ width: 22, height: 22, borderRadius: "50%", background: m.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ color: "#FFF", fontSize: 10 }}>★</span>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 800, color: tokens.ink, fontFamily: "'Nunito', sans-serif" }}>{language === "pt" ? m.pt : m.es}</span>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                <button style={{ flex: 1, padding: "12px", borderRadius: 8, background: tokens.greenButton, color: "#FFF", fontWeight: 700, border: "none" }}>Baixar Imagem</button>
                <button style={{ padding: "12px", borderRadius: 8, background: "#FFF", border: "1.5px solid rgba(0,0,0,0.1)" }}>WhatsApp</button>
              </div>

            </div>
          </div>
          
          <div style={{ display: "flex", justifyContent: "flex-end", padding: "24px 40px", gap: 16 }}>
             <button style={{ padding: "14px 24px", borderRadius: 8, border: \`1.5px solid \${tokens.greenButton}\`, color: tokens.greenButton, fontWeight: 700, background: "transparent", cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}>Outra imagem</button>
             <button onClick={playSame} style={{ padding: "14px 24px", borderRadius: 8, background: tokens.greenDark, color: "#FFF", fontWeight: 700, border: "none", cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}>Jogar novamente</button>
          </div>

        </div>
      </div>
    </div>
  );
}
`;

if (!content.includes('function FinishedScreen')) {
    content += '\n' + finishedScreenCode;
}

fs.writeFileSync('src/app/game/page.tsx', content, 'utf-8');
