# 📱 Portal IFNMG

Aplicação mobile desenvolvida em **React Native** com o objetivo de centralizar a divulgação de processos seletivos do Instituto Federal, facilitando o acesso às informações, prazos e oportunidades.

---

## 🎯 Objetivo

Atualmente, as informações sobre processos seletivos estão espalhadas em diferentes plataformas (site, Instagram, WhatsApp), o que dificulta o acesso e pode levar à perda de prazos.

Este aplicativo busca:

- 📌 Centralizar informações em um único lugar  
- 📱 Facilitar o acesso para alunos e candidatos  
- 🔔 Enviar notificações sobre novos processos  
- 📊 Melhorar a organização e visibilidade dos editais  

---

## 🚀 Tecnologias utilizadas

- React Native  
- Expo  
- TypeScript  
- Expo Router  

---

## 📱 Como executar o projeto

### 1. Clone o repositório

```bash
git clone https://github.com/mariafernanda0011/portal-if-app.git
```

### 2. Acesse a pasta do projeto

```bash
cd if-processos
```

### 3. Instale as dependências

```bash
npm install
```

### 4. Inicie o projeto

```bash
npx expo start
```


### Backend

Para que o aplicativo funcione e consiga salvar os dados (como as publicações e usuários), o servidor backend precisa estar rodando em paralelo com o Expo.

**1. Configuração de Variáveis de Ambiente (.env)**
Antes de iniciar, crie um arquivo chamado `.env` na raiz da pasta do seu backend com as seguintes variáveis de conexão (peça a senha do banco Atlas para Renato):

\`\`\`env
PORT=3000
MONGODB_LOCAL_URL=mongodb://127.0.0.1:27017/portal-ifnmg
MONGODB_ATLAS_URL=sua_url_do_atlas_aqui
CHAVE_SECRETA=sua_chave_secreta_aqui
\`\`\`
*(O servidor tentará conectar primeiro na nuvem. Se falhar, usará o banco local).*

**2. Instalando dependências e rodando o servidor**
Abra um terminal exclusivo para a pasta do backend e rode os comandos:

\`\`\`bash
# Instala as bibliotecas necessárias (faça isso na primeira vez)
npm install

# Inicia o servidor de desenvolvimento
npm run dev
\`\`\`

**3. Conexão para o Celular Físico (Localtunnel / Ngrok)**
Se você for testar o aplicativo usando o Expo Go no celular, o aplicativo não conseguirá ler o `localhost`. Você precisará expor o backend para a internet. 

Com o servidor rodando (`npm run dev`), abra uma **nova aba** no terminal do backend e rode:
\`\`\`bash
npx localtunnel --port 3000
\`\`\`
1. O terminal vai gerar um link (ex: `https://seu-link-aleatorio.loca.lt`).
2. **Importante:** Abra esse link no seu navegador do PC copie o ip no inicio da pagina,cole no campo no meio da pagina e clique no botão azul *"Continue"* para desbloquear o acesso.
3. Copie esse link e cole na variável `API_URL` dentro do arquivo `src/config/api.ts` no frontend.

### 5. Rodar no celular

1. Instale o aplicativo **Expo Go** no seu celular  
2. Escaneie o QR Code exibido no terminal  

👉 Caso esteja usando ambiente remoto (ex: Codespaces):

```bash
npx expo start --tunnel
```

---

## 🤝 Contribuição

Para contribuir com o projeto:

1. Faça um fork do repositório  
2. Crie uma branch:

```bash
git checkout -b minha-feature
```

3. Faça suas alterações  

4. Commit:

```bash
git commit -m "feat: descrição da alteração"
```

5. Envie para o repositório:

```bash
git push origin minha-feature
```

6. Abra um Pull Request  

---

## 📌 Status do projeto

🚧 **Em desenvolvimento (MVP)**
