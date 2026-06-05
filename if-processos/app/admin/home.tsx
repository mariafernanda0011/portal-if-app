import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { API_URL } from '@/src/config/api';
import { criarCabecalhoAuth, limparToken } from '@/src/config/auth';
import { COLORS } from '@/src/styles/theme';
import { globalStyles } from '@/src/styles/globalStyles';

type Cargo = '' | 'professor' | 'coordenador' | 'diretor_ensino' | 'diretor_geral' | 'administrador';

type Perfil = {
  nome: string;
  email: string;
  cargo: Cargo;
  foto?: string;
  curso: string;
  disciplina: string;
};

type Publicacao = {
  _id: string;
  titulo: string;
  subtitulo?: string;
  descricao: string;
  imagem?: string;
  urlPublicacao?: string;
  pdfs?: string[];
  arquivoPdf?: string;
  autor?: {
    nome?: string;
    cargo?: Cargo;
  };
  encerrada?: boolean;
  createdAt: string;
};

type AdminNotificacao = {
  _id: string;
  tipo: 'comentario' | 'interesse';
  lida: boolean;
  createdAt: string;
  texto?: string;
  nomeVisitante?: string;
  usuario?: {
    nome?: string;
    email?: string;
  };
  publicacao?: {
    _id: string;
    titulo: string;
  };
};

const CARGOS: { valor: Cargo; rotulo: string }[] = [
  { valor: 'professor', rotulo: 'Professor' },
  { valor: 'coordenador', rotulo: 'Coordenador de curso' },
  { valor: 'diretor_ensino', rotulo: 'Diretor de ensino' },
  { valor: 'diretor_geral', rotulo: 'Diretor geral' },
  { valor: 'administrador', rotulo: 'Administrador' },
];

const perfilVazio: Perfil = {
  nome: '',
  email: '',
  cargo: '',
  curso: '',
  disciplina: '',
};

export default function HomeAdmin() {
  const router = useRouter();
  const [perfil, setPerfil] = useState<Perfil>(perfilVazio);
  const [perfilEmEdicao, setPerfilEmEdicao] = useState<Perfil>(perfilVazio);
  const [fotoSelecionada, setFotoSelecionada] = useState('');
  const [publicacoes, setPublicacoes] = useState<Publicacao[]>([]);
  const [publicacaoEmEdicao, setPublicacaoEmEdicao] = useState<Publicacao | null>(null);
  const [imagemPostSelecionada, setImagemPostSelecionada] = useState('');
  const [pdfsPostSelecionados, setPdfsPostSelecionados] = useState<string[]>([]);
  const [busca, setBusca] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [modalPerfilVisivel, setModalPerfilVisivel] = useState(false);
  const [modalSenhaVisivel, setModalSenhaVisivel] = useState(false);
  const [senhaModal, setSenhaModal] = useState('');
  const [confirmarSenhaModal, setConfirmarSenhaModal] = useState('');
  const [senhaModalVisivel, setSenhaModalVisivel] = useState(false);
  const [salvandoSenha, setSalvandoSenha] = useState(false);
  const [mensagensNaoLidas, setMensagensNaoLidas] = useState(0);
  const [notificacoesNaoLidas, setNotificacoesNaoLidas] = useState(0);
  const [modalNotificacoesVisivel, setModalNotificacoesVisivel] = useState(false);
  const [notificacoesAdmin, setNotificacoesAdmin] = useState<AdminNotificacao[]>([]);
  const [carregandoNotificacoes, setCarregandoNotificacoes] = useState(false);

  const carregarPainel = useCallback(async () => {
    try {
      const headers = criarCabecalhoAuth();
      const [respostaPerfil, respostaPublicacoes] = await Promise.all([
        axios.get(`${API_URL}/auth/perfil`, { headers }),
        axios.get(`${API_URL}/admin/publicacoes`, { headers }),
      ]);

      setPerfil({ ...perfilVazio, ...respostaPerfil.data });
      setPublicacoes(respostaPublicacoes.data);
    } catch (error: any) {
      const mensagem = error.response?.data?.erro || 'Não foi possível carregar o painel.';
      Alert.alert('Atenção', mensagem);

      if (error.response?.status === 401 || error.response?.status === 403) {
        limparToken();
        router.replace('/login');
      }
    } finally {
      setCarregando(false);
    }
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      carregarPainel();
    }, [carregarPainel])
  );

  useFocusEffect(
    useCallback(() => {
      const carregarNaoLidas = async () => {
        try {
          const headers = criarCabecalhoAuth();
          const [respostaChats, respostaInteresses] = await Promise.all([
            axios.get(`${API_URL}/chats/nao-lidas`, { headers }),
            axios.get(`${API_URL}/admin/notificacoes/nao-lidas`, { headers }),
          ]);
          setMensagensNaoLidas(respostaChats.data.total);
          setNotificacoesNaoLidas(respostaInteresses.data.total);
        } catch {
          setMensagensNaoLidas(0);
          setNotificacoesNaoLidas(0);
        }
      };

      carregarNaoLidas();
      const intervalo = setInterval(carregarNaoLidas, 5000);
      return () => clearInterval(intervalo);
    }, [])
  );

  const fotoPerfil = fotoSelecionada || perfil.foto;
  const fotoSource = fotoPerfil
    ? { uri: fotoPerfil.startsWith('http') || fotoPerfil.startsWith('file:') ? fotoPerfil : `${API_URL}/${fotoPerfil}` }
    : null;
  const imagemPostEdicao = imagemPostSelecionada || publicacaoEmEdicao?.imagem;
  const imagemPostSource = imagemPostEdicao
    ? { uri: imagemPostEdicao.startsWith('http') || imagemPostEdicao.startsWith('file:') || imagemPostEdicao.startsWith('blob:') ? imagemPostEdicao : `${API_URL}/${imagemPostEdicao}` }
    : null;
  const publicacoesFiltradas = publicacoes.filter((publicacao) => {
    const termo = busca.trim().toLowerCase();

    return !termo
      || publicacao.titulo.toLowerCase().includes(termo)
      || publicacao.subtitulo?.toLowerCase().includes(termo)
      || publicacao.descricao.toLowerCase().includes(termo);
  });

  const abrirEdicaoPerfil = () => {
    setPerfilEmEdicao({ ...perfilVazio, ...perfil });
    setFotoSelecionada('');
    setModalPerfilVisivel(true);
  };

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

  const abrirEdicaoPublicacao = (publicacao: Publicacao) => {
    setPublicacaoEmEdicao({ ...publicacao });
    setImagemPostSelecionada('');
    setPdfsPostSelecionados([]);
  };

  const fecharEdicaoPublicacao = () => {
    setPublicacaoEmEdicao(null);
    setImagemPostSelecionada('');
    setPdfsPostSelecionados([]);
  };

  const selecionarImagemPost = async () => {
    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.9,
    });

    if (!resultado.canceled) {
      setImagemPostSelecionada(resultado.assets[0].uri);
    }
  };

  const selecionarPdfsPost = async () => {
    const resultado = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
      copyToCacheDirectory: true,
      multiple: true,
    });

    if (!resultado.canceled) {
      const novosPdfs = resultado.assets.map((asset) => {
        if (Platform.OS === 'web' && asset.file) {
          return URL.createObjectURL(asset.file);
        }

        return asset.uri;
      });

      setPdfsPostSelecionados(novosPdfs.slice(0, 5));
    }
  };

  const salvarPerfil = async () => {
    if (!perfilEmEdicao.nome.trim()) {
      Alert.alert('Atenção', 'Informe seu nome.');
      return;
    }

    if (!perfilEmEdicao.cargo) {
      Alert.alert('Atenção', 'Selecione seu cargo.');
      return;
    }

    try {
      setSalvando(true);
      const formData = new FormData();
      formData.append('nome', perfilEmEdicao.nome);
      formData.append('cargo', perfilEmEdicao.cargo);
      formData.append('curso', perfilEmEdicao.curso);
      formData.append('disciplina', perfilEmEdicao.disciplina);

      if (fotoSelecionada) {
        const nome = fotoSelecionada.split('/').pop() || 'perfil.jpg';

        if (Platform.OS === 'web') {
          const response = await fetch(fotoSelecionada);
          const blob = await response.blob();
          formData.append('foto', blob, nome);
        } else {
          // @ts-ignore FormData do React Native aceita objetos de arquivo com URI.
          formData.append('foto', { uri: fotoSelecionada, name: nome, type: 'image/jpeg' });
        }
      }

      const resposta = await fetch(`${API_URL}/auth/perfil`, {
        method: 'PUT',
        headers: criarCabecalhoAuth(),
        body: formData,
      });

      const textoResposta = await resposta.text();
      let dados: any = {};

      try {
        dados = textoResposta ? JSON.parse(textoResposta) : {};
      } catch {
        throw new Error(`Resposta inválida do servidor (${resposta.status}). Verifique a URL da API e o tunnel.`);
      }

      if (!resposta.ok) {
        throw new Error(dados.erro || `Não foi possível atualizar o perfil (${resposta.status}).`);
      }

      setPerfil({ ...perfilVazio, ...dados });
      setModalPerfilVisivel(false);
      setFotoSelecionada('');
      Alert.alert('Sucesso', 'Perfil atualizado.');
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Não foi possível atualizar o perfil.');
    } finally {
      setSalvando(false);
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
      setSalvandoSenha(true);
      await axios.put(
        `${API_URL}/auth/definir-senha`,
        { password: senhaModal },
        { headers: criarCabecalhoAuth() }
      );
      fecharModalSenha();
      Alert.alert('Sucesso', 'Senha alterada com sucesso.');
    } catch (error: any) {
      Alert.alert('Erro', error.response?.data?.erro || 'Não foi possível alterar a senha.');
    } finally {
      setSalvandoSenha(false);
    }
  };

  const salvarPublicacao = async () => {
    if (!publicacaoEmEdicao) return;

    try {
      setSalvando(true);
      const formData = new FormData();
      formData.append('titulo', publicacaoEmEdicao.titulo);
      formData.append('subtitulo', publicacaoEmEdicao.subtitulo || '');
      formData.append('descricao', publicacaoEmEdicao.descricao);
      formData.append('urlPublicacao', publicacaoEmEdicao.urlPublicacao || '');

      if (imagemPostSelecionada) {
        const nomeImagem = imagemPostSelecionada.split('/').pop() || 'capa.jpg';

        if (Platform.OS === 'web') {
          const response = await fetch(imagemPostSelecionada);
          const blob = await response.blob();
          formData.append('imagem', blob, nomeImagem);
        } else {
          // @ts-ignore FormData do React Native aceita objetos de arquivo com URI.
          formData.append('imagem', { uri: imagemPostSelecionada, name: nomeImagem, type: 'image/jpeg' });
        }
      }

      for (const [index, pdfUri] of pdfsPostSelecionados.entries()) {
        const nomePdf = `arquivo_${index}.pdf`;

        if (Platform.OS === 'web') {
          const response = await fetch(pdfUri);
          const blob = await response.blob();
          formData.append('pdfs', blob, nomePdf);
        } else {
          // @ts-ignore FormData do React Native aceita objetos de arquivo com URI.
          formData.append('pdfs', { uri: pdfUri, name: nomePdf, type: 'application/pdf' });
        }
      }

      const resposta = await fetch(`${API_URL}/admin/publicacoes/${publicacaoEmEdicao._id}`, {
        method: 'PUT',
        headers: criarCabecalhoAuth(),
        body: formData,
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(dados.erro || 'Não foi possível editar a publicação.');
      }

      setPublicacoes((atuais) =>
        atuais.map((item) => (item._id === dados._id ? dados : item))
      );
      fecharEdicaoPublicacao();
      Alert.alert('Sucesso', 'Publicação atualizada.');
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Não foi possível editar a publicação.');
    } finally {
      setSalvando(false);
    }
  };

  const encerrarPublicacao = (publicacao: Publicacao) => {
    Alert.alert(
      'Encerrar publicação',
      `Deseja encerrar "${publicacao.titulo}"? Ela deixará de aparecer para os visitantes.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Encerrar',
          style: 'destructive',
          onPress: async () => {
            try {
              const resposta = await axios.patch(
                `${API_URL}/admin/publicacoes/${publicacao._id}/encerrar`,
                {},
                { headers: criarCabecalhoAuth() }
              );
              setPublicacoes((atuais) =>
                atuais.map((item) => (item._id === resposta.data._id ? resposta.data : item))
              );
            } catch (error: any) {
              Alert.alert('Erro', error.response?.data?.erro || 'Não foi possível encerrar a publicação.');
            }
          },
        },
      ]
    );
  };

  const reativarPublicacao = (publicacao: Publicacao) => {
    Alert.alert(
      'Reativar publicação',
      `Deseja realmente reativar "${publicacao.titulo}"? Ela voltará a aparecer para os visitantes.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Reativar',
          onPress: async () => {
            try {
              const resposta = await axios.patch(
                `${API_URL}/admin/publicacoes/${publicacao._id}/reativar`,
                {},
                { headers: criarCabecalhoAuth() }
              );
              setPublicacoes((atuais) =>
                atuais.map((item) => (item._id === resposta.data._id ? resposta.data : item))
              );
            } catch (error: any) {
              Alert.alert('Erro', error.response?.data?.erro || 'Não foi possível reativar a publicação.');
            }
          },
        },
      ]
    );
  };

  const sair = () => {
    limparToken();
    router.replace('/login');
  };

  const abrirNotificacoesAdmin = async () => {
    try {
      setModalNotificacoesVisivel(true);
      setCarregandoNotificacoes(true);
      const headers = criarCabecalhoAuth();
      const resposta = await axios.get(`${API_URL}/admin/notificacoes`, { headers });
      setNotificacoesAdmin(resposta.data);
      await axios.patch(`${API_URL}/admin/notificacoes/lidas`, {}, { headers });
      setNotificacoesNaoLidas(0);
    } catch (error: any) {
      Alert.alert('Erro', error.response?.data?.erro || 'Não foi possível carregar as notificações.');
    } finally {
      setCarregandoNotificacoes(false);
    }
  };

  const abrirPublicacaoDaNotificacao = (notificacao: AdminNotificacao) => {
    if (!notificacao.publicacao?._id) return;

    setModalNotificacoesVisivel(false);
    router.push(`/publicacao/${notificacao.publicacao._id}` as never);
  };

  if (carregando) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={globalStyles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={abrirNotificacoesAdmin}
            >
              <Ionicons name={notificacoesNaoLidas > 0 ? 'notifications' : 'notifications-outline'} size={20} color={COLORS.white} />
              {notificacoesNaoLidas > 0 && (
                <View style={styles.headerBadge}>
                  <Text style={styles.headerBadgeText}>{notificacoesNaoLidas > 99 ? '99+' : notificacoesNaoLidas}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton} onPress={() => router.push('/admin/chats' as never)}>
              <Ionicons name="chatbubbles-outline" size={20} color={COLORS.white} />
              {mensagensNaoLidas > 0 && (
                <View style={styles.headerBadge}>
                  <Text style={styles.headerBadgeText}>{mensagensNaoLidas > 99 ? '99+' : mensagensNaoLidas}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton} onPress={sair}>
              <Ionicons name="log-out-outline" size={20} color={COLORS.white} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.avatarButton} onPress={abrirEdicaoPerfil}>
            {fotoSource ? (
              <Image source={fotoSource} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Ionicons name="person-outline" size={42} color={COLORS.primary} />
              </View>
            )}
            <View style={styles.cameraBadge}>
              <Ionicons name="camera" size={14} color={COLORS.white} />
            </View>
          </TouchableOpacity>

          <Text style={styles.nome}>{perfil.nome || 'Administrador'}</Text>
          <Text style={styles.cargo}>{rotuloCargo(perfil.cargo)}</Text>
          <TouchableOpacity style={styles.editProfileButton} onPress={abrirEdicaoPerfil}>
            <Ionicons name="create-outline" size={16} color={COLORS.white} />
            <Text style={styles.editProfileText}>Editar perfil</Text>
          </TouchableOpacity>

          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={19} color={COLORS.gray} />
            <TextInput
              value={busca}
              onChangeText={setBusca}
              placeholder="Buscar publicação..."
              placeholderTextColor={COLORS.placeholder}
              style={styles.searchInput}
            />
            {!!busca && (
              <TouchableOpacity style={styles.clearSearch} onPress={() => setBusca('')}>
                <Ionicons name="close-circle" size={18} color={COLORS.placeholder} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Suas publicações</Text>
              <Text style={styles.sectionSubtitle}>
                {publicacoes.length} {publicacoes.length === 1 ? 'publicação cadastrada' : 'publicações cadastradas'}
              </Text>
            </View>
            <TouchableOpacity style={styles.addButton} onPress={() => router.push('/admin/criar-publicacao')}>
              <Ionicons name="add" size={22} color={COLORS.white} />
            </TouchableOpacity>
          </View>

          {publicacoesFiltradas.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="document-text-outline" size={42} color={COLORS.placeholder} />
              <Text style={styles.emptyText}>
                {busca ? 'Nenhuma publicação encontrada.' : 'Nenhuma publicação cadastrada.'}
              </Text>
            </View>
          ) : (
            publicacoesFiltradas.map((publicacao) => (
              <TouchableOpacity
                key={publicacao._id}
                style={styles.postCard}
                activeOpacity={0.88}
                onPress={() => router.push(`/publicacao/${publicacao._id}` as never)}
              >
                <View style={styles.postHeader}>
                  <View style={styles.postContent}>
                    <Text style={styles.postTitle}>{publicacao.titulo}</Text>
                    {!!publicacao.subtitulo && <Text style={styles.postSubtitle}>{publicacao.subtitulo}</Text>}
                  </View>
                  <View style={[styles.status, publicacao.encerrada ? styles.statusClosed : styles.statusActive]}>
                    <Text style={[styles.statusText, publicacao.encerrada ? styles.statusTextClosed : styles.statusTextActive]}>
                      {publicacao.encerrada ? 'Encerrada' : 'Ativa'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.postDescription} numberOfLines={3}>{publicacao.descricao}</Text>
                {!!publicacao.autor?.nome && (
                  <Text style={styles.postAuthor}>
                    {publicacao.autor.nome}{publicacao.autor.cargo ? ` • ${rotuloCargo(publicacao.autor.cargo)}` : ''}
                  </Text>
                )}
                <Text style={styles.postDate}>{formatarData(publicacao.createdAt)}</Text>

                <View style={styles.postActions}>
                  <TouchableOpacity
                    style={styles.secondaryAction}
                    onPress={() => router.push(`/publicacao/${publicacao._id}` as never)}
                  >
                    <Ionicons name="chatbubble-ellipses-outline" size={17} color={COLORS.primary} />
                    <Text style={styles.secondaryActionText}>Comentários</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.secondaryAction}
                    onPress={() => abrirEdicaoPublicacao(publicacao)}
                  >
                    <Ionicons name="create-outline" size={17} color={COLORS.primary} />
                    <Text style={styles.secondaryActionText}>Editar</Text>
                  </TouchableOpacity>
                  {!publicacao.encerrada && (
                    <TouchableOpacity style={styles.closeAction} onPress={() => encerrarPublicacao(publicacao)}>
                      <Ionicons name="close-circle-outline" size={17} color={COLORS.secondary} />
                      <Text style={styles.closeActionText}>Encerrar</Text>
                    </TouchableOpacity>
                  )}
                  {publicacao.encerrada && (
                    <TouchableOpacity style={styles.reactivateAction} onPress={() => reativarPublicacao(publicacao)}>
                      <Ionicons name="refresh-circle-outline" size={17} color={COLORS.primary} />
                      <Text style={styles.reactivateActionText}>Reativar</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      <View style={styles.bottomNav}>
        <NavItem icon="home" label="Painel" ativo onPress={() => {}} />
        <NavItem icon="add-circle-outline" label="Novo" onPress={() => router.push('/admin/criar-publicacao')} />
        <NavItem icon="eye-outline" label="Visualizar" onPress={() => router.push('/home')} />
        <NavItem icon="person-outline" label="Perfil" onPress={abrirEdicaoPerfil} />
      </View>

      <Modal visible={modalNotificacoesVisivel} animationType="slide" transparent onRequestClose={() => setModalNotificacoesVisivel(false)}>
        <View style={styles.notificationOverlay}>
          <View style={styles.notificationPanel}>
            <View style={styles.notificationHeader}>
              <View>
                <Text style={styles.notificationModalTitle}>Notificações</Text>
                <Text style={styles.notificationModalSubtitle}>Comentários e interessados nas suas publicações</Text>
              </View>
              <TouchableOpacity style={styles.iconButton} onPress={() => setModalNotificacoesVisivel(false)}>
                <Ionicons name="close" size={22} color={COLORS.textDark} />
              </TouchableOpacity>
            </View>

            {carregandoNotificacoes ? (
              <View style={styles.notificationLoading}>
                <ActivityIndicator size="large" color={COLORS.primary} />
              </View>
            ) : (
              <ScrollView contentContainerStyle={notificacoesAdmin.length === 0 ? styles.notificationEmptyList : styles.notificationList}>
                {notificacoesAdmin.length === 0 ? (
                  <View style={styles.notificationEmpty}>
                    <Ionicons name="notifications-off-outline" size={42} color={COLORS.placeholder} />
                    <Text style={styles.notificationEmptyTitle}>Nada novo por aqui</Text>
                    <Text style={styles.notificationEmptyText}>Quando um aluno comentar ou marcar interesse, aparecerá neste sino.</Text>
                  </View>
                ) : (
                  notificacoesAdmin.map((notificacao) => (
                    <TouchableOpacity
                      key={`${notificacao.tipo}-${notificacao._id}`}
                      style={[styles.adminNotificationItem, !notificacao.lida && styles.adminNotificationUnread]}
                      onPress={() => abrirPublicacaoDaNotificacao(notificacao)}
                    >
                      <View style={styles.adminNotificationIcon}>
                        <Ionicons
                          name={notificacao.tipo === 'comentario' ? 'chatbubble-ellipses-outline' : 'hand-left-outline'}
                          size={19}
                          color={COLORS.primary}
                        />
                      </View>
                      <View style={styles.adminNotificationContent}>
                        <Text style={styles.adminNotificationTitle}>{tituloNotificacaoAdmin(notificacao)}</Text>
                        <Text style={styles.adminNotificationText} numberOfLines={2}>{textoNotificacaoAdmin(notificacao)}</Text>
                        <Text style={styles.adminNotificationDate}>{formatarData(notificacao.createdAt)}</Text>
                      </View>
                      {!notificacao.lida && <View style={styles.adminUnreadDot} />}
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      <Modal visible={modalPerfilVisivel} animationType="slide" onRequestClose={() => setModalPerfilVisivel(false)}>
        <ScrollView style={styles.modal} contentContainerStyle={styles.modalContent}>
          <ModalHeader titulo="Editar perfil" onClose={() => setModalPerfilVisivel(false)} />

          <TouchableOpacity style={styles.profilePhotoEditor} onPress={selecionarFoto}>
            {fotoSource ? (
              <Image source={fotoSource} style={styles.profilePhoto} />
            ) : (
              <View style={[styles.profilePhoto, styles.avatarPlaceholder]}>
                <Ionicons name="person-outline" size={44} color={COLORS.primary} />
              </View>
            )}
            <Text style={styles.photoAction}>Alterar foto</Text>
          </TouchableOpacity>

          <Campo label="Nome" value={perfilEmEdicao.nome} onChangeText={(nome) => setPerfilEmEdicao({ ...perfilEmEdicao, nome })} />
          <Text style={globalStyles.label}>Cargo</Text>
          <View style={styles.options}>
            {CARGOS.map((cargo) => (
              <TouchableOpacity
                key={cargo.valor}
                style={[styles.option, perfilEmEdicao.cargo === cargo.valor && styles.optionSelected]}
                onPress={() => setPerfilEmEdicao({ ...perfilEmEdicao, cargo: cargo.valor })}
              >
                <Text style={[styles.optionText, perfilEmEdicao.cargo === cargo.valor && styles.optionTextSelected]}>
                  {cargo.rotulo}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {(perfilEmEdicao.cargo === 'professor' || perfilEmEdicao.cargo === 'coordenador') && (
            <Campo label="Curso" value={perfilEmEdicao.curso} onChangeText={(curso) => setPerfilEmEdicao({ ...perfilEmEdicao, curso })} />
          )}
          {perfilEmEdicao.cargo === 'professor' && (
            <Campo label="Disciplina" value={perfilEmEdicao.disciplina} onChangeText={(disciplina) => setPerfilEmEdicao({ ...perfilEmEdicao, disciplina })} />
          )}

          <TouchableOpacity style={globalStyles.btnPrimary} onPress={salvarPerfil} disabled={salvando}>
            <Text style={globalStyles.btnPrimaryText}>{salvando ? 'Salvando...' : 'Salvar perfil'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.changePasswordButton} onPress={() => setModalSenhaVisivel(true)}>
            <Ionicons name="key-outline" size={18} color={COLORS.primary} />
            <Text style={styles.changePasswordText}>Alterar senha</Text>
          </TouchableOpacity>
        </ScrollView>
      </Modal>

      <Modal visible={modalSenhaVisivel} animationType="slide" transparent onRequestClose={fecharModalSenha}>
        <View style={styles.passwordModalOverlay}>
          <View style={styles.passwordModal}>
            <View style={styles.passwordModalHeader}>
              <Text style={styles.passwordModalTitle}>Alterar senha</Text>
              <TouchableOpacity style={styles.iconButton} onPress={fecharModalSenha}>
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

            <TouchableOpacity style={globalStyles.btnPrimary} onPress={alterarSenha} disabled={salvandoSenha}>
              <Text style={globalStyles.btnPrimaryText}>{salvandoSenha ? 'Alterando...' : 'Salvar nova senha'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={!!publicacaoEmEdicao} animationType="slide" onRequestClose={fecharEdicaoPublicacao}>
        <ScrollView style={styles.modal} contentContainerStyle={styles.modalContent}>
          <ModalHeader titulo="Editar publicação" onClose={fecharEdicaoPublicacao} />
          {publicacaoEmEdicao && (
            <>
              <Campo label="Título" value={publicacaoEmEdicao.titulo} onChangeText={(titulo) => setPublicacaoEmEdicao({ ...publicacaoEmEdicao, titulo })} />
              <Campo label="Subtítulo" value={publicacaoEmEdicao.subtitulo || ''} onChangeText={(subtitulo) => setPublicacaoEmEdicao({ ...publicacaoEmEdicao, subtitulo })} />
              <Campo label="Descrição" multiline value={publicacaoEmEdicao.descricao} onChangeText={(descricao) => setPublicacaoEmEdicao({ ...publicacaoEmEdicao, descricao })} />
              <Campo label="Link externo" value={publicacaoEmEdicao.urlPublicacao || ''} onChangeText={(urlPublicacao) => setPublicacaoEmEdicao({ ...publicacaoEmEdicao, urlPublicacao })} />

              <Text style={styles.attachmentsTitle}>Arquivos e mídia</Text>
              {imagemPostSource && <Image source={imagemPostSource} style={styles.postImagePreview} />}
              <TouchableOpacity style={styles.attachmentButton} onPress={selecionarImagemPost}>
                <Ionicons name="image-outline" size={19} color={COLORS.primary} />
                <Text style={styles.attachmentButtonText}>
                  {imagemPostSelecionada ? 'Trocar imagem selecionada' : 'Trocar imagem de capa'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.attachmentButton} onPress={selecionarPdfsPost}>
                <Ionicons name="document-attach-outline" size={19} color={COLORS.primary} />
                <Text style={styles.attachmentButtonText}>Substituir PDFs</Text>
              </TouchableOpacity>

              {pdfsPostSelecionados.length > 0 ? (
                pdfsPostSelecionados.map((pdf, index) => (
                  <View key={`${pdf}-${index}`} style={styles.selectedFile}>
                    <Ionicons name="document-text-outline" size={18} color={COLORS.secondary} />
                    <Text style={styles.selectedFileText} numberOfLines={1}>{nomeArquivo(pdf)}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.attachmentHint}>Os PDFs atuais serão mantidos até você selecionar novos arquivos.</Text>
              )}

              <TouchableOpacity style={globalStyles.btnPrimary} onPress={salvarPublicacao} disabled={salvando}>
                <Text style={globalStyles.btnPrimaryText}>{salvando ? 'Salvando...' : 'Salvar alterações'}</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </Modal>
    </View>
  );
}

function Campo({ label, multiline, ...props }: { label: string; multiline?: boolean; value: string; onChangeText: (value: string) => void }) {
  return (
    <View style={globalStyles.inputGroup}>
      <Text style={globalStyles.label}>{label}</Text>
      <TextInput
        {...props}
        multiline={multiline}
        style={[globalStyles.input, multiline && styles.textArea]}
      />
    </View>
  );
}

function ModalHeader({ titulo, onClose }: { titulo: string; onClose: () => void }) {
  return (
    <View style={styles.modalHeader}>
      <Text style={styles.modalTitle}>{titulo}</Text>
      <TouchableOpacity style={styles.iconButton} onPress={onClose}>
        <Ionicons name="close" size={22} color={COLORS.textDark} />
      </TouchableOpacity>
    </View>
  );
}

function NavItem({ icon, label, ativo, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; ativo?: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.navItem} onPress={onPress}>
      <Ionicons name={icon} size={21} color={ativo ? COLORS.primary : COLORS.placeholder} />
      <Text style={[styles.navText, ativo && styles.navTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function rotuloCargo(cargo: Cargo) {
  return CARGOS.find((item) => item.valor === cargo)?.rotulo || 'Perfil administrativo';
}

function formatarData(data: string) {
  return new Date(data).toLocaleDateString('pt-BR');
}

function nomeAutorNotificacao(notificacao: AdminNotificacao) {
  return notificacao.usuario?.nome || notificacao.usuario?.email || notificacao.nomeVisitante || 'Visitante';
}

function tituloNotificacaoAdmin(notificacao: AdminNotificacao) {
  const nome = nomeAutorNotificacao(notificacao);

  return notificacao.tipo === 'comentario'
    ? `${nome} comentou`
    : `${nome} marcou interesse`;
}

function textoNotificacaoAdmin(notificacao: AdminNotificacao) {
  const titulo = notificacao.publicacao?.titulo || 'Publicação';

  if (notificacao.tipo === 'comentario') {
    return notificacao.texto
      ? `"${notificacao.texto}" em ${titulo}`
      : `Novo comentário em ${titulo}`;
  }

  return `Interesse registrado em ${titulo}`;
}

function nomeArquivo(caminho: string) {
  return caminho.split(/[/\\]/).pop() || 'arquivo.pdf';
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background },
  header: { backgroundColor: COLORS.primaryLight, alignItems: 'center', paddingTop: 52, paddingBottom: 18, paddingHorizontal: 20 },
  headerActions: { position: 'absolute', top: 48, right: 18, flexDirection: 'row' },
  headerButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', marginLeft: 6 },
  headerBadge: { position: 'absolute', top: 0, right: 0, minWidth: 17, height: 17, paddingHorizontal: 4, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.secondary },
  headerBadgeText: { color: COLORS.white, fontSize: 9, fontWeight: 'bold' },
  avatarButton: { marginTop: 8 },
  avatar: { width: 96, height: 96, borderRadius: 48, borderWidth: 3, borderColor: COLORS.white },
  avatarPlaceholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#e8f5e9' },
  cameraBadge: { position: 'absolute', right: 0, bottom: 2, width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary },
  nome: { marginTop: 12, color: COLORS.white, fontWeight: 'bold', fontSize: 21 },
  cargo: { marginTop: 3, color: '#e8f5e9', fontSize: 14 },
  editProfileButton: { marginTop: 12, flexDirection: 'row', alignItems: 'center', paddingVertical: 7, paddingHorizontal: 12, borderWidth: 1, borderColor: '#ffffff99', borderRadius: 8 },
  editProfileText: { marginLeft: 6, color: COLORS.white, fontWeight: '600' },
  searchBar: { width: '100%', height: 44, marginTop: 18, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', borderRadius: 22, backgroundColor: '#ffffffee' },
  searchInput: { flex: 1, marginLeft: 8, color: COLORS.textDark, fontSize: 15 },
  clearSearch: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 14, paddingBottom: 88 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  sectionTitle: { fontSize: 21, fontWeight: 'bold', color: COLORS.textDark },
  sectionSubtitle: { marginTop: 3, color: COLORS.gray, fontSize: 13 },
  addButton: { width: 44, height: 44, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary },
  empty: { alignItems: 'center', padding: 38, backgroundColor: COLORS.white, borderRadius: 8 },
  emptyText: { marginTop: 10, color: COLORS.gray },
  postCard: { padding: 12, marginBottom: 9, borderRadius: 8, backgroundColor: COLORS.white, elevation: 2, shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 3 },
  postHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  postContent: { flex: 1, paddingRight: 8 },
  postTitle: { color: COLORS.textDark, fontSize: 15, fontWeight: 'bold' },
  postSubtitle: { marginTop: 2, color: COLORS.gray, fontSize: 12 },
  postDescription: { marginTop: 7, color: COLORS.gray, fontSize: 13, lineHeight: 18 },
  postAuthor: { marginTop: 7, color: COLORS.placeholder, fontSize: 11 },
  postDate: { marginTop: 7, color: COLORS.placeholder, fontSize: 11 },
  status: { paddingVertical: 4, paddingHorizontal: 7, borderRadius: 8 },
  statusActive: { backgroundColor: '#e8f5e9' },
  statusClosed: { backgroundColor: '#ffebee' },
  statusText: { fontSize: 11, fontWeight: 'bold' },
  statusTextActive: { color: COLORS.primary },
  statusTextClosed: { color: COLORS.secondary },
  postActions: { flexDirection: 'row', marginTop: 10, paddingTop: 9, borderTopWidth: 1, borderTopColor: COLORS.lightGray },
  secondaryAction: { flexDirection: 'row', alignItems: 'center', marginRight: 18 },
  secondaryActionText: { marginLeft: 5, color: COLORS.primary, fontWeight: '600' },
  closeAction: { flexDirection: 'row', alignItems: 'center' },
  closeActionText: { marginLeft: 5, color: COLORS.secondary, fontWeight: '600' },
  reactivateAction: { flexDirection: 'row', alignItems: 'center' },
  reactivateActionText: { marginLeft: 5, color: COLORS.primary, fontWeight: '600' },
  bottomNav: { position: 'absolute', right: 0, bottom: 0, left: 0, height: 68, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', borderTopWidth: 1, borderTopColor: COLORS.lightGray, backgroundColor: COLORS.white, elevation: 10, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4 },
  navItem: { width: 78, height: 56, alignItems: 'center', justifyContent: 'center' },
  navText: { marginTop: 3, color: COLORS.placeholder, fontSize: 11 },
  navTextActive: { color: COLORS.primary, fontWeight: 'bold' },
  modal: { flex: 1, backgroundColor: COLORS.white },
  modalContent: { padding: 20, paddingTop: 50 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  modalTitle: { color: COLORS.primary, fontSize: 23, fontWeight: 'bold' },
  iconButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  profilePhotoEditor: { alignItems: 'center', marginBottom: 25 },
  profilePhoto: { width: 96, height: 96, borderRadius: 48 },
  photoAction: { marginTop: 8, color: COLORS.primary, fontWeight: 'bold' },
  changePasswordButton: { minHeight: 48, marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.primary, borderRadius: 8, backgroundColor: COLORS.white },
  changePasswordText: { marginLeft: 7, color: COLORS.primary, fontWeight: 'bold' },
  passwordModalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0, 0, 0, 0.35)' },
  passwordModal: { padding: 20, paddingTop: 16, borderTopLeftRadius: 8, borderTopRightRadius: 8, backgroundColor: COLORS.white },
  passwordModalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  passwordModalTitle: { color: COLORS.primary, fontSize: 21, fontWeight: 'bold' },
  notificationOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0, 0, 0, 0.35)' },
  notificationPanel: { maxHeight: '82%', borderTopLeftRadius: 8, borderTopRightRadius: 8, backgroundColor: COLORS.white },
  notificationHeader: { paddingHorizontal: 18, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: COLORS.lightGray },
  notificationModalTitle: { color: COLORS.primary, fontSize: 21, fontWeight: 'bold' },
  notificationModalSubtitle: { marginTop: 3, color: COLORS.gray, fontSize: 12 },
  notificationLoading: { minHeight: 180, alignItems: 'center', justifyContent: 'center' },
  notificationList: { padding: 14, paddingBottom: 24 },
  notificationEmptyList: { flexGrow: 1, justifyContent: 'center', padding: 30 },
  notificationEmpty: { alignItems: 'center' },
  notificationEmptyTitle: { marginTop: 10, color: COLORS.textDark, fontSize: 16, fontWeight: 'bold' },
  notificationEmptyText: { marginTop: 5, color: COLORS.gray, fontSize: 13, lineHeight: 18, textAlign: 'center' },
  adminNotificationItem: { minHeight: 76, marginBottom: 9, padding: 11, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: COLORS.lightGray, borderRadius: 8, backgroundColor: COLORS.white },
  adminNotificationUnread: { borderColor: '#c8e6c9', backgroundColor: '#f4fbf5' },
  adminNotificationIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: '#e8f5e9' },
  adminNotificationContent: { flex: 1, marginLeft: 10 },
  adminNotificationTitle: { color: COLORS.textDark, fontSize: 14, fontWeight: 'bold' },
  adminNotificationText: { marginTop: 3, color: COLORS.gray, fontSize: 12, lineHeight: 17 },
  adminNotificationDate: { marginTop: 4, color: COLORS.placeholder, fontSize: 11 },
  adminUnreadDot: { width: 9, height: 9, marginLeft: 7, borderRadius: 5, backgroundColor: COLORS.secondary },
  passwordInput: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: COLORS.lightGray, borderRadius: 8, backgroundColor: COLORS.white },
  passwordTextInput: { flex: 1, height: 48, paddingHorizontal: 12, color: COLORS.textDark },
  eyeButton: { width: 42, height: 48, alignItems: 'center', justifyContent: 'center' },
  options: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 18 },
  option: { marginRight: 7, marginBottom: 7, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: COLORS.lightGray },
  optionSelected: { backgroundColor: '#e8f5e9', borderColor: COLORS.primary },
  optionText: { color: COLORS.gray, fontSize: 13 },
  optionTextSelected: { color: COLORS.primary, fontWeight: 'bold' },
  textArea: { height: 110, textAlignVertical: 'top' },
  attachmentsTitle: { marginTop: 3, marginBottom: 10, color: COLORS.primary, fontSize: 17, fontWeight: 'bold' },
  postImagePreview: { width: '100%', height: 170, marginBottom: 10, borderRadius: 8, resizeMode: 'contain', backgroundColor: COLORS.background },
  attachmentButton: { flexDirection: 'row', alignItems: 'center', marginBottom: 9, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: COLORS.lightGray },
  attachmentButtonText: { marginLeft: 8, color: COLORS.primary, fontWeight: '600' },
  selectedFile: { flexDirection: 'row', alignItems: 'center', marginBottom: 7, padding: 9, borderRadius: 8, backgroundColor: COLORS.background },
  selectedFileText: { flex: 1, marginLeft: 7, color: COLORS.gray, fontSize: 13 },
  attachmentHint: { marginBottom: 16, color: COLORS.placeholder, fontSize: 12, lineHeight: 17 },
});
