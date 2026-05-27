import { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Platform, Modal, SafeAreaView } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import axios from 'axios';
import { COLORS } from '../styles/theme';
import { API_URL } from '@/src/config/api';

type CardProps = {
    _id: string;
    imagem?: any;
    titulo: string;
    subtitulo?: string;
    descricao: string;
    linkExterno?: string;
    pdfs?: string[];
    arquivoPdf?: string;

    userId: string;
}

export default function Card(props: CardProps) {
    const [expandido, setExpandido] = useState(false);
    const [modalVisivel, setModalVisivel] = useState(false);
    const [pdfUrl, setPdfUrl] = useState('');

    const [favorito, setFavorito] = useState(false);

    useEffect(() => {
        verificarFavorito();
    }, []);

    const verificarFavorito = async () => {
        try {
            const response = await axios.get(
                `${API_URL}/favorites/${props.userId}`
            );

            const existe = response.data.some(
                (fav: any) => fav.postId === props._id
            );

            setFavorito(existe);

        } catch (error) {
            console.log('Erro ao verificar favorito:', error);
        }
    };

    const toggleFavorito = async () => {
        try {

            if (favorito) {

                await axios.delete(
                    `${API_URL}/favorites/${props.userId}/${props._id}`
                );

                setFavorito(false);

            } else {

                await axios.post(`${API_URL}/favorites`, {
                    userId: props.userId,
                    postId: props._id,
                });

                setFavorito(true);
            }

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

    const abrirPdf = (caminhoRelativo: string) => {
        const urlCompleta = caminhoRelativo.startsWith('http')
            ? caminhoRelativo
            : `${API_URL}/${caminhoRelativo}`;

        if (Platform.OS === 'web') {
            window.open(urlCompleta, '_blank');
        } else {
            const urlFinal = Platform.OS === 'android'
                ? `https://docs.google.com/gview?embedded=true&url=${urlCompleta}`
                : urlCompleta;

            setPdfUrl(urlFinal);
            setModalVisivel(true);
        }
    };

    return (
        <View style={styles.card}>

            <TouchableOpacity
                style={styles.botaoFavorito}
                onPress={toggleFavorito}
            >
                <Ionicons
                    name={favorito ? 'star' : 'star-outline'}
                    size={24}
                    color={favorito ? 'FFD700' : COLORS.gray}
                />
            </TouchableOpacity>

            {imagemSource && (
                <Image
                    source={imagemSource}
                    style={styles.imagem}
                />
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

                {expandido && props.linkExterno && (
                    <TouchableOpacity
                        style={styles.linkExternoContainer}
                        onPress={() => Linking.openURL(props.linkExterno!)}
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

                {expandido && ((props.pdfs && props.pdfs.length > 0) || props.arquivoPdf) && (
                    <View style={styles.conteudoExtra}>

                        <Text style={styles.label}>
                            Anexos:
                        </Text>

                        {props.pdfs && props.pdfs.map((path, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.pdfItem}
                                onPress={() => abrirPdf(path)}
                            >
                                <Ionicons
                                    name="document-text-outline"
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

                        {props.arquivoPdf && (
                            <TouchableOpacity
                                style={styles.pdfItem}
                                onPress={() => abrirPdf(props.arquivoPdf!)}
                            >
                                <Ionicons
                                    name="document-text-outline"
                                    size={20}
                                    color={COLORS.secondary}
                                />

                                <Text
                                    style={styles.pdfTexto}
                                    numberOfLines={1}
                                >
                                    {props.arquivoPdf.split(/[/\\]/).pop()}
                                </Text>
                            </TouchableOpacity>
                        )}

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
            </View>

            {Platform.OS !== 'web' && (
                <Modal
                    visible={modalVisivel}
                    animationType="slide"
                    onRequestClose={() => setModalVisivel(false)}
                >
                    <SafeAreaView
                        style={{
                            flex: 1,
                            backgroundColor: COLORS.textDark
                        }}
                    >
                        <TouchableOpacity
                            onPress={() => setModalVisivel(false)}
                            style={styles.btnFechar}
                        >
                            <Text
                                style={{
                                    color: COLORS.white,
                                    fontWeight: 'bold'
                                }}
                            >
                                FECHAR DOCUMENTO
                            </Text>
                        </TouchableOpacity>

                        <WebView
                            source={{ uri: pdfUrl }}
                            style={{ flex: 1 }}
                            startInLoadingState={true}
                        />
                    </SafeAreaView>
                </Modal>
            )}
        </View>
    );
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

    imagem: {
        alignSelf: "center",
        width: '100%',
        height: 200,
        resizeMode: 'cover',
        borderRadius: 8,
        marginBottom: 10,
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

    btnFechar: {
        padding: 15,
        backgroundColor: COLORS.textDark,
        alignItems: 'center'
    },
});