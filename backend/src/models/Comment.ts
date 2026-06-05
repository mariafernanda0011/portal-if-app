import { Schema, model } from 'mongoose';

const CommentSchema = new Schema({
  publicacao: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
  usuario: { type: Schema.Types.ObjectId, ref: 'User' },
  nomeVisitante: {
    type: String,
    trim: true,
    maxlength: 80
  },
  texto: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  visualizadoPeloAdmin: { type: Boolean, default: false }
}, { timestamps: true });

CommentSchema.index({ publicacao: 1, createdAt: -1 });
CommentSchema.index({ publicacao: 1, visualizadoPeloAdmin: 1 });

export const Comment = model('Comment', CommentSchema);
