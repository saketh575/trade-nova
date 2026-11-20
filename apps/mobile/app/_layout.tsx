import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { MobileAppProvider } from '../lib/mobile-app-context';
import { colors } from '../lib/theme';

export {
  ErrorBoundary,
} from 'expo-router';

export default function RootLayout() {
  return (
    <MobileAppProvider>
      <ThemeProvider value={DarkTheme}>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
            animation: 'slide_from_right',
          }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="paper-trading" />
          <Stack.Screen name="neon-intelligence" />
          <Stack.Screen name="market-replay" />
          <Stack.Screen name="risk-simulator" />
          <Stack.Screen name="learning" />
          <Stack.Screen name="stock/[symbol]" />
        </Stack>
      </ThemeProvider>
    </MobileAppProvider>
  );
}
