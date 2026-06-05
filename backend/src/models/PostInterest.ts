import { Schema, model } from 'mongoose';

const PostInterestSchema = new Schema({
  publicacao: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
  usuario: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  visualizadoPeloAdmin: { type: Boolean, default: false }
}, { timestamps: true });

PostInterestSchema.index({ publicacao: 1, usuario: 1 }, { unique: true });
PostInterestSchema.index({ usuario: 1, createdAt: -1 });
PostInterestSchema.index({ publicacao: 1, visualizadoPeloAdmin: 1 });

export const PostInterest = model('PostInterest', PostInterestSchema);
