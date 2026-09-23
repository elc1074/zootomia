import sys

with open('src/app/game/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update textAnswer input styling
old_input_style = """                      style={{
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
                      }}"""
                      
new_input_style = """                      style={{
                        flex: 1,
                        fontFamily: "'Nunito', sans-serif",
                        fontWeight: 600,
                        fontSize: "0.88rem",
                        background: (answeredViaTexto && feedback === "correct") ? "#DDF1E4" : "rgba(180,140,100,0.25)",
                        border: (answeredViaTexto && feedback === "correct") ? "1.5px solid #2F8A5E" : (emptyError ? "1.5px solid #D9534F" : "1.5px solid rgba(100,70,40,0.28)"),
                        borderRadius: 5,
                        color: "#1A2E22",
                        padding: "10px 14px",
                        outline: "none",
                      }}"""
content = content.replace(old_input_style, new_input_style)

# 2. Update fx-direct success block
old_direct = """              {answeredViaTexto && (
                <div style={{ color: "#3A9E6F", fontWeight: 700 }}>{t.pts10}</div>
              )}"""

new_direct = """              {answeredViaTexto && (
                <div style={{ position: "relative" }}>
                  <div style={{ position: "absolute", bottom: "100%", left: 20, color: tokens.gold, fontFamily: "'Baloo 2', sans-serif", fontSize: 44, fontWeight: 800, animation: "floatUp 900ms forwards", pointerEvents: "none", textShadow: "0 2px 10px rgba(0,0,0,0.15)" }}>+10</div>
                  <div style={{ color: tokens.greenSoft, fontWeight: 800, fontSize: "1.1rem" }}>{t.firstTry}</div>
                </div>
              )}"""
content = content.replace(old_direct, new_direct)

# 3. Update alternatives styling
old_alt_styles = """                    let bg = "rgba(180,140,100,0.18)";
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
                    }"""
                    
new_alt_styles = """                    let bg = "rgba(180,140,100,0.18)";
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
                        delay = "300ms"; // Espera o tremor
                      }
                    }"""
content = content.replace(old_alt_styles, new_alt_styles)

old_alt_button = """                        style={{
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
                      
new_alt_button = """                        style={{
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
content = content.replace(old_alt_button, new_alt_button)

# 4. Also fix the letters (A, B, C, D) inside alternatives
old_alt_letter = """                            background:
                              isSelected && questionState === "ANSWERED"
                                ? (isCorrect ? "#3A9E6F" : "rgba(180,60,40,0.6)")
                                : "rgba(100,70,40,0.18)",
                            fontSize: "0.68rem",
                            fontWeight: 800,
                            color: isSelected && questionState === "ANSWERED" ? "#fff" : "rgba(92,61,32,0.8)",
                          }}"""
                          
new_alt_letter = """                            background:
                              questionState === "ANSWERED" && (isSelected || isCorrect)
                                ? "rgba(255,255,255,0.25)"
                                : "rgba(100,70,40,0.18)",
                            fontSize: "0.68rem",
                            fontWeight: 800,
                            transitionDelay: delay,
                            color: questionState === "ANSWERED" && (isSelected || isCorrect) ? "#fff" : "rgba(92,61,32,0.8)",
                          }}"""
content = content.replace(old_alt_letter, new_alt_letter)

# 5. Remove the old pts5 and pts0 feedbacks (they are replaced by the animation)
old_pts_feedback = """                  {questionState === "ANSWERED" && feedback === "correct" && (
                    <div style={{ color: "#3A9E6F", fontWeight: 700, marginTop: 4 }}>{t.pts5}</div>
                  )}
                  {questionState === "ANSWERED" && feedback === "wrong" && (
                    <div style={{ color: "#D9534F", fontWeight: 700, marginTop: 4 }}>{t.pts0}</div>
                  )}"""
content = content.replace(old_pts_feedback, "")

with open('src/app/game/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

