import { Schema, model } from 'mongoose';

const PasswordResetCodeSchema = new Schema({
  usuario: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  codeHash: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  used: { type: Boolean, default: false },
  attempts: { type: Number, default: 0 }
}, { timestamps: true });

PasswordResetCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
PasswordResetCodeSchema.index({ email: 1, used: 1, createdAt: -1 });

export const PasswordResetCode = model('PasswordResetCode', PasswordResetCodeSchema);
