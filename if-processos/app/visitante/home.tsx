import React, { useEffect, useState } from 'react';
import {View, Text, TextInput, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity} from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Card from '@/src/components/Card';
import BotaoVoltar from '@/src/components/BotaoVoltar';
import { COLORS } from '@/src/styles/theme';
import { globalStyles } from '@/src/styles/globalStyles';
import { API_URL } from '@/src/config/api';

interface Post {
    _id: string;
    titulo: string;
    subtitulo?: string;
    descricao: string;
    imagem?: string;
    createdAt: string;
}

export default function HomeVisitante(){

  const router = useRouter();
  const [data, setData] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  
  // Carrega as publicações ao montar o componente
  useEffect(() => {
    carregarPublicacoes();
  }, []);

  // Função para carregar as publicações do backend
  async function carregarPublicacoes() {
    try {
      const res = await axios.get(`${API_URL}/publicacoes`);
      // Ordena as publicações por data de criação (mais recentes primeiro)
      const ordenado = res.data.sort(
        (a: Post, b: Post) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
      );

      setData(ordenado);
    } catch (error) {
      console.log('Erro ao buscar publicações:', error);
    } finally { 
      setLoading(false);
    }
  }

  // Filtra os dados com base na busca
  const filtradas = data.filter(item =>
    item.titulo.toLowerCase().includes(busca.toLowerCase()) ||
    item.descricao.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <View style={globalStyles.container}>

      <View style={[globalStyles.header, { alignItems: 'center' }]}>

        <Text style={styles.portalTitle}>Portal IFNMG</Text> 

        <View style={styles.searchBar}>
          <Ionicons
            name="search"
            size={20}
            color={COLORS.textLight}
          />

          <TextInput
            placeholder="Buscar no portal..."
            style={styles.searchInput}
            placeholderTextColor={COLORS.placeholder}
            value={busca}
            onChangeText={setBusca}
          />
        </View>

      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={{ marginTop: 10, color: COLORS.gray }}>
            Buscando publicações...
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtradas}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <Card
              {...item}
              onAbrirDetalhes={() => router.push(`/publicacao/${item._id}` as never)}
            />
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.empty}>
              Nenhuma publicação encontrada no momento.
            </Text>
          }
        />
      )}

      <BotaoVoltar variante="flutuante" cor={COLORS.secondary} style={{ bottom: 60 }} />

    </View>
  );
}

const styles = StyleSheet.create({

  portalTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 18,
    color: COLORS.white
  },

  searchBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 25,
    paddingHorizontal: 15,
    height: 45,
    alignItems: 'center',
    width: '100%',
  },

  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: COLORS.textDark,
  },

  listContent: {
    padding: 15,
    paddingBottom: 80,
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  empty: {
    textAlign: 'center',
    marginTop: 50,
    color: COLORS.gray,
  },
});
