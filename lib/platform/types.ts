export type Material = { id: string; nombre: string; archivoId: string };
export type Lesson = {
  id: string;
  titulo: string;
  texto: string;
  videoProvider?: "youtube" | "vimeo";
  videoId?: string;
  requerida: boolean;
  materiales: Material[];
};
export type Curriculum = {
  modulos: { id: string; titulo: string; lecciones: Lesson[] }[];
  liveUrl?: string;
  liveAt?: string;
  timezone?: string;
  cupo?: number;
};
export type Question = {
  id: string;
  texto: string;
  tipo: "unica" | "multiple" | "vf";
  opciones: { id: string; texto: string }[];
  correctas: string[];
  puntos: number;
  feedback: string;
};
export type Quiz = {
  preguntas: Question[];
  aprobacion: number;
  intentos: number;
  requerirContenidos: boolean;
};
export type ActionState = {
  ok?: boolean;
  error?: string;
  mensaje?: string;
  id?: string;
};
