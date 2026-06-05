import { Schema, model } from 'mongoose';

const ConversationSchema = new Schema({
  aluno: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  admin: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  publicacao: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
  status: {
    type: String,
    enum: ['aberta', 'encerrada'],
    default: 'aberta'
  },
  ultimaMensagemEm: { type: Date, default: Date.now }
}, { timestamps: true });

ConversationSchema.index(
  { aluno: 1, admin: 1, publicacao: 1 },
  { unique: true }
);

export const Conversation = model('Conversation', ConversationSchema);
