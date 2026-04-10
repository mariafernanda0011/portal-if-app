import { StyleSheet } from 'react-native';
import { COLORS, SIZES } from './theme';

export const globalStyles = StyleSheet.create({
  
    container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Cabeçalho padrão arredondado
  header: {
    backgroundColor: COLORS.primaryLight,
    paddingTop: SIZES.headerPadding,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: SIZES.radius,
    borderBottomRightRadius: SIZES.radius,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: COLORS.white,
    marginLeft: 10,
  },

  // Formulários e Inputs
  inputGroup: {
    marginBottom: 18,
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textLight,
    marginBottom: 6,
  },
  
  input: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    color: COLORS.textDark,
  },
  
  // Botões principais 
  btnPrimary: {
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },

  btnPrimaryText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },

}); 