import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import axios from 'axios';
import BotaoVoltar from '@/src/components/BotaoVoltar';
import { API_URL } from '@/src/config/api';
import { criarCabecalhoAuth } from '@/src/config/auth';
import { COLORS } from '@/src/styles/theme';
import { Conversa, MensagemChat } from '@/src/types/Chat';

type RespostaMensagens = {
  conversa: Conversa;
  mensagens: MensagemChat[];
  usuarioAtualId: string;
};

export default function Chat() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const listaRef = useRef<FlatList<MensagemChat>>(null);
  const [conversa, setConversa] = useState<Conversa | null>(null);
  const [mensagens, setMensagens] = useState<MensagemChat[]>([]);
  const [usuarioAtualId, setUsuarioAtualId] = useState('');
  const [texto, setTexto] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);

  const carregarMensagens = useCallback(async (silencioso = false) => {
    try {
      const resposta = await axios.get<RespostaMensagens>(`${API_URL}/chats/${id}/mensagens`, {
        headers: criarCabecalhoAuth(),
      });
      setConversa(resposta.data.conversa);
      setMensagens(resposta.data.mensagens);
      setUsuarioAtualId(resposta.data.usuarioAtualId);
    } catch (error: any) {
      if (!silencioso) {
        Alert.alert('Erro', error.response?.data?.erro || 'Não foi possível carregar as mensagens.');
      }
    } finally {
      setCarregando(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      carregarMensagens();
      const intervalo = setInterval(() => carregarMensagens(true), 4000);
      return () => clearInterval(intervalo);
    }, [carregarMensagens])
  );

  const enviarMensagem = async () => {
    const mensagem = texto.trim();
    if (!mensagem || enviando) return;

    try {
      setEnviando(true);
      const resposta = await axios.post<MensagemChat>(
        `${API_URL}/chats/${id}/mensagens`,
        { texto: mensagem },
        { headers: criarCabecalhoAuth() }
      );
      setTexto('');
      setMensagens((atuais) => [...atuais, resposta.data]);
    } catch (error: any) {
      Alert.alert('Erro', error.response?.data?.erro || 'Não foi possível enviar a mensagem.');
    } finally {
      setEnviando(false);
    }
  };

  const encerrarConversa = () => {
    Alert.alert(
      'Encerrar conversa',
      'Deseja realmente encerrar esta conversa? O histórico continuará disponível para consulta.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Encerrar',
          style: 'destructive',
          onPress: async () => {
            try {
              const resposta = await axios.patch<Conversa>(
                `${API_URL}/chats/${id}/encerrar`,
                {},
                { headers: criarCabecalhoAuth() }
              );
              setConversa((atual) => atual ? { ...atual, status: resposta.data.status } : atual);
            } catch (error: any) {
              Alert.alert('Erro', error.response?.data?.erro || 'Não foi possível encerrar a conversa.');
            }
          },
        },
      ]
    );
  };

  const outraPessoa = conversa
    ? conversa.aluno._id === usuarioAtualId ? conversa.admin : conversa.aluno
    : null;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <BotaoVoltar variante="header" cor={COLORS.white} />
        <View style={styles.headerText}>
          <Text style={styles.headerTitle} numberOfLines={1}>{outraPessoa?.nome || 'Conversa'}</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {outraPessoa?.email || conversa?.publicacao?.titulo || 'Publicação'}
          </Text>
        </View>
        {conversa?.status === 'aberta' && (
          <TouchableOpacity style={styles.closeButton} onPress={encerrarConversa}>
            <Ionicons name="close-circle-outline" size={22} color={COLORS.white} />
          </TouchableOpacity>
        )}
      </View>

      {carregando ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <>
          <View style={styles.postContext}>
            <Ionicons name="document-text-outline" size={15} color={COLORS.primary} />
            <Text style={styles.postContextText} numberOfLines={1}>
              {conversa?.publicacao?.titulo || 'Publicação'}
            </Text>
          </View>
          <FlatList
            ref={listaRef}
            data={mensagens}
            keyExtractor={(item) => item._id}
            contentContainerStyle={[styles.messages, mensagens.length === 0 && styles.emptyMessages]}
            onContentSizeChange={() => listaRef.current?.scrollToEnd({ animated: true })}
            renderItem={({ item }) => {
              const enviada = item.remetente._id === usuarioAtualId;
              return (
                <View style={[styles.bubble, enviada ? styles.bubbleSent : styles.bubbleReceived]}>
                  <Text style={[styles.messageText, enviada && styles.messageTextSent]}>{item.texto}</Text>
                  <Text style={[styles.messageTime, enviada && styles.messageTimeSent]}>
                    {formatarHorario(item.createdAt)}
                  </Text>
                </View>
              );
            }}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons name="chatbubble-ellipses-outline" size={40} color={COLORS.placeholder} />
                <Text style={styles.emptyTitle}>Conversa iniciada</Text>
                <Text style={styles.emptyText}>Envie uma mensagem sobre esta publicação.</Text>
              </View>
            }
          />

          {conversa?.status === 'encerrada' ? (
            <View style={styles.closedBar}>
              <Ionicons name="lock-closed-outline" size={17} color={COLORS.secondary} />
              <Text style={styles.closedText}>Conversa encerrada. O histórico permanece disponível.</Text>
            </View>
          ) : (
            <View style={styles.composer}>
              <TextInput
                value={texto}
                onChangeText={setTexto}
                placeholder="Digite uma mensagem..."
                placeholderTextColor={COLORS.placeholder}
                style={styles.input}
                multiline
                maxLength={1000}
              />
              <TouchableOpacity
                style={[styles.sendButton, (!texto.trim() || enviando) && styles.sendButtonDisabled]}
                onPress={enviarMensagem}
                disabled={!texto.trim() || enviando}
              >
                <Ionicons name="send" size={19} color={COLORS.white} />
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
    </KeyboardAvoidingView>
  );
}

function formatarHorario(data: string) {
  return new Date(data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { minHeight: 104, paddingTop: 48, paddingHorizontal: 16, paddingBottom: 13, flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primaryLight },
  headerText: { flex: 1, marginLeft: 10 },
  headerTitle: { color: COLORS.white, fontSize: 17, fontWeight: 'bold' },
  headerSubtitle: { marginTop: 2, color: '#e8f5e9', fontSize: 12 },
  closeButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  postContext: { minHeight: 38, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: COLORS.lightGray, backgroundColor: COLORS.white },
  postContextText: { flex: 1, marginLeft: 7, color: COLORS.primary, fontSize: 12, fontWeight: '600' },
  messages: { padding: 13 },
  emptyMessages: { flexGrow: 1, justifyContent: 'center' },
  empty: { alignItems: 'center', paddingHorizontal: 32 },
  emptyTitle: { marginTop: 9, color: COLORS.textDark, fontSize: 16, fontWeight: 'bold' },
  emptyText: { marginTop: 5, color: COLORS.gray, fontSize: 13, textAlign: 'center' },
  bubble: { maxWidth: '82%', marginBottom: 8, paddingHorizontal: 11, paddingVertical: 8, borderRadius: 8 },
  bubbleSent: { alignSelf: 'flex-end', backgroundColor: COLORS.primary },
  bubbleReceived: { alignSelf: 'flex-start', backgroundColor: COLORS.white },
  messageText: { color: COLORS.textDark, fontSize: 14, lineHeight: 19 },
  messageTextSent: { color: COLORS.white },
  messageTime: { marginTop: 3, color: COLORS.placeholder, fontSize: 10, textAlign: 'right' },
  messageTimeSent: { color: '#e8f5e9' },
  composer: { padding: 10, flexDirection: 'row', alignItems: 'flex-end', borderTopWidth: 1, borderTopColor: COLORS.lightGray, backgroundColor: COLORS.white },
  input: { flex: 1, maxHeight: 104, minHeight: 42, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: COLORS.lightGray, borderRadius: 8, color: COLORS.textDark, fontSize: 14 },
  sendButton: { width: 42, height: 42, marginLeft: 8, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary },
  sendButtonDisabled: { opacity: 0.45 },
  closedBar: { minHeight: 56, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderTopWidth: 1, borderTopColor: COLORS.lightGray, backgroundColor: COLORS.white },
  closedText: { marginLeft: 7, color: COLORS.secondary, fontSize: 12, fontWeight: '600' },
});
