export type PessoaChat = {
  _id: string;
  nome?: string;
  email?: string;
  cargo?: string;
  foto?: string;
};

export type PublicacaoChat = {
  _id: string;
  titulo: string;
  encerrada?: boolean;
};

export type MensagemChat = {
  _id: string;
  texto: string;
  lida: boolean;
  createdAt: string;
  remetente: PessoaChat;
};

export type Conversa = {
  _id: string;
  aluno: PessoaChat;
  admin: PessoaChat;
  publicacao: PublicacaoChat;
  status: 'aberta' | 'encerrada';
  ultimaMensagemEm: string;
  ultimaMensagem?: MensagemChat;
  naoLidas?: number;
};
