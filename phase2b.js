const fs = require('fs');

let content = fs.readFileSync('src/app/game/page.tsx', 'utf-8');

const shareEndIndex = content.indexOf('</div>\n          </div>\n          \n          <div style={{ display: "flex", justifyContent: "flex-end", padding: "24px 40px", gap: 16 }}>');

if (shareEndIndex !== -1) {
  const toReviewStr = `
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
`;
  content = content.slice(0, shareEndIndex) + '</div>' + toReviewStr + content.slice(shareEndIndex + 6);
  fs.writeFileSync('src/app/game/page.tsx', content, 'utf-8');
}

