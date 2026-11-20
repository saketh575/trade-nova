import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../lib/theme';

export default function NotFoundScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>TRADE NOVA</Text>
      <Text style={styles.title}>This screen is unavailable.</Text>
      <Link href="/" style={styles.link}>Return to Home</Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24, backgroundColor: colors.background },
  eyebrow: { color: colors.accent, fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  title: { color: colors.text, fontSize: 18, fontWeight: '800', textAlign: 'center' },
  link: { color: colors.accent, fontSize: 13, fontWeight: '700', padding: 10 },
});
