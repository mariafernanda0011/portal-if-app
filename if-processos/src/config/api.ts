import { Platform } from "react-native";

export const API_URL =
  Platform.OS === "web"
    ? "http://localhost:3000"
    : "https://weak-cars-remain.loca.lt"; // ATENÇÃO: Substitua pelo IP da sua máquina se usar o celular para testar,
 //  ou use um serviço de tunelamento como ngrok ou localtunnel para expor o servidor local para a internet.
 // Exemplo usando localtunnel: rode no terminal do backend npx localtunnel --port 3000 
 // e use a URL fornecida (ex: https://solid-paths-remain.loca.lt)  como API_URL.
 