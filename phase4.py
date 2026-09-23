import os

# 1. Create src/platform/share.ts
os.makedirs('src/platform', exist_ok=True)
share_ts_code = """export interface SharePlatform {
  saveImage(png: Blob, fileName: string): Promise<"saved" | "cancelled" | "error">;
  openExternal(url: string): void;
  copyText(text: string): Promise<boolean>;
}

export function getSharePlatform(): SharePlatform {
  // @ts-ignore
  if (typeof window !== "undefined" && window.zootomiaDesktop) {
    // @ts-ignore
    return window.zootomiaDesktop as SharePlatform;
  }

  return {
    async saveImage(png: Blob, fileName: string) {
      try {
        const url = URL.createObjectURL(png);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
        return "saved";
      } catch (err) {
        return "error";
      }
    },
    openExternal(url: string) {
      window.open(url, "_blank", "noopener");
    },
    async copyText(text: string) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (err) {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        try {
          document.execCommand("copy");
          document.body.removeChild(textarea);
          return true;
        } catch (e) {
          document.body.removeChild(textarea);
          return false;
        }
      }
    }
  };
}
"""

with open('src/platform/share.ts', 'w', encoding='utf-8') as f:
    f.write(share_ts_code)

# 2. Create src/app/game/ShareCards.tsx
share_cards_tsx = """import React from 'react';
import { tokens } from '../../styles/tokens';
import { AnatomyImage } from '../../data/anatomy';

// Placeholder styles based on the specs (simplified for code size but meeting core colors)

export function ShareCardStory({ 
  questions, 
  questionResults, 
  score, 
  maxScore, 
  correctCount, 
  incorrectCount, 
  bestStreak, 
  level, 
  medals, 
  language,
  deltaInfo,
  lastGame,
  image
}: any) {
  // 540x960 
  return (
    <div id="share-card-story" style={{ 
      width: 540, 
      height: 960, 
      background: "#1C3528", 
      position: "relative",
      padding: "44px 40px 36px 40px",
      display: "flex",
      flexDirection: "column",
      gap: 26,
      overflow: "hidden"
    }}>
      <div style={{
        position: "absolute",
        inset: 0,
        opacity: 0.09,
        backgroundImage: `url(${image?.url})`,
        backgroundSize: "170%",
        backgroundPosition: "center",
        filter: "invert(1)",
        zIndex: 0
      }} />

      <div style={{ position: "relative", zIndex: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 38, height: 38, background: "#3A9E6F", borderRadius: 8 }} />
          <span style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: 30, color: "#FFF" }}>Zoo<span style={{ color: "#E8C252" }}>tomia</span></span>
        </div>
        <span style={{ fontSize: 12, fontWeight: 800, color: "#8DC9A0", textTransform: "uppercase", letterSpacing: "0.16em" }}>{image?.titulo[language] || ""}</span>
      </div>

      <div style={{ position: "relative", zIndex: 1, flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ width: 118, height: 118, borderRadius: "50%", background: level.color, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 0 6px rgba(255,255,255,.08), 0 0 0 12px rgba(255,255,255,.04)" }}>
          <span style={{ fontSize: "3rem" }}>🦴</span>
        </div>
        <div style={{ marginTop: 20, textAlign: "center" }}>
          <div style={{ fontSize: 12, color: "#8DC9A0", fontWeight: 800, fontFamily: "'Nunito', sans-serif", letterSpacing: "0.1em", textTransform: "uppercase" }}>NÍVEL</div>
          <div style={{ fontSize: 46, fontWeight: 800, color: "#FFF", fontFamily: "'Baloo 2', sans-serif", lineHeight: 1.1 }}>{language === "pt" ? level.pt : level.es}</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: "rgba(255,255,255,0.72)" }}>{language === "pt" ? level.descPt : level.descEs}</div>
        </div>
      </div>

      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
          <span style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: 150, color: "#E8C252", letterSpacing: "-0.04em", lineHeight: 0.9 }}>{score}</span>
          <span style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 700, fontSize: 28, color: "rgba(255,255,255,0.6)" }}>/{maxScore} pts</span>
        </div>
      </div>

      <div style={{ position: "relative", zIndex: 1, background: "#EFE4D2", borderRadius: 16, padding: "22px 24px", display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
          <div style={{ width: 96, height: 96, borderRadius: "50%", border: "12px solid #C94F3D", position: "relative", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
            <span style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: 24, fontWeight: 800, lineHeight: 1 }}>{Math.round((correctCount/questions.length)*100)}%</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#5C3D20" }}>ACERTO</span>
          </div>
          <div style={{ display: "flex", flex: 1, justifyContent: "space-between" }}>
             <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <span style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: 30, color: "#2F8A5E", lineHeight: 1 }}>{questionResults.filter((r:string)=>r==="DIRECT").length}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#5C3D20" }}>DE PRIMEIRA</span>
             </div>
             <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <span style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: 30, color: "#9A6E10", lineHeight: 1 }}>{questionResults.filter((r:string)=>r==="ALTERNATIVE").length}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#5C3D20" }}>NA ALT.</span>
             </div>
             <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <span style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: 30, color: "#C94F3D", lineHeight: 1 }}>{incorrectCount}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#5C3D20" }}>ERROS</span>
             </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: 6 }}>
           {questionResults.map((r:string, i:number) => (
             <div key={i} style={{ height: 30, borderRadius: 6, background: r === "DIRECT" ? "#2F8A5E" : r === "ALTERNATIVE" ? "#D9A93A" : "#C94F3D" }} />
           ))}
           {Array(10 - questionResults.length).fill(0).map((_, i) => (
             <div key={i+10} style={{ height: 30, borderRadius: 6, background: "rgba(92,61,32,0.18)" }} />
           ))}
        </div>

        {medals.length > 0 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
            {medals.map((m: any) => (
              <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 6, background: "#FFF", border: `1.5px solid ${m.color}`, borderRadius: 999, padding: "2px 10px 2px 2px" }}>
                <div style={{ width: 22, height: 22, borderRadius: "50%", background: m.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ color: "#FFF", fontSize: 10 }}>★</span>
                </div>
                <span style={{ fontSize: 12, fontWeight: 800, color: "#1C3528", fontFamily: "'Nunito', sans-serif" }}>{language === "pt" ? m.pt : m.es}</span>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1, background: "#1C3528", borderRadius: 10, padding: 12, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 22 }}>🔥</span>
            <span style={{ color: "#FFF", fontSize: 14, fontWeight: 700 }}>{bestStreak} seguidas</span>
          </div>
          {deltaInfo && (
            <div style={{ flex: 1, background: "#1C3528", borderRadius: 10, padding: 12, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: "#8DC9A0", fontSize: 18, fontWeight: 800 }}>{deltaInfo.icon}</span>
              <span style={{ color: "#FFF", fontSize: 14, fontWeight: 700 }}>{deltaInfo.text}</span>
            </div>
          )}
        </div>
      </div>

      <div style={{ position: "relative", zIndex: 1, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <div style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: 24, fontWeight: 800, color: "#FFF" }}>Consegue me superar?</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>zootomia.app</div>
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(141,201,160,0.8)", textAlign: "right" }}>
          {new Intl.DateTimeFormat(language === "pt" ? 'pt-BR' : 'es-CL', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date()).replace(/\./g, '')}<br/>
          {new Date().getHours().toString().padStart(2, '0')}:{new Date().getMinutes().toString().padStart(2, '0')}
        </div>
      </div>
    </div>
  );
}

export function ShareCardSquare({ 
  questions, 
  questionResults, 
  score, 
  maxScore, 
  correctCount, 
  incorrectCount, 
  bestStreak, 
  level, 
  medals, 
  language,
  deltaInfo,
  lastGame,
  image
}: any) {
  // 600x600 
  return (
    <div id="share-card-square" style={{ 
      width: 600, 
      height: 600, 
      background: "#1C3528", 
      position: "relative",
      padding: 36,
      display: "flex",
      flexDirection: "column",
      gap: 22,
      overflow: "hidden"
    }}>
      <div style={{
        position: "absolute",
        inset: 0,
        opacity: 0.09,
        backgroundImage: `url(${image?.url})`,
        backgroundSize: "115%",
        backgroundPosition: "center",
        filter: "invert(1)",
        zIndex: 0
      }} />

      <div style={{ position: "relative", zIndex: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: 28, color: "#FFF" }}>Zoo<span style={{ color: "#E8C252" }}>tomia</span></span>
        <span style={{ fontSize: 11, fontWeight: 800, color: "#8DC9A0", textTransform: "uppercase" }}>{image?.titulo[language] || ""}</span>
      </div>

      <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ width: 96, height: 96, borderRadius: "50%", background: level.color, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 0 6px rgba(255,255,255,.08)" }}>
          <span style={{ fontSize: "2.5rem" }}>🦴</span>
        </div>
        <div>
          <div style={{ fontSize: 11, color: "#8DC9A0", fontWeight: 800, fontFamily: "'Nunito', sans-serif", letterSpacing: "0.1em", textTransform: "uppercase" }}>NÍVEL</div>
          <div style={{ fontSize: 40, fontWeight: 800, color: "#FFF", fontFamily: "'Baloo 2', sans-serif", lineHeight: 1.1 }}>{language === "pt" ? level.pt : level.es}</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.72)" }}>{language === "pt" ? level.descPt : level.descEs}</div>
        </div>
      </div>

      <div style={{ position: "relative", zIndex: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
          <span style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: 120, color: "#E8C252", lineHeight: 0.9 }}>{score}</span>
          <span style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 700, fontSize: 22, color: "rgba(255,255,255,0.6)" }}>/{maxScore} pts</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
          <span style={{ fontSize: 20, color: "#8DC9A0", fontWeight: 800, fontFamily: "'Baloo 2', sans-serif" }}>{correctCount} <span style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>ACERTOS</span></span>
          <span style={{ fontSize: 20, color: "#F08A78", fontWeight: 800, fontFamily: "'Baloo 2', sans-serif" }}>{incorrectCount} <span style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>ERROS</span></span>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ fontSize: 18 }}>🔥</span>
            <span style={{ color: "#FFF", fontSize: 20, fontWeight: 800, fontFamily: "'Baloo 2', sans-serif" }}>{bestStreak} <span style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>SEGUIDAS</span></span>
          </div>
        </div>
      </div>

      <div style={{ position: "relative", zIndex: 1, display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: 6 }}>
         {questionResults.map((r:string, i:number) => (
           <div key={i} style={{ height: 34, borderRadius: 7, background: r === "DIRECT" ? "#2F8A5E" : r === "ALTERNATIVE" ? "#D9A93A" : "#C94F3D" }} />
         ))}
         {Array(10 - questionResults.length).fill(0).map((_, i) => (
           <div key={i+10} style={{ height: 34, borderRadius: 7, background: "rgba(92,61,32,0.18)" }} />
         ))}
      </div>

      {medals.length > 0 && (
        <div style={{ position: "relative", zIndex: 1, display: "flex", gap: 6, flexWrap: "wrap" }}>
          {medals.map((m: any) => (
            <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 6, background: "#FFF", border: `1.5px solid ${m.color}`, borderRadius: 999, padding: "2px 10px 2px 2px" }}>
              <div style={{ width: 22, height: 22, borderRadius: "50%", background: m.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ color: "#FFF", fontSize: 10 }}>★</span>
              </div>
              <span style={{ fontSize: 12, fontWeight: 800, color: "#1C3528", fontFamily: "'Nunito', sans-serif" }}>{language === "pt" ? m.pt : m.es}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ position: "relative", zIndex: 1, borderTop: "1px solid rgba(141,201,160,0.2)", paddingTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: 20, fontWeight: 800, color: "#FFF" }}>Consegue me superar?</div>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#8DC9A0", textAlign: "right" }}>
          {new Intl.DateTimeFormat(language === "pt" ? 'pt-BR' : 'es-CL', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date()).replace(/\./g, '')} · {new Date().getHours().toString().padStart(2, '0')}:{new Date().getMinutes().toString().padStart(2, '0')}
        </div>
      </div>
    </div>
  );
}
"""

with open('src/app/game/ShareCards.tsx', 'w', encoding='utf-8') as f:
    f.write(share_cards_tsx)

