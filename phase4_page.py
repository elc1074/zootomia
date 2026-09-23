import sys

with open('src/app/game/page.tsx', 'r', encoding='utf-8') as f:
    page_code = f.read()

# 1. Add Imports
imports_hook = """import { useSession } from '@/contexts/SessionContext';"""
new_imports = """import { useSession } from '@/contexts/SessionContext';
import { ShareCardStory, ShareCardSquare } from './ShareCards';
import { getSharePlatform } from '../../platform/share';
import { toBlob } from 'html-to-image';"""

page_code = page_code.replace(imports_hook, new_imports)

# 2. Add generate image logic inside FinishedScreen
old_finished = """function FinishedScreen({ questions, questionResults, score, correctCount, incorrectCount, bestStreak, cardFormat, setCardFormat, handleReturnMenu, language, especie, t, playSame, lastGame }: any) {"""
new_finished = """function FinishedScreen({ questions, questionResults, score, correctCount, incorrectCount, bestStreak, cardFormat, setCardFormat, handleReturnMenu, language, especie, t, playSame, lastGame }: any) {
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
"""

page_code = page_code.replace(old_finished, new_finished)

# 3. Replace buttons in the UI
old_buttons = """                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
                  <button style={{ padding: "12px 24px", borderRadius: 8, background: tokens.greenButton, color: "#FFF", fontWeight: 700, border: "none", cursor: "pointer", flex: "1 1 100%" }}>Baixar imagem</button>
                  <button style={{ padding: "10px 16px", borderRadius: 8, background: "#FFF", border: "1.5px solid rgba(0,0,0,0.1)", color: tokens.ink, fontWeight: 700, cursor: "pointer", flex: 1 }}>WhatsApp</button>
                  <button style={{ padding: "10px 16px", borderRadius: 8, background: "#FFF", border: "1.5px solid rgba(0,0,0,0.1)", color: tokens.ink, fontWeight: 700, cursor: "pointer", flex: 1 }}>X / Twitter</button>
                  <button style={{ padding: "10px 16px", borderRadius: 8, background: "#FFF", border: "1.5px solid rgba(0,0,0,0.1)", color: tokens.ink, fontWeight: 700, cursor: "pointer", flex: 1 }}>Instagram</button>
                  <button style={{ padding: "10px 16px", borderRadius: 8, background: "#FFF", border: "1.5px solid rgba(0,0,0,0.1)", color: tokens.ink, fontWeight: 700, cursor: "pointer", flex: 1 }}>Copiar texto</button>
                </div>"""

new_buttons = """                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
                  <button onClick={handleDownload} disabled={isGenerating} style={{ padding: "12px 24px", borderRadius: 8, background: tokens.greenButton, color: "#FFF", fontWeight: 700, border: "none", cursor: isGenerating ? "wait" : "pointer", flex: "1 1 100%" }}>{isGenerating ? "Gerando..." : "Baixar imagem"}</button>
                  <button onClick={handleWhatsApp} disabled={isGenerating} style={{ padding: "10px 16px", borderRadius: 8, background: "#FFF", border: "1.5px solid rgba(0,0,0,0.1)", color: tokens.ink, fontWeight: 700, cursor: isGenerating ? "wait" : "pointer", flex: 1 }}>WhatsApp</button>
                  <button onClick={handleTwitter} disabled={isGenerating} style={{ padding: "10px 16px", borderRadius: 8, background: "#FFF", border: "1.5px solid rgba(0,0,0,0.1)", color: tokens.ink, fontWeight: 700, cursor: isGenerating ? "wait" : "pointer", flex: 1 }}>X / Twitter</button>
                  <button onClick={handleInstagram} disabled={isGenerating} style={{ padding: "10px 16px", borderRadius: 8, background: "#FFF", border: "1.5px solid rgba(0,0,0,0.1)", color: tokens.ink, fontWeight: 700, cursor: isGenerating ? "wait" : "pointer", flex: 1 }}>Instagram</button>
                  <button onClick={handleCopyText} disabled={isGenerating} style={{ padding: "10px 16px", borderRadius: 8, background: "#FFF", border: "1.5px solid rgba(0,0,0,0.1)", color: tokens.ink, fontWeight: 700, cursor: isGenerating ? "wait" : "pointer", flex: 1 }}>{feedbackMsg === "Copiado!" ? "Copiado!" : "Copiar texto"}</button>
                </div>"""

page_code = page_code.replace(old_buttons, new_buttons)

# 4. Inject offscreen renderer and feedback snackbar
old_return = """  return (
    <div className="flex-1 flex overflow-hidden" style={{ background: "#C0A888" }}>"""

new_return = """  const cardProps = { questions, questionResults, score, maxScore, correctCount, incorrectCount, bestStreak, level, medals, language, deltaInfo, lastGame, image: questions[0]?.views[0]?.image };

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
"""

page_code = page_code.replace(old_return, new_return)

with open('src/app/game/page.tsx', 'w', encoding='utf-8') as f:
    f.write(page_code)

