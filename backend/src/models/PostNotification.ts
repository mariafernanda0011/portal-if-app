import { Schema, model } from 'mongoose';

const PostNotificationSchema = new Schema({
  usuario: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  publicacao: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
  lida: { type: Boolean, default: false }
}, { timestamps: true });

PostNotificationSchema.index({ usuario: 1, publicacao: 1 }, { unique: true });
PostNotificationSchema.index({ usuario: 1, lida: 1, createdAt: -1 });

export const PostNotification = model('PostNotification', PostNotificationSchema);
