import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import axios from 'axios';
import BotaoVoltar from '@/src/components/BotaoVoltar';
import Card from '@/src/components/Card';
import { API_URL } from '@/src/config/api';
import { criarCabecalhoAuth } from '@/src/config/auth';
import { COLORS } from '@/src/styles/theme';
import { Publicacao } from '@/src/types/Publicacao';

export default function DetalhesPublicacao() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [publicacao, setPublicacao] = useState<Publicacao | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [iniciandoChat, setIniciandoChat] = useState(false);

  const carregarPublicacao = useCallback(async () => {
    try {
      const resposta = await axios.get(`${API_URL}/publicacoes/${id}`);
      setPublicacao(resposta.data);
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
              {!!publicacao.autor?._id && (
                <TouchableOpacity style={styles.chatButton} onPress={iniciarChat} disabled={iniciandoChat}>
                  <Ionicons name="chatbubbles-outline" size={20} color={COLORS.white} />
                  <Text style={styles.chatButtonText}>
                    {iniciandoChat ? 'Abrindo conversa...' : 'Falar com o responsável'}
                  </Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <Text style={styles.empty}>Publicação não encontrada.</Text>
          )}
        </ScrollView>
      )}
    </View>
  );
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
});
