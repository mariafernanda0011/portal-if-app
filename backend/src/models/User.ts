import { Schema, model } from 'mongoose';

const UserSchema = new Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'user'], default: 'user' },
  isFirstLogin: { type: Boolean, default: true },
  nome: { type: String },
  cargo: {
    type: String,
    enum: ['professor', 'coordenador', 'diretor_ensino', 'diretor_geral', 'administrador']
  },
  foto: { type: String },
  curso: { type: String },
  disciplina: { type: String }
});

export const User = model('User', UserSchema);
