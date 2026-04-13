import { Schema, model } from 'mongoose';

const PostSchema = new Schema({
  titulo: { type: String, required: true },
  subtitulo: { type: String },
  descricao: { type: String, required: true },
  linkExterno: { type: String },
  imagem: { type: String }, // URL da imagem
  pdfs: [{ type: String }], // Array de URLs dos PDFs
  createdAt: { type: Date, default: Date.now }
});

export const Post = model('Post', PostSchema);