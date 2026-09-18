"use client";

// Ferramenta interna para mapear ossos.
// Abra http://localhost:3000/annotate , aponte para a imagem, clique em cada osso,
// digite o nome e copie o JSON gerado para src/data/anatomy.ts

import React, { useState } from "react";

type Ponto = { name: string; x: number; y: number };

export default function Annotate() {
  const [src, setSrc] = useState("/images/bones/cao-esqueleto-geral-lateral.jpg");
  const [pontos, setPontos] = useState<Ponto[]>([]);

  function marcar(e: React.MouseEvent<HTMLImageElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    const x = Number(((e.clientX - r.left) / r.width).toFixed(3));
    const y = Number(((e.clientY - r.top) / r.height).toFixed(3));
    const name = window.prompt("Nome do osso?");
    if (name) setPontos((p) => [...p, { name, x, y }]);
  }

  const json = JSON.stringify(
    { id: "meu-id", titulo: "", especie: "", src, fonte: "", markers: pontos },
    null,
    2,
  );

  return (
    <div style={{ display: "flex", gap: 24, padding: 24, fontFamily: "sans-serif", flexWrap: "wrap" }}>
      <div style={{ flex: "1 1 480px" }}>
        <input
          value={src}
          onChange={(e) => setSrc(e.target.value)}
          style={{ width: "100%", maxWidth: 420, padding: 8, marginBottom: 6 }}
        />
        <p style={{ fontSize: 12, color: "#666", margin: "0 0 8px" }}>
          Clique na imagem para marcar um osso.
        </p>
        <div style={{ position: "relative", maxWidth: 720 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt=""
            onClick={marcar}
            style={{ display: "block", width: "100%", cursor: "crosshair", borderRadius: 6 }}
          />
          <svg
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", overflow: "visible" }}
          >
            {pontos.map((p, i) => (
              <g key={i}>
                <circle cx={`${p.x * 100}%`} cy={`${p.y * 100}%`} r={5} fill="#E8352E" />
                <text x={`${p.x * 100}%`} y={`${p.y * 100}%`} dx={9} dy={4} fontSize={13} fill="#E8352E">
                  {p.name}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>

      <div style={{ flex: "0 1 380px" }}>
        <button onClick={() => setPontos((p) => p.slice(0, -1))}>Desfazer último</button>
        <button onClick={() => setPontos([])} style={{ marginLeft: 8 }}>
          Limpar
        </button>
        <textarea
          readOnly
          value={json}
          onFocus={(e) => e.currentTarget.select()}
          style={{
            display: "block",
            width: "100%",
            height: 420,
            marginTop: 8,
            fontFamily: "monospace",
            fontSize: 12,
          }}
        />
      </div>
    </div>
  );
}
