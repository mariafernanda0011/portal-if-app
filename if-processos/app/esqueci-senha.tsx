import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import axios from 'axios';
import BotaoVoltar from '@/src/components/BotaoVoltar';
import { API_URL } from '@/src/config/api';
import { COLORS } from '@/src/styles/theme';
import { globalStyles } from '@/src/styles/globalStyles';

export default function EsqueciSenha() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [enviando, setEnviando] = useState(false);

  const solicitarCodigo = async () => {
    if (!email.trim()) {
      Alert.alert('Atenção', 'Informe o e-mail cadastrado.');
      return;
    }

    try {
      setEnviando(true);
      await axios.post(`${API_URL}/auth/esqueci-senha`, {
        email: email.trim().toLowerCase(),
      });
      Alert.alert('Código enviado', 'Verifique seu e-mail institucional.');
      router.push(`/validar-codigo-senha?email=${encodeURIComponent(email.trim().toLowerCase())}` as never);
    } catch (error: any) {
      Alert.alert('Erro', error.response?.data?.erro || 'Não foi possível enviar o código.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <KeyboardAvoidingView style={globalStyles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={[globalStyles.header, styles.header]}>
        <BotaoVoltar variante="header" cor={COLORS.white} />
        <Text style={globalStyles.headerTitle}>Recuperar senha</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Ionicons name="mail-outline" size={34} color={COLORS.primary} />
        </View>
        <Text style={styles.title}>Informe seu e-mail</Text>
        <Text style={styles.subtitle}>Enviaremos um código de 6 dígitos que expira em 15 minutos.</Text>

        <View style={globalStyles.inputGroup}>
          <Text style={globalStyles.label}>E-mail cadastrado</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="seu.email@ifnmg.edu.br"
            style={globalStyles.input}
          />
        </View>

        <TouchableOpacity style={globalStyles.btnPrimary} onPress={solicitarCodigo} disabled={enviando}>
          <Text style={globalStyles.btnPrimaryText}>{enviando ? 'Enviando...' : 'Enviar código'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center' },
  content: { flex: 1, justifyContent: 'center', padding: 22 },
  iconCircle: { width: 72, height: 72, marginBottom: 18, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', borderRadius: 36, backgroundColor: '#e8f5e9' },
  title: { color: COLORS.primary, fontSize: 24, fontWeight: 'bold', textAlign: 'center' },
  subtitle: { marginTop: 8, marginBottom: 24, color: COLORS.gray, fontSize: 14, lineHeight: 20, textAlign: 'center' },
});
