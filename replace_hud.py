import sys

with open('src/app/game/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update ScoreTile function at the end
old_score_tile = """function ScoreTile({ label, value, color, large }: { label: string; value: number | string; color: string; large?: boolean }) {
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
}"""

new_score_tile = """function ScoreTile({ label, value, valueColor }: { label: string; value: React.ReactNode; valueColor: string }) {
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
}"""
content = content.replace(old_score_tile, new_score_tile)

# 2. Update header
start_header = content.find('{/* ─── Scoreboard header ─── */}')
end_header = content.find('</header>') + len('</header>')

if start_header != -1 and end_header != -1:
    new_header = """{/* ─── Scoreboard header ─── */}
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
      </header>"""
    content = content[:start_header] + new_header + content[end_header:]

# 3. Add progress bar and fix the container
old_main = """{/* ─── Main content ─── */}
      {gameState === "IN_PROGRESS" ? (
        <div className="flex-1 flex overflow-hidden" style={{ minHeight: 0 }}>"""

new_main = """{/* ─── Main content ─── */}
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
          <div className="flex-1 flex overflow-hidden" style={{ minHeight: 0 }}>"""

content = content.replace(old_main, new_main)

# Add closing div for the extra flex-col wrapper we added
end_main = """        </div>
      ) : (
        /* ─── FINISHED STATE ─── */"""
        
new_end_main = """          </div>
        </div>
      ) : (
        /* ─── FINISHED STATE ─── */"""
content = content.replace(end_main, new_end_main)

with open('src/app/game/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

