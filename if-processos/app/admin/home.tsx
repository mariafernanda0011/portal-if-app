import React, { useEffect, useState } from 'react';
import {View, Text, TextInput, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity,} from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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

export default function HomeAdmin() {
  const router = useRouter();

  const [data, setData] = useState<Post[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState('');
  const [tab, setTab] = useState<
    'home' | 'editais' | 'favoritos' | 'perfil'
  >('home');

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
  }

  const filtradas = data.filter(
    item =>
      item.titulo.toLowerCase().includes(busca.toLowerCase()) ||
      item.descricao.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <View style={globalStyles.container}>
      
      {/* HEADER */}
      <View style={[globalStyles.header, { alignItems: 'center' }]}>
        
        <View style={styles.headerTop}>
          
          <View style={styles.titleContainer}>
            <Text style={styles.portalTitle}>Portal IFNMG</Text>
          </View>

          <TouchableOpacity onPress={() => console.log('notificações')}>
            <Ionicons
              name="notifications-outline"
              size={22}
              color={COLORS.white}
            />
          </TouchableOpacity>

        </View>

        {/* BARRA DE BUSCA */}
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

          <TouchableOpacity onPress={() => console.log('filtros')}>
            <Ionicons
              name="options-outline"
              size={20}
              color={COLORS.textLight}
            />
          </TouchableOpacity>

        </View>
      </View>

      {/* LISTA */}
      {carregando ? (
        <View style={styles.center}>
          <ActivityIndicator
            size="large"
            color={COLORS.primary}
          />

          <Text style={{ marginTop: 10, color: COLORS.gray }}>
            Buscando publicações...
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtradas}
          keyExtractor={(item) => item._id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <Text style={styles.sectionTitle}>
              Editais recentes
            </Text>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              
              {/* TOPO DO CARD */}
              <View style={styles.cardTop}>
                
                <View style={{ flex: 1 }}>
                  
                  <Text style={styles.cardTitle}>
                    {item.titulo}
                  </Text>

                  {!!item.subtitulo && (
                    <Text style={styles.cardSubtitle}>
                      {item.subtitulo}
                    </Text>
                  )}

                  <Text
                    numberOfLines={2}
                    style={styles.cardDescription}
                  >
                    {item.descricao}
                  </Text>

                </View>

                {/* AÇÕES */}
                <View style={styles.actions}>
                  
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() =>
                      router.push(`/editar/${item._id}`)
                    }
                  >
                    <Ionicons
                      name="create-outline"
                      size={18}
                      color={COLORS.gray}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() =>
                      console.log('excluir publicação')
                    }
                  >
                    <Ionicons
                      name="trash-outline"
                      size={18}
                      color="#ff4d4d"
                    />
                  </TouchableOpacity>

                </View>
              </View>

              {/* BOTÃO */}
              <TouchableOpacity
                style={styles.saibaMais}
                onPress={() =>
                  router.push(`/publicacao/${item._id}`)
                }
              >
                <Text style={styles.saibaMaisText}>
                  Clique aqui para saber mais
                </Text>
              </TouchableOpacity>

              {/* ANEXOS */}
              <Text style={styles.anexoTitle}>
                Anexos:
              </Text>

              <View style={styles.anexoBox} />

              {/* VER MAIS */}
              <TouchableOpacity
                onPress={() =>
                  router.push(`/publicacao/${item._id}`)
                }
              >
                <Text style={styles.verMais}>
                  Ver mais
                </Text>
              </TouchableOpacity>

            </View>
          )}
          ListFooterComponent={
            <TouchableOpacity
              style={styles.novoEdital}
              onPress={() =>
                router.push('/admin/criar-publicacao')
              }
            >
              <Text style={styles.novoEditalText}>
                + Novo Edital
              </Text>
            </TouchableOpacity>
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              Nenhuma publicação encontrada.
            </Text>
          }
        />
      )}

      <BotaoVoltar
          variante="flutuante"
          cor={COLORS.secondary}
          style={{ bottom: 90 }}
        />

      {/* MENU INFERIOR */}
      <View style={styles.bottomNav}>
        
        <TouchableOpacity
          onPress={() => {
            setTab('home');
            router.push('/admin/home');
          }}
          style={styles.navItem}
        >
          <Ionicons
            name="home"
            size={22}
            color={tab === 'home' ? COLORS.primary : '#999'}
          />

          <Text
            style={[
              styles.navText,
              tab === 'home' && styles.active,
            ]}
          >
            Home
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            setTab('editais');
          }}
          style={styles.navItem}
        >
          <Ionicons
            name="document-text"
            size={22}
            color={tab === 'editais' ? COLORS.primary : '#999'}
          />

          <Text
            style={[
              styles.navText,
              tab === 'editais' && styles.active,
            ]}
          >
            Editais
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            setTab('favoritos');
            router.push('/favoritos');
          }}
          style={styles.navItem}
        >
          <Ionicons
            name="star"
            size={22}
            color={tab === 'favoritos' ? COLORS.primary : '#999'}
          />

          <Text
            style={[
              styles.navText,
              tab === 'favoritos' && styles.active,
            ]}
          >
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

          <Text
            style={[
              styles.navText,
              tab === 'perfil' && styles.active,
            ]}
          >
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
    backgroundColor: 'rgba(255,255,255,0.95)',
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
    paddingBottom: 120,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 15,
  },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 15,
    marginBottom: 18,

    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },

  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textDark,
  },

  cardSubtitle: {
    fontSize: 15,
    color: COLORS.gray,
    marginTop: 2,
  },

  cardDescription: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 5,
  },

  actions: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 10,
  },

  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#F3F3F3',
    justifyContent: 'center',
    alignItems: 'center',
  },

  saibaMais: {
    backgroundColor: '#DFF3DF',
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 15,
  },

  saibaMaisText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '600',
  },

  anexoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 8,
  },

  anexoBox: {
    height: 28,
    backgroundColor: '#F2F2F2',
    borderRadius: 6,
    marginBottom: 15,
  },

  verMais: {
    textAlign: 'center',
    color: '#0066FF',
    fontWeight: '600',
  },

  novoEdital: {
    backgroundColor: COLORS.primary,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },

  novoEditalText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 16,
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    color: COLORS.gray,
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