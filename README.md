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
GOOGLE_CLIENT_ID=seu_google_client_id_aqui
SMTP_HOST=smtp.seu_provedor.com
SMTP_PORT=587
SMTP_USER=seu_email_de_envio
SMTP_PASS=sua_senha_ou_app_password
SMTP_FROM="Portal IFNMG <seu_email_de_envio>"
\`\`\`
*(O servidor tentará conectar primeiro na nuvem. Se falhar, usará o banco local).*

As variáveis `SMTP_*` são usadas para enviar o código de recuperação de senha. Em desenvolvimento, se elas não estiverem configuradas, o backend mostra o código no terminal para facilitar testes locais.

Se o app usar mais de um Client ID do Google, por exemplo Web e Android, você também pode informar todos no backend separados por vírgula:

```env
GOOGLE_CLIENT_IDS=client_web.apps.googleusercontent.com,client_android.apps.googleusercontent.com
```

**2. Instalando dependências e rodando o servidor**
Abra um terminal exclusivo para a pasta do backend e rode os comandos:

\`\`\`bash
# Instala as bibliotecas necessárias (faça isso na primeira vez)
npm install

# Inicia o servidor de desenvolvimento
npm run dev
\`\`\`

### Configurando a URL da API no app

O frontend lê a URL do backend pela variável `EXPO_PUBLIC_API_URL`. Assim você não precisa alterar o arquivo `src/config/api.ts` toda vez que mudar de IP ou trocar o link do tunnel.

Dentro da pasta `if-processos`, crie um arquivo chamado `.env`:

```env
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_GOOGLE_CLIENT_ID=seu_google_client_id_padrao
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=seu_google_client_id_web
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=seu_google_client_id_android
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=seu_google_client_id_ios
EXPO_PUBLIC_EXPO_OWNER=seu_usuario_ou_org_da_expo
```

No Google Cloud Console, adicione a URL de redirecionamento do Expo Go no Web Client ID:

```txt
https://auth.expo.io/@seu_usuario_ou_org_da_expo/if-processos
```

O proxy `auth.expo.io` é usado apenas no Expo Go. Em APK, AAB ou development build, use o Client ID nativo da plataforma.

Use a URL conforme o ambiente:

- **Web no mesmo computador:** `http://localhost:3000`
- **Celular na mesma rede Wi-Fi:** `http://IP_DO_SEU_PC:3000`, por exemplo `http://192.168.0.10:3000`
- **Celular fora da rede ou usando tunnel:** use a URL gerada pelo serviço, por exemplo `https://seu-link.loca.lt`

Depois de mudar o `.env`, reinicie o Expo para ele carregar a nova variável:

```bash
npx expo start --clear
```

**Conexão para o Celular Físico (Localtunnel / Ngrok / Cloudflared)**
Se você for testar o aplicativo usando o Expo Go no celular e não quiser usar o IP local do computador, exponha o backend para a internet com um serviço de tunnel.

Com o servidor rodando (`npm run dev`), abra uma **nova aba** no terminal do backend e rode uma das opções:

```bash
npx localtunnel --port 3000
```

ou:

```bash
cloudflared tunnel --url http://localhost:3000
```

Copie a URL gerada e coloque no arquivo `if-processos/.env`:

```env
EXPO_PUBLIC_API_URL=https://seu-link-gerado
```

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
