import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import axios from 'axios';
import BotaoVoltar from '@/src/components/BotaoVoltar';
import Card from '@/src/components/Card';
import { API_URL } from '@/src/config/api';
import { criarCabecalhoAuth, obterToken } from '@/src/config/auth';
import { COLORS } from '@/src/styles/theme';
import { Publicacao } from '@/src/types/Publicacao';

type Comentario = {
  _id: string;
  texto: string;
  createdAt: string;
  usuario?: {
    nome?: string;
    email?: string;
    cargo?: string;
    role?: string;
    foto?: string;
  };
  nomeVisitante?: string;
};

type Interessado = {
  _id: string;
  createdAt: string;
  usuario?: {
    nome?: string;
    email?: string;
  };
};

export default function DetalhesPublicacao() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [publicacao, setPublicacao] = useState<Publicacao | null>(null);
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [comentarioTexto, setComentarioTexto] = useState('');
  const [nomeVisitante, setNomeVisitante] = useState('');
  const [captchaId, setCaptchaId] = useState('');
  const [captchaResposta, setCaptchaResposta] = useState('');
  const [captchaPergunta, setCaptchaPergunta] = useState('Carregando captcha...');
  const [carregando, setCarregando] = useState(true);
  const [iniciandoChat, setIniciandoChat] = useState(false);
  const [enviandoComentario, setEnviandoComentario] = useState(false);
  const usuarioAutenticado = Boolean(obterToken());
  const [usuarioAtualId, setUsuarioAtualId] = useState('');
  const [usuarioAtualRole, setUsuarioAtualRole] = useState('');
  const [interessado, setInteressado] = useState(false);
  const [marcandoInteresse, setMarcandoInteresse] = useState(false);
  const [modalInteressadosVisivel, setModalInteressadosVisivel] = useState(false);
  const [interessados, setInteressados] = useState<Interessado[]>([]);
  const [mensagemInteressados, setMensagemInteressados] = useState('');
  const [carregandoInteressados, setCarregandoInteressados] = useState(false);
  const [salvandoMensagem, setSalvandoMensagem] = useState(false);
  const chatDisponivel = Boolean(
    usuarioAutenticado &&
    publicacao?.autor?._id &&
    publicacao.autor._id !== usuarioAtualId
  );
  const ehAluno = usuarioAtualRole === 'user';
  const ehAdminCriador = Boolean(usuarioAtualRole === 'admin' && publicacao?.autor?._id === usuarioAtualId);
  const mensagemPublicacaoInteressados = publicacao?.mensagemInteressados?.trim() || '';
  const mostrarMensagemInteressados = Boolean(
    mensagemPublicacaoInteressados &&
    (ehAdminCriador || (ehAluno && interessado))
  );
  const comentarioVisitanteInvalido = !usuarioAutenticado && (!nomeVisitante.trim() || !captchaId || !captchaResposta.trim());

  const carregarCaptcha = useCallback(async () => {
    try {
      const resposta = await axios.get(`${API_URL}/comentarios/captcha`);
      setCaptchaId(resposta.data?.id || '');
      setCaptchaPergunta(resposta.data?.pergunta || 'Resolva a conta para comentar.');
    } catch {
      setCaptchaId('');
      setCaptchaPergunta('Não foi possível carregar o captcha.');
    }
  }, []);

  const carregarPublicacao = useCallback(async () => {
    try {
      const requisicoes = [
        axios.get(`${API_URL}/publicacoes/${id}`, { headers: criarCabecalhoAuth() }),
        axios.get(`${API_URL}/publicacoes/${id}/comentarios`, { headers: criarCabecalhoAuth() }),
      ];

      if (obterToken()) {
        requisicoes.push(axios.get(`${API_URL}/auth/perfil`, { headers: criarCabecalhoAuth() }));
      } else {
        carregarCaptcha();
      }

      const [respostaPublicacao, respostaComentarios, respostaPerfil] = await Promise.all(requisicoes);
      setPublicacao(respostaPublicacao.data);
      setComentarios(respostaComentarios.data);
      setUsuarioAtualId(respostaPerfil?.data?._id || '');
      setUsuarioAtualRole(respostaPerfil?.data?.role || '');

      if (respostaPerfil?.data?.role === 'user') {
        const respostaInteresse = await axios.get(`${API_URL}/publicacoes/${id}/interesse/status`, {
          headers: criarCabecalhoAuth(),
        });
        setInteressado(respostaInteresse.data.interessado);
      } else {
        setInteressado(false);
      }
    } catch (error: any) {
      Alert.alert('Erro', error.response?.data?.erro || 'Não foi possível carregar a publicação.');
    } finally {
      setCarregando(false);
    }
  }, [id, carregarCaptcha]);

  useFocusEffect(
    useCallback(() => {
      carregarPublicacao();
    }, [carregarPublicacao])
  );

  const iniciarChat = async () => {
    if (!publicacao || iniciandoChat) return;

    try {
      setIniciandoChat(true);
      const resposta = await axios.post(
        `${API_URL}/chats/publicacoes/${publicacao._id}`,
        {},
        { headers: criarCabecalhoAuth() }
      );
      router.push(`/chat/${resposta.data._id}` as never);
    } catch (error: any) {
      Alert.alert('Erro', error.response?.data?.erro || 'Não foi possível iniciar a conversa.');
    } finally {
      setIniciandoChat(false);
    }
  };

  const enviarComentario = async () => {
    const texto = comentarioTexto.trim();
    const nome = nomeVisitante.trim();
    if (!texto || enviandoComentario) return;
    if (!usuarioAutenticado && !nome) {
      Alert.alert('Nome obrigatório', 'Informe seu nome para comentar como visitante.');
      return;
    }
    if (!usuarioAutenticado && (!captchaId || !captchaResposta.trim())) {
      Alert.alert('Captcha obrigatório', 'Responda a pergunta simples para comentar como visitante.');
      return;
    }

    try {
      setEnviandoComentario(true);
      const resposta = await axios.post(
        `${API_URL}/publicacoes/${id}/comentarios`,
        usuarioAutenticado ? { texto } : { texto, nomeVisitante: nome, captchaId, captchaResposta: captchaResposta.trim() },
        { headers: criarCabecalhoAuth() }
      );
      setComentarios((atuais) => [resposta.data, ...atuais]);
      setComentarioTexto('');
      setCaptchaResposta('');
      if (!usuarioAutenticado) {
        carregarCaptcha();
      }
    } catch (error: any) {
      Alert.alert('Erro', error.response?.data?.erro || 'Não foi possível publicar o comentário.');
      if (!usuarioAutenticado) {
        setCaptchaResposta('');
        carregarCaptcha();
      }
    } finally {
      setEnviandoComentario(false);
    }
  };

  const registrarInteresse = async () => {
    if (marcandoInteresse || interessado) return;

    try {
      setMarcandoInteresse(true);
      await axios.post(`${API_URL}/publicacoes/${id}/interesse`, {}, {
        headers: criarCabecalhoAuth(),
      });
      setInteressado(true);
      Alert.alert('Interesse registrado', 'O responsável pela publicação será avisado.');
    } catch (error: any) {
      Alert.alert('Erro', error.response?.data?.erro || 'Não foi possível registrar seu interesse.');
    } finally {
      setMarcandoInteresse(false);
    }
  };

  const carregarInteressados = async () => {
    if (!ehAdminCriador) return;

    try {
      setCarregandoInteressados(true);
      const resposta = await axios.get(`${API_URL}/admin/publicacoes/${id}/interessados`, {
        headers: criarCabecalhoAuth(),
      });
      setInteressados(resposta.data.interessados || []);
      setMensagemInteressados(resposta.data.mensagemInteressados || '');
      setModalInteressadosVisivel(true);
    } catch (error: any) {
      Alert.alert('Erro', error.response?.data?.erro || 'Não foi possível carregar os interessados.');
    } finally {
      setCarregandoInteressados(false);
    }
  };

  const salvarMensagemInteressados = async () => {
    const mensagem = mensagemInteressados.trim();

    if (!mensagem) {
      Alert.alert('Mensagem', 'Digite uma mensagem para os interessados.');
      return;
    }

    try {
      setSalvandoMensagem(true);
      const resposta = await axios.put(
        `${API_URL}/admin/publicacoes/${id}/interessados/mensagem`,
        { mensagem },
        { headers: criarCabecalhoAuth() }
      );
      setMensagemInteressados(resposta.data.mensagemInteressados || mensagem);
      setPublicacao((atual) => atual ? {
        ...atual,
        mensagemInteressados: resposta.data.mensagemInteressados || mensagem
      } : atual);
      Alert.alert(
        'Mensagem salva',
        `${resposta.data.notificacoesEnviadas || 0} interessado(s) receberam essa mensagem agora. Quem já recebeu antes não recebe duplicado.`
      );
    } catch (error: any) {
      Alert.alert('Erro', error.response?.data?.erro || 'Não foi possível enviar a mensagem.');
    } finally {
      setSalvandoMensagem(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <BotaoVoltar variante="header" cor={COLORS.white} />
        <Text style={styles.headerTitle}>Detalhes da publicação</Text>
      </View>

      {carregando ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {publicacao ? (
            <>
              <Card {...publicacao} favoritosHabilitados />
              {ehAluno && (
                <TouchableOpacity
                  style={[styles.interestButton, interessado && styles.interestButtonActive]}
                  onPress={registrarInteresse}
                  disabled={interessado || marcandoInteresse}
                >
                  {marcandoInteresse ? (
                    <ActivityIndicator size="small" color={COLORS.white} />
                  ) : (
                    <Ionicons name={interessado ? 'checkmark-circle-outline' : 'hand-left-outline'} size={20} color={COLORS.white} />
                  )}
                  <Text style={styles.interestButtonText}>
                    {interessado ? 'Interesse registrado' : 'Tenho interesse'}
                  </Text>
                </TouchableOpacity>
              )}
              {ehAdminCriador && (
                <TouchableOpacity style={styles.adminInterestButton} onPress={carregarInteressados} disabled={carregandoInteressados}>
                  {carregandoInteressados ? (
                    <ActivityIndicator size="small" color={COLORS.primary} />
                  ) : (
                    <Ionicons name="people-outline" size={20} color={COLORS.primary} />
                  )}
                  <Text style={styles.adminInterestButtonText}>Interessados</Text>
                </TouchableOpacity>
              )}
              {chatDisponivel && (
                <TouchableOpacity style={styles.chatButton} onPress={iniciarChat} disabled={iniciandoChat}>
                  <Ionicons name="chatbubbles-outline" size={20} color={COLORS.white} />
                  <Text style={styles.chatButtonText}>
                    {iniciandoChat ? 'Abrindo conversa...' : 'Falar com o responsável'}
                  </Text>
                </TouchableOpacity>
              )}
              {mostrarMensagemInteressados && (
                <View style={styles.interestInfoBox}>
                  <View style={styles.interestInfoHeader}>
                    <Ionicons name="information-circle-outline" size={20} color={COLORS.primary} />
                    <Text style={styles.interestInfoTitle}>Informações para interessados</Text>
                  </View>
                  <Text style={styles.interestInfoText}>{mensagemPublicacaoInteressados}</Text>
                </View>
              )}
              <View style={styles.commentsSection}>
                <View style={styles.commentsHeader}>
                  <Text style={styles.commentsTitle}>Comentários</Text>
                  <Text style={styles.commentsCount}>{comentarios.length}</Text>
                </View>

                <View style={styles.commentComposer}>
                  <View style={styles.commentFields}>
                    {!usuarioAutenticado && (
                      <>
                        <TextInput
                          value={nomeVisitante}
                          onChangeText={setNomeVisitante}
                          placeholder="Seu nome"
                          placeholderTextColor={COLORS.placeholder}
                          style={styles.visitorNameInput}
                          maxLength={80}
                        />
                        <View style={styles.captchaRow}>
                          <Text style={styles.captchaQuestion}>{captchaPergunta}</Text>
                          <TextInput
                            value={captchaResposta}
                            onChangeText={setCaptchaResposta}
                            placeholder="Resposta"
                            placeholderTextColor={COLORS.placeholder}
                            style={styles.captchaInput}
                            keyboardType="number-pad"
                            maxLength={4}
                          />
                        </View>
                      </>
                    )}
                    <TextInput
                      value={comentarioTexto}
                      onChangeText={setComentarioTexto}
                      placeholder="Escreva um comentário..."
                      placeholderTextColor={COLORS.placeholder}
                      style={styles.commentInput}
                      multiline
                      maxLength={500}
                    />
                  </View>
                  <TouchableOpacity
                    style={[styles.sendCommentButton, (!comentarioTexto.trim() || comentarioVisitanteInvalido || enviandoComentario) && styles.sendCommentDisabled]}
                    onPress={enviarComentario}
                    disabled={!comentarioTexto.trim() || comentarioVisitanteInvalido || enviandoComentario}
                  >
                    {enviandoComentario ? (
                      <ActivityIndicator size="small" color={COLORS.white} />
                    ) : (
                      <Ionicons name="send" size={18} color={COLORS.white} />
                    )}
                  </TouchableOpacity>
                </View>

                {comentarios.length === 0 ? (
                  <Text style={styles.noComments}>Nenhum comentário ainda.</Text>
                ) : (
                  comentarios.map((comentario) => (
                    <View key={comentario._id} style={styles.commentItem}>
                      <CommentAvatar comentario={comentario} />
                      <View style={styles.commentContent}>
                        <View style={styles.commentTop}>
                          <Text style={styles.commentName} numberOfLines={1}>{nomeUsuario(comentario)}</Text>
                          <Text style={styles.commentDate}>{formatarData(comentario.createdAt)}</Text>
                        </View>
                        <Text style={styles.commentText}>{comentario.texto}</Text>
                      </View>
                    </View>
                  ))
                )}
              </View>
            </>
          ) : (
            <Text style={styles.empty}>Publicação não encontrada.</Text>
          )}
        </ScrollView>
      )}

      <Modal
        visible={modalInteressadosVisivel}
        animationType="slide"
        transparent
        onRequestClose={() => setModalInteressadosVisivel(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.interestedPanel}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Interessados</Text>
                <Text style={styles.modalSubtitle}>{interessados.length} aluno(s) marcaram interesse</Text>
              </View>
              <TouchableOpacity style={styles.modalCloseButton} onPress={() => setModalInteressadosVisivel(false)}>
                <Ionicons name="close" size={22} color={COLORS.textDark} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.interestedContent}>
              <Text style={styles.infoLabel}>Informações para os interessados</Text>
              <TextInput
                value={mensagemInteressados}
                onChangeText={setMensagemInteressados}
                placeholder="Digite uma mensagem com mais informações..."
                placeholderTextColor={COLORS.placeholder}
                style={styles.infoInput}
                multiline
                maxLength={1000}
              />
              <TouchableOpacity
                style={[styles.saveInfoButton, salvandoMensagem && styles.saveInfoButtonDisabled]}
                onPress={salvarMensagemInteressados}
                disabled={salvandoMensagem}
              >
                {salvandoMensagem ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Ionicons name="send-outline" size={18} color={COLORS.white} />
                )}
                <Text style={styles.saveInfoText}>
                  {salvandoMensagem ? 'Enviando...' : 'Salvar e notificar'}
                </Text>
              </TouchableOpacity>

              <View style={styles.interestedListHeader}>
                <Ionicons name="people-outline" size={18} color={COLORS.primary} />
                <Text style={styles.interestedListTitle}>Lista de interessados</Text>
              </View>

              {interessados.length === 0 ? (
                <Text style={styles.noInterested}>Nenhum aluno marcou interesse ainda.</Text>
              ) : (
                interessados.map((item) => (
                  <View key={item._id} style={styles.interestedItem}>
                    <View style={styles.commentAvatar}>
                      <Ionicons name="person-outline" size={18} color={COLORS.primary} />
                    </View>
                    <View style={styles.interestedInfo}>
                      <Text style={styles.interestedName}>{item.usuario?.nome || 'Aluno'}</Text>
                      <Text style={styles.interestedEmail}>{item.usuario?.email || 'E-mail não informado'}</Text>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function nomeUsuario(comentario: Comentario) {
  return comentario.usuario?.nome || comentario.usuario?.email || comentario.nomeVisitante || 'Visitante';
}

function CommentAvatar({ comentario }: { comentario: Comentario }) {
  const foto = comentario.usuario?.foto;

  if (foto) {
    const uri = montarUrlFoto(foto);
    return <Image source={{ uri }} style={styles.commentAvatar} />;
  }

  return (
    <View style={styles.commentAvatar}>
      <Ionicons name="person-outline" size={18} color={COLORS.primary} />
    </View>
  );
}

function montarUrlFoto(foto: string) {
  if (foto.startsWith('http')) return foto;

  const caminhoNormalizado = foto.replace(/\\/g, '/');
  const indiceUploads = caminhoNormalizado.lastIndexOf('/uploads/');
  const caminhoPublico = indiceUploads >= 0
    ? caminhoNormalizado.slice(indiceUploads + 1)
    : caminhoNormalizado;

  return `${API_URL}/${caminhoPublico}`;
}

function formatarData(data: string) {
  return new Date(data).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 52,
    paddingHorizontal: 20,
    paddingBottom: 18,
    backgroundColor: COLORS.primaryLight,
  },
  headerTitle: {
    marginLeft: 12,
    color: COLORS.white,
    fontSize: 20,
    fontWeight: 'bold',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 15,
  },
  empty: {
    marginTop: 50,
    color: COLORS.gray,
    textAlign: 'center',
  },
  chatButton: {
    minHeight: 48,
    marginTop: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: COLORS.primary,
  },
  interestButton: {
    minHeight: 48,
    marginTop: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: COLORS.secondary,
  },
  interestButtonActive: {
    backgroundColor: COLORS.primary,
  },
  interestButtonText: {
    marginLeft: 8,
    color: COLORS.white,
    fontSize: 15,
    fontWeight: 'bold',
  },
  adminInterestButton: {
    minHeight: 48,
    marginTop: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#c8e6c9',
    borderRadius: 8,
    backgroundColor: '#e8f5e9',
  },
  adminInterestButtonText: {
    marginLeft: 8,
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: 'bold',
  },
  chatButtonText: {
    marginLeft: 8,
    color: COLORS.white,
    fontSize: 15,
    fontWeight: 'bold',
  },
  interestInfoBox: {
    marginTop: 12,
    padding: 13,
    borderWidth: 1,
    borderColor: '#c8e6c9',
    borderRadius: 8,
    backgroundColor: '#f4fbf5',
  },
  interestInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 7,
  },
  interestInfoTitle: {
    marginLeft: 7,
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  interestInfoText: {
    color: COLORS.textDark,
    fontSize: 13,
    lineHeight: 19,
  },
  commentsSection: {
    marginTop: 14,
    padding: 13,
    borderRadius: 8,
    backgroundColor: COLORS.white,
  },
  commentsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  commentsTitle: {
    flex: 1,
    color: COLORS.textDark,
    fontSize: 18,
    fontWeight: 'bold',
  },
  commentsCount: {
    minWidth: 26,
    height: 26,
    paddingHorizontal: 7,
    borderRadius: 13,
    color: COLORS.white,
    backgroundColor: COLORS.primary,
    fontSize: 12,
    fontWeight: 'bold',
    lineHeight: 26,
    textAlign: 'center',
  },
  commentComposer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 13,
  },
  commentFields: {
    flex: 1,
  },
  visitorNameInput: {
    height: 42,
    marginBottom: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    color: COLORS.textDark,
    backgroundColor: COLORS.inputBg,
  },
  captchaRow: {
    minHeight: 42,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  captchaQuestion: {
    flex: 1,
    marginRight: 8,
    color: COLORS.textDark,
    fontSize: 13,
    fontWeight: '600',
  },
  captchaInput: {
    width: 96,
    height: 42,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    color: COLORS.textDark,
    backgroundColor: COLORS.inputBg,
    textAlign: 'center',
  },
  commentInput: {
    minHeight: 44,
    maxHeight: 104,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    color: COLORS.textDark,
    backgroundColor: COLORS.inputBg,
    textAlignVertical: 'top',
  },
  sendCommentButton: {
    width: 44,
    height: 44,
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: COLORS.primary,
  },
  sendCommentDisabled: {
    opacity: 0.45,
  },
  noComments: {
    paddingVertical: 18,
    color: COLORS.gray,
    textAlign: 'center',
  },
  commentItem: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  commentAvatar: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
    backgroundColor: '#e8f5e9',
  },
  commentContent: {
    flex: 1,
    marginLeft: 9,
  },
  commentTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentName: {
    flex: 1,
    color: COLORS.textDark,
    fontSize: 13,
    fontWeight: 'bold',
  },
  commentDate: {
    marginLeft: 7,
    color: COLORS.placeholder,
    fontSize: 10,
  },
  commentText: {
    marginTop: 4,
    color: COLORS.gray,
    fontSize: 13,
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  interestedPanel: {
    maxHeight: '84%',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    backgroundColor: COLORS.white,
  },
  modalHeader: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  modalTitle: {
    color: COLORS.textDark,
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalSubtitle: {
    marginTop: 2,
    color: COLORS.gray,
    fontSize: 12,
  },
  modalCloseButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  interestedContent: {
    padding: 15,
    paddingBottom: 26,
  },
  infoLabel: {
    marginBottom: 7,
    color: COLORS.textDark,
    fontSize: 13,
    fontWeight: 'bold',
  },
  infoInput: {
    minHeight: 98,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    color: COLORS.textDark,
    backgroundColor: COLORS.inputBg,
    textAlignVertical: 'top',
  },
  saveInfoButton: {
    minHeight: 44,
    marginTop: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: COLORS.primary,
  },
  saveInfoButtonDisabled: {
    opacity: 0.55,
  },
  saveInfoText: {
    marginLeft: 7,
    color: COLORS.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  interestedListHeader: {
    marginTop: 18,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  interestedListTitle: {
    marginLeft: 6,
    color: COLORS.textDark,
    fontSize: 15,
    fontWeight: 'bold',
  },
  noInterested: {
    paddingVertical: 18,
    color: COLORS.gray,
    textAlign: 'center',
  },
  interestedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  interestedInfo: {
    flex: 1,
    marginLeft: 10,
  },
  interestedName: {
    color: COLORS.textDark,
    fontSize: 14,
    fontWeight: 'bold',
  },
  interestedEmail: {
    marginTop: 2,
    color: COLORS.gray,
    fontSize: 12,
  },
});
