import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import axios from 'axios';
import Card from '@/src/components/Card';
import UserBottomNav from '@/src/components/UserBottomNav';
import { API_URL } from '@/src/config/api';
import { criarCabecalhoAuth, limparToken } from '@/src/config/auth';
import { COLORS } from '@/src/styles/theme';
import { globalStyles } from '@/src/styles/globalStyles';
import { Publicacao } from '@/src/types/Publicacao';

export default function Favoritos() {
  const router = useRouter();
  const [publicacoes, setPublicacoes] = useState<Publicacao[]>([]);
  const [carregando, setCarregando] = useState(true);

  const carregarFavoritos = useCallback(async () => {
    try {
      const resposta = await axios.get(`${API_URL}/favorites`, {
        headers: criarCabecalhoAuth(),
      });
      setPublicacoes(resposta.data);
    } catch (error: any) {
      Alert.alert('Erro', error.response?.data?.erro || 'Não foi possível carregar seus favoritos.');

      if (error.response?.status === 401) {
        limparToken();
        router.replace('/login');
      }
    } finally {
      setCarregando(false);
    }
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      carregarFavoritos();
    }, [carregarFavoritos])
  );

  return (
    <View style={globalStyles.container}>

      <View style={styles.header}>
        <Text style={styles.title}>Favoritos</Text>
        <Text style={styles.subtitle}>Publicações salvas para consultar depois</Text>
      </View>

      {carregando ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={publicacoes}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <Card
              {...item}
              favoritosHabilitados
              onFavoritoAlterado={carregarFavoritos}
              onAbrirDetalhes={() => router.push(`/publicacao/${item._id}` as never)}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="star-outline" size={42} color={COLORS.placeholder} />
              <Text style={styles.emptyText}>Você ainda não salvou nenhuma publicação.</Text>
            </View>
          }
        />
      )}

      <UserBottomNav ativa="favoritos" />
    </View>
  );
}

const styles = StyleSheet.create({

  header: {
    paddingTop: 54,
    paddingHorizontal: 20,
    paddingBottom: 18,
    backgroundColor: COLORS.primaryLight,
  },

  title: {
    color: COLORS.white,
    fontSize: 26,
    fontWeight: 'bold',
  },

  subtitle: {
    marginTop: 4,
    color: '#e8f5e9',
    fontSize: 14,
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  listContent: {
    padding: 15,
    paddingBottom: 120,
  },

  empty: {
    alignItems: 'center',
    paddingTop: 70,
  },

  emptyText: {
    marginTop: 10,
    color: COLORS.gray,
    textAlign: 'center',
  },

});
