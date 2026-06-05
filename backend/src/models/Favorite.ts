import { Schema, model } from 'mongoose';

const FavoriteSchema = new Schema({
  usuario: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  post: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
}, {
  timestamps: true,
});

FavoriteSchema.index({ usuario: 1, post: 1 }, { unique: true });

export const Favorite = model('Favorite', FavoriteSchema);
