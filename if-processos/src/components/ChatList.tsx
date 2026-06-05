import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import axios from 'axios';
import BotaoVoltar from '@/src/components/BotaoVoltar';
import UserBottomNav from '@/src/components/UserBottomNav';
import { API_URL } from '@/src/config/api';
import { criarCabecalhoAuth } from '@/src/config/auth';
import { COLORS } from '@/src/styles/theme';
import { Conversa, PessoaChat } from '@/src/types/Chat';

export default function ChatList({ modo }: { modo: 'admin' | 'user' }) {
  const router = useRouter();
  const [conversas, setConversas] = useState<Conversa[]>([]);
  const [carregando, setCarregando] = useState(true);

  const carregarConversas = useCallback(async (silencioso = false) => {
    try {
      const resposta = await axios.get(`${API_URL}/chats`, {
        headers: criarCabecalhoAuth(),
      });
      setConversas(resposta.data);
    } catch (error: any) {
      if (!silencioso) {
        Alert.alert('Erro', error.response?.data?.erro || 'Não foi possível carregar as conversas.');
      }
    } finally {
      setCarregando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      carregarConversas();
      const intervalo = setInterval(() => carregarConversas(true), 5000);
      return () => clearInterval(intervalo);
    }, [carregarConversas])
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {modo === 'admin' && <BotaoVoltar variante="header" cor={COLORS.white} />}
        <View style={modo === 'admin' && styles.headerTextWithBack}>
          <Text style={styles.headerTitle}>Conversas</Text>
          <Text style={styles.headerSubtitle}>
            {modo === 'admin' ? 'Atendimento das suas publicações' : 'Mensagens sobre publicações'}
          </Text>
        </View>
      </View>

      {carregando ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={conversas}
          keyExtractor={(item) => item._id}
          contentContainerStyle={[
            styles.list,
            modo === 'user' && styles.listWithBottomNav,
            conversas.length === 0 && styles.emptyList,
          ]}
          renderItem={({ item }) => (
            <ConversaItem
              conversa={item}
              pessoa={modo === 'admin' ? item.aluno : item.admin}
              onPress={() => router.push(`/chat/${item._id}` as never)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="chatbubbles-outline" size={44} color={COLORS.placeholder} />
              <Text style={styles.emptyTitle}>Nenhuma conversa ainda</Text>
              <Text style={styles.emptyText}>
                {modo === 'admin'
                  ? 'Quando um aluno enviar uma mensagem, ela aparecerá aqui.'
                  : 'Abra uma publicação e toque em falar com o responsável.'}
              </Text>
            </View>
          }
        />
      )}

      {modo === 'user' && <UserBottomNav ativa="conversas" />}
    </View>
  );
}

function ConversaItem({
  conversa,
  pessoa,
  onPress,
}: {
  conversa: Conversa;
  pessoa: PessoaChat;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Avatar pessoa={pessoa} />
      <View style={styles.cardContent}>
        <View style={styles.cardTop}>
          <Text style={styles.personName} numberOfLines={1}>{pessoa.nome || 'Usuário'}</Text>
          <Text style={styles.time}>{formatarHorario(conversa.ultimaMensagemEm)}</Text>
        </View>
        {!!pessoa.email && <Text style={styles.email} numberOfLines={1}>{pessoa.email}</Text>}
        <Text style={styles.postTitle} numberOfLines={1}>
          <Ionicons name="document-text-outline" size={12} color={COLORS.primary} />{' '}
          {conversa.publicacao?.titulo || 'Publicação'}
        </Text>
        <View style={styles.cardBottom}>
          <Text style={styles.preview} numberOfLines={1}>
            {conversa.ultimaMensagem?.texto || 'Conversa iniciada. Envie a primeira mensagem.'}
          </Text>
          {!!conversa.naoLidas && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{conversa.naoLidas > 99 ? '99+' : conversa.naoLidas}</Text>
            </View>
          )}
        </View>
        {conversa.status === 'encerrada' && <Text style={styles.closed}>Conversa encerrada</Text>}
      </View>
    </TouchableOpacity>
  );
}

function Avatar({ pessoa }: { pessoa: PessoaChat }) {
  if (pessoa.foto) {
    const uri = pessoa.foto.startsWith('http') ? pessoa.foto : `${API_URL}/${pessoa.foto}`;
    return <Image source={{ uri }} style={styles.avatar} />;
  }

  return (
    <View style={[styles.avatar, styles.avatarPlaceholder]}>
      <Ionicons name="person-outline" size={22} color={COLORS.primary} />
    </View>
  );
}

function formatarHorario(data: string) {
  const valor = new Date(data);
  const hoje = new Date();

  if (valor.toDateString() === hoje.toDateString()) {
    return valor.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  return valor.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { minHeight: 116, paddingTop: 50, paddingHorizontal: 20, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primaryLight },
  headerTextWithBack: { marginLeft: 12 },
  headerTitle: { color: COLORS.white, fontSize: 22, fontWeight: 'bold' },
  headerSubtitle: { marginTop: 3, color: '#e8f5e9', fontSize: 13 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 13 },
  listWithBottomNav: { paddingBottom: 82 },
  emptyList: { flexGrow: 1, justifyContent: 'center' },
  empty: { alignItems: 'center', paddingHorizontal: 30 },
  emptyTitle: { marginTop: 10, color: COLORS.textDark, fontSize: 17, fontWeight: 'bold' },
  emptyText: { marginTop: 6, color: COLORS.gray, fontSize: 13, lineHeight: 19, textAlign: 'center' },
  card: { flexDirection: 'row', marginBottom: 9, padding: 12, borderRadius: 8, backgroundColor: COLORS.white, elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 3 },
  avatar: { width: 46, height: 46, borderRadius: 23 },
  avatarPlaceholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#e8f5e9' },
  cardContent: { flex: 1, marginLeft: 10 },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  personName: { flex: 1, color: COLORS.textDark, fontSize: 15, fontWeight: 'bold' },
  time: { marginLeft: 8, color: COLORS.placeholder, fontSize: 11 },
  email: { marginTop: 2, color: COLORS.gray, fontSize: 12 },
  postTitle: { marginTop: 4, color: COLORS.primary, fontSize: 12, fontWeight: '600' },
  cardBottom: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
  preview: { flex: 1, color: COLORS.gray, fontSize: 13 },
  unreadBadge: { minWidth: 21, height: 21, marginLeft: 8, paddingHorizontal: 5, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.secondary },
  unreadText: { color: COLORS.white, fontSize: 11, fontWeight: 'bold' },
  closed: { marginTop: 5, color: COLORS.secondary, fontSize: 11, fontWeight: '600' },
});
