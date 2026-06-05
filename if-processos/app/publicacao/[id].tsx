import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
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
  };
  nomeVisitante?: string;
};

export default function DetalhesPublicacao() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [publicacao, setPublicacao] = useState<Publicacao | null>(null);
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [comentarioTexto, setComentarioTexto] = useState('');
  const [nomeVisitante, setNomeVisitante] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [iniciandoChat, setIniciandoChat] = useState(false);
  const [enviandoComentario, setEnviandoComentario] = useState(false);
  const usuarioAutenticado = Boolean(obterToken());
  const [usuarioAtualId, setUsuarioAtualId] = useState('');
  const chatDisponivel = Boolean(
    usuarioAutenticado &&
    publicacao?.autor?._id &&
    publicacao.autor._id !== usuarioAtualId
  );

  const carregarPublicacao = useCallback(async () => {
    try {
      const requisicoes = [
        axios.get(`${API_URL}/publicacoes/${id}`, { headers: criarCabecalhoAuth() }),
        axios.get(`${API_URL}/publicacoes/${id}/comentarios`, { headers: criarCabecalhoAuth() }),
      ];

      if (obterToken()) {
        requisicoes.push(axios.get(`${API_URL}/auth/perfil`, { headers: criarCabecalhoAuth() }));
      }

      const [respostaPublicacao, respostaComentarios, respostaPerfil] = await Promise.all(requisicoes);
      setPublicacao(respostaPublicacao.data);
      setComentarios(respostaComentarios.data);
      setUsuarioAtualId(respostaPerfil?.data?._id || '');
    } catch (error: any) {
      Alert.alert('Erro', error.response?.data?.erro || 'Não foi possível carregar a publicação.');
    } finally {
      setCarregando(false);
    }
  }, [id]);

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

    try {
      setEnviandoComentario(true);
      const resposta = await axios.post(
        `${API_URL}/publicacoes/${id}/comentarios`,
        usuarioAutenticado ? { texto } : { texto, nomeVisitante: nome },
        { headers: criarCabecalhoAuth() }
      );
      setComentarios((atuais) => [resposta.data, ...atuais]);
      setComentarioTexto('');
    } catch (error: any) {
      Alert.alert('Erro', error.response?.data?.erro || 'Não foi possível publicar o comentário.');
    } finally {
      setEnviandoComentario(false);
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
              {chatDisponivel && (
                <TouchableOpacity style={styles.chatButton} onPress={iniciarChat} disabled={iniciandoChat}>
                  <Ionicons name="chatbubbles-outline" size={20} color={COLORS.white} />
                  <Text style={styles.chatButtonText}>
                    {iniciandoChat ? 'Abrindo conversa...' : 'Falar com o responsável'}
                  </Text>
                </TouchableOpacity>
              )}
              <View style={styles.commentsSection}>
                <View style={styles.commentsHeader}>
                  <Text style={styles.commentsTitle}>Comentários</Text>
                  <Text style={styles.commentsCount}>{comentarios.length}</Text>
                </View>

                <View style={styles.commentComposer}>
                  <View style={styles.commentFields}>
                    {!usuarioAutenticado && (
                      <TextInput
                        value={nomeVisitante}
                        onChangeText={setNomeVisitante}
                        placeholder="Seu nome"
                        placeholderTextColor={COLORS.placeholder}
                        style={styles.visitorNameInput}
                        maxLength={80}
                      />
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
                    style={[styles.sendCommentButton, (!comentarioTexto.trim() || (!usuarioAutenticado && !nomeVisitante.trim()) || enviandoComentario) && styles.sendCommentDisabled]}
                    onPress={enviarComentario}
                    disabled={!comentarioTexto.trim() || (!usuarioAutenticado && !nomeVisitante.trim()) || enviandoComentario}
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
                      <View style={styles.commentAvatar}>
                        <Ionicons name="person-outline" size={18} color={COLORS.primary} />
                      </View>
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
    </View>
  );
}

function nomeUsuario(comentario: Comentario) {
  return comentario.usuario?.nome || comentario.usuario?.email || comentario.nomeVisitante || 'Visitante';
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
  chatButtonText: {
    marginLeft: 8,
    color: COLORS.white,
    fontSize: 15,
    fontWeight: 'bold',
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
});
