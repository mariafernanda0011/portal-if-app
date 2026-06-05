let tokenSessao = '';
const CHAVE_TOKEN = 'portal_if_token';

const obterStorage = () => {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
};

export const salvarToken = (token: string) => {
  tokenSessao = token;
  obterStorage()?.setItem(CHAVE_TOKEN, token);
};

export const obterToken = () => tokenSessao || obterStorage()?.getItem(CHAVE_TOKEN) || '';

export const limparToken = () => {
  tokenSessao = '';
  obterStorage()?.removeItem(CHAVE_TOKEN);
};

export const criarCabecalhoAuth = (): Record<string, string> => {
  const token = obterToken();

  return token ? { Authorization: `Bearer ${token}` } : {};
};
