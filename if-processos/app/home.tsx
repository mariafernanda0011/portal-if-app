import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import axios from 'axios'; 
import Card from '@/src/components/Card';
import BotaoVoltar from '@/src/components/BotaoVoltar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS } from '@/src/styles/theme';
import { globalStyles } from '@/src/styles/globalStyles';

export default function Home() {
    const router = useRouter();
    const [processos, setProcessos] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const buscarPublicacoes = async () => {
        try {
            const urlDaApi = 'http://192.168.100.252/publicacoes'; // ATENÇÃO: Substitua pelo IP da sua máquina
            const resposta = await axios.get(urlDaApi);
            setProcessos(resposta.data); 
        } catch (error) {
            console.error("Erro ao buscar as publicações:", error);
        } finally {
            setCarregando(false); 
        }
    };

    useEffect(() => {
        buscarPublicacoes();
    }, []);

    return (
        <View style={globalStyles.container}>

            <View style={[globalStyles.header, { alignItems: 'center' }]}>
                <Text style={styles.portalTitle}>Portal IFNMG</Text>
                <View style={styles.searchBar}>
                    <Ionicons name="search" size={20} color={COLORS.textLight} />
                    <TextInput
                        placeholder="Buscar no portal..."
                        style={styles.searchInput}
                        placeholderTextColor={COLORS.placeholder}
                    />
                </View>
            </View>

            {carregando ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={{ marginTop: 10, color: COLORS.gray }}>Buscando publicações...</Text>
                </View>
            ) : (
                <FlatList
                    data={processos}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={styles.listContent}
                    renderItem={({ item }) => (
                        <Card {...item} />
                    )}
                    ListEmptyComponent={
                        <Text style={{ textAlign: 'center', color: COLORS.gray, marginTop: 50 }}>
                            Nenhuma publicação encontrada no momento.
                        </Text>
                    }
                />
            )}
            <BotaoVoltar variante="flutuante" cor={COLORS.secondary} />
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

});