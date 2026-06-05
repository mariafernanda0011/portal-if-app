import React, { useEffect, useMemo, useState } from 'react';
import { View, ImageBackground, Image, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { Alert } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import { API_URL } from '@/src/config/api';
import { salvarToken } from '@/src/config/auth';

WebBrowser.maybeCompleteAuthSession();

const googleDiscovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [senhaVisivel, setSenhaVisivel] = useState(false);
  const [entrandoGoogle, setEntrandoGoogle] = useState(false);
  const [mostrarEsqueciSenha, setMostrarEsqueciSenha] = useState(false);
  const rodandoNoExpoGo = Constants.appOwnership === 'expo';
  const expoOwner = process.env.EXPO_PUBLIC_EXPO_OWNER || Constants.expoConfig?.owner || '';
  const expoSlug = Constants.expoConfig?.slug || 'if-processos';
  const redirectUriGoogle = rodandoNoExpoGo && expoOwner
    ? `https://auth.expo.io/@${expoOwner}/${expoSlug}`
    : AuthSession.makeRedirectUri({ scheme: 'ifprocessos' });
  const googleClientId = rodandoNoExpoGo
    ? process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID
    : Platform.select({
      android: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
      ios: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
      web: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
      default: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
    });
  const googleNonce = useMemo(() => `portal-ifnmg-${Date.now()}-${Math.random().toString(16).slice(2)}`, []);
  const [googleRequest, googleResponse, promptGoogleAsync] = AuthSession.useAuthRequest({
    clientId: googleClientId || '',
    redirectUri: redirectUriGoogle,
    responseType: AuthSession.ResponseType.IdToken,
    scopes: ['openid', 'profile', 'email'],
    usePKCE: false,
    extraParams: {
      nonce: googleNonce,
      prompt: 'select_account',
    },
  }, googleDiscovery);

  const finalizarLogin = (token: string, role: string, isFirstLogin?: boolean) => {
    salvarToken(token);

    if (isFirstLogin) {
      if (role === 'admin') {
        router.replace('/definir-senha?destino=admin' as never);
      } else {
        router.replace('/perfil?primeiroAcesso=1' as never);
      }
      return;
    }

    if (role === 'admin') {
      router.replace('/admin/home');
    } else {
      router.replace('/usuario/home');
    }
  };

  const autenticarComIdToken = async (idToken: string) => {
    try {
      setEntrandoGoogle(true);
      const resposta = await axios.post(`${API_URL}/auth/google`, { idToken });
      const { token, role, isFirstLogin } = resposta.data;
      finalizarLogin(token, role, isFirstLogin);
    } catch (error: any) {
      Alert.alert('Falha no Google', error.response?.data?.erro || 'Não foi possível entrar com Google.');
    } finally {
      setEntrandoGoogle(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erro', 'Preencha o e-mail e a senha.');
      return;
    }

    try {
      setMostrarEsqueciSenha(false);
      const urlDaApi = `${API_URL}/auth/login`;

      const resposta = await axios.post(urlDaApi, {
        email: email.trim(),
        password: password
      });

      if (resposta.status === 200) {
        const { token, role, isFirstLogin } = resposta.data;

        Alert.alert('Sucesso', 'Login realizado!');
        finalizarLogin(token, role, isFirstLogin);
      }
    } catch (error: any) {

      const mensagemErro = error.response?.data?.erro || 'Não foi possível conectar ao servidor.';
      setMostrarEsqueciSenha(mensagemErro === 'Senha incorreta.');
      Alert.alert('Falha no Login', mensagemErro);
    }
  };

  useEffect(() => {
    const autenticarComGoogle = async () => {
      if (googleResponse?.type !== 'success') return;

      const idToken = googleResponse.params?.id_token;
      if (!idToken) {
        Alert.alert('Google', 'Não foi possível obter o token da conta Google.');
        return;
      }

      await autenticarComIdToken(idToken);
    };

    autenticarComGoogle();
  }, [googleResponse]);

  const handleGoogleLogin = async () => {
    if (!googleClientId) {
      Alert.alert(
        'Google',
        Platform.OS === 'android'
          ? 'Configure o Client ID do Google adequado para este ambiente. No Expo Go use o Web Client ID; em APK/AAB ou development build use o Android Client ID.'
          : 'Configure o Client ID do Google para esta plataforma nas variáveis EXPO_PUBLIC_GOOGLE_* do app.'
      );
      return;
    }

    if (rodandoNoExpoGo && !expoOwner) {
      Alert.alert(
        'Google',
        'Configure EXPO_PUBLIC_EXPO_OWNER no .env do app para gerar a URL https://auth.expo.io/@usuario/if-processos.'
      );
      return;
    }

    if (rodandoNoExpoGo) {
      if (!googleRequest?.url) {
        Alert.alert('Google', 'A autenticação ainda está carregando. Tente novamente em alguns segundos.');
        return;
      }

      try {
        setEntrandoGoogle(true);
        const returnUrl = AuthSession.getDefaultReturnUrl(undefined, { scheme: 'ifprocessos' });
        const startUrl = `${redirectUriGoogle}/start?${new URLSearchParams({
          authUrl: googleRequest.url,
          returnUrl,
        }).toString()}`;
        const resultado = await WebBrowser.openAuthSessionAsync(startUrl, returnUrl);

        if (resultado.type !== 'success') {
          return;
        }

        const respostaProxy = googleRequest.parseReturnUrl(resultado.url);

        if (respostaProxy.type !== 'success') {
          Alert.alert('Google', 'Não foi possível concluir o login pelo Google.');
          return;
        }

        const idToken = respostaProxy.params?.id_token;
        if (!idToken) {
          Alert.alert('Google', 'Não foi possível obter o token da conta Google.');
          return;
        }

        await autenticarComIdToken(idToken);
      } catch (error: any) {
        Alert.alert('Google', error.message || 'Não foi possível concluir o login pelo Google.');
      } finally {
        setEntrandoGoogle(false);
      }
      return;
    }

    await promptGoogleAsync();
  };

  return (
    <View style={styles.container}>
      <ImageBackground style={styles.imageBackground}
        source={require('../assets/images/background.png')}
        resizeMode="cover"
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.content}>

            <View style={styles.header}>
              <Image style={styles.imagem} source={require('../assets/images/ifnmg_logo.png')} />
              <Text style={styles.title}> Portal IFNMG</Text>
            </View>

            <View style={styles.form}>
              <View style={styles.campo}>
                <View style={styles.label}>
                  <Text style={styles.labelText}>E-mail: </Text>
                </View>
                <View style={styles.inputContainer}>
                  <Ionicons name="at-outline" size={20} color="#747474" />
                  <TextInput
                    style={styles.input}
                    placeholder='seu.email@ifnmg.edu.br'
                    placeholderTextColor="#666"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>
              </View>

              <View style={styles.campo}>
                <View style={styles.label}>
                  <Text style={styles.labelText}>Senha: </Text>
                </View>
                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed-outline" size={20} color="#747474" />
                  <TextInput
                    style={styles.input}
                    placeholder='******'
                    placeholderTextColor="#666"
                    secureTextEntry={!senhaVisivel}
                    value={password}
                    onChangeText={setPassword}
                  />
                  <TouchableOpacity onPress={() => setSenhaVisivel(!senhaVisivel)}>
                    <Ionicons name={senhaVisivel ? "eye-outline" : "eye-off-outline"} size={20} color="#747474" />
                  </TouchableOpacity>
                </View>
              </View>

              {mostrarEsqueciSenha && (
                <TouchableOpacity style={styles.forgotButton} onPress={() => router.push('/esqueci-senha' as never)}>
                  <Text style={styles.forgotText}>Esqueci minha senha</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity style={styles.botao} onPress={handleLogin}>
                <Text style={styles.botaoText}>Entrar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.googleButton}
                onPress={handleGoogleLogin}
                disabled={!googleRequest || entrandoGoogle}
              >
                <Ionicons name="logo-google" size={20} color="#1f1f1f" />
                <Text style={styles.googleButtonText}>
                  {entrandoGoogle ? 'Entrando com Google...' : 'Entrar com Google'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <TouchableOpacity style={styles.visitButton} onPress={() => router.push('/visitante/home')} >
                <Text style={styles.visitText}>Continuar como visitante</Text>
                <Ionicons name="arrow-forward" size={18} color="#000" />
              </TouchableOpacity>
            </View>

          </View>
        </KeyboardAvoidingView >
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  imageBackground: {
    flex: 1,
  },

  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 40,
  },

  header: {
    alignItems: "center",
    marginTop: 80,
  },

  imagem: {
    width: 230,
    height: 80,
    resizeMode: "contain",
  },

  title: {
    fontSize: 26,
    marginTop: 15,
    fontWeight: "500",
  },

  form: {
    width: "100%",
  },

  campo: {
    width: "100%",
    position: "relative",
    marginBottom: 25,
  },

  label: {
    position: "absolute",
    zIndex: 1,
    top: -12,
    left: 25,
    backgroundColor: "#ffffff",
  },

  labelText: {
    fontWeight: "600",
    fontSize: 16,
    color: "#000000bc",
    paddingHorizontal: 10,
  },

  inputContainer: {
    flexDirection: "row",
    height: 55,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#ccc",
    borderRadius: 25,
    paddingHorizontal: 15,
    backgroundColor: "#fff",
  },

  input: {
    flex: 1,
    paddingHorizontal: 10,
    fontSize: 16,
  },

  botao: {
    width: "100%",
    padding: 10,
    borderRadius: 28,
    alignItems: "center",
    backgroundColor: "#007bff",
    marginTop: 15,
    marginBottom: 10,
  },

  botaoText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  forgotButton: {
    alignSelf: "center",
    marginBottom: 12,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  forgotText: {
    color: "#d32f2f",
    fontSize: 14,
    fontWeight: "600",
  },
  googleButton: {
    width: "100%",
    padding: 12,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    borderWidth: 1.5,
    borderColor: "#ddd",
    backgroundColor: "#fff",
  },
  googleButtonText: {
    marginLeft: 8,
    color: "#1f1f1f",
    fontSize: 16,
    fontWeight: "600",
  },

  footer: {
    width: "100%",
    justifyContent: "flex-end",
    alignItems: "center",
    marginBottom: 20,
  },

  visitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
    borderRadius: 28,
    backgroundColor: "#d3d3d3",
    width: "80%",
    marginBottom: 5,
  },

  visitText: {
    fontSize: 18,
    fontWeight: "600",
    marginRight: 5,
    color: "#000000bc",
  },

});
