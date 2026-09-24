import sys

with open('src/app/gallery/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Import IMAGES properly and add toggle state
imports_old = """  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const { language } = useLanguage();"""
imports_new = """  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [showNames, setShowNames] = useState(false);
  const { language } = useLanguage();"""
content = content.replace(imports_old, imports_new)

# 2. Modify enlarged viewer to add pins
viewer_old = """          <div style={{ position: "relative", width: "80%", height: "80%" }}>
            <Image 
              src={GALLERY_IMAGES[viewerIndex]}
              alt="Imagem Ampliada"
              fill
              style={{ objectFit: "contain" }}
            />
          </div>"""
viewer_new = """          <div style={{ position: "relative", width: "80%", height: "80%" }}>
            <Image 
              src={IMAGES[viewerIndex].src}
              alt="Imagem Ampliada"
              fill
              style={{ objectFit: "contain" }}
            />
            {/* Markers Overlay */}
            {IMAGES[viewerIndex].markers.map((marker, i) => (
              <div
                key={i}
                className="group"
                style={{
                  position: "absolute",
                  left: `${marker.x}%`,
                  top: `${marker.y}%`,
                  width: 14,
                  height: 14,
                  transform: "translate(-50%, -50%)",
                  background: "#E8C252",
                  border: "2px solid #1C3528",
                  borderRadius: "50%",
                  cursor: "pointer",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.5)",
                  zIndex: 20
                }}
              >
                {/* Tooltip on hover or permanently visible if showNames is true */}
                <div 
                  className={showNames ? "" : "hidden group-hover:block"}
                  style={{
                    position: "absolute",
                    left: 20,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "rgba(28, 53, 40, 0.85)",
                    color: "#FFF",
                    padding: "4px 8px",
                    borderRadius: 4,
                    fontSize: 12,
                    fontWeight: 700,
                    fontFamily: "'Nunito', sans-serif",
                    whiteSpace: "nowrap",
                    pointerEvents: "none"
                  }}
                >
                  {language === "pt" ? marker.name.pt : marker.name.es}
                </div>
              </div>
            ))}
          </div>"""
content = content.replace(viewer_old, viewer_new)

# 3. Add Show Names toggle button
close_btn_old = """          <button 
            onClick={() => setViewerIndex(null)}
            style={{ position: "absolute", top: 20, right: 30, background: "none", border: "none", color: "#FFF", fontSize: "2rem", cursor: "pointer", zIndex: 110 }}
          >
            &times;
          </button>"""
close_btn_new = """          <div style={{ position: "absolute", top: 20, right: 30, zIndex: 110, display: "flex", gap: 16, alignItems: "center" }}>
            <button 
              onClick={() => setShowNames(!showNames)}
              style={{ background: showNames ? "#8DC9A0" : "rgba(255,255,255,0.1)", border: "none", color: showNames ? "#1C3528" : "#FFF", fontSize: "0.9rem", fontWeight: 700, padding: "8px 16px", borderRadius: 999, cursor: "pointer" }}
            >
              {showNames ? "Esconder Nomes" : "Mostrar Nomes"}
            </button>
            <button 
              onClick={() => {
                setViewerIndex(null);
                setShowNames(false);
              }}
              style={{ background: "none", border: "none", color: "#FFF", fontSize: "2rem", cursor: "pointer", lineHeight: 1 }}
            >
              &times;
            </button>
          </div>"""
content = content.replace(close_btn_old, close_btn_new)

with open('src/app/gallery/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

