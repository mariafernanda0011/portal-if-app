import 'dotenv/config'; // Importa as variáveis do arquivo .env
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from './models/User';
import { Post } from './models/Post';

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 3000;
const CHAVE_SECRETA = process.env.CHAVE_SECRETA || 'chave_reserva_temporaria_123';
const MONGODB_URL = process.env.MONGODB_URL || 'SUA_URL_DO_MONGODB_AQUI';


mongoose.connect(MONGODB_URL)
  .then(() => console.log('✅ Conectado ao MongoDB!'))
  .catch(err => console.error('❌ Erro ao conectar ao MongoDB:', err));

app.get('/', (req, res) => {
  res.send('API Portal IFNMG Rodando! 🚀');
});

app.post('/publicacoes', async (req, res) => {
  const { titulo, subtitulo, descricao, imagem, urlPublicacao, arquivoPdf } = req.body;

  try {
    const novaPostagem = new Post({
      titulo,
      subtitulo,
      descricao,
      imagem,
      urlPublicacao,
      arquivoPdf     
    });

    await novaPostagem.save();
    res.status(201).json({ mensagem: "Publicação criada com sucesso!" });
  } catch (error) {
    console.error("Erro ao salvar publicação:", error);
    res.status(500).json({ erro: "Erro ao salvar no banco de dados." });
  }
});

app.get('/publicacoes', async (req, res) => {
  try {
    const publicacoes = await Post.find().sort({ createdAt: -1 });
    res.status(200).json(publicacoes);
  } catch (error) {
    console.error("Erro ao buscar publicações:", error);
    res.status(500).json({ mensagem: "Erro interno do servidor." });
  }
});

app.post('/auth/cadastro', async (req, res) => {
  const { email, password } = req.body;

  try {
    const dominioFuncionario = "@ifnmg.edu.br";
    const dominioAluno = "@aluno.ifnmg.edu.br";
    const ehFuncionario = email.endsWith(dominioFuncionario);
    const ehAluno = email.endsWith(dominioAluno);

    if (!ehFuncionario && !ehAluno) {
      return res.status(403).json({
        erro: 'Apenas e-mails institucionais do IFNMG são permitidos para cadastro.'
      });
    }

    let roleAtribuida = 'user';
    if (ehFuncionario) {
      roleAtribuida = 'admin';
    }

    const usuarioExiste = await User.findOne({ email });
    if (usuarioExiste) {
      return res.status(400).json({ erro: 'Este e-mail já está cadastrado.' });
    }

    const salt = await bcrypt.genSalt(10);
    const senhaCriptografada = await bcrypt.hash(password, salt);

    const novoUsuario = new User({
      email: email,
      password: senhaCriptografada,
      role: roleAtribuida
    });

    await novoUsuario.save();

    res.status(201).json({ mensagem: `Cadastro realizado como ${roleAtribuida}!` });

  } catch (error) {
    console.error("Erro ao cadastrar:", error);
    res.status(500).json({ erro: 'Erro ao processar cadastro.' });
  }
});

app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const usuario = await User.findOne({ email });
    if (!usuario) {
      return res.status(404).json({ erro: 'Usuário não encontrado.' });
    }

    const senhaValida = await bcrypt.compare(password, usuario.password);
    if (!senhaValida) {
      return res.status(400).json({ erro: 'Senha incorreta.' });
    }

    const token = jwt.sign(
      { id: usuario._id, role: usuario.role },
      CHAVE_SECRETA,
      { expiresIn: '1d' }
    );

    res.status(200).json({
      mensagem: 'Login bem-sucedido!',
      token: token,
      role: usuario.role
    });

  } catch (error) {
    console.error("Erro ao fazer login:", error);
    res.status(500).json({ erro: 'Erro interno ao fazer login.' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});