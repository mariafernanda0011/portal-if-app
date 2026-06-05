import 'dotenv/config';
import express, { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { randomBytes, randomInt } from 'crypto';
import nodemailer from 'nodemailer';
import { User } from './models/User';
import { Post } from './models/Post';
import { Favorite } from './models/Favorite';
import { Conversation } from './models/Conversation';
import { Message } from './models/Message';
import { PostNotification } from './models/PostNotification';
import { PasswordResetCode } from './models/PasswordResetCode';
import { Comment } from './models/Comment';
import multer from 'multer';

const app = express();
app.use(express.json());
app.use(cors());
app.use('/uploads', express.static('uploads'));

const PORT = process.env.PORT || 3000;
const CHAVE_SECRETA = process.env.CHAVE_SECRETA || 'chave_reserva_temporaria_123';
const MONGODB_ATLAS = process.env.MONGODB_ATLAS_URL || '';
const MONGODB_LOCAL = process.env.MONGODB_LOCAL_URL || '';
const GOOGLE_CLIENT_IDS = [
  process.env.GOOGLE_CLIENT_ID,
  ...(process.env.GOOGLE_CLIENT_IDS || '').split(',')
]
  .map((clientId) => clientId?.trim())
  .filter((clientId): clientId is string => Boolean(clientId));
const googleClient = new OAuth2Client();
const SMTP_HOST = process.env.SMTP_HOST || '';
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER;

type RequisicaoAutenticada = Request & {
  usuario?: {
    id: string;
    role: string;
  };
};

const autenticar = (req: RequisicaoAutenticada, res: Response, next: NextFunction) => {
  const authorization = req.headers.authorization;
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : '';

  if (!token) {
    return res.status(401).json({ erro: 'Faça login para continuar.' });
  }

  try {
    const payload = jwt.verify(token, CHAVE_SECRETA) as { id: string; role: string };
    req.usuario = payload;
    next();
  } catch {
    return res.status(401).json({ erro: 'Sua sessão expirou. Faça login novamente.' });
  }
};

const autenticarOpcional = (req: RequisicaoAutenticada, res: Response, next: NextFunction) => {
  const authorization = req.headers.authorization;
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : '';

  if (!token) {
    next();
    return;
  }

  try {
    const payload = jwt.verify(token, CHAVE_SECRETA) as { id: string; role: string };
    req.usuario = payload;
    next();
  } catch {
    return res.status(401).json({ erro: 'Sua sessão expirou. Faça login novamente.' });
  }
};

const autorizarAdmin = (req: RequisicaoAutenticada, res: Response, next: NextFunction) => {
  if (req.usuario?.role !== 'admin') {
    return res.status(403).json({ erro: 'Acesso restrito a administradores.' });
  }

  next();
};

const obterRolePorEmailInstitucional = (email: string) => {
  const emailNormalizado = email.trim().toLowerCase();

  if (emailNormalizado.endsWith('@aluno.ifnmg.edu.br')) {
    return 'user';
  }

  if (emailNormalizado.endsWith('@ifnmg.edu.br')) {
    return 'admin';
  }

  return '';
};

const gerarTokenApp = (usuario: { _id: unknown; role: string }) => jwt.sign(
  { id: usuario._id, role: usuario.role },
  CHAVE_SECRETA,
  { expiresIn: '1d' }
);

const gerarCodigoRecuperacao = () => String(randomInt(100000, 1000000));

const enviarCodigoRecuperacao = async (email: string, codigo: string) => {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !SMTP_FROM) {
    console.warn(`[DEV] Código de recuperação para ${email}: ${codigo}`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    }
  });

  await transporter.sendMail({
    from: SMTP_FROM,
    to: email,
    subject: 'Código de recuperação - Portal-IFNMG',
    text: `Seu código de recuperação é ${codigo}. Ele expira em 15 minutos.`,
    html: `
      <p>Olá,</p>
      <p>Seu código de recuperação do Portal-IFNMG é:</p>
      <h2>${codigo}</h2>
      <p>Ele expira em 15 minutos. Se você não solicitou essa alteração, ignore este e-mail.</p>
    `
  });
};

console.log('⏳ Tentando conectar ao MongoDB Atlas (Nuvem)...');

mongoose.connect(MONGODB_ATLAS)
  .then(() => {
    console.log('✅ Conectado ao MongoDB Atlas com sucesso!');
  })
  .catch((erroAtlas) => {
    console.error('⚠️ Falha ao conectar no Atlas:', {
      name: erroAtlas.name,
      message: erroAtlas.message,
      code: erroAtlas.code,
      reason: erroAtlas.reason,
    });



    console.log('🔄 Acionando Plano B: Conectando ao Banco Local...');

    mongoose.connect(MONGODB_LOCAL)
      .then(() => console.log('✅ Conectado ao MongoDB Local (Modo Offline)!'))
      .catch((erroLocal) => console.error('❌ Erro fatal: Nenhum banco de dados disponível.', erroLocal));
  });
app.get('/', (req, res) => {
  res.send('API Portal IFNMG Rodando! 🚀');
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

app.post('/publicacoes', autenticar, autorizarAdmin, upload.fields([
  { name: 'imagem', maxCount: 1 },
  { name: 'pdfs', maxCount: 5 }
]), async (req: RequisicaoAutenticada, res) => {
  try {
    const { titulo, subtitulo, descricao, linkExterno, urlPublicacao } = req.body;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const caminhoImagem = files && files['imagem'] ? files['imagem'][0].path.replace(/\\/g, '/') : '';
    const caminhosPdfs = files && files['pdfs'] ? files['pdfs'].map(f => f.path.replace(/\\/g, '/')) : [];

    const novaPostagem = new Post({
      titulo,
      subtitulo,
      descricao,
      imagem: caminhoImagem,
      urlPublicacao: urlPublicacao || linkExterno,
      arquivoPdf: caminhosPdfs[0],
      pdfs: caminhosPdfs,
      autor: req.usuario?.id,
    });

    await novaPostagem.save();
    const alunos = await User.find({ role: 'user' }).select('_id');

    if (alunos.length > 0) {
      await PostNotification.insertMany(
        alunos.map((aluno) => ({
          usuario: aluno._id,
          publicacao: novaPostagem._id,
        })),
        { ordered: false }
      ).catch((error) => {
        console.error('Erro ao criar notificações da publicação:', error);
      });
    }

    await novaPostagem.populate('autor', 'nome cargo');
    res.status(201).json({ mensagem: "Publicação criada com sucesso!", publicacao: novaPostagem });

  } catch (error) {
    console.error("Erro ao salvar publicação:", error);
    res.status(500).json({ erro: "Erro interno ao salvar." });
  }
});


app.get('/publicacoes', async (req, res) => {
  try {
    const publicacoes = await Post.find({ encerrada: { $ne: true } })
      .populate('autor', 'nome cargo')
      .sort({ createdAt: -1 });
    res.status(200).json(publicacoes);
  } catch (error) {
    console.error("Erro ao buscar publicações:", error);
    res.status(500).json({ mensagem: "Erro interno do servidor." });
  }
});

app.get('/publicacoes/:id', autenticarOpcional, async (req: RequisicaoAutenticada, res) => {
  try {
    const filtro = req.usuario?.role === 'admin'
      ? {
        _id: req.params.id,
        $or: [
          { encerrada: { $ne: true } },
          { autor: req.usuario.id },
          { autor: { $exists: false } }
        ]
      }
      : {
        _id: req.params.id,
        encerrada: { $ne: true }
      };

    const publicacao = await Post.findOne(filtro).populate('autor', 'nome cargo');

    if (!publicacao) {
      return res.status(404).json({ erro: 'Publicação não encontrada.' });
    }

    res.status(200).json(publicacao);
  } catch (error) {
    console.error("Erro ao buscar publicação:", error);
    res.status(500).json({ erro: "Erro interno ao buscar publicação." });
  }
});

app.get('/publicacoes/:id/comentarios', autenticarOpcional, async (req: RequisicaoAutenticada, res) => {
  try {
    const filtroPublicacao = req.usuario?.role === 'admin'
      ? {
        _id: req.params.id,
        $or: [
          { encerrada: { $ne: true } },
          { autor: req.usuario.id },
          { autor: { $exists: false } }
        ]
      }
      : {
        _id: req.params.id,
        encerrada: { $ne: true }
      };

    const publicacao = await Post.exists(filtroPublicacao);
    if (!publicacao) {
      return res.status(404).json({ erro: 'Publicação não encontrada.' });
    }

    const comentarios = await Comment.find({ publicacao: req.params.id })
      .populate('usuario', 'nome email role cargo')
      .sort({ createdAt: -1 });

    res.status(200).json(comentarios);
  } catch (error) {
    console.error('Erro ao buscar comentários:', error);
    res.status(500).json({ erro: 'Não foi possível carregar os comentários.' });
  }
});

app.post('/publicacoes/:id/comentarios', autenticarOpcional, async (req: RequisicaoAutenticada, res) => {
  try {
    const texto = String(req.body.texto || '').trim();
    const nomeVisitante = String(req.body.nomeVisitante || '').trim();

    if (!texto) {
      return res.status(400).json({ erro: 'Digite um comentário.' });
    }

    if (!req.usuario && !nomeVisitante) {
      return res.status(400).json({ erro: 'Informe seu nome para comentar como visitante.' });
    }

    if (nomeVisitante.length > 80) {
      return res.status(400).json({ erro: 'O nome deve ter no máximo 80 caracteres.' });
    }

    if (texto.length > 500) {
      return res.status(400).json({ erro: 'O comentário deve ter no máximo 500 caracteres.' });
    }

    const filtroPublicacao = req.usuario?.role === 'admin'
      ? {
        _id: req.params.id,
        $or: [
          { encerrada: { $ne: true } },
          { autor: req.usuario.id },
          { autor: { $exists: false } }
        ]
      }
      : {
        _id: req.params.id,
        encerrada: { $ne: true }
      };

    const publicacao = await Post.findOne(filtroPublicacao);

    if (!publicacao) {
      return res.status(404).json({ erro: 'Publicação não encontrada ou encerrada.' });
    }

    const comentario = await Comment.create({
      publicacao: publicacao._id,
      ...(req.usuario ? { usuario: req.usuario.id } : { nomeVisitante }),
      texto
    });
    await comentario.populate('usuario', 'nome email role cargo');

    res.status(201).json(comentario);
  } catch (error) {
    console.error('Erro ao criar comentário:', error);
    res.status(500).json({ erro: 'Não foi possível publicar o comentário.' });
  }
});

app.get('/favorites', autenticar, async (req: RequisicaoAutenticada, res) => {
  try {
    const favoritos = await Favorite.find({ usuario: req.usuario!.id })
      .populate({
        path: 'post',
        match: { encerrada: { $ne: true } },
        populate: { path: 'autor', select: 'nome cargo' }
      })
      .sort({ createdAt: -1 });

    res.status(200).json(favoritos.map((favorito) => favorito.post).filter(Boolean));
  } catch (error) {
    console.error("Erro ao buscar favoritos:", error);
    res.status(500).json({ erro: "Erro interno ao buscar favoritos." });
  }
});

app.get('/favorites/:postId/status', autenticar, async (req: RequisicaoAutenticada, res) => {
  try {
    const favorito = await Favorite.exists({
      usuario: req.usuario!.id,
      post: req.params.postId
    });

    res.status(200).json({ favorito: !!favorito });
  } catch (error) {
    console.error("Erro ao verificar favorito:", error);
    res.status(500).json({ erro: "Erro interno ao verificar favorito." });
  }
});

app.post('/favorites/:postId', autenticar, async (req: RequisicaoAutenticada, res) => {
  try {
    const post = await Post.findOne({ _id: req.params.postId, encerrada: { $ne: true } });

    if (!post) {
      return res.status(404).json({ erro: 'Publicação não encontrada.' });
    }

    await Favorite.findOneAndUpdate(
      { usuario: req.usuario!.id, post: req.params.postId },
      { usuario: req.usuario!.id, post: req.params.postId },
      { upsert: true, new: true }
    );

    res.status(201).json({ mensagem: 'Publicação adicionada aos favoritos.' });
  } catch (error) {
    console.error("Erro ao adicionar favorito:", error);
    res.status(500).json({ erro: "Erro interno ao adicionar favorito." });
  }
});

app.delete('/favorites/:postId', autenticar, async (req: RequisicaoAutenticada, res) => {
  try {
    await Favorite.findOneAndDelete({
      usuario: req.usuario!.id,
      post: req.params.postId
    });

    res.status(200).json({ mensagem: 'Publicação removida dos favoritos.' });
  } catch (error) {
    console.error("Erro ao remover favorito:", error);
    res.status(500).json({ erro: "Erro interno ao remover favorito." });
  }
});

const filtroPostsDoAdmin = (usuarioId: string) => ({
  $or: [
    { autor: usuarioId },
    { autor: { $exists: false } }
  ]
});

app.get('/admin/publicacoes', autenticar, autorizarAdmin, async (req: RequisicaoAutenticada, res) => {
  try {
    const publicacoes = await Post.find(filtroPostsDoAdmin(req.usuario!.id))
      .populate('autor', 'nome cargo')
      .sort({ createdAt: -1 });
    res.status(200).json(publicacoes);
  } catch (error) {
    console.error("Erro ao buscar publicações do administrador:", error);
    res.status(500).json({ erro: "Erro interno ao buscar publicações." });
  }
});

app.put('/admin/publicacoes/:id', autenticar, autorizarAdmin, upload.fields([
  { name: 'imagem', maxCount: 1 },
  { name: 'pdfs', maxCount: 5 }
]), async (req: RequisicaoAutenticada, res) => {
  try {
    const { titulo, subtitulo, descricao, urlPublicacao, linkExterno } = req.body;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const caminhoImagem = files && files['imagem'] ? files['imagem'][0].path.replace(/\\/g, '/') : '';
    const caminhosPdfs = files && files['pdfs'] ? files['pdfs'].map(f => f.path.replace(/\\/g, '/')) : [];

    if (!titulo?.trim() || !descricao?.trim()) {
      return res.status(400).json({ erro: 'Preencha título e descrição.' });
    }

    const atualizacoes: Record<string, unknown> = {
      titulo: titulo.trim(),
      subtitulo: subtitulo?.trim() || '',
      descricao: descricao.trim(),
      urlPublicacao: urlPublicacao?.trim() || linkExterno?.trim() || '',
      autor: req.usuario!.id
    };

    if (caminhoImagem) {
      atualizacoes.imagem = caminhoImagem;
    }

    if (caminhosPdfs.length > 0) {
      atualizacoes.arquivoPdf = caminhosPdfs[0];
      atualizacoes.pdfs = caminhosPdfs;
    }

    const publicacao = await Post.findOneAndUpdate(
      { _id: req.params.id, ...filtroPostsDoAdmin(req.usuario!.id) },
      atualizacoes,
      { new: true }
    ).populate('autor', 'nome cargo');

    if (!publicacao) {
      return res.status(404).json({ erro: 'Publicação não encontrada.' });
    }

    res.status(200).json(publicacao);
  } catch (error) {
    console.error("Erro ao editar publicação:", error);
    res.status(500).json({ erro: "Erro interno ao editar publicação." });
  }
});

app.patch('/admin/publicacoes/:id/encerrar', autenticar, autorizarAdmin, async (req: RequisicaoAutenticada, res) => {
  try {
    const publicacao = await Post.findOneAndUpdate(
      { _id: req.params.id, ...filtroPostsDoAdmin(req.usuario!.id) },
      { encerrada: true, autor: req.usuario!.id },
      { new: true }
    ).populate('autor', 'nome cargo');

    if (!publicacao) {
      return res.status(404).json({ erro: 'Publicação não encontrada.' });
    }

    res.status(200).json(publicacao);
  } catch (error) {
    console.error("Erro ao encerrar publicação:", error);
    res.status(500).json({ erro: "Erro interno ao encerrar publicação." });
  }
});

app.patch('/admin/publicacoes/:id/reativar', autenticar, autorizarAdmin, async (req: RequisicaoAutenticada, res) => {
  try {
    const publicacao = await Post.findOneAndUpdate(
      { _id: req.params.id, ...filtroPostsDoAdmin(req.usuario!.id) },
      { encerrada: false, autor: req.usuario!.id },
      { new: true }
    ).populate('autor', 'nome cargo');

    if (!publicacao) {
      return res.status(404).json({ erro: 'Publicação não encontrada.' });
    }

    res.status(200).json(publicacao);
  } catch (error) {
    console.error("Erro ao reativar publicação:", error);
    res.status(500).json({ erro: "Erro interno ao reativar publicação." });
  }
});

app.get('/notificacoes', autenticar, async (req: RequisicaoAutenticada, res) => {
  try {
    const notificacoes = await PostNotification.find({ usuario: req.usuario!.id })
      .populate({
        path: 'publicacao',
        match: { encerrada: { $ne: true } },
        populate: { path: 'autor', select: 'nome cargo' }
      })
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json(notificacoes.filter((notificacao) => notificacao.publicacao));
  } catch (error) {
    console.error('Erro ao buscar notificações:', error);
    res.status(500).json({ erro: 'Não foi possível carregar as notificações.' });
  }
});

app.get('/notificacoes/nao-lidas', autenticar, async (req: RequisicaoAutenticada, res) => {
  try {
    const total = await PostNotification.countDocuments({
      usuario: req.usuario!.id,
      lida: false
    });

    res.status(200).json({ total });
  } catch (error) {
    console.error('Erro ao contar notificações:', error);
    res.status(500).json({ erro: 'Não foi possível carregar o contador de notificações.' });
  }
});

app.patch('/notificacoes/lidas', autenticar, async (req: RequisicaoAutenticada, res) => {
  try {
    await PostNotification.updateMany(
      { usuario: req.usuario!.id, lida: false },
      { lida: true }
    );

    res.status(200).json({ mensagem: 'Notificações marcadas como lidas.' });
  } catch (error) {
    console.error('Erro ao marcar notificações como lidas:', error);
    res.status(500).json({ erro: 'Não foi possível marcar as notificações como lidas.' });
  }
});

app.delete('/notificacoes/lidas', autenticar, async (req: RequisicaoAutenticada, res) => {
  try {
    const resultado = await PostNotification.deleteMany({
      usuario: req.usuario!.id,
      lida: true
    });

    res.status(200).json({
      mensagem: 'Notificações visualizadas removidas.',
      removidas: resultado.deletedCount
    });
  } catch (error) {
    console.error('Erro ao limpar notificações visualizadas:', error);
    res.status(500).json({ erro: 'Não foi possível limpar as notificações visualizadas.' });
  }
});

app.patch('/notificacoes/:id/lida', autenticar, async (req: RequisicaoAutenticada, res) => {
  try {
    const notificacao = await PostNotification.findOneAndUpdate(
      { _id: req.params.id, usuario: req.usuario!.id },
      { lida: true },
      { new: true }
    );

    if (!notificacao) {
      return res.status(404).json({ erro: 'Notificação não encontrada.' });
    }

    res.status(200).json(notificacao);
  } catch (error) {
    console.error('Erro ao marcar notificação como lida:', error);
    res.status(500).json({ erro: 'Não foi possível marcar a notificação como lida.' });
  }
});

app.post('/chats/publicacoes/:postId', autenticar, async (req: RequisicaoAutenticada, res) => {
  try {
    const publicacao = await Post.findOne({
      _id: req.params.postId,
      encerrada: { $ne: true }
    });

    if (!publicacao) {
      return res.status(404).json({ erro: 'Esta publicação não está disponível para iniciar uma conversa.' });
    }

    if (!publicacao.autor) {
      return res.status(400).json({ erro: 'Esta publicação ainda não possui um responsável disponível.' });
    }

    if (String(publicacao.autor) === req.usuario!.id) {
      return res.status(400).json({ erro: 'Você já é o responsável por esta publicação.' });
    }

    const conversa = await Conversation.findOneAndUpdate(
      {
        aluno: req.usuario!.id,
        admin: publicacao.autor,
        publicacao: publicacao._id
      },
      {
        $setOnInsert: {
          aluno: req.usuario!.id,
          admin: publicacao.autor,
          publicacao: publicacao._id,
          status: 'aberta',
          ultimaMensagemEm: new Date()
        }
      },
      { new: true, upsert: true }
    )
      .populate('aluno', 'nome email foto')
      .populate('admin', 'nome email cargo foto')
      .populate('publicacao', 'titulo encerrada');

    res.status(200).json(conversa);
  } catch (error) {
    console.error('Erro ao iniciar conversa:', error);
    res.status(500).json({ erro: 'Não foi possível iniciar a conversa.' });
  }
});

app.get('/chats', autenticar, async (req: RequisicaoAutenticada, res) => {
  try {
    const filtro = req.usuario!.role === 'admin'
      ? {
        $or: [
          { admin: req.usuario!.id },
          { aluno: req.usuario!.id }
        ]
      }
      : { aluno: req.usuario!.id };

    const conversas = await Conversation.find(filtro)
      .populate('aluno', 'nome email foto')
      .populate('admin', 'nome email cargo foto')
      .populate('publicacao', 'titulo encerrada')
      .sort({ ultimaMensagemEm: -1 });

    const conversasComResumo = await Promise.all(conversas.map(async (conversa) => {
      const [ultimaMensagem, naoLidas] = await Promise.all([
        Message.findOne({ conversa: conversa._id })
          .populate('remetente', 'nome role')
          .sort({ createdAt: -1 }),
        Message.countDocuments({
          conversa: conversa._id,
          remetente: { $ne: req.usuario!.id },
          lida: false
        })
      ]);

      return {
        ...conversa.toObject(),
        ultimaMensagem,
        naoLidas
      };
    }));

    res.status(200).json(conversasComResumo);
  } catch (error) {
    console.error('Erro ao listar conversas:', error);
    res.status(500).json({ erro: 'Não foi possível carregar as conversas.' });
  }
});

app.get('/chats/nao-lidas', autenticar, async (req: RequisicaoAutenticada, res) => {
  try {
    const filtro = req.usuario!.role === 'admin'
      ? {
        $or: [
          { admin: req.usuario!.id },
          { aluno: req.usuario!.id }
        ]
      }
      : { aluno: req.usuario!.id };
    const conversas = await Conversation.find(filtro).select('_id');
    const total = await Message.countDocuments({
      conversa: { $in: conversas.map((conversa) => conversa._id) },
      remetente: { $ne: req.usuario!.id },
      lida: false
    });

    res.status(200).json({ total });
  } catch (error) {
    console.error('Erro ao contar mensagens não lidas:', error);
    res.status(500).json({ erro: 'Não foi possível carregar o contador de mensagens.' });
  }
});

app.get('/chats/:id/mensagens', autenticar, async (req: RequisicaoAutenticada, res) => {
  try {
    const conversa = await Conversation.findOne({
      _id: req.params.id,
      $or: [
        { aluno: req.usuario!.id },
        { admin: req.usuario!.id }
      ]
    })
      .populate('aluno', 'nome email foto')
      .populate('admin', 'nome email cargo foto')
      .populate('publicacao', 'titulo encerrada');

    if (!conversa) {
      return res.status(404).json({ erro: 'Conversa não encontrada.' });
    }

    await Message.updateMany(
      {
        conversa: conversa._id,
        remetente: { $ne: req.usuario!.id },
        lida: false
      },
      { lida: true }
    );

    const mensagens = await Message.find({ conversa: conversa._id })
      .populate('remetente', 'nome role foto')
      .sort({ createdAt: 1 });

    res.status(200).json({
      conversa,
      mensagens,
      usuarioAtualId: req.usuario!.id
    });
  } catch (error) {
    console.error('Erro ao carregar mensagens:', error);
    res.status(500).json({ erro: 'Não foi possível carregar as mensagens.' });
  }
});

app.post('/chats/:id/mensagens', autenticar, async (req: RequisicaoAutenticada, res) => {
  try {
    const texto = String(req.body.texto || '').trim();
    if (!texto) {
      return res.status(400).json({ erro: 'Digite uma mensagem.' });
    }
    if (texto.length > 1000) {
      return res.status(400).json({ erro: 'A mensagem deve ter no máximo 1000 caracteres.' });
    }

    const conversa = await Conversation.findOne({
      _id: req.params.id,
      $or: [
        { aluno: req.usuario!.id },
        { admin: req.usuario!.id }
      ]
    });

    if (!conversa) {
      return res.status(404).json({ erro: 'Conversa não encontrada.' });
    }
    if (conversa.status === 'encerrada') {
      return res.status(400).json({ erro: 'Esta conversa foi encerrada e permanece disponível apenas para consulta.' });
    }

    const mensagem = await Message.create({
      conversa: conversa._id,
      remetente: req.usuario!.id,
      texto
    });
    conversa.ultimaMensagemEm = new Date();
    await conversa.save();
    await mensagem.populate('remetente', 'nome role foto');

    res.status(201).json(mensagem);
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    res.status(500).json({ erro: 'Não foi possível enviar a mensagem.' });
  }
});

app.patch('/chats/:id/encerrar', autenticar, async (req: RequisicaoAutenticada, res) => {
  try {
    const conversa = await Conversation.findOneAndUpdate(
      {
        _id: req.params.id,
        $or: [
          { aluno: req.usuario!.id },
          { admin: req.usuario!.id }
        ]
      },
      { status: 'encerrada' },
      { new: true }
    );

    if (!conversa) {
      return res.status(404).json({ erro: 'Conversa não encontrada.' });
    }

    res.status(200).json(conversa);
  } catch (error) {
    console.error('Erro ao encerrar conversa:', error);
    res.status(500).json({ erro: 'Não foi possível encerrar a conversa.' });
  }
});

app.get('/auth/perfil', autenticar, async (req: RequisicaoAutenticada, res) => {
  try {
    const usuario = await User.findById(req.usuario!.id).select('-password');

    if (!usuario) {
      return res.status(404).json({ erro: 'Usuário não encontrado.' });
    }

    res.status(200).json(usuario);
  } catch (error) {
    console.error("Erro ao buscar perfil:", error);
    res.status(500).json({ erro: "Erro interno ao buscar perfil." });
  }
});

app.put('/auth/perfil', autenticar, upload.single('foto'), async (req: RequisicaoAutenticada, res) => {
  try {
    const { nome, cargo, curso, disciplina } = req.body;
    const cargosPermitidos = ['professor', 'coordenador', 'diretor_ensino', 'diretor_geral', 'administrador'];
    const ehAdmin = req.usuario!.role === 'admin';

    if (!nome?.trim()) {
      return res.status(400).json({ erro: 'Informe seu nome.' });
    }

    if (ehAdmin && (!cargo || !cargosPermitidos.includes(cargo))) {
      return res.status(400).json({ erro: 'Cargo inválido.' });
    }

    const atualizacoes: Record<string, string> = {
      nome: nome.trim()
    };

    if (ehAdmin) {
      atualizacoes.cargo = cargo;
      atualizacoes.curso = cargo === 'professor' || cargo === 'coordenador' ? curso?.trim() || '' : '';
      atualizacoes.disciplina = cargo === 'professor' ? disciplina?.trim() || '' : '';
    }

    if (req.file) {
      atualizacoes.foto = req.file.path.replace(/\\/g, '/');
    }

    const usuario = await User.findByIdAndUpdate(
      req.usuario!.id,
      atualizacoes,
      { new: true, runValidators: true }
    ).select('-password');

    if (!usuario) {
      return res.status(404).json({ erro: 'Usuário não encontrado.' });
    }

    res.status(200).json(usuario);
  } catch (error) {
    console.error("Erro ao atualizar perfil:", error);
    res.status(500).json({ erro: "Erro interno ao atualizar perfil." });
  }
});

app.post('/auth/cadastro', async (req, res) => {
  const { email, password } = req.body;

  try {
    const emailNormalizado = String(email || '').trim().toLowerCase();
    const roleAtribuida = obterRolePorEmailInstitucional(emailNormalizado);

    if (!roleAtribuida) {
      return res.status(403).json({
        erro: 'Apenas e-mails institucionais do IFNMG são permitidos para cadastro.'
      });
    }

    const usuarioExiste = await User.findOne({ email: emailNormalizado });
    if (usuarioExiste) {
      return res.status(400).json({ erro: 'Este e-mail já está cadastrado.' });
    }

    const salt = await bcrypt.genSalt(10);
    const senhaCriptografada = await bcrypt.hash(password, salt);

    const novoUsuario = new User({
      email: emailNormalizado,
      password: senhaCriptografada,
      role: roleAtribuida,
      isFirstLogin: false
    });

    await novoUsuario.save();

    res.status(201).json({ mensagem: `Cadastro realizado como ${roleAtribuida}!` });

  } catch (error) {
    console.error("Erro ao cadastrar:", error);
    res.status(500).json({ erro: 'Erro ao processar cadastro.' });
  }
});

app.post('/auth/google', async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({ erro: 'Token do Google não informado.' });
  }

  if (GOOGLE_CLIENT_IDS.length === 0) {
    return res.status(500).json({ erro: 'Configure GOOGLE_CLIENT_ID ou GOOGLE_CLIENT_IDS no backend.' });
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_IDS
    });
    const payload = ticket.getPayload();
    const email = payload?.email?.trim().toLowerCase() || '';

    if (!email || payload?.email_verified === false) {
      return res.status(401).json({ erro: 'Não foi possível confirmar o e-mail da conta Google.' });
    }

    const roleAtribuida = obterRolePorEmailInstitucional(email);
    if (!roleAtribuida) {
      return res.status(403).json({
        erro: 'Use uma conta Google institucional do IFNMG.'
      });
    }

    let usuario = await User.findOne({ email });

    if (!usuario) {
      const senhaAleatoria = randomBytes(32).toString('hex');
      const senhaCriptografada = await bcrypt.hash(senhaAleatoria, 10);

      usuario = await User.create({
        email,
        password: senhaCriptografada,
        role: roleAtribuida,
        nome: payload?.name || '',
        foto: payload?.picture || '',
        isFirstLogin: true
      });
    } else if (usuario.role !== roleAtribuida) {
      usuario.role = roleAtribuida;
      await usuario.save();
    }

    const token = gerarTokenApp(usuario);

    res.status(200).json({
      mensagem: 'Login com Google realizado!',
      token,
      role: usuario.role,
      isFirstLogin: usuario.isFirstLogin
    });
  } catch (error) {
    console.error('Erro ao autenticar com Google:', error);
    res.status(401).json({ erro: 'Token do Google inválido ou expirado.' });
  }
});

app.put('/auth/definir-senha', autenticar, async (req: RequisicaoAutenticada, res) => {
  const { password } = req.body;

  if (!password || String(password).length < 6) {
    return res.status(400).json({ erro: 'A senha deve ter pelo menos 6 caracteres.' });
  }

  try {
    const senhaCriptografada = await bcrypt.hash(String(password), 10);
    const usuario = await User.findByIdAndUpdate(
      req.usuario!.id,
      {
        password: senhaCriptografada,
        isFirstLogin: false
      },
      { new: true }
    ).select('-password');

    if (!usuario) {
      return res.status(404).json({ erro: 'Usuário não encontrado.' });
    }

    res.status(200).json({
      mensagem: 'Senha definida com sucesso.',
      usuario
    });
  } catch (error) {
    console.error('Erro ao definir senha:', error);
    res.status(500).json({ erro: 'Não foi possível definir a senha.' });
  }
});

app.post('/auth/esqueci-senha', async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();

  if (!email) {
    return res.status(400).json({ erro: 'Informe o e-mail cadastrado.' });
  }

  try {
    const usuario = await User.findOne({ email });

    if (!usuario) {
      return res.status(404).json({ erro: 'E-mail não encontrado.' });
    }

    const codigo = gerarCodigoRecuperacao();
    const codeHash = await bcrypt.hash(codigo, 10);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await PasswordResetCode.updateMany(
      { email, used: false },
      { used: true }
    );

    await PasswordResetCode.create({
      usuario: usuario._id,
      email,
      codeHash,
      expiresAt
    });

    await enviarCodigoRecuperacao(email, codigo);

    res.status(200).json({ mensagem: 'Código enviado para o e-mail cadastrado.' });
  } catch (error) {
    console.error('Erro ao solicitar recuperação de senha:', error);
    res.status(500).json({ erro: 'Não foi possível enviar o código de recuperação.' });
  }
});

app.post('/auth/validar-codigo-senha', async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const codigo = String(req.body.codigo || '').trim();

  if (!email || !/^\d{6}$/.test(codigo)) {
    return res.status(400).json({ erro: 'Informe o e-mail e o código de 6 dígitos.' });
  }

  try {
    const registro = await PasswordResetCode.findOne({
      email,
      used: false,
      expiresAt: { $gt: new Date() }
    }).sort({ createdAt: -1 });

    if (!registro) {
      return res.status(400).json({ erro: 'Código inválido ou expirado.' });
    }

    if (registro.attempts >= 5) {
      return res.status(429).json({ erro: 'Muitas tentativas. Solicite um novo código.' });
    }

    const codigoValido = await bcrypt.compare(codigo, registro.codeHash);
    if (!codigoValido) {
      registro.attempts += 1;
      await registro.save();
      return res.status(400).json({ erro: 'Código inválido.' });
    }

    res.status(200).json({ mensagem: 'Código validado com sucesso.' });
  } catch (error) {
    console.error('Erro ao validar código de senha:', error);
    res.status(500).json({ erro: 'Não foi possível validar o código.' });
  }
});

app.put('/auth/redefinir-senha', async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const codigo = String(req.body.codigo || '').trim();
  const password = String(req.body.password || '');

  if (!email || !/^\d{6}$/.test(codigo)) {
    return res.status(400).json({ erro: 'Informe o e-mail e o código de 6 dígitos.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ erro: 'A senha deve ter pelo menos 6 caracteres.' });
  }

  try {
    const registro = await PasswordResetCode.findOne({
      email,
      used: false,
      expiresAt: { $gt: new Date() }
    }).sort({ createdAt: -1 });

    if (!registro) {
      return res.status(400).json({ erro: 'Código inválido ou expirado.' });
    }

    if (registro.attempts >= 5) {
      return res.status(429).json({ erro: 'Muitas tentativas. Solicite um novo código.' });
    }

    const codigoValido = await bcrypt.compare(codigo, registro.codeHash);
    if (!codigoValido) {
      registro.attempts += 1;
      await registro.save();
      return res.status(400).json({ erro: 'Código inválido.' });
    }

    const senhaCriptografada = await bcrypt.hash(password, 10);
    await User.findByIdAndUpdate(registro.usuario, {
      password: senhaCriptografada,
      isFirstLogin: false
    });

    registro.used = true;
    await registro.save();

    res.status(200).json({ mensagem: 'Senha redefinida com sucesso.' });
  } catch (error) {
    console.error('Erro ao redefinir senha:', error);
    res.status(500).json({ erro: 'Não foi possível redefinir a senha.' });
  }
});

app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const usuario = await User.findOne({ email: String(email || '').trim().toLowerCase() });
    if (!usuario) {
      return res.status(404).json({ erro: 'Usuário não encontrado.' });
    }

    const senhaValida = await bcrypt.compare(password, usuario.password);
    if (!senhaValida) {
      return res.status(400).json({ erro: 'Senha incorreta.' });
    }

    const token = gerarTokenApp(usuario);

    res.status(200).json({
      mensagem: 'Login bem-sucedido!',
      token: token,
      role: usuario.role,
      isFirstLogin: usuario.isFirstLogin
    });

  } catch (error) {
    console.error("Erro ao fazer login:", error);
    res.status(500).json({ erro: 'Erro interno ao fazer login.' });
  }
});

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
