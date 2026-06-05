import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import axios from 'axios';
import BotaoVoltar from '@/src/components/BotaoVoltar';
import { API_URL } from '@/src/config/api';
import { COLORS } from '@/src/styles/theme';
import { globalStyles } from '@/src/styles/globalStyles';

export default function NovaSenha() {
  const router = useRouter();
  const { email = '', codigo = '' } = useLocalSearchParams<{ email?: string; codigo?: string }>();
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [senhaVisivel, setSenhaVisivel] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const redefinirSenha = async () => {
    if (senha.length < 6) {
      Alert.alert('Atenção', 'A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (senha !== confirmarSenha) {
      Alert.alert('Atenção', 'As senhas não conferem.');
      return;
    }

    try {
      setSalvando(true);
      await axios.put(`${API_URL}/auth/redefinir-senha`, {
        email,
        codigo,
        password: senha,
      });
      Alert.alert('Sucesso', 'Senha redefinida. Faça login com a nova senha.');
      router.replace('/login');
    } catch (error: any) {
      Alert.alert('Erro', error.response?.data?.erro || 'Não foi possível redefinir a senha.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <KeyboardAvoidingView style={globalStyles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={[globalStyles.header, styles.header]}>
        <BotaoVoltar variante="header" cor={COLORS.white} />
        <Text style={globalStyles.headerTitle}>Nova senha</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Ionicons name="key-outline" size={34} color={COLORS.primary} />
        </View>
        <Text style={styles.title}>Crie uma nova senha</Text>
        <Text style={styles.subtitle}>Use uma senha com pelo menos 6 caracteres.</Text>

        <View style={globalStyles.inputGroup}>
          <Text style={globalStyles.label}>Nova senha</Text>
          <View style={styles.passwordInput}>
            <TextInput
              value={senha}
              onChangeText={setSenha}
              secureTextEntry={!senhaVisivel}
              placeholder="Mínimo 6 caracteres"
              style={styles.passwordTextInput}
            />
            <TouchableOpacity style={styles.eyeButton} onPress={() => setSenhaVisivel(!senhaVisivel)}>
              <Ionicons name={senhaVisivel ? 'eye-outline' : 'eye-off-outline'} size={20} color={COLORS.placeholder} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={globalStyles.inputGroup}>
          <Text style={globalStyles.label}>Confirmar senha</Text>
          <TextInput
            value={confirmarSenha}
            onChangeText={setConfirmarSenha}
            secureTextEntry={!senhaVisivel}
            placeholder="Repita a senha"
            style={globalStyles.input}
          />
        </View>

        <TouchableOpacity style={globalStyles.btnPrimary} onPress={redefinirSenha} disabled={salvando}>
          <Text style={globalStyles.btnPrimaryText}>{salvando ? 'Salvando...' : 'Redefinir senha'}</Text>
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
  passwordInput: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: COLORS.lightGray, borderRadius: 8, backgroundColor: COLORS.white },
  passwordTextInput: { flex: 1, height: 48, paddingHorizontal: 12, color: COLORS.textDark },
  eyeButton: { width: 42, height: 48, alignItems: 'center', justifyContent: 'center' },
});
