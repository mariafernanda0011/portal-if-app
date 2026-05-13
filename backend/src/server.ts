import 'dotenv/config'; // Importa as variáveis do arquivo .env
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from './models/User';
import { Post } from './models/Post';
import multer from 'multer';


const app = express();
app.use(express.json());
app.use(cors());
app.use('/uploads', express.static('uploads'));

const PORT = process.env.PORT || 3000;
const CHAVE_SECRETA = process.env.CHAVE_SECRETA || 'chave_reserva_temporaria_123';
const MONGODB_ATLAS = process.env.MONGODB_ATLAS_URL || '';
const MONGODB_LOCAL = process.env.MONGODB_LOCAL_URL || '';

console.log('⏳ Tentando conectar ao MongoDB Atlas (Nuvem)...');

mongoose.connect(MONGODB_ATLAS, { family: 4 })
  .then(() => {
    console.log('✅ Conectado ao MongoDB Atlas com sucesso!');
  })
  .catch((erroAtlas) => {
    console.error('⚠️ Falha ao conectar no Atlas. Motivo:', erroAtlas);
    console.log('🔄 Acionando Plano B: Conectando ao Banco Local...');

    // Tenta conectar no banco local se o Atlas falhar
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

app.post('/publicacoes', upload.fields([
  { name: 'imagem', maxCount: 1 },
  { name: 'pdfs', maxCount: 5 }
]), async (req, res) => {
  try {
    const { titulo, subtitulo, descricao, linkExterno } = req.body;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const caminhoImagem = files && files['imagem'] ? files['imagem'][0].path.replace(/\\/g, '/') : '';
    const caminhosPdfs = files && files['pdfs'] ? files['pdfs'].map(f => f.path.replace(/\\/g, '/')) : [];

    const novaPostagem = new Post({
      titulo,
      subtitulo,
      descricao,
      imagem: caminhoImagem,
      urlPublicacao: linkExterno,
      arquivoPdf: caminhosPdfs[0],
    });

    await novaPostagem.save();
    res.status(201).json({ mensagem: "Publicação criada com sucesso!" });

  } catch (error) {
    console.error("Erro ao salvar publicação:", error);
    res.status(500).json({ erro: "Erro interno ao salvar." });
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

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});