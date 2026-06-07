import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import axios from 'axios';
import { API_URL } from '@/src/config/api';
import { criarCabecalhoAuth } from '@/src/config/auth';
import { COLORS } from '@/src/styles/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Aba = 'home' | 'favoritos' | 'conversas' | 'perfil';

export default function UserBottomNav({ ativa }: { ativa: Aba }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [mensagensNaoLidas, setMensagensNaoLidas] = useState(0);

  useFocusEffect(
    useCallback(() => {
      const carregarNaoLidas = async () => {
        try {
          const resposta = await axios.get(`${API_URL}/chats/nao-lidas`, {
            headers: criarCabecalhoAuth(),
          });
          setMensagensNaoLidas(resposta.data.total);
        } catch {
          setMensagensNaoLidas(0);
        }
      };

      carregarNaoLidas();
      const intervalo = setInterval(carregarNaoLidas, 5000);
      return () => clearInterval(intervalo);
    }, [])
  );

  return (
    <View style={[styles.container, { height: 68 + (insets.bottom || 0), paddingBottom: insets.bottom || 0 }]}>
      <NavItem
        ativo={ativa === 'home'}
        icon="home-outline"
        iconAtivo="home"
        label="Home"
        onPress={() => router.replace('/usuario/home')}
      />
      <NavItem
        ativo={ativa === 'favoritos'}
        icon="star-outline"
        iconAtivo="star"
        label="Favoritos"
        onPress={() => router.replace('/favoritos' as never)}
      />
      <NavItem
        ativo={ativa === 'conversas'}
        icon="chatbubbles-outline"
        iconAtivo="chatbubbles"
        label="Conversas"
        badge={mensagensNaoLidas}
        onPress={() => router.replace('/conversas' as never)}
      />
      <NavItem
        ativo={ativa === 'perfil'}
        icon="person-outline"
        iconAtivo="person"
        label="Perfil"
        onPress={() => router.replace('/perfil' as never)}
      />
    </View>
  );
}

function NavItem({
  ativo,
  icon,
  iconAtivo,
  label,
  badge,
  onPress,
}: {
  ativo: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  iconAtivo: keyof typeof Ionicons.glyphMap;
  label: string;
  badge?: number;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.item} onPress={onPress}>
      <Ionicons name={ativo ? iconAtivo : icon} size={22} color={ativo ? COLORS.primary : COLORS.placeholder} />
      {!!badge && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
        </View>
      )}
      <Text style={[styles.text, ativo && styles.textActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    backgroundColor: COLORS.white,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  item: {
    position: 'relative',
    width: 78,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 18,
    minWidth: 17,
    height: 17,
    paddingHorizontal: 4,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.secondary,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: 'bold',
  },
  text: {
    marginTop: 3,
    color: COLORS.placeholder,
    fontSize: 11,
  },
  textActive: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
});
