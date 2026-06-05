import React, { useCallback, useState } from 'react';
import { Alert, Image, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import UserBottomNav from '@/src/components/UserBottomNav';
import { API_URL } from '@/src/config/api';
import { criarCabecalhoAuth, limparToken } from '@/src/config/auth';
import { COLORS } from '@/src/styles/theme';
import { globalStyles } from '@/src/styles/globalStyles';

type PerfilUsuario = {
  nome: string;
  email: string;
  foto?: string;
};

const perfilVazio: PerfilUsuario = {
  nome: '',
  email: '',
};

export default function Perfil() {
  const router = useRouter();
  const { primeiroAcesso } = useLocalSearchParams<{ primeiroAcesso?: string }>();
  const [perfil, setPerfil] = useState<PerfilUsuario>(perfilVazio);
  const [fotoSelecionada, setFotoSelecionada] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [senhaVisivel, setSenhaVisivel] = useState(false);
  const [modalSenhaVisivel, setModalSenhaVisivel] = useState(false);
  const [senhaModal, setSenhaModal] = useState('');
  const [confirmarSenhaModal, setConfirmarSenhaModal] = useState('');
  const [senhaModalVisivel, setSenhaModalVisivel] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [salvandoSenha, setSalvandoSenha] = useState(false);
  const [salvandoSenhaModal, setSalvandoSenhaModal] = useState(false);

  const carregarPerfil = useCallback(async () => {
    try {
      const resposta = await axios.get(`${API_URL}/auth/perfil`, {
        headers: criarCabecalhoAuth(),
      });
      setPerfil({ ...perfilVazio, ...resposta.data });
    } catch (error: any) {
      Alert.alert('Erro', error.response?.data?.erro || 'Não foi possível carregar seu perfil.');

      if (error.response?.status === 401) {
        limparToken();
        router.replace('/login');
      }
    }
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      carregarPerfil();
    }, [carregarPerfil])
  );

  const fotoPerfil = fotoSelecionada || perfil.foto;
  const fotoSource = fotoPerfil
    ? { uri: fotoPerfil.startsWith('http') || fotoPerfil.startsWith('file:') || fotoPerfil.startsWith('blob:') ? fotoPerfil : `${API_URL}/${fotoPerfil}` }
    : null;

  const selecionarFoto = async () => {
    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!resultado.canceled) {
      setFotoSelecionada(resultado.assets[0].uri);
    }
  };

  const salvarPerfil = async () => {
    if (!perfil.nome.trim()) {
      Alert.alert('Atenção', 'Informe seu nome.');
      return;
    }

    try {
      setSalvando(true);
      const formData = new FormData();
      formData.append('nome', perfil.nome);

      if (fotoSelecionada) {
        const nomeArquivo = fotoSelecionada.split('/').pop() || 'perfil.jpg';

        if (Platform.OS === 'web') {
          const respostaFoto = await fetch(fotoSelecionada);
          const blob = await respostaFoto.blob();
          formData.append('foto', blob, nomeArquivo);
        } else {
          // @ts-ignore FormData do React Native aceita objetos de arquivo com URI.
          formData.append('foto', { uri: fotoSelecionada, name: nomeArquivo, type: 'image/jpeg' });
        }
      }

      const resposta = await fetch(`${API_URL}/auth/perfil`, {
        method: 'PUT',
        headers: criarCabecalhoAuth(),
        body: formData,
      });
      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(dados.erro || 'Não foi possível atualizar seu perfil.');
      }

      setPerfil({ ...perfilVazio, ...dados });
      setFotoSelecionada('');
      Alert.alert('Sucesso', 'Perfil atualizado.');
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Não foi possível atualizar seu perfil.');
    } finally {
      setSalvando(false);
    }
  };

  const definirSenha = async () => {
    if (novaSenha.length < 6) {
      Alert.alert('Atenção', 'A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (novaSenha !== confirmarSenha) {
      Alert.alert('Atenção', 'As senhas não conferem.');
      return;
    }

    try {
      setSalvandoSenha(true);
      await axios.put(
        `${API_URL}/auth/definir-senha`,
        { password: novaSenha },
        { headers: criarCabecalhoAuth() }
      );
      setNovaSenha('');
      setConfirmarSenha('');
      Alert.alert('Sucesso', 'Senha criada com sucesso.');
      router.replace('/usuario/home');
    } catch (error: any) {
      Alert.alert('Erro', error.response?.data?.erro || 'Não foi possível criar sua senha.');
    } finally {
      setSalvandoSenha(false);
    }
  };

  const fecharModalSenha = () => {
    setModalSenhaVisivel(false);
    setSenhaModal('');
    setConfirmarSenhaModal('');
    setSenhaModalVisivel(false);
  };

  const alterarSenha = async () => {
    if (senhaModal.length < 6) {
      Alert.alert('Atenção', 'A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (senhaModal !== confirmarSenhaModal) {
      Alert.alert('Atenção', 'As senhas não conferem.');
      return;
    }

    try {
      setSalvandoSenhaModal(true);
      await axios.put(
        `${API_URL}/auth/definir-senha`,
        { password: senhaModal },
        { headers: criarCabecalhoAuth() }
      );
      fecharModalSenha();
      Alert.alert('Sucesso', 'Senha alterada com sucesso.');
    } catch (error: any) {
      Alert.alert('Erro', error.response?.data?.erro || 'Não foi possível alterar sua senha.');
    } finally {
      setSalvandoSenhaModal(false);
    }
  };

  const sair = () => {
    limparToken();
    router.replace('/login');
  };

  return (
    <View style={globalStyles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Seu perfil</Text>
        <Text style={styles.subtitle}>
          {primeiroAcesso === '1' ? 'Complete seu primeiro acesso e crie sua senha' : 'Mantenha seus dados atualizados'}
        </Text>

        <TouchableOpacity style={styles.avatarButton} onPress={selecionarFoto}>
          {fotoSource ? (
            <Image source={fotoSource} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Ionicons name="person-outline" size={44} color={COLORS.primary} />
            </View>
          )}
          <View style={styles.cameraBadge}>
            <Ionicons name="camera" size={14} color={COLORS.white} />
          </View>
        </TouchableOpacity>

        <View style={globalStyles.inputGroup}>
          <Text style={globalStyles.label}>Nome</Text>
          <TextInput
            value={perfil.nome}
            onChangeText={(nome) => setPerfil({ ...perfil, nome })}
            placeholder="Seu nome"
            style={globalStyles.input}
          />
        </View>

        <View style={globalStyles.inputGroup}>
          <Text style={globalStyles.label}>E-mail institucional</Text>
          <TextInput value={perfil.email} editable={false} style={[globalStyles.input, styles.disabledInput]} />
        </View>

        <TouchableOpacity style={globalStyles.btnPrimary} onPress={salvarPerfil} disabled={salvando}>
          <Text style={globalStyles.btnPrimaryText}>{salvando ? 'Salvando...' : 'Salvar perfil'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.changePasswordButton} onPress={() => setModalSenhaVisivel(true)}>
          <Ionicons name="key-outline" size={18} color={COLORS.primary} />
          <Text style={styles.changePasswordText}>Alterar senha</Text>
        </TouchableOpacity>

        {primeiroAcesso === '1' && (
          <View style={styles.passwordBox}>
            <Text style={styles.passwordTitle}>Criar senha do app</Text>
            <Text style={styles.passwordHint}>
              Essa senha permite entrar pelo e-mail institucional mesmo quando você não quiser usar o Google.
            </Text>

            <View style={globalStyles.inputGroup}>
              <Text style={globalStyles.label}>Nova senha</Text>
              <View style={styles.passwordInput}>
                <TextInput
                  value={novaSenha}
                  onChangeText={setNovaSenha}
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

            <TouchableOpacity style={styles.passwordButton} onPress={definirSenha} disabled={salvandoSenha}>
              <Text style={styles.passwordButtonText}>{salvandoSenha ? 'Criando senha...' : 'Criar senha e continuar'}</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={styles.logoutButton} onPress={sair}>
          <Ionicons name="log-out-outline" size={18} color={COLORS.secondary} />
          <Text style={styles.logoutText}>Sair da conta</Text>
        </TouchableOpacity>
      </ScrollView>

      <UserBottomNav ativa="perfil" />

      <Modal visible={modalSenhaVisivel} animationType="slide" transparent onRequestClose={fecharModalSenha}>
        <View style={styles.modalOverlay}>
          <View style={styles.passwordModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Alterar senha</Text>
              <TouchableOpacity style={styles.modalCloseButton} onPress={fecharModalSenha}>
                <Ionicons name="close" size={22} color={COLORS.textDark} />
              </TouchableOpacity>
            </View>

            <View style={globalStyles.inputGroup}>
              <Text style={globalStyles.label}>Nova senha</Text>
              <View style={styles.passwordInput}>
                <TextInput
                  value={senhaModal}
                  onChangeText={setSenhaModal}
                  secureTextEntry={!senhaModalVisivel}
                  placeholder="Mínimo 6 caracteres"
                  style={styles.passwordTextInput}
                />
                <TouchableOpacity style={styles.eyeButton} onPress={() => setSenhaModalVisivel(!senhaModalVisivel)}>
                  <Ionicons name={senhaModalVisivel ? 'eye-outline' : 'eye-off-outline'} size={20} color={COLORS.placeholder} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={globalStyles.inputGroup}>
              <Text style={globalStyles.label}>Confirmar nova senha</Text>
              <TextInput
                value={confirmarSenhaModal}
                onChangeText={setConfirmarSenhaModal}
                secureTextEntry={!senhaModalVisivel}
                placeholder="Repita a nova senha"
                style={globalStyles.input}
              />
            </View>

            <TouchableOpacity style={globalStyles.btnPrimary} onPress={alterarSenha} disabled={salvandoSenhaModal}>
              <Text style={globalStyles.btnPrimaryText}>{salvandoSenhaModal ? 'Alterando...' : 'Salvar nova senha'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 54,
    paddingHorizontal: 20,
    paddingBottom: 94,
  },
  title: {
    color: COLORS.primary,
    fontSize: 26,
    fontWeight: 'bold',
  },
  subtitle: {
    marginTop: 4,
    marginBottom: 22,
    color: COLORS.gray,
    fontSize: 14,
  },
  avatarButton: {
    alignSelf: 'center',
    marginBottom: 25,
  },
  avatar: {
    width: 104,
    height: 104,
    borderRadius: 52,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e8f5e9',
  },
  cameraBadge: {
    position: 'absolute',
    right: 0,
    bottom: 2,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    backgroundColor: COLORS.primary,
  },
  disabledInput: {
    color: COLORS.gray,
    backgroundColor: COLORS.lightGray,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
    padding: 12,
  },
  logoutText: {
    marginLeft: 7,
    color: COLORS.secondary,
    fontWeight: 'bold',
  },
  changePasswordButton: {
    minHeight: 48,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 8,
    backgroundColor: COLORS.white,
  },
  changePasswordText: {
    marginLeft: 7,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  passwordModal: {
    padding: 20,
    paddingTop: 16,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    backgroundColor: COLORS.white,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  modalTitle: {
    color: COLORS.primary,
    fontSize: 21,
    fontWeight: 'bold',
  },
  modalCloseButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  passwordBox: {
    marginTop: 18,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#c8e6c9',
    backgroundColor: '#f4fbf5',
  },
  passwordTitle: {
    color: COLORS.primary,
    fontSize: 17,
    fontWeight: 'bold',
  },
  passwordHint: {
    marginTop: 5,
    marginBottom: 14,
    color: COLORS.gray,
    fontSize: 12,
    lineHeight: 17,
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
  passwordButton: {
    marginTop: 4,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: COLORS.primary,
  },
  passwordButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
});
