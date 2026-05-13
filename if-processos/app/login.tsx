import React, { useState } from 'react';
import { View, ImageBackground, Image, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { Alert } from 'react-native';
import { API_URL } from '@/src/config/api';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');


  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erro', 'Preencha o e-mail e a senha.');
      return;
    }

    try {
      const urlDaApi = `${API_URL}/auth/login`;

      const resposta = await axios.post(urlDaApi, {
        email: email.trim(),
        password: password
      });

      if (resposta.status === 200) {
        const { token, role } = resposta.data;

        Alert.alert('Sucesso', 'Login realizado!');

        if (role === 'admin') {
          router.push('/admin/criar-publicacao');
        } else {
          router.push('/home');
        }
      }
    } catch (error: any) {

      const mensagemErro = error.response?.data?.erro || 'Não foi possível conectar ao servidor.';
      Alert.alert('Falha no Login', mensagemErro);
    }
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
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                  />
                  <TouchableOpacity onPress={() => { }}>
                    <Ionicons name="eye-off-outline" size={20} color="#747474" />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity style={styles.botao} onPress={handleLogin}>
                <Text style={styles.botaoText}>Entrar</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <TouchableOpacity style={styles.visitButton} onPress={() => router.push('/home')} >
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