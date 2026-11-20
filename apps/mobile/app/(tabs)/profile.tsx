import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { BellRing, BookOpen, Bot, CirclePlay, LogIn, LogOut, ShieldCheck, UserRound } from 'lucide-react-native';
import { useState } from 'react';
import { Button, Card, LabeledInput, LinkRow, Screen, SectionHeading } from '../../components/ui';
import { useMobileApp } from '../../lib/mobile-app-context';
import { enableNotifications, sendLocalNotification } from '../../lib/notifications';
import { colors } from '../../lib/theme';

export default function ProfileScreen() {
  const {
    appState, authConfigured, authError, cloudMessage, cloudStatus, session,
    setDisplayName, setNotifications, signIn, signOut, signUp,
  } = useMobileApp();
  const [name, setName] = useState(appState.settings.displayName);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMode, setAuthMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [busy, setBusy] = useState(false);

  const handleAuth = async () => {
    if (!email.trim() || password.length < 6) {
      Alert.alert('Check your details', 'Enter a valid email address and a password with at least six characters.');
      return;
    }
    setBusy(true);
    try {
      const message = authMode === 'sign-in' ? await signIn(email, password) : await signUp(email, password);
      Alert.alert(authMode === 'sign-in' ? 'Account sign-in' : 'Account creation', message);
    } finally {
      setBusy(false);
    }
  };

  const handleNotifications = async () => {
    setBusy(true);
    try {
      const result = await enableNotifications();
      setNotifications(result.enabled, result.pushToken);
      Alert.alert(result.enabled ? 'Notifications ready' : 'Notifications unavailable', result.message);
    } catch (error) {
      Alert.alert('Could not enable notifications', error instanceof Error ? error.message : 'Notification setup failed.');
    } finally {
      setBusy(false);
    }
  };

  const cloudLabel = cloudStatus === 'synced' ? 'ACCOUNT SYNCED'
    : cloudStatus === 'syncing' ? 'SYNCING'
      : cloudStatus === 'error' ? 'SYNC ISSUE'
        : 'DEVICE ONLY';
  const cloudColor = cloudStatus === 'synced' ? colors.positive
    : cloudStatus === 'error' ? colors.amber
      : cloudStatus === 'syncing' ? colors.cyan
        : colors.muted;

  return (
    <Screen>
      <View>
        <Text style={styles.eyebrow}>ACCOUNT & PREFERENCES</Text>
        <Text style={styles.title}>Profile</Text>
      </View>
      <Card style={styles.profileCard}>
        <View style={styles.avatar}><UserRound size={23} color={colors.accent} /></View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{session?.user.email ?? appState.settings.displayName}</Text>
          <Text style={styles.profileStatus}>{session ? 'Signed in · Trade Nova account' : 'Guest · practice data on this device'}</Text>
        </View>
      </Card>

      <SectionHeading title="Account sync" subtitle="Supabase auth and row-level protected user state" />
      <Card style={styles.syncCard}>
        <View style={styles.syncTop}>
          <Text style={styles.syncTitle}>{session ? 'Your account' : 'Sign in or create an account'}</Text>
          <View style={[styles.statusPill, { borderColor: `${cloudColor}50` }]}>
            <View style={[styles.statusDot, { backgroundColor: cloudColor }]} />
            <Text style={[styles.statusText, { color: cloudColor }]}>{cloudLabel}</Text>
          </View>
        </View>
        {session ? (
          <>
            <Text style={styles.helperText}>Watchlists, virtual paper trades, learning progress and profile preferences sync to this Supabase account when configured.</Text>
            <Button title="Sign out" variant="secondary" icon={<LogOut size={15} color={colors.text} />} onPress={() => void signOut()} />
          </>
        ) : authConfigured ? (
          <>
            <Text style={styles.helperText}>Use the same Supabase project on mobile and web to share an account. Passwords and session tokens are never stored in the app state row.</Text>
            <LabeledInput label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" />
            <LabeledInput label="Password" value={password} onChangeText={setPassword} placeholder="At least 6 characters" secureTextEntry />
            {authError ? <Text style={styles.errorText}>{authError}</Text> : null}
            <Button title={authMode === 'sign-in' ? 'Sign in' : 'Create account'} onPress={() => void handleAuth()} disabled={busy} icon={<LogIn size={15} color="#10150C" />} />
            <Pressable onPress={() => setAuthMode((mode) => mode === 'sign-in' ? 'sign-up' : 'sign-in')} style={styles.switchAuth}>
              <Text style={styles.switchAuthText}>{authMode === 'sign-in' ? 'New to Trade Nova? Create an account' : 'Already registered? Sign in'}</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={styles.helperText}>Supabase is not configured. The app remains usable in local demo mode; no account or cross-device sync is claimed.</Text>
            <Text style={styles.syncMessage}>{cloudMessage}</Text>
          </>
        )}
        {session && cloudMessage ? <Text style={cloudStatus === 'error' ? styles.errorText : styles.syncMessage}>{cloudMessage}</Text> : null}
      </Card>

      <SectionHeading title="Profile preferences" subtitle="Saved locally or synced with your account" />
      <Card style={styles.settingsCard}>
        <LabeledInput label="Display name" value={name} onChangeText={setName} placeholder="Trader" autoCapitalize="words" />
        <Button title="Save display name" variant="secondary" onPress={() => { setDisplayName(name.trim() || 'Trader'); Alert.alert('Profile updated', 'Your display name has been saved.'); }} />
      </Card>

      <SectionHeading title="Notifications" subtitle="Push delivery requires an EAS project and delivery service" />
      <Card style={styles.notificationCard}>
        <View style={styles.notificationInfo}>
          <View style={styles.notificationIcon}><BellRing size={18} color={colors.accent} /></View>
          <View style={styles.profileInfo}>
            <Text style={styles.syncTitle}>{appState.settings.notificationsEnabled ? 'Notifications enabled' : 'Market alerts'}</Text>
            <Text style={styles.helperText}>Device permission and Expo push-token registration</Text>
          </View>
        </View>
        <Button title={appState.settings.notificationsEnabled ? 'Update notification registration' : 'Enable notifications'} onPress={() => void handleNotifications()} disabled={busy} />
        {appState.settings.expoPushToken ? <Text numberOfLines={2} style={styles.tokenText}>Push token registered · {appState.settings.expoPushToken.slice(0, 30)}…</Text> : null}
        {appState.settings.notificationsEnabled ? (
          <Button
            title="Send a local test notification"
            variant="quiet"
            onPress={() => void sendLocalNotification('TRADE NOVA', 'Local notifications are working on this device.').catch((error: unknown) => Alert.alert('Notification failed', error instanceof Error ? error.message : 'Could not schedule notification.'))}
          />
        ) : null}
      </Card>

      <SectionHeading title="More workspaces" subtitle="Explore dedicated mobile screens" />
      <Card style={styles.linksCard}>
        <LinkRow title="Paper Trading" subtitle="Order entry and virtual position management" href="/paper-trading" icon={<CirclePlay size={18} color={colors.accent} />} />
        <LinkRow title="NEON Intelligence" subtitle="Calculated technical context and journal" href="/neon-intelligence" icon={<Bot size={18} color={colors.accent} />} />
        <LinkRow title="Market Replay" subtitle="Replay illustrative practice candles" href="/market-replay" icon={<CirclePlay size={18} color={colors.accent} />} />
        <LinkRow title="Risk Simulator" subtitle="Position sizing and risk/reward" href="/risk-simulator" icon={<ShieldCheck size={18} color={colors.accent} />} />
        <LinkRow title="Learning Centre" subtitle="Market lessons and progress" href="/learning" icon={<BookOpen size={18} color={colors.accent} />} />
      </Card>
      <Text style={styles.footer}>TRADE NOVA · Think Smarter. Trade Wiser.{'\n'}Educational paper trading only. No live brokerage.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  eyebrow: { color: colors.accent, fontSize: 9, fontWeight: '900', letterSpacing: 1.5, marginBottom: 5 },
  title: { color: colors.text, fontSize: 26, fontWeight: '900', letterSpacing: -0.8 },
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  avatar: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: '#B6F23A1B' },
  profileInfo: { flex: 1, gap: 4 },
  profileName: { color: colors.text, fontSize: 13, fontWeight: '800' },
  profileStatus: { color: colors.muted, fontSize: 10 },
  syncCard: { gap: 13 },
  syncTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  syncTitle: { color: colors.text, fontSize: 13, fontWeight: '800' },
  statusPill: { flexDirection: 'row', gap: 5, alignItems: 'center', borderWidth: 1, borderRadius: 99, paddingHorizontal: 8, paddingVertical: 5 },
  statusDot: { width: 5, height: 5, borderRadius: 3 },
  statusText: { fontSize: 8, fontWeight: '900', letterSpacing: 0.4 },
  helperText: { color: colors.muted, fontSize: 11, lineHeight: 17 },
  syncMessage: { color: colors.cyan, fontSize: 10, lineHeight: 15 },
  errorText: { color: colors.negative, fontSize: 11, lineHeight: 17 },
  switchAuth: { alignItems: 'center', paddingVertical: 5 },
  switchAuthText: { color: colors.accent, fontSize: 11, fontWeight: '700' },
  settingsCard: { gap: 13 },
  notificationCard: { gap: 12 },
  notificationInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  notificationIcon: { width: 38, height: 38, borderRadius: 13, backgroundColor: '#B6F23A17', alignItems: 'center', justifyContent: 'center' },
  tokenText: { color: colors.dim, fontSize: 9, lineHeight: 14 },
  linksCard: { paddingVertical: 3, paddingHorizontal: 13 },
  footer: { color: colors.dim, fontSize: 10, lineHeight: 16, textAlign: 'center', paddingTop: 1 },
});
