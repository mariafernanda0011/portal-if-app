import mongoose, { Schema, model } from 'mongoose';

const PostSchema = new mongoose.Schema({
  titulo: { type: String, required: true },
  subtitulo: { type: String },
  descricao: { type: String, required: true },
  imagem: { type: String }, 
  urlPublicacao: { type: String },
  arquivoPdf: { type: String },   
  createdAt: { type: Date, default: Date.now }
});

export const Post = model('Post', PostSchema);