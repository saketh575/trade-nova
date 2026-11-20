import { Link } from 'expo-router';
import { ArrowDownRight, ArrowUpRight, Bell, ChevronRight, RefreshCw, Search, Sparkles, X } from 'lucide-react-native';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type PressableProps, type ScrollViewProps, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import type { Candle, Timeframe } from '../../../src/lib/market-data';
import { demoMarketDataProvider, formatINR } from '../../../src/lib/market-data';
import { fetchMarketSnapshot, type MarketModeLabel } from '../lib/market-data';
import { colors, radii } from '../lib/theme';

export function Screen({ children, contentStyle, ...props }: ScrollViewProps & { contentStyle?: StyleProp<ViewStyle> }) {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        {...props}
        style={styles.scroll}
        contentContainerStyle={[styles.screenContent, contentStyle, props.contentContainerStyle]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function AppHeader({ subtitle = 'MARKET WORKSPACE' }: { subtitle?: string }) {
  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.brand}>TRADE <Text style={styles.brandAccent}>NOVA</Text></Text>
        <Text style={styles.eyebrow}>{subtitle}</Text>
      </View>
      <Link href="/profile" asChild>
        <Pressable accessibilityRole="button" accessibilityLabel="Open profile and notifications" style={styles.headerButton}>
          <Bell size={18} color={colors.text} />
        </Pressable>
      </Link>
    </View>
  );
}

export function SectionHeading({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: { label: string; href: '/markets' | '/watchlist' | '/portfolio' | '/paper-trading' | '/learning' };
}) {
  return (
    <View style={styles.sectionHeading}>
      <View style={styles.flex}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
      </View>
      {action ? (
        <Link href={action.href} asChild>
          <Pressable style={styles.inlineAction}>
            <Text style={styles.inlineActionText}>{action.label}</Text>
            <ChevronRight size={14} color={colors.accent} />
          </Pressable>
        </Link>
      ) : null}
    </View>
  );
}

export function Card({ children, style, ...props }: ViewProps) {
  return <View style={[styles.card, style]} {...props}>{children}</View>;
}

export function Eyebrow({ children, style }: { children: ReactNode; style?: object }) {
  return <Text style={[styles.eyebrow, style]}>{children}</Text>;
}

export function DataBadge({ mode, stale = false }: { mode: MarketModeLabel; stale?: boolean }) {
  const label = stale ? 'STALE' : mode;
  const tint = stale ? colors.amber : mode === 'LIVE' ? colors.positive : mode === 'DELAYED' ? colors.amber : colors.cyan;
  return (
    <View style={[styles.dataBadge, { borderColor: `${tint}55`, backgroundColor: `${tint}16` }]}>
      <View style={[styles.badgeDot, { backgroundColor: tint }]} />
      <Text style={[styles.dataBadgeText, { color: tint }]}>{label}</Text>
    </View>
  );
}

export function DemoNotice({ mode = 'DEMO', updatedAt }: { mode?: MarketModeLabel; updatedAt?: string | null }) {
  const message = mode === 'DEMO'
    ? 'Illustrative sample data · not live or historical market prices'
    : mode === 'DELAYED'
      ? 'Licensed delayed data · quotes may not reflect current prices'
      : 'Connected market feed · verify exchange and provider terms';
  return (
    <View style={styles.notice}>
      <View style={styles.noticeTop}>
        <Sparkles size={14} color={colors.accent} />
        <Text style={styles.noticeLabel}>DATA STATUS</Text>
        <DataBadge mode={mode} />
      </View>
      <Text style={styles.noticeCopy}>{message}</Text>
      {updatedAt ? <Text style={styles.noticeTimestamp}>Provider update · {new Date(updatedAt).toLocaleString()}</Text> : null}
    </View>
  );
}

export function IndexCard({
  name,
  value,
  changePct,
  onPress,
}: {
  name: string;
  value: string;
  changePct: number;
  onPress?: () => void;
}) {
  const positive = changePct >= 0;
  const Icon = positive ? ArrowUpRight : ArrowDownRight;
  return (
    <Pressable onPress={onPress} style={styles.indexCard}>
      <View style={styles.indexCardHeader}>
        <Text style={styles.indexName}>{name}</Text>
        <View style={[styles.indexIcon, { backgroundColor: positive ? '#57D99A17' : '#E0787817' }]}>
          <Icon size={15} color={positive ? colors.positive : colors.negative} />
        </View>
      </View>
      <Text style={styles.indexValue}>{value}</Text>
      <Text style={[styles.indexChange, { color: positive ? colors.positive : colors.negative }]}>
        {positive ? '+' : ''}{changePct.toFixed(2)}% <Text style={styles.indexPeriod}>today</Text>
      </Text>
    </Pressable>
  );
}

export function MetricCard({ label, value, detail, positive }: { label: string; value: string; detail: string; positive?: boolean }) {
  return (
    <Card style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text numberOfLines={1} adjustsFontSizeToFit style={styles.metricValue}>{value}</Text>
      <Text style={[styles.metricDetail, positive === undefined ? null : { color: positive ? colors.positive : colors.negative }]}>{detail}</Text>
    </Card>
  );
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  icon,
  style,
}: {
  title: string;
  onPress: PressableProps['onPress'];
  variant?: 'primary' | 'secondary' | 'danger' | 'quiet';
  disabled?: boolean;
  icon?: ReactNode;
  style?: object;
}) {
  const containerStyle = variant === 'primary' ? styles.primaryButton
    : variant === 'danger' ? styles.dangerButton
      : variant === 'quiet' ? styles.quietButton
        : styles.secondaryButton;
  const textStyle = variant === 'primary' ? styles.primaryButtonText
    : variant === 'danger' ? styles.dangerButtonText
      : variant === 'quiet' ? styles.quietButtonText
        : styles.secondaryButtonText;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [containerStyle, style, disabled && styles.disabled, pressed && !disabled && styles.pressed]}>
      {icon}
      <Text style={textStyle}>{title}</Text>
    </Pressable>
  );
}

export function AppDialog({
  visible,
  title,
  message,
  confirmLabel = 'Okay',
  cancelLabel,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel?: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onCancel}>
      <View style={styles.dialogOverlay}>
        {onCancel ? <Pressable accessibilityLabel="Dismiss dialog" style={StyleSheet.absoluteFill} onPress={onCancel} /> : null}
        <View accessibilityRole="alert" style={styles.dialogCard}>
          <Text style={styles.dialogTitle}>{title}</Text>
          <Text style={styles.dialogMessage}>{message}</Text>
          <View style={styles.dialogActions}>
            {cancelLabel && onCancel ? <Button title={cancelLabel} variant="secondary" onPress={onCancel} style={styles.dialogButton} /> : null}
            <Button title={confirmLabel} onPress={onConfirm} style={styles.dialogButton} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function SearchField({ value, onChangeText, placeholder = 'Search stocks or symbols' }: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <View style={styles.searchField}>
      <Search size={17} color={colors.muted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.dim}
        autoCapitalize="characters"
        autoCorrect={false}
        accessibilityLabel={placeholder}
        style={styles.searchInput}
      />
      {value ? <Pressable accessibilityLabel="Clear search" onPress={() => onChangeText('')}><X size={16} color={colors.muted} /></Pressable> : null}
    </View>
  );
}

export function InstrumentRow({
  symbol,
  company,
  price,
  changePct,
  onPress,
  trailing,
}: {
  symbol: string;
  company: string;
  price: string;
  changePct: number;
  onPress?: () => void;
  trailing?: ReactNode;
}) {
  const positive = changePct >= 0;
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.instrumentRow}>
      <View style={[styles.symbolAvatar, { borderColor: positive ? '#57D99A44' : '#E0787844' }]}>
        <Text style={[styles.symbolAvatarText, { color: positive ? colors.positive : colors.negative }]}>{symbol.slice(0, 1)}</Text>
      </View>
      <View style={styles.instrumentMain}>
        <Text style={styles.instrumentSymbol}>{symbol}</Text>
        <Text numberOfLines={1} style={styles.instrumentCompany}>{company}</Text>
      </View>
      <View style={styles.instrumentNumbers}>
        <Text style={styles.instrumentPrice}>{price}</Text>
        <Text style={[styles.instrumentChange, { color: positive ? colors.positive : colors.negative }]}>
          {positive ? '+' : ''}{changePct.toFixed(2)}%
        </Text>
      </View>
      {trailing}
    </Pressable>
  );
}

export function LoadingState({ label = 'Loading market workspace' }: { label?: string }) {
  return (
    <View style={styles.loadingState}>
      <ActivityIndicator color={colors.accent} />
      <Text style={styles.loadingLabel}>{label}</Text>
    </View>
  );
}

export function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <Card style={styles.emptyState}>
      <Sparkles color={colors.accent} size={22} />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyMessage}>{message}</Text>
    </Card>
  );
}

export function MiniSparkline({ values, positive = true }: { values: number[]; positive?: boolean }) {
  const path = useMemo(() => makeLinePath(values, 80, 28), [values]);
  return (
    <Svg width={64} height={24} viewBox="0 0 80 28">
      <Path d={path} fill="none" stroke={positive ? colors.positive : colors.negative} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function MarketChart({ symbol, mode, candles: initialCandles }: { symbol: string; mode: MarketModeLabel; candles: Candle[] }) {
  const [timeframe, setTimeframe] = useState<Timeframe>('1D');
  const [candles, setCandles] = useState(initialCandles);
  const [chartError, setChartError] = useState<string | null>(null);

  useEffect(() => {
    if (mode === 'DEMO') return;
    let active = true;
    void fetchMarketSnapshot(symbol, timeframe).then((snapshot) => {
      if (active) {
        setCandles(snapshot.candles);
        setChartError(null);
      }
    }).catch((error: unknown) => {
      if (active) setChartError(error instanceof Error ? error.message : 'Chart data is unavailable.');
    });
    return () => { active = false; };
  }, [mode, symbol, timeframe]);

  const loadTimeframe = async (next: Timeframe) => {
    setTimeframe(next);
    setChartError(null);
    if (mode === 'DEMO') return;
    try {
      const snapshot = await fetchMarketSnapshot(symbol, next);
      setCandles(snapshot.candles);
    } catch (error) {
      setChartError(error instanceof Error ? error.message : 'Chart data is unavailable.');
    }
  };

  const activeCandles = mode === 'DEMO' ? demoMarketDataProvider.getCandles(symbol, timeframe) : candles;
  const points = useMemo(() => activeCandles.map((candle) => candle.close), [activeCandles]);
  const line = useMemo(() => makeLinePath(points, 320, 132, 8), [points]);
  const area = `${line} L 312 132 L 8 132 Z`;
  const latest = points[points.length - 1] ?? 0;

  return (
    <Card style={styles.chartCard}>
      <View style={styles.chartHeader}>
        <View>
          <Eyebrow>{symbol} · {mode}</Eyebrow>
          <Text style={styles.chartPrice}>{latest ? formatINR(Math.round(latest * 100)) : '—'}</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Refresh market data" onPress={() => void loadTimeframe(timeframe)} style={styles.refreshButton}>
          <RefreshCw size={15} color={colors.muted} />
        </Pressable>
      </View>
      <View style={styles.timeframeRow}>
        {(['1D', '1W', '1M', '3M', '1Y'] as const).map((value) => (
          <Pressable key={value} onPress={() => void loadTimeframe(value)} style={[styles.timeframeButton, timeframe === value && styles.timeframeButtonSelected]}>
            <Text style={[styles.timeframeText, timeframe === value && styles.timeframeTextSelected]}>{value}</Text>
          </Pressable>
        ))}
      </View>
      {chartError ? <Text style={styles.chartError}>{chartError}</Text> : (
        <Svg width="100%" height={150} viewBox="0 0 320 140" preserveAspectRatio="none">
          <Defs>
            <LinearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={colors.accent} stopOpacity="0.28" />
              <Stop offset="1" stopColor={colors.accent} stopOpacity="0" />
            </LinearGradient>
          </Defs>
          <Path d="M8 28 H312 M8 70 H312 M8 112 H312" stroke={colors.border} strokeWidth="1" />
          <Path d={area} fill="url(#chartFill)" />
          <Path d={line} fill="none" stroke={colors.accent} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      )}
      <View style={styles.chartAxis}>
        <Text style={styles.chartAxisText}>{timeframe === '1D' ? '09:15' : `- ${timeframe}`}</Text>
        <Text style={styles.chartAxisText}>Illustrative series · not historical</Text>
        <Text style={styles.chartAxisText}>15:30</Text>
      </View>
    </Card>
  );
}

export function LabeledInput({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  secureTextEntry = false,
  autoCapitalize = 'none',
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'number-pad' | 'decimal-pad' | 'email-address';
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.dim}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        style={styles.textInput}
      />
    </View>
  );
}

export function TogglePill({ labels, selected, onSelect }: {
  labels: string[];
  selected: string;
  onSelect: (value: string) => void;
}) {
  return (
    <View style={styles.togglePill}>
      {labels.map((label) => (
        <Pressable key={label} onPress={() => onSelect(label)} style={[styles.toggleOption, selected === label && styles.toggleOptionSelected]}>
          <Text style={[styles.toggleText, selected === label && styles.toggleTextSelected]}>{label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export function LinkRow({ title, subtitle, href, icon }: {
  title: string;
  subtitle: string;
  href: '/paper-trading' | '/neon-intelligence' | '/market-replay' | '/risk-simulator' | '/learning';
  icon: ReactNode;
}) {
  return (
    <Link href={href} asChild>
      <Pressable style={styles.linkRow}>
        <View style={styles.linkIcon}>{icon}</View>
        <View style={styles.flex}>
          <Text style={styles.linkTitle}>{title}</Text>
          <Text style={styles.linkSubtitle}>{subtitle}</Text>
        </View>
        <ChevronRight size={17} color={colors.muted} />
      </Pressable>
    </Link>
  );
}

export function formatPercent(value: number) {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
}

function makeLinePath(values: number[], width: number, height: number, inset = 4) {
  if (!values.length) return '';
  if (values.length === 1) return `M${inset} ${height / 2} L${width - inset} ${height / 2}`;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const usableWidth = width - inset * 2;
  const usableHeight = height - inset * 2;
  return values.map((value, index) => {
    const x = inset + (index / (values.length - 1)) * usableWidth;
    const y = height - inset - ((value - min) / range) * usableHeight;
    return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(' ');
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  screenContent: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 28, gap: 20 },
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  brand: { color: colors.text, fontSize: 18, fontWeight: '900', letterSpacing: 0.6 },
  brandAccent: { color: colors.accent },
  eyebrow: { color: colors.muted, fontSize: 10, fontWeight: '800', letterSpacing: 1.25, marginBottom: 7 },
  headerButton: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: -8 },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  sectionSubtitle: { color: colors.muted, fontSize: 12, marginTop: 4, lineHeight: 17 },
  inlineAction: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  inlineActionText: { color: colors.accent, fontSize: 12, fontWeight: '700' },
  card: { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: radii.card, padding: 16 },
  notice: { backgroundColor: '#111A13', borderColor: '#314127', borderWidth: 1, borderRadius: radii.control, padding: 13, gap: 7 },
  noticeTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  noticeLabel: { color: colors.muted, fontSize: 10, fontWeight: '800', letterSpacing: 1, flex: 1 },
  noticeCopy: { color: '#ABB7A8', fontSize: 11, lineHeight: 16 },
  noticeTimestamp: { color: colors.dim, fontSize: 9, lineHeight: 13 },
  dataBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: radii.pill, paddingVertical: 5, paddingHorizontal: 8 },
  badgeDot: { width: 5, height: 5, borderRadius: 3 },
  dataBadgeText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  indexCard: { flex: 1, minWidth: '47%', backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: radii.control, padding: 13, gap: 7 },
  indexCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  indexName: { color: colors.muted, fontSize: 11, fontWeight: '700' },
  indexIcon: { width: 25, height: 25, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  indexValue: { color: colors.text, fontSize: 18, fontWeight: '800', letterSpacing: -0.4 },
  indexChange: { fontSize: 11, fontWeight: '800' },
  indexPeriod: { color: colors.muted, fontWeight: '500' },
  metricCard: { flex: 1, minWidth: '47%', padding: 14, gap: 9 },
  metricLabel: { color: colors.muted, fontSize: 11, fontWeight: '600' },
  metricValue: { color: colors.text, fontSize: 20, fontWeight: '800', letterSpacing: -0.6 },
  metricDetail: { color: colors.muted, fontSize: 11 },
  primaryButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 48, borderRadius: radii.control, paddingHorizontal: 16, backgroundColor: colors.accent },
  primaryButtonText: { color: '#10150C', fontWeight: '900', fontSize: 13 },
  secondaryButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 46, borderRadius: radii.control, paddingHorizontal: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.cardRaised },
  secondaryButtonText: { color: colors.text, fontWeight: '800', fontSize: 12 },
  dangerButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 46, borderRadius: radii.control, paddingHorizontal: 14, backgroundColor: '#4D2426' },
  dangerButtonText: { color: '#FFD4D4', fontWeight: '800', fontSize: 12 },
  quietButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 40, borderRadius: radii.control, paddingHorizontal: 12, borderWidth: 1, borderColor: colors.border },
  quietButtonText: { color: colors.muted, fontWeight: '700', fontSize: 11 },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.75, transform: [{ scale: 0.985 }] },
  dialogOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 22, backgroundColor: '#000000A8' },
  dialogCard: { width: '100%', maxWidth: 380, gap: 12, padding: 19, borderRadius: 19, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.cardRaised },
  dialogTitle: { color: colors.text, fontSize: 17, fontWeight: '900' },
  dialogMessage: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  dialogActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 9, marginTop: 4 },
  dialogButton: { flex: 1 },
  searchField: { minHeight: 48, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: radii.control, backgroundColor: colors.card, paddingHorizontal: 13, gap: 10 },
  searchInput: { flex: 1, color: colors.text, fontSize: 14, paddingVertical: 10 },
  instrumentRow: { minHeight: 66, flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  symbolAvatar: { width: 37, height: 37, borderRadius: 13, borderWidth: 1, backgroundColor: colors.cardRaised, alignItems: 'center', justifyContent: 'center' },
  symbolAvatarText: { fontSize: 15, fontWeight: '900' },
  instrumentMain: { flex: 1, gap: 4 },
  instrumentSymbol: { color: colors.text, fontSize: 13, fontWeight: '800' },
  instrumentCompany: { color: colors.muted, fontSize: 10, maxWidth: 150 },
  instrumentNumbers: { alignItems: 'flex-end', gap: 4 },
  instrumentPrice: { color: colors.text, fontSize: 12, fontWeight: '700' },
  instrumentChange: { fontSize: 10, fontWeight: '800' },
  loadingState: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 25 },
  loadingLabel: { color: colors.muted, fontSize: 12 },
  emptyState: { alignItems: 'center', gap: 8, paddingVertical: 24 },
  emptyTitle: { color: colors.text, fontSize: 14, fontWeight: '800', textAlign: 'center' },
  emptyMessage: { color: colors.muted, fontSize: 12, lineHeight: 18, textAlign: 'center' },
  chartCard: { gap: 12, padding: 15 },
  chartHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chartPrice: { color: colors.text, fontSize: 23, fontWeight: '900', letterSpacing: -0.6 },
  refreshButton: { height: 36, width: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: colors.cardRaised },
  timeframeRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: colors.background, borderRadius: 10, padding: 4 },
  timeframeButton: { minWidth: 49, alignItems: 'center', paddingVertical: 7, borderRadius: 8 },
  timeframeButtonSelected: { backgroundColor: colors.cardRaised },
  timeframeText: { color: colors.muted, fontSize: 10, fontWeight: '700' },
  timeframeTextSelected: { color: colors.accent },
  chartAxis: { flexDirection: 'row', justifyContent: 'space-between' },
  chartAxisText: { color: colors.dim, fontSize: 9 },
  chartError: { color: colors.amber, fontSize: 12, lineHeight: 18, paddingVertical: 18 },
  inputGroup: { gap: 7 },
  inputLabel: { color: colors.muted, fontSize: 11, fontWeight: '700' },
  textInput: { minHeight: 47, color: colors.text, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: radii.control, paddingHorizontal: 13, fontSize: 14 },
  togglePill: { flexDirection: 'row', gap: 5, backgroundColor: colors.background, borderRadius: radii.control, padding: 4 },
  toggleOption: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 36, borderRadius: 9 },
  toggleOptionSelected: { backgroundColor: colors.cardRaised },
  toggleText: { color: colors.muted, fontSize: 11, fontWeight: '700' },
  toggleTextSelected: { color: colors.accent },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: colors.border },
  linkIcon: { height: 38, width: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: '#B6F23A15' },
  linkTitle: { color: colors.text, fontSize: 13, fontWeight: '800' },
  linkSubtitle: { color: colors.muted, fontSize: 10, marginTop: 4 },
});
