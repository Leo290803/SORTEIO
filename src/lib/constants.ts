export const CATEGORIAS = ["12 a 14 anos", "15 a 17 anos"] as const;
export const NAIPES = ["Masculino", "Feminino"] as const;

export interface ModalidadeInfo {
  nome: string;
  tipo: "escola" | "atletas";
  atletas?: 1 | 2;
}

export const MODALIDADES_INFO: ModalidadeInfo[] = [
  { nome: "Futsal", tipo: "escola" },
  { nome: "Voleibol", tipo: "escola" },
  { nome: "Basquetebol", tipo: "escola" },
  { nome: "Handebol", tipo: "escola" },
  { nome: "Futebol", tipo: "escola" },
  { nome: "Queimada", tipo: "escola" },
  { nome: "Vôlei de Praia", tipo: "atletas", atletas: 2 },
  { nome: "Tênis de Mesa", tipo: "atletas", atletas: 1 },
  { nome: "Xadrez", tipo: "atletas", atletas: 1 },
  { nome: "Atletismo", tipo: "atletas", atletas: 1 },
];

export const MODALIDADES = MODALIDADES_INFO.map((m) => m.nome);

export const getModalidadeInfo = (nome: string): ModalidadeInfo => {
  return (
    MODALIDADES_INFO.find((m) => m.nome === nome) ?? {
      nome,
      tipo: "escola",
    }
  );
};

export type Categoria = (typeof CATEGORIAS)[number];
export type Naipe = (typeof NAIPES)[number];
