import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS } from '../styles/theme';

interface BotaoVoltarProps {
  variante?: 'flutuante' | 'header' | 'simples';
  texto?: string;
  cor?: string;
  style?: ViewStyle;
}

export default function BotaoVoltar({ variante = 'header', texto, cor, style }: BotaoVoltarProps) {
  const router = useRouter();

  // Define o estilo base baseado na variante
  const estiloBotao = variante === 'flutuante' ? styles.flutuante : styles.header;
  const corIcone = cor || (variante === 'header' ? COLORS.white : COLORS.secondary);

  return (
    <TouchableOpacity 
      style={[estiloBotao, style]} 
      onPress={() => router.back()}
    >
      <View style={[styles.circulo, { backgroundColor: variante === 'flutuante' ? corIcone : 'transparent' }]}>
        <Ionicons 
          name="arrow-back" 
          size={variante === 'flutuante' ? 24 : 26} 
          color={variante === 'flutuante' ? COLORS.white : corIcone} 
        />
      </View>
      {texto && <Text style={[styles.texto, { color: corIcone }]}>{texto}</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  
    header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  flutuante: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  
  circulo: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  texto: {
    marginLeft: 8,
    fontWeight: 'bold',
    fontSize: 16,
  },

});