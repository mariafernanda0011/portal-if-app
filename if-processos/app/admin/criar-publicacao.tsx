import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import axios from 'axios';
import Card from '@/src/components/Card';
import BotaoVoltar from '@/src/components/BotaoVoltar';
import { COLORS } from '@/src/styles/theme';
import { globalStyles } from '@/src/styles/globalStyles';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { API_URL } from '@/src/config/api';

export default function CriarPublicacao() {

    const router = useRouter();

    const [titulo, setTitulo] = useState('');
    const [descricao, setDescricao] = useState('');
    const [link, setLink] = useState('');
    const [arquivos, setArquivos] = useState<string[]>([]);
    const [subtitulo, setSubtitulo] = useState('');
    const [imagem, setImagem] = useState('');


    const handleSelecionarCapa = async () => {
        const resultado = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [16, 9],
            quality: 1,
        });

        if (!resultado.canceled) {
            setImagem(resultado.assets[0].uri);
        }
    };

    const removerImagem = () => setImagem('');

    const handleAnexarPDF = async () => {
        try {
            const resultado = await DocumentPicker.getDocumentAsync({
                type: 'application/pdf',
                copyToCacheDirectory: true,
            });

            if (!resultado.canceled && resultado.assets && resultado.assets.length > 0) {

                const novoPdf = resultado.assets.map(asset => {

                    if (Platform.OS === 'web') {
                        if (asset.file) {
                            return URL.createObjectURL(asset.file);
                        }
                        return asset.uri;
                    } else {
                        return asset.uri;

                    }

                });
                setArquivos([...arquivos, ...novoPdf]);
            }

        } catch (error) {
            console.error("Erro ao escolher PDF:", error);
        }

    };
    
    const removerArquivo = (index: number) => {
        setArquivos(arquivos.filter((_, i) => i !== index));
    };

    const handlePublicar = async () => {
        if (!titulo.trim() || !descricao.trim()) {
            Alert.alert("Erro", "Preencha título e descrição.");
            return;
        }

        try {
            const formData = new FormData();

            formData.append('titulo', titulo);
            formData.append('subtitulo', subtitulo);
            formData.append('descricao', descricao);
            formData.append('urlPublicacao', link);

            if (imagem) {
                const nome = imagem.split('/').pop() || 'capa.jpg';

                if (Platform.OS === 'web') {
                    const response = await fetch(imagem);
                    const blob = await response.blob();
                    formData.append('imagem', blob, nome);
                } else {
                    // @ts-ignore
                    formData.append('imagem', { uri: imagem, name: nome, type: 'image/jpeg' });
                }
            }

            let index = 0;
            for (const pdfUri of arquivos) {
                const nomePdf = `arquivo_${index}.pdf`;

                if (Platform.OS === 'web') {
                    const response = await fetch(pdfUri);
                    const blob = await response.blob();
                    formData.append('pdfs', blob, nomePdf);
                } else {
                    // @ts-ignore
                    formData.append('pdfs', { uri: pdfUri, name: nomePdf, type: 'application/pdf' });
                }
                index++;
            }

            const resposta = await fetch(`${API_URL}/publicacoes`, {
                method: 'POST',
                body: formData,
            });

            if (resposta.ok) { 
                Alert.alert("Sucesso", "Publicação enviada com os arquivos!");
                router.back();
            } else {
                const erroJson = await resposta.json();
                console.error("Erro do servidor:", erroJson);
                Alert.alert("Erro", "O servidor recusou a postagem.");
            }

        } catch (error) {
            console.error("Erro no envio:", error);
            Alert.alert("Erro", "Falha catastrófica ao tentar salvar.");
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
        >
            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

                <View style={[globalStyles.header, styles.header]}>
                    <BotaoVoltar variante='header' cor={COLORS.white} />
                    <Text style={globalStyles.headerTitle}>Nova Publicação</Text>
                </View>

                <View style={styles.form}>
                    <Text style={styles.sectionTitle}>Informações Gerais</Text>

                    <View style={globalStyles.inputGroup}>
                        <Text style={globalStyles.label}>Título da publicação</Text>
                        <TextInput
                            style={globalStyles.input}
                            placeholder="Ex: Processo Seletivo 2026"
                            value={titulo}
                            onChangeText={setTitulo}
                        />
                    </View>

                    <View style={globalStyles.inputGroup}>
                        <Text style={globalStyles.label}>Subtítulo da publicação (Opcional)</Text>
                        <TextInput
                            style={globalStyles.input}
                            placeholder="Ex: Edital 01/2026"
                            value={subtitulo}
                            onChangeText={setSubtitulo}
                        />
                    </View>

                    <View style={globalStyles.inputGroup}>
                        <Text style={globalStyles.label}>Descrição</Text>
                        <TextInput
                            style={[globalStyles.input, styles.textArea]}
                            placeholder="Escreva os detalhes aqui..."
                            multiline
                            value={descricao}
                            onChangeText={setDescricao}
                        />
                    </View>

                    <View style={globalStyles.inputGroup}>
                        <Text style={globalStyles.label}>URL da publicação (Opcional)</Text>
                        <TextInput
                            style={globalStyles.input}
                            placeholder="https://ifnmg.edu.br/..."
                            value={link}
                            onChangeText={setLink}
                            autoCapitalize="none"
                        />
                    </View>

                    <Text style={styles.sectionTitle}>Arquivos e Mídia</Text>

                    <View style={styles.row}>
                        <TouchableOpacity
                            style={[styles.btnAnexoSecundario, imagem ? { borderColor: COLORS.secondary } : null]}
                            onPress={imagem ? removerImagem : handleSelecionarCapa}>
                            <Ionicons
                                name={imagem ? "close-circle-outline" : "image-outline"}
                                size={20}
                                color={imagem ? COLORS.secondary : COLORS.gray}
                            />
                            <Text style={[styles.txtAnexoSecundario, imagem ? { color: COLORS.secondary } : null]}>
                                {imagem ? "Remover Imagem" : "Adicionar Imagem"}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.btnAnexoPrincipal} onPress={handleAnexarPDF}>
                            <Ionicons name="add-circle-outline" size={20} color={COLORS.white} />
                            <Text style={styles.txtAnexoPrincipal}>Add PDF (Anexos)</Text>
                        </TouchableOpacity>
                    </View>

                    {arquivos.map((item, index) => (
                        <View key={index} style={styles.cardArquivo}>
                            <Ionicons name="document-text" size={20} color={COLORS.secondary} />
                            <Text style={styles.nomeArquivo} numberOfLines={1}>{item}</Text>
                            <TouchableOpacity onPress={() => removerArquivo(index)}>
                                <Ionicons name="trash-outline" size={18} color={COLORS.placeholder} />
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>

                <View style={styles.dividerContainer}>
                    <View style={styles.divider} />
                    <Text style={styles.previewLabel}>PRÉ-VISUALIZAÇÃO NO APP</Text>
                </View>

                <View style={styles.previewContainer}>
                    <Card
                        imagem={imagem}
                        titulo={titulo || "Insira um título"}
                        subtitulo={subtitulo || ""}
                        descricao={descricao || "A descrição resumida será exibida neste local após o preenchimento."}
                        pdfs={arquivos}
                        linkExterno={link} _id={''} />
                </View>

                <View style={{ paddingHorizontal: 10, paddingBottom: 10, marginTop: 15 }}>
                    <TouchableOpacity style={globalStyles.btnPrimary} onPress={handlePublicar}>
                        <Text style={globalStyles.btnPrimaryText}>Publicar Agora</Text>
                    </TouchableOpacity>
                    <Text style={styles.previewLabel}>©2026 - Portal IFNMG </Text>
                </View>

            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: COLORS.white
    },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    form: {
        padding: 20
    },

    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.primary,
        textTransform: 'uppercase',
        marginBottom: 15,
        marginTop: 10,
    },

    textArea: {
        height: 100,
        textAlignVertical: 'top'
    },

    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15
    },

    btnAnexoSecundario: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 15,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.lightGray,
        marginRight: 10
    },

    btnAnexoPrincipal: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 8,
        backgroundColor: COLORS.primary
    },

    txtAnexoSecundario: {
        marginLeft: 8,
        color: COLORS.gray,
        fontWeight: '500'
    },

    txtAnexoPrincipal: {
        marginLeft: 8,
        color: COLORS.white,
        fontWeight: 'bold'
    },

    cardArquivo: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        padding: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.lightGray,
        marginBottom: 8
    },

    nomeArquivo: {
        flex: 1,
        marginLeft: 10,
        fontSize: 14,
        color: '#444'
    },

    dividerContainer: {
        alignItems: 'center',
        marginTop: 10,
    },

    divider: {
        height: 1,
        backgroundColor: COLORS.lightGray,
        width: '90%'
    },

    previewLabel: {
        textAlign: 'center',
        fontSize: 11,
        color: COLORS.placeholder,
        fontWeight: 'bold',
        marginVertical: 15,
        letterSpacing: 2
    },

    previewContainer: {
        backgroundColor: COLORS.background,
        padding: 15,
    },

});