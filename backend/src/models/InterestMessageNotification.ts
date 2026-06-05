import { Schema, model } from 'mongoose';

const InterestMessageNotificationSchema = new Schema({
  usuario: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  publicacao: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
  mensagem: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  lida: { type: Boolean, default: false }
}, { timestamps: true });

InterestMessageNotificationSchema.index({ usuario: 1, publicacao: 1 }, { unique: true });
InterestMessageNotificationSchema.index({ usuario: 1, lida: 1, createdAt: -1 });

export const InterestMessageNotification = model('InterestMessageNotification', InterestMessageNotificationSchema);
