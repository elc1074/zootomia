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
  especie: string; 
  src: string; // caminho dentro de /public
  fonte: string; // legenda / atlas de origem, para atribuição
  markers: Marker[];
};

export const IMAGES: AnatomyImage[] = [
  {
    id: "cao-esqueleto-lateral",
    titulo: "Esqueleto do cão — vista lateral",
    especie: "Canis lupus familiaris",
    src: "/images/bones/cao-esqueleto-lateral.png",
    fonte: "Atlas de Osteología de los Mamíferos Domésticos — Figura 1.a",
    markers: [
      { name: "Vértebras cervicais", aceita: ["vertebras cervicais", "vertebras cervicales", "cervicais"], x: 0.26, y: 0.205 },
      { name: "Vértebras torácicas", aceita: ["vertebras toracicas", "toracicas"], x: 0.458, y: 0.252 },
      { name: "Vértebras lombares", aceita: ["vertebras lombares", "vertebras lumbares", "lombares"], x: 0.668, y: 0.258 },
      { name: "Sacro", x: 0.816, y: 0.277 },
      { name: "Vértebras caudais", aceita: ["vertebras caudais", "vertebras caudales", "caudais"], x: 0.906, y: 0.31 },
      { name: "Costela nº 10", aceita: ["costela 10", "costela n10", "costilla n10", "costilla nº 10"], x: 0.52, y: 0.542 },
      { name: "Arco costal", x: 0.515, y: 0.539 },
      { name: "Esterno", aceita: ["esternon"], x: 0.286, y: 0.507 },
      { name: "Escápula", aceita: ["escapula"], x: 0.329, y: 0.419 },
      { name: "Úmero", aceita: ["umero", "humero"], x: 0.329, y: 0.529 },
      { name: "Rádio", aceita: ["radio"], x: 0.372, y: 0.623 },
      { name: "Ulna", aceita: ["cubito", "cúbito"], x: 0.382, y: 0.542 },
      { name: "Ossos do carpo", aceita: ["carpo", "huesos del carpo"], x: 0.367, y: 0.752 },
      { name: "Ossos metacarpianos", aceita: ["metacarpianos", "hueso metacarpianos"], x: 0.367, y: 0.83 },
      { name: "Falanges", x: 0.348, y: 0.932 },
      { name: "Coxal", x: 0.782, y: 0.333 },
      { name: "Fêmur", x: 0.782, y: 0.503 },
      { name: "Tíbia", aceita: ["tibia"], x: 0.768, y: 0.639 },
      { name: "Ossos do tarso", aceita: ["tarso", "huesos del tarso"], x: 0.809, y: 0.768 },
      { name: "Ossos metatarsianos", aceita: ["metatarsianos", "huesos metatarsianos"], x: 0.773, y: 0.852 },
      { name: "Falanges", x: 0.757, y: 0.941 },
    ],
  },
];
