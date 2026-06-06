import mongoose, { Schema, model } from 'mongoose';

const PostSchema = new mongoose.Schema({
  titulo: { type: String, required: true },
  subtitulo: { type: String },
  descricao: { type: String, required: true },
  imagem: { type: String }, 
  urlPublicacao: { type: String },
  arquivoPdf: { type: String },
  pdfs: [{ type: String }],
  autor: { type: Schema.Types.ObjectId, ref: 'User' },
  mensagemInteressados: { type: String, default: '' },
  dataLimite: { type: Date },
  encerrada: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

export const Post = model('Post', PostSchema);
