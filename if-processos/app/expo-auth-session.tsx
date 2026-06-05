import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { COLORS } from '@/src/styles/theme';

export default function ExpoAuthSessionCallback() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
});
