import { View, Text, TextInput, StyleSheet, FlatList } from 'react-native';
import Card from '@/src/components/Card';
import BotaoVoltar from '@/src/components/BotaoVoltar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS } from '@/src/styles/theme';
import { globalStyles } from '@/src/styles/globalStyles';


export default function Home() {

    const router = useRouter();

    {/* Dados de teste */ }
    const processos = [

        {
            id: '1',
            imagem: '',
            linkExterno: 'https://www.ifnmg.edu.br/mais-noticias-almenara/723-almenara-noticias-2026/40417-ifnmg-campus-almenara-abre-selecao-para-programa-de-monitoria-e-monitoria-inclusiva-2026',
            titulo: 'Publicado edital para remoção de docentes do IFNMG entre os campi Araçuaí, Arinos, Pirapora, Salinas e Teófilo Otoni',
            subtitulo: 'Edital',
            descricao: 'O IFNMG publicou o Edital nº 551/2026, que regulamenta o Processo Seletivo de Remoção de servidores docentes entre as unidades organizacionais da instituição.',
            pdfs: ['edital_01.pdf']
        },

        {
            id: '2',
            imagem: '',
            titulo: 'IFNMG Campus Almenara abre seleção para Programa de Monitoria e Monitoria Inclusiva 2026',
            descricao: 'O Instituto Federal do Norte de Minas Gerais (IFNMG) – Campus Almenara publicou o Edital nº 060/2026, que estabelece as normas para seleção de estudantes bolsistas para o Programa Institucional de Monitoria e Monitoria Inclusiva, referente ao primeiro semestre letivo de 2026. ',
            pdfs: ['Edital.pdf', 'ANEXO I - TERMO DE COMPROMISSO E ADESÃO']

        },

    ];

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

            <FlatList
                data={processos}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => (
                    <Card {...item} />
                )}
            />

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