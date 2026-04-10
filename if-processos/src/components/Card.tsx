import { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Platform, Modal, SafeAreaView } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { COLORS } from '../styles/theme'; 

type CardProps = {
    imagem?: any;
    titulo: string;
    subtitulo?: string;
    descricao: string;
    linkExterno?: string;
    pdfs?: string[];
}

export default function Card(props: CardProps) {
    const [expandido, setExpandido] = useState(false);
    const [modalVisivel, setModalVisivel] = useState(false);
    const [pdfUrl, setPdfUrl] = useState('');

    const abrirPdf = (url: string) => {
        const urlFinal = Platform.OS === 'android'
            ? `https://docs.google.com/gview?embedded=true&url=${url}`
            : url;
        setPdfUrl(urlFinal);
        setModalVisivel(true);
    };

    return (
        <View style={styles.card}>
            {props.imagem && (
                <Image
                    source={typeof props.imagem === 'number' ? props.imagem : { uri: props.imagem }}
                    style={styles.imagem}
                />
            )}

            <View>
                <Text style={styles.titulo}>{props.titulo}</Text>
                {props.subtitulo && (
                    <Text style={styles.subtituloTexto}>{props.subtitulo}</Text>
                )}
                <Text style={styles.descricao} numberOfLines={expandido ? undefined : 2}>
                    {props.descricao}
                </Text>

                {expandido && props.linkExterno && (
                    <TouchableOpacity
                        style={styles.linkExternoContainer}
                        onPress={() => Linking.openURL(props.linkExterno!)}
                    >
                        <Ionicons name="globe-outline" size={16} color={COLORS.primary} />
                        <Text style={styles.linkExternoTexto}>Clique aqui para saber mais</Text>
                        <Ionicons name="open-outline" size={14} color={COLORS.primary} />
                    </TouchableOpacity>
                )}

                {expandido && props.pdfs && (
                    <View style={styles.conteudoExtra}>
                        <Text style={styles.label}>Anexos:</Text>
                        {props.pdfs.map((path, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.pdfItem}
                                onPress={() => abrirPdf(path)}
                            >
                                <Ionicons name="document-text-outline" size={20} color={COLORS.secondary} />
                                <Text style={styles.pdfTexto} numberOfLines={1}>{path.split('/').pop()}</Text>
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
            </View>

            <Modal visible={modalVisivel} animationType="slide">
                <SafeAreaView style={{ flex: 1 }}>
                    <TouchableOpacity onPress={() => setModalVisivel(false)} style={styles.btnFechar}>
                        <Text style={{ color: COLORS.white, fontWeight: 'bold' }}>FECHAR DOCUMENTO</Text>
                    </TouchableOpacity>
                    <WebView source={{ uri: pdfUrl }} style={{ flex: 1 }} />
                </SafeAreaView>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    
    card: {
        backgroundColor: COLORS.white,
        borderRadius: 15,
        marginBottom: 15,
        elevation: 3,
        overflow: 'hidden',
        padding: 15,
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
        backgroundColor: COLORS.inputBg,
        padding: 10,
        borderRadius: 8,
        marginBottom: 5,
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