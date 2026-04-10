import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Card from '@/src/components/Card';
import BotaoVoltar from '@/src/components/BotaoVoltar';

// Importação dos padrões do projeto
import { COLORS } from '@/src/styles/theme';
import { globalStyles } from '@/src/styles/globalStyles';

export default function CriarPublicacao() {

    const router = useRouter();

    // Estados do Formulário
    const [titulo, setTitulo] = useState('');
    const [descricao, setDescricao] = useState('');
    const [link, setLink] = useState('');
    const [arquivos, setArquivos] = useState<string[]>([]);
    const [subtitulo, setSubtitulo] = useState('');
    const [imagem, setImagem] = useState('');

    const handleSelecionarCapa = () => {
        setImagem('https://picsum.photos/400/200');
    };

    const removerImagem = () => setImagem('');

    const handleAnexarPDF = () => {
        const nomeFake = `edital_extraido_${arquivos.length + 1}.pdf`;
        setArquivos([...arquivos, nomeFake]);
    };

    const removerArquivo = (index: number) => {
        setArquivos(arquivos.filter((_, i) => i !== index));
    };

    const handlePublicar = () => {
        if (!titulo.trim() || !descricao.trim()) {
            Alert.alert("Campos obrigatórios", "Por favor, preencha o título e a descrição.");
            return;
        }
        Alert.alert("Sucesso", "Dados capturados pelo front!");
        router.back();
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
        >
            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

                {/* Header padrão utilizando globalStyles */}
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
                        linkExterno={link}
                    />
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