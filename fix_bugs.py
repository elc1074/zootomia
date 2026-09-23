import sys

# 1. Update SessionContext.tsx
with open('src/contexts/SessionContext.tsx', 'r', encoding='utf-8') as f:
    session_code = f.read()

session_code = session_code.replace(
    'getLastGame: () => SessionGame | null;',
    'getLastGame: () => SessionGame | null;\n  getPreviousGame: () => SessionGame | null;'
)

session_code = session_code.replace(
    """  const getLastGame = () => {
    if (history.length === 0) return null;
    return history[history.length - 1];
  };""",
    """  const getLastGame = () => {
    if (history.length === 0) return null;
    return history[history.length - 1];
  };

  const getPreviousGame = () => {
    if (history.length < 2) return null;
    return history[history.length - 2];
  };"""
)

session_code = session_code.replace(
    'value={{ history, addGame, getLastGame }}',
    'value={{ history, addGame, getLastGame, getPreviousGame }}'
)

with open('src/contexts/SessionContext.tsx', 'w', encoding='utf-8') as f:
    f.write(session_code)

# 2. Update page.tsx
with open('src/app/game/page.tsx', 'r', encoding='utf-8') as f:
    page_code = f.read()

page_code = page_code.replace(
    'const { addGame, getLastGame } = useSession();',
    'const { addGame, getLastGame, getPreviousGame } = useSession();'
)
page_code = page_code.replace(
    'lastGame={getLastGame()}',
    'lastGame={getPreviousGame()}'
)

# Fix alternatives animations
old_alt_logic = """                    let bg = "rgba(180,140,100,0.18)";
                    let border = "1.5px solid rgba(100,70,40,0.2)";
                    let color = "#1A2E22";
                    if (questionState === "ANSWERED") {
                      if (isCorrect) {
                        bg = "rgba(58,158,111,0.18)";
                        border = "1.5px solid #3A9E6F";
                        color = "#2F5C44";
                      } else if (isSelected) {
                        bg = "rgba(180,60,40,0.15)";
                        border = "1.5px solid rgba(180,60,40,0.5)";
                        color = "#7A2010";
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
                        }}
                      >"""

new_alt_logic = """                    let bg = "rgba(180,140,100,0.18)";
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
                        )}"""

page_code = page_code.replace(old_alt_logic, new_alt_logic)

old_letter_logic = """                            background:
                              isSelected && questionState === "ANSWERED"
                                ? (isCorrect ? "#3A9E6F" : "rgba(180,60,40,0.6)")
                                : "rgba(100,70,40,0.18)",
                            fontSize: "0.68rem",
                            fontWeight: 800,
                            color: isSelected && questionState === "ANSWERED" ? "#fff" : "rgba(92,61,32,0.8)","""

new_letter_logic = """                            background:
                              questionState === "ANSWERED" && (isSelected || isCorrect)
                                ? "rgba(255,255,255,0.25)"
                                : "rgba(100,70,40,0.18)",
                            fontSize: "0.68rem",
                            fontWeight: 800,
                            transitionDelay: delay,
                            color: questionState === "ANSWERED" && (isSelected || isCorrect) ? "#fff" : "rgba(92,61,32,0.8)","""

page_code = page_code.replace(old_letter_logic, new_letter_logic)

old_feedbacks = """                  {questionState === "ANSWERED" && feedback === "correct" && (
                    <div style={{ color: "#3A9E6F", fontWeight: 700, marginTop: 4 }}>{t.pts5}</div>
                  )}
                  {questionState === "ANSWERED" && feedback === "wrong" && (
                    <div style={{ color: "#D9534F", fontWeight: 700, marginTop: 4 }}>{t.pts0}</div>
                  )}"""

page_code = page_code.replace(old_feedbacks, "")

with open('src/app/game/page.tsx', 'w', encoding='utf-8') as f:
    f.write(page_code)

