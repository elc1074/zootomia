import sys

with open('src/app/game/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

import_hook = """const [gameState, setGameState] = useState<"IN_PROGRESS" | "FINISHED">("IN_PROGRESS");"""

new_hook = """const [gameState, setGameState] = useState<"IN_PROGRESS" | "FINISHED">("IN_PROGRESS");
  const { addGame, getLastGame } = useSession();
  const hasSavedSession = React.useRef(false);

  React.useEffect(() => {
    if (gameState === "IN_PROGRESS") {
      hasSavedSession.current = false;
    }
    if (gameState === "FINISHED" && questions && !hasSavedSession.current) {
      hasSavedSession.current = true;
      addGame({
        imageId: questions[0].imageId,
        score,
        maxScore: questions.length * 10,
        correctCount,
        incorrectCount,
        finishedAt: new Date()
      });
    }
  }, [gameState, questions, score, correctCount, incorrectCount, addGame]);
"""

content = content.replace(import_hook, new_hook)

finished_screen_props = """        <FinishedScreen
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
          t={t}"""

new_finished_screen_props = """        <FinishedScreen
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
          lastGame={getLastGame()}"""

content = content.replace(finished_screen_props, new_finished_screen_props)

finished_screen_func = """function FinishedScreen({ questions, questionResults, score, correctCount, incorrectCount, bestStreak, cardFormat, setCardFormat, handleReturnMenu, language, especie, t, playSame }: any) {"""
new_finished_screen_func = """function FinishedScreen({ questions, questionResults, score, correctCount, incorrectCount, bestStreak, cardFormat, setCardFormat, handleReturnMenu, language, especie, t, playSame, lastGame }: any) {"""

content = content.replace(finished_screen_func, new_finished_screen_func)

# And now, inside FinishedScreen we compute the delta:
delta_logic = """  const maxScore = questions.length * 10;
  const pct = maxScore > 0 ? score / maxScore : 0;
  const level = getLevel(pct);
  const medals = getMedals(questionResults);"""

new_delta_logic = """  const maxScore = questions.length * 10;
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
  }"""

content = content.replace(delta_logic, new_delta_logic)

# In the UI we add the sequence/streak box and comparison box (Phase 2 & 3 missing part)
old_stats = """              <div style={{ display: "flex", gap: 16 }}>
                <div style={{ flex: 1, background: tokens.greenDark, borderRadius: 12, padding: "16px", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <span style={{ fontSize: 44, fontWeight: 800, color: tokens.gold, fontFamily: "'Baloo 2', sans-serif", lineHeight: 1 }}>{score}</span>
                  <span style={{ fontSize: 18, fontWeight: 700, color: "rgba(255,255,255,0.6)", fontFamily: "'Baloo 2', sans-serif" }}>/{maxScore}</span>
                </div>"""

new_stats = """              <div style={{ display: "flex", gap: 16 }}>
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
                </div>"""

content = content.replace(old_stats, new_stats)

with open('src/app/game/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

