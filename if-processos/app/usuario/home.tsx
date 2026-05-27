import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
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

export default function HomeUsuario() {
  const router = useRouter();

  const [data, setData] = useState<Post[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState('');
  const [tab, setTab] = useState<'home' | 'fav' | 'perfil'>('home');

  useEffect(() => {
    carregarPublicacoes();
  }, []);

  async function carregarPublicacoes() {
    try {
      const res = await axios.get(`${API_URL}/publicacoes`);

      const ordenado = res.data.sort(
        (a: Post, b: Post) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
      );

      setData(ordenado);
    } finally {
      setCarregando(false);
    }
  };

  const filtradas = data.filter(item =>
    item.titulo.toLowerCase().includes(busca.toLowerCase()) ||
    item.descricao.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <View style={globalStyles.container}>

      <View style={[globalStyles.header, { alignItems: 'center' }]}>

        <View style={styles.headerTop}>

          <View style={styles.titleContainer}>
            <Text style={styles.portalTitle}>Portal IFNMG</Text>
          </View>

          <TouchableOpacity onPress={() => console.log('notificações')}>
            <Ionicons name="notifications-outline" size={22} color={COLORS.white} />
          </TouchableOpacity>

        </View>
          <View style={styles.searchBar}>
          
              <Ionicons name="search" size={20} color={COLORS.textLight} />
              <TextInput
                  placeholder="Buscar no portal..."
                  style={styles.searchInput}
                  placeholderTextColor={COLORS.placeholder}
                  />
              
            <TouchableOpacity onPress={() => console.log('filtros')}>
              <Ionicons name="options-outline" size={20} color={COLORS.textLight} />
            </TouchableOpacity>
          </View>
      </View>

      {carregando ? (
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
            <TouchableOpacity
              onPress={() => router.push(`/publicacao/${item._id}`)}
            >
              <Card {...item} />
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={{ textAlign: 'center', marginTop: 50, color: COLORS.gray }}>
              Nenhuma publicação encontrada no momento.
            </Text>
          }
        />
      )}

      <BotaoVoltar
        variante="flutuante"
        cor={COLORS.secondary}
        style={{ bottom: 90 }}
      />

      <View style={styles.bottomNav}>

        <TouchableOpacity
          onPress={() => {
            setTab('home');
            router.push('/home');
          }}
          style={styles.navItem}
        >
          <Ionicons
            name="home"
            size={22}
            color={tab === 'home' ? COLORS.primary : '#999'}
          />
          <Text style={[styles.navText, tab === 'home' && styles.active]}>
            Home
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            setTab('fav');
            router.push('/favoritos');
          }}
          style={styles.navItem}
        >
          <Ionicons
            name="star"
            size={22}
            color={tab === 'fav' ? COLORS.primary : '#999'}
          />
          <Text style={[styles.navText, tab === 'fav' && styles.active]}>
            Favoritos
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            setTab('perfil');
            router.push('/perfil');
          }}
          style={styles.navItem}
        >
          <Ionicons
            name="person"
            size={22}
            color={tab === 'perfil' ? COLORS.primary : '#999'}
          />
          <Text style={[styles.navText, tab === 'perfil' && styles.active]}>
            Perfil
          </Text>
        </TouchableOpacity>

      </View>

    </View>
  );
}

const styles = StyleSheet.create({

  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 18,
    position: 'relative',
  },

  titleContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },

  portalTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.white,
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

  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: -2 },
    elevation: 10,
  },

  navItem: {
    alignItems: 'center',
  },

  navText: {
    fontSize: 12,
    color: '#999',
  },

  active: {
    color: COLORS.primary,
    fontWeight: '600',
  },
});