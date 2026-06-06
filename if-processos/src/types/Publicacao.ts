export type Publicacao = {
  _id: string;
  titulo: string;
  subtitulo?: string;
  descricao: string;
  imagem?: string;
  urlPublicacao?: string;
  arquivoPdf?: string;
  pdfs?: string[];
  mensagemInteressados?: string;
  dataLimite?: string;
  autor?: {
    _id?: string;
    nome?: string;
    cargo?: string;
  };
  createdAt: string;
};
