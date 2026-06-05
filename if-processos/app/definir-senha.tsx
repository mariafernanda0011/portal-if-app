import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import axios from 'axios';
import { API_URL } from '@/src/config/api';
import { criarCabecalhoAuth, limparToken } from '@/src/config/auth';
import { COLORS } from '@/src/styles/theme';
import { globalStyles } from '@/src/styles/globalStyles';

export default function DefinirSenha() {
  const router = useRouter();
  const { destino } = useLocalSearchParams<{ destino?: string }>();
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [senhaVisivel, setSenhaVisivel] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const salvarSenha = async () => {
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
      await axios.put(
        `${API_URL}/auth/definir-senha`,
        { password: senha },
        { headers: criarCabecalhoAuth() }
      );
      Alert.alert('Sucesso', 'Senha criada com sucesso.');
      router.replace(destino === 'admin' ? '/admin/home' : '/usuario/home');
    } catch (error: any) {
      Alert.alert('Erro', error.response?.data?.erro || 'Não foi possível criar sua senha.');
    } finally {
      setSalvando(false);
    }
  };

  const sair = () => {
    limparToken();
    router.replace('/login');
  };

  return (
    <View style={globalStyles.container}>
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Ionicons name="key-outline" size={34} color={COLORS.primary} />
        </View>

        <Text style={styles.title}>Crie sua senha</Text>
        <Text style={styles.subtitle}>
          Seu login com Google foi aceito. Agora defina uma senha definitiva para acessar o app também pelo e-mail.
        </Text>

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

        <TouchableOpacity style={globalStyles.btnPrimary} onPress={salvarSenha} disabled={salvando}>
          <Text style={globalStyles.btnPrimaryText}>{salvando ? 'Salvando...' : 'Criar senha e continuar'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.exitButton} onPress={sair}>
          <Text style={styles.exitText}>Voltar para login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 22,
  },
  iconCircle: {
    width: 72,
    height: 72,
    marginBottom: 18,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 36,
    backgroundColor: '#e8f5e9',
  },
  title: {
    color: COLORS.primary,
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 24,
    color: COLORS.gray,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  passwordInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    backgroundColor: COLORS.white,
  },
  passwordTextInput: {
    flex: 1,
    height: 48,
    paddingHorizontal: 12,
    color: COLORS.textDark,
  },
  eyeButton: {
    width: 42,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exitButton: {
    marginTop: 18,
    alignItems: 'center',
    padding: 10,
  },
  exitText: {
    color: COLORS.gray,
    fontWeight: '600',
  },
});
