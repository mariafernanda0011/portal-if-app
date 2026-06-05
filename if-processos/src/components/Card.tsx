import { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Platform, Modal, SafeAreaView, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import axios from 'axios';
import { COLORS } from '../styles/theme';
import { API_URL } from '@/src/config/api';
import { criarCabecalhoAuth } from '@/src/config/auth';

type CardProps = {
    _id: string;
    imagem?: any;
    titulo: string;
    subtitulo?: string;
    descricao: string;
    linkExterno?: string;
    urlPublicacao?: string;
    pdfs?: string[];
    arquivoPdf?: string;
    autor?: {
        nome?: string;
        cargo?: string;
    };

    favoritosHabilitados?: boolean;
    onFavoritoAlterado?: () => void;
    onAbrirDetalhes?: () => void;
}

export default function Card(props: CardProps) {
    const [expandido, setExpandido] = useState(false);
    const [modalImagemVisivel, setModalImagemVisivel] = useState(false);
    const [baixandoPdf, setBaixandoPdf] = useState(false);
    const linkExterno = props.linkExterno || props.urlPublicacao;
    const pdfs = props.pdfs && props.pdfs.length > 0
        ? props.pdfs
        : props.arquivoPdf
            ? [props.arquivoPdf]
            : [];

    const [favorito, setFavorito] = useState(false);

    useEffect(() => {
        if (props.favoritosHabilitados) {
            verificarFavorito();
        }
    }, [props._id, props.favoritosHabilitados]);

    const verificarFavorito = async () => {
        try {
            const response = await axios.get(
                `${API_URL}/favorites/${props._id}/status`,
                { headers: criarCabecalhoAuth() }
            );

            setFavorito(response.data.favorito);

        } catch (error) {
            console.log('Erro ao verificar favorito:', error);
        }
    };

    const toggleFavorito = async () => {
        if (!props.favoritosHabilitados) return;

        try {

            if (favorito) {

                await axios.delete(
                    `${API_URL}/favorites/${props._id}`,
                    { headers: criarCabecalhoAuth() }
                );

                setFavorito(false);

            } else {

                await axios.post(
                    `${API_URL}/favorites/${props._id}`,
                    {},
                    { headers: criarCabecalhoAuth() }
                );

                setFavorito(true);
            }

            props.onFavoritoAlterado?.();

        } catch (error) {
            console.log('Erro ao atualizar favorito:', error);
        }
    };

    const getImagemSource = () => {
        if (!props.imagem) return null;

        if (typeof props.imagem === 'number') return props.imagem;

        if (
            props.imagem.startsWith('http') ||
            props.imagem.startsWith('https') ||
            props.imagem.startsWith('file://') ||
            props.imagem.startsWith('data:') ||
            props.imagem.startsWith('blob:')
        ) {
            return { uri: props.imagem };
        }

        return { uri: `${API_URL}/${props.imagem}` };
    };

    const imagemSource = getImagemSource();

    const abrirPdf = async (caminhoRelativo: string) => {
        const urlCompleta = caminhoRelativo.startsWith('http')
            ? caminhoRelativo
            : `${API_URL}/${caminhoRelativo}`;
        const nomeArquivo = caminhoRelativo.split(/[/\\]/).pop() || `documento-${Date.now()}.pdf`;

        if (Platform.OS === 'web') {
            window.open(urlCompleta, '_blank');
            return;
        }

        try {
            setBaixandoPdf(true);
            const destino = `${FileSystem.cacheDirectory}${nomeArquivo}`;
            const download = await FileSystem.downloadAsync(urlCompleta, destino, {
                headers: criarCabecalhoAuth(),
            });

            if (download.status < 200 || download.status >= 300) {
                throw new Error(`Download recusado pelo servidor (${download.status}).`);
            }

            const podeCompartilhar = await Sharing.isAvailableAsync();
            if (!podeCompartilhar) {
                await Linking.openURL(download.uri);
                return;
            }

            await Sharing.shareAsync(download.uri, {
                mimeType: 'application/pdf',
                UTI: 'com.adobe.pdf',
                dialogTitle: 'Abrir PDF',
            });
        } catch (error: any) {
            Alert.alert('Erro', error.message || 'Não foi possível baixar ou abrir o PDF.');
        } finally {
            setBaixandoPdf(false);
        }
    };

    return (
        <View style={styles.card}>

            {props.favoritosHabilitados && (
                <TouchableOpacity
                    style={styles.botaoFavorito}
                    onPress={toggleFavorito}
                >
                    <Ionicons
                        name={favorito ? 'star' : 'star-outline'}
                        size={24}
                        color={favorito ? '#FFD700' : COLORS.gray}
                    />
                </TouchableOpacity>
            )}

            {imagemSource && (
                <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => setModalImagemVisivel(true)}
                    style={styles.imagemContainer}
                >
                    <Image
                        source={imagemSource}
                        style={styles.imagem}
                    />
                </TouchableOpacity>
            )}

            <View>
                <Text style={styles.titulo}>{props.titulo}</Text>

                {props.subtitulo && (
                    <Text style={styles.subtituloTexto}>
                        {props.subtitulo}
                    </Text>
                )}

                <Text
                    style={styles.descricao}
                    numberOfLines={expandido ? undefined : 2}
                >
                    {props.descricao}
                </Text>

                {!!props.autor?.nome && (
                    <Text style={styles.autor}>
                        {props.autor.nome}{props.autor.cargo ? ` • ${rotuloCargo(props.autor.cargo)}` : ''}
                    </Text>
                )}

                {expandido && linkExterno && (
                    <TouchableOpacity
                        style={styles.linkExternoContainer}
                        onPress={() => Linking.openURL(linkExterno)}
                    >
                        <Ionicons
                            name="globe-outline"
                            size={16}
                            color={COLORS.primary}
                        />

                        <Text style={styles.linkExternoTexto}>
                            Clique aqui para saber mais
                        </Text>

                        <Ionicons
                            name="open-outline"
                            size={14}
                            color={COLORS.primary}
                        />
                    </TouchableOpacity>
                )}

                {expandido && pdfs.length > 0 && (
                    <View style={styles.conteudoExtra}>

                        <Text style={styles.label}>
                            Anexos:
                        </Text>

                        {pdfs.map((path, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.pdfItem}
                                onPress={() => abrirPdf(path)}
                            >
                                <Ionicons
                                    name={baixandoPdf ? 'cloud-download-outline' : 'document-text-outline'}
                                    size={20}
                                    color={COLORS.secondary}
                                />

                                <Text
                                    style={styles.pdfTexto}
                                    numberOfLines={1}
                                >
                                    {path.split(/[/\\]/).pop()}
                                </Text>
                            </TouchableOpacity>
                        ))}

                    </View>
                )}

                <TouchableOpacity
                    style={styles.botaoExpandir}
                    onPress={() => setExpandido(!expandido)}
                >
                    <Text style={styles.textoBotaoExpandir}>
                        {expandido ? "Ver menos" : "Ver mais..."}
                    </Text>

                    <Ionicons
                        name={expandido ? "chevron-up" : "chevron-down"}
                        size={16}
                        color="#007bff"
                    />
                </TouchableOpacity>

                {props.onAbrirDetalhes && (
                    <TouchableOpacity style={styles.botaoDetalhes} onPress={props.onAbrirDetalhes}>
                        <Ionicons name="open-outline" size={15} color={COLORS.primary} />
                        <Text style={styles.textoBotaoDetalhes}>Abrir detalhes</Text>
                    </TouchableOpacity>
                )}
            </View>

            <Modal visible={baixandoPdf} animationType="fade" transparent>
                <View style={styles.downloadOverlay}>
                    <View style={styles.downloadBox}>
                        <ActivityIndicator size="large" color={COLORS.primary} />
                        <Text style={styles.downloadText}>Baixando PDF...</Text>
                    </View>
                </View>
            </Modal>

            {imagemSource && (
                <Modal
                    visible={modalImagemVisivel}
                    animationType="fade"
                    transparent
                    onRequestClose={() => setModalImagemVisivel(false)}
                >
                    <SafeAreaView style={styles.modalImagemContainer}>
                        <TouchableOpacity
                            style={styles.botaoFecharImagem}
                            onPress={() => setModalImagemVisivel(false)}
                        >
                            <Ionicons name="close" size={28} color={COLORS.white} />
                        </TouchableOpacity>

                        <Image
                            source={imagemSource}
                            style={styles.imagemExpandida}
                        />
                    </SafeAreaView>
                </Modal>
            )}
        </View>
    );
}

function rotuloCargo(cargo: string) {
    const cargos: Record<string, string> = {
        professor: 'Professor',
        coordenador: 'Coordenador de curso',
        diretor_ensino: 'Diretor de ensino',
        diretor_geral: 'Diretor geral',
        administrador: 'Administrador',
    };

    return cargos[cargo] || cargo;
}

const styles = StyleSheet.create({

    card: {
        backgroundColor: COLORS.white,
        borderRadius: 15,
        marginBottom: 15,
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        overflow: 'hidden',
        padding: 15,
        position: 'relative',
    },

    botaoFavorito: {
        position: 'absolute',
        top: 12,
        right: 12,
        zIndex: 10,
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 6,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.15,
        shadowRadius: 3,
    },

    imagemContainer: {
        width: '100%',
        height: 200,
        borderRadius: 8,
        marginBottom: 10,
        overflow: 'hidden',
        backgroundColor: COLORS.background,
    },

    imagem: {
        width: '100%',
        height: '100%',
        resizeMode: 'contain',
    },

    titulo: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.textDark,
        marginBottom: 5,
    },

    subtituloTexto: {
        fontSize: 14,
        color: COLORS.textLight,
        fontWeight: '600',
        marginBottom: 5,
    },

    descricao: {
        fontSize: 14,
        color: COLORS.gray,
        marginTop: 5,
        textAlign: 'justify',
    },
    autor: {
        marginTop: 8,
        color: COLORS.placeholder,
        fontSize: 12,
    },

    linkExternoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
        padding: 10,
        backgroundColor: '#e8f5e9',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#c8e6c9',
    },

    linkExternoTexto: {
        flex: 1,
        marginLeft: 8,
        fontSize: 13,
        color: COLORS.primary,
        fontWeight: 'bold',
        textDecorationLine: 'underline',
    },

    conteudoExtra: {
        marginTop: 15,
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: COLORS.lightGray,
    },

    label: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 10,
        color: COLORS.textDark,
    },

    pdfItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        padding: 10,
        borderRadius: 8,
        marginBottom: 5,
        borderWidth: 1,
        borderColor: COLORS.lightGray
    },

    pdfTexto: {
        fontSize: 12,
        marginLeft: 10,
        color: '#2f76d3',
    },

    botaoExpandir: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
    },

    textoBotaoExpandir: {
        color: '#007bff',
        fontWeight: '600',
        marginRight: 5,
    },
    botaoDetalhes: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
    },
    textoBotaoDetalhes: {
        marginLeft: 5,
        color: COLORS.primary,
        fontSize: 13,
        fontWeight: '600',
    },

    downloadOverlay: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.35)',
    },
    downloadBox: {
        minWidth: 180,
        padding: 18,
        alignItems: 'center',
        borderRadius: 8,
        backgroundColor: COLORS.white,
    },
    downloadText: {
        marginTop: 10,
        color: COLORS.textDark,
        fontWeight: 'bold',
    },
    modalImagemContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.94)',
    },
    botaoFecharImagem: {
        position: 'absolute',
        top: 45,
        right: 18,
        zIndex: 2,
        width: 42,
        height: 42,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 21,
        backgroundColor: 'rgba(0, 0, 0, 0.35)',
    },
    imagemExpandida: {
        width: '100%',
        height: '100%',
        resizeMode: 'contain',
    },
});
