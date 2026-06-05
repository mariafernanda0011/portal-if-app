import { Schema, model } from 'mongoose';

const MessageSchema = new Schema({
  conversa: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true },
  remetente: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  texto: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  lida: { type: Boolean, default: false }
}, { timestamps: true });

MessageSchema.index({ conversa: 1, createdAt: 1 });

export const Message = model('Message', MessageSchema);
