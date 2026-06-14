import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, ImageBackground, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import axios from 'axios';
import Card from '@/src/components/Card';
import UserBottomNav from '@/src/components/UserBottomNav';
import { API_URL } from '@/src/config/api';
import { criarCabecalhoAuth } from '@/src/config/auth';
import { COLORS } from '@/src/styles/theme';
import { globalStyles } from '@/src/styles/globalStyles';
import { Publicacao } from '@/src/types/Publicacao';

type NotificacaoPublicacao = {
  _id: string;
  lida: boolean;
  createdAt: string;
  tipo?: 'publicacao' | 'mensagem_interesse';
  mensagem?: string;
  publicacao: Publicacao;
};

export default function HomeUsuario() {
  const router = useRouter();
  const [publicacoes, setPublicacoes] = useState<Publicacao[]>([]);
  const [notificacoes, setNotificacoes] = useState<NotificacaoPublicacao[]>([]);
  const [busca, setBusca] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [modalNotificacoes, setModalNotificacoes] = useState(false);

  const carregarPublicacoes = useCallback(async () => {
    try {
      const resposta = await axios.get(`${API_URL}/publicacoes`);
      setPublicacoes(resposta.data);
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar as publicações.');
    } finally {
      setCarregando(false);
    }
  }, []);

  const carregarNotificacoes = useCallback(async (silencioso = false) => {
    try {
      const resposta = await axios.get(`${API_URL}/notificacoes`, {
        headers: criarCabecalhoAuth(),
      });
      setNotificacoes(resposta.data);
    } catch {
      if (!silencioso) {
        Alert.alert('Erro', 'Não foi possível carregar as notificações.');
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      carregarPublicacoes();
      carregarNotificacoes(true);
      const intervalo = setInterval(() => carregarNotificacoes(true), 8000);
      return () => clearInterval(intervalo);
    }, [carregarNotificacoes, carregarPublicacoes])
  );

  const totalNaoLidas = notificacoes.filter((notificacao) => !notificacao.lida).length;

  const publicacoesFiltradas = publicacoes.filter((publicacao) => {
    const termo = busca.trim().toLowerCase();

    return !termo
      || publicacao.titulo.toLowerCase().includes(termo)
      || publicacao.subtitulo?.toLowerCase().includes(termo)
      || publicacao.descricao.toLowerCase().includes(termo);
  });

  const abrirModalNotificacoes = async () => {
    setModalNotificacoes(true);

    if (totalNaoLidas === 0) return;

    setNotificacoes((atuais) => atuais.map((item) => ({ ...item, lida: true })));

    try {
      await axios.patch(`${API_URL}/notificacoes/lidas`, {}, {
        headers: criarCabecalhoAuth(),
      });
    } catch {
      carregarNotificacoes(true);
    }
  };

  const abrirNotificacao = async (notificacao: NotificacaoPublicacao) => {
    try {
      if (!notificacao.lida) {
        await axios.patch(
          `${API_URL}/notificacoes/${notificacao._id}/lida`,
          {},
          { headers: criarCabecalhoAuth() }
        );
        setNotificacoes((atuais) =>
          atuais.map((item) => item._id === notificacao._id ? { ...item, lida: true } : item)
        );
      }

      setModalNotificacoes(false);
      router.push(`/publicacao/${notificacao.publicacao._id}` as never);
    } catch {
      Alert.alert('Erro', 'Não foi possível abrir a notificação.');
    }
  };

  const marcarTodasComoLidas = async () => {
    try {
      await axios.patch(`${API_URL}/notificacoes/lidas`, {}, {
        headers: criarCabecalhoAuth(),
      });
      setNotificacoes((atuais) => atuais.map((item) => ({ ...item, lida: true })));
    } catch {
      Alert.alert('Erro', 'Não foi possível marcar as notificações como lidas.');
    }
  };

  const limparVisualizadas = () => {
    const totalVisualizadas = notificacoes.filter((notificacao) => notificacao.lida).length;

    if (totalVisualizadas === 0) {
      Alert.alert('Notificações', 'Não há notificações visualizadas para limpar.');
      return;
    }

    Alert.alert(
      'Limpar notificações',
      `Deseja apagar ${totalVisualizadas} ${totalVisualizadas === 1 ? 'notificação visualizada' : 'notificações visualizadas'}? As não lidas serão mantidas.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpar',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${API_URL}/notificacoes/lidas`, {
                headers: criarCabecalhoAuth(),
              });
              setNotificacoes((atuais) => atuais.filter((item) => !item.lida));
            } catch {
              Alert.alert('Erro', 'Não foi possível limpar as notificações visualizadas.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={globalStyles.container}>
      <ImageBackground style={[globalStyles.header, styles.header]} source={require('../../assets/images/icone2.png')} imageStyle={globalStyles.headerBackgroundImage}>
        <View style={styles.headerTop}>
          <Text style={styles.portalTitle}>Portal IFNMG</Text>
          <TouchableOpacity style={styles.notificationButton} onPress={abrirModalNotificacoes}>
            <Ionicons name={totalNaoLidas > 0 ? 'notifications' : 'notifications'} size={24} color={COLORS.white} />
            {totalNaoLidas > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>{totalNaoLidas > 99 ? '99+' : totalNaoLidas}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color={COLORS.textLight} />
          <TextInput
            value={busca}
            onChangeText={setBusca}
            placeholder="Buscar no portal..."
            placeholderTextColor={COLORS.placeholder}
            style={styles.searchInput}
          />
          {!!busca && (
            <TouchableOpacity style={styles.clearButton} onPress={() => setBusca('')}>
              <Ionicons name="close-circle" size={18} color={COLORS.placeholder} />
            </TouchableOpacity>
          )}
        </View>
      </ImageBackground>

      {carregando ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Buscando publicações...</Text>
        </View>
      ) : (
        <FlatList
          data={publicacoesFiltradas}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <Card
              {...item}
              favoritosHabilitados
              onAbrirDetalhes={() => router.push(`/publicacao/${item._id}` as never)}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.empty}>
              {busca ? 'Nenhuma publicação encontrada.' : 'Nenhuma publicação disponível no momento.'}
            </Text>
          }
        />
      )}

      <UserBottomNav ativa="home" />

      <Modal
        visible={modalNotificacoes}
        animationType="slide"
        transparent
        onRequestClose={() => setModalNotificacoes(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.notificationPanel}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Notificações</Text>
                <Text style={styles.modalSubtitle}>Publicações e avisos de interesse</Text>
              </View>
              <TouchableOpacity style={styles.modalCloseButton} onPress={() => setModalNotificacoes(false)}>
                <Ionicons name="close" size={22} color={COLORS.textDark} />
              </TouchableOpacity>
            </View>

            {notificacoes.length > 0 && (
              <View style={styles.notificationActions}>
                <TouchableOpacity style={styles.markAllButton} onPress={marcarTodasComoLidas}>
                  <Ionicons name="checkmark-done-outline" size={17} color={COLORS.primary} />
                  <Text style={styles.markAllText}>Marcar todas como lidas</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.clearReadButton} onPress={limparVisualizadas}>
                  <Ionicons name="trash-outline" size={17} color={COLORS.secondary} />
                  <Text style={styles.clearReadText}>Limpar visualizadas</Text>
                </TouchableOpacity>
              </View>
            )}

            <FlatList
              data={notificacoes}
              keyExtractor={(item) => item._id}
              contentContainerStyle={notificacoes.length === 0 ? styles.notificationEmptyList : styles.notificationList}
              renderItem={({ item }) => (
                <TouchableOpacity style={[styles.notificationItem, !item.lida && styles.notificationUnread]} onPress={() => abrirNotificacao(item)}>
                  <View style={styles.notificationIcon}>
                    <Ionicons
                      name={item.tipo === 'mensagem_interesse' ? 'information-circle-outline' : 'document-text-outline'}
                      size={19}
                      color={COLORS.primary}
                    />
                  </View>
                  <View style={styles.notificationContent}>
                    <Text style={styles.notificationTitle} numberOfLines={2}>
                      {item.tipo === 'mensagem_interesse' ? `Informações: ${item.publicacao.titulo}` : item.publicacao.titulo}
                    </Text>
                    {item.tipo === 'mensagem_interesse' && !!item.mensagem ? (
                      <Text style={styles.notificationDescription} numberOfLines={3}>{item.mensagem}</Text>
                    ) : !!item.publicacao.subtitulo && (
                      <Text style={styles.notificationDescription} numberOfLines={2}>{item.publicacao.subtitulo}</Text>
                    )}
                    <Text style={styles.notificationDate}>{formatarData(item.createdAt)}</Text>
                  </View>
                  {!item.lida && <View style={styles.unreadDot} />}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.notificationEmpty}>
                  <Ionicons name="notifications-off-outline" size={42} color={COLORS.placeholder} />
                  <Text style={styles.notificationEmptyTitle}>Nada novo por aqui</Text>
                  <Text style={styles.notificationEmptyText}>Quando uma publicação ou aviso para interessados aparecer, ele ficará neste sino.</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
    </View>
  );
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
  header: {
    alignItems: 'stretch',
  },
  headerTop: {
    marginBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  portalTitle: {
    color: COLORS.white,
    fontSize: 28,
    fontWeight: '700',
  },
  notificationButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 3,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.secondary,
  },
  notificationBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  searchBar: {
    width: '100%',
    height: 45,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
  },
  searchInput: {
    flex: 1,
    marginLeft: 9,
    color: COLORS.textDark,
    fontSize: 16,
  },
  clearButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: 15,
    paddingBottom: 120,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: COLORS.gray,
  },
  empty: {
    marginTop: 50,
    color: COLORS.gray,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.32)',
  },
  notificationPanel: {
    maxHeight: '82%',
    paddingTop: 18,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    backgroundColor: COLORS.white,
  },
  modalHeader: {
    paddingHorizontal: 18,
    paddingBottom: 12,
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
  notificationActions: {
    marginTop: 10,
    paddingHorizontal: 18,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  markAllButton: {
    marginRight: 8,
    marginBottom: 8,
    paddingVertical: 7,
    paddingHorizontal: 9,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#e8f5e9',
  },
  markAllText: {
    marginLeft: 5,
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  clearReadButton: {
    marginBottom: 8,
    paddingVertical: 7,
    paddingHorizontal: 9,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#ffebee',
  },
  clearReadText: {
    marginLeft: 5,
    color: COLORS.secondary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  notificationList: {
    padding: 14,
    paddingBottom: 24,
  },
  notificationEmptyList: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 30,
  },
  notificationItem: {
    minHeight: 74,
    marginBottom: 9,
    padding: 11,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    backgroundColor: COLORS.white,
  },
  notificationUnread: {
    borderColor: '#c8e6c9',
    backgroundColor: '#f4fbf5',
  },
  notificationIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e8f5e9',
  },
  notificationContent: {
    flex: 1,
    marginLeft: 10,
  },
  notificationTitle: {
    color: COLORS.textDark,
    fontSize: 14,
    fontWeight: 'bold',
  },
  notificationDescription: {
    marginTop: 2,
    color: COLORS.gray,
    fontSize: 12,
  },
  notificationDate: {
    marginTop: 4,
    color: COLORS.placeholder,
    fontSize: 11,
  },
  unreadDot: {
    width: 9,
    height: 9,
    marginLeft: 7,
    borderRadius: 5,
    backgroundColor: COLORS.secondary,
  },
  notificationEmpty: {
    alignItems: 'center',
  },
  notificationEmptyTitle: {
    marginTop: 10,
    color: COLORS.textDark,
    fontSize: 16,
    fontWeight: 'bold',
  },
  notificationEmptyText: {
    marginTop: 5,
    color: COLORS.gray,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
});
