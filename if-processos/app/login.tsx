import { View, ImageBackground, Image, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function Login() {
  return (
    <ImageBackground style={styles.imageBackground}
      source={require('../assets/images/background.png')}
      resizeMode="cover"
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.container}>

          <View style={styles.form}>

            <View style={styles.header}>
              <Image style={styles.imagem} source={require('../assets/images/ifnmg_logo.png')} />
              <Text style={styles.title}> Portal IFNMG</Text>
            </View>

            <View style={styles.campo}>
              <Text style={styles.label}>Email: </Text>
              <TextInput style={styles.input} placeholder='Usuário' placeholderTextColor="#666"></TextInput>
            </View>
            <View style={styles.campo}>
              <Text style={styles.label}>Senha: </Text>
              <View style={styles.inputContainer}>
                <TextInput style={styles.inputComIcone} placeholder='Senha' placeholderTextColor="#666" secureTextEntry></TextInput>
                <Ionicons name="eye-off-outline" size={20} color="#666"
                />
              </View>
            </View>

            <TouchableOpacity style={styles.botao} onPress={() => { }}>
              <Text style={styles.botaoText}>Entrar</Text>
            </TouchableOpacity>
          </View>

        </View>
      </KeyboardAvoidingView >
    </ImageBackground >

  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  imageBackground: {
    flex: 1,
  },

  header: {
    alignItems: "center",
    marginBottom: 30,
  },

  imagem: {
    width: 230,
    height: 80,
    resizeMode: "contain",
  },

  title: {
    fontSize: 24,
    marginTop: 10,
    fontWeight: "500",
  },

  form: {
    width: "90%",
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    padding: 25,
    backgroundColor: "rgb(221, 221, 221)",
  },

  campo: {
    marginBottom: 15,
    width: "100%",
  },

  label: {
    fontWeight: "600",
    fontSize: 16,
    marginBottom: 5,
  },

  input: {
    borderWidth: 1,
    borderColor: "#8b8b8b",
    borderRadius: 10,
    padding: 10,
    backgroundColor: "#fff",
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#8b8b8b",
    borderRadius: 10,
    paddingHorizontal: 10,
    backgroundColor: "#fff",
  },

  inputComIcone: {
    flex: 1,
    padding: 10,
  },

  botao: {
    width: "100%",
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "#007bff",
    marginTop: 15,
  },

  botaoText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

});