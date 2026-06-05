import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import axios from 'axios';
import BotaoVoltar from '@/src/components/BotaoVoltar';
import { API_URL } from '@/src/config/api';
import { COLORS } from '@/src/styles/theme';
import { globalStyles } from '@/src/styles/globalStyles';

export default function ValidarCodigoSenha() {
  const router = useRouter();
  const { email = '' } = useLocalSearchParams<{ email?: string }>();
  const [codigo, setCodigo] = useState('');
  const [validando, setValidando] = useState(false);

  const validarCodigo = async () => {
    if (!/^\d{6}$/.test(codigo.trim())) {
      Alert.alert('Atenção', 'Digite o código de 6 dígitos.');
      return;
    }

    try {
      setValidando(true);
      await axios.post(`${API_URL}/auth/validar-codigo-senha`, {
        email,
        codigo: codigo.trim(),
      });
      router.push(`/nova-senha?email=${encodeURIComponent(email)}&codigo=${codigo.trim()}` as never);
    } catch (error: any) {
      Alert.alert('Erro', error.response?.data?.erro || 'Código inválido.');
    } finally {
      setValidando(false);
    }
  };

  return (
    <KeyboardAvoidingView style={globalStyles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={[globalStyles.header, styles.header]}>
        <BotaoVoltar variante="header" cor={COLORS.white} />
        <Text style={globalStyles.headerTitle}>Validar código</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Ionicons name="shield-checkmark-outline" size={34} color={COLORS.primary} />
        </View>
        <Text style={styles.title}>Digite o código</Text>
        <Text style={styles.subtitle}>Enviamos o código para {email}.</Text>

        <View style={globalStyles.inputGroup}>
          <Text style={globalStyles.label}>Código de 6 dígitos</Text>
          <TextInput
            value={codigo}
            onChangeText={(value) => setCodigo(value.replace(/\D/g, '').slice(0, 6))}
            keyboardType="number-pad"
            placeholder="000000"
            maxLength={6}
            style={[globalStyles.input, styles.codeInput]}
          />
        </View>

        <TouchableOpacity style={globalStyles.btnPrimary} onPress={validarCodigo} disabled={validando}>
          <Text style={globalStyles.btnPrimaryText}>{validando ? 'Validando...' : 'Continuar'}</Text>
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
  codeInput: { textAlign: 'center', fontSize: 24, letterSpacing: 5, fontWeight: 'bold' },
});
