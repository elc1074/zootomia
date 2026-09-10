// Ossos mapeados de cada imagem.
// x e y vão de 0 a 1 = fração da largura/altura da imagem (independente do tamanho na tela).
// Para gerar esses valores sem chutar, use a rota /annotate.

export type Marker = {
  name: string; // resposta canônica, ex. "Fêmur"
  aceita?: string[]; // outras grafias aceitas no campo de texto, ex. ["femur", "os femoris"]
  x: number;
  y: number;
};

export type AnatomyImage = {
  id: string;
  titulo: string; // aparece no cabeçalho do jogo
  especie: string; // ex. "Canis lupus familiaris"
  src: string; // caminho dentro de /public
  fonte: string; // legenda / atlas de origem, para atribuição
  markers: Marker[];
};

export const IMAGES: AnatomyImage[] = [
  {
    id: "cao-esqueleto-lateral",
    titulo: "Esqueleto do cão — vista lateral",
    especie: "Canis lupus familiaris",
    src: "/images/bones/cao-esqueleto-lateral.jpg",
    fonte: "Atlas de Osteología de los Mamíferos Domésticos",
    markers: [
      { name: "Crânio", x: 0.2, y: 0.3 },
      { name: "Pelve", x: 0.86, y: 0.63 },
      { name: "Fêmur", x: 0.74, y: 0.84 },
    ],
  },
];
