import Slider from '@react-native-community/slider';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { ArrowDown, ArrowUp, Pause, Play, RotateCcw, SkipForward } from 'lucide-react-native';
import Svg, { G, Line, Rect } from 'react-native-svg';
import { Button, Card, DemoNotice, Screen, SectionHeading, TogglePill } from '../components/ui';
import { colors } from '../lib/theme';
import { demoMarketDataProvider, type Timeframe } from '../../../src/lib/market-data';

interface ReplayTrade {
  side: 'BUY' | 'SELL';
  price: number;
  step: number;
}

export default function MarketReplayScreen() {
  const [symbol, setSymbol] = useState('NIFTY 50');
  const [timeframe, setTimeframe] = useState<Timeframe>('1D');
  const [cursor, setCursor] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [trades, setTrades] = useState<ReplayTrade[]>([]);
  const candles = useMemo(() => demoMarketDataProvider.getCandles(symbol, timeframe), [symbol, timeframe]);
  const visible = candles.slice(0, Math.min(cursor + 1, candles.length));
  const candle = candles[Math.min(cursor, candles.length - 1)];
  const entryTrade = trades.find((trade) => trade.side === 'BUY');
  const replayPnl = entryTrade && candle ? (candle.close - entryTrade.price) * 100 : 0;

  useEffect(() => {
    if (!playing) return;
    const timer = setTimeout(() => {
      if (cursor >= candles.length - 1) setPlaying(false);
      else setCursor(cursor + 1);
    }, 1000 / speed);
    return () => clearTimeout(timer);
  }, [playing, speed, cursor, candles.length]);

  const recordTrade = (side: 'BUY' | 'SELL') => {
    if (!candle) return;
    if (side === 'SELL' && !entryTrade) {
      Alert.alert('No replay position', 'Record a virtual buy first to review a practice exit.');
      return;
    }
    setTrades((items) => [...items, { side, price: candle.close, step: candle.step }]);
  };

  const selectSymbol = (value: string) => {
    setSymbol(value);
    setCursor(0);
    setPlaying(false);
    setTrades([]);
  };

  const selectTimeframe = (value: string) => {
    setTimeframe(value as Timeframe);
    setCursor(0);
    setPlaying(false);
    setTrades([]);
  };

  return (
    <Screen>
      <View>
        <Text style={styles.eyebrow}>PRACTICE PLAYBACK · SYNTHETIC SERIES</Text>
        <Text style={styles.title}>Market Replay</Text>
      </View>
      <DemoNotice mode="DEMO" />
      <Card style={styles.replayNotice}>
        <Text style={styles.noticeTitle}>Not historical market data</Text>
        <Text style={styles.noticeText}>No licensed historical feed is configured. These illustrative candles support interface practice only and do not represent actual past prices.</Text>
      </Card>
      <SectionHeading title="Select instrument" subtitle="Choose a sample instrument to replay" />
      <View style={styles.symbols}>
        {['NIFTY 50', 'RELIANCE', 'TCS', 'INFY', 'HDFCBANK'].map((value) => (
          <Pressable key={value} onPress={() => selectSymbol(value)} style={[styles.symbolChip, symbol === value && styles.symbolChipSelected]}>
            <Text style={[styles.symbolText, symbol === value && styles.symbolTextSelected]}>{value}</Text>
          </Pressable>
        ))}
      </View>
      <TogglePill labels={['1D', '1W', '1M', '3M']} selected={timeframe} onSelect={selectTimeframe} />
      <Card style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <View><Text style={styles.chartSymbol}>{symbol}</Text><Text style={styles.chartLabel}>Candle {Math.min(cursor + 1, candles.length)} of {candles.length}</Text></View>
          <Text style={styles.chartPrice}>{candle ? candle.close.toFixed(2) : '—'}</Text>
        </View>
        <CandleReplayChart candles={visible.slice(-24)} />
        <View style={styles.progressLabels}><Text style={styles.progressText}>START</Text><Text style={styles.progressText}>{Math.round((cursor / Math.max(candles.length - 1, 1)) * 100)}%</Text><Text style={styles.progressText}>END</Text></View>
        <Slider minimumValue={0} maximumValue={Math.max(0, candles.length - 1)} step={1} value={cursor} onValueChange={(value) => { setCursor(Math.floor(value)); setPlaying(false); }} minimumTrackTintColor={colors.accent} maximumTrackTintColor={colors.border} thumbTintColor={colors.accent} accessibilityLabel="Replay candle position" />
        <View style={styles.controls}>
          <Pressable accessibilityRole="button" onPress={() => { setCursor(0); setPlaying(false); setTrades([]); }} style={styles.controlButton}><RotateCcw size={16} color={colors.muted} /></Pressable>
          <Pressable accessibilityRole="button" onPress={() => setCursor((position) => Math.min(position + 1, candles.length - 1))} style={styles.controlButton}><SkipForward size={16} color={colors.text} /></Pressable>
          <Pressable accessibilityRole="button" onPress={() => setPlaying((state) => !state)} style={styles.playButton}>{playing ? <Pause size={17} color="#10150C" /> : <Play size={17} color="#10150C" />}</Pressable>
          <TogglePill labels={['0.5×', '1×', '2×']} selected={`${speed}×`} onSelect={(value) => setSpeed(Number(value.replace('×', '')))} />
        </View>
      </Card>

      <SectionHeading title="Replay practice trade" subtitle="Session-only virtual replay entries" />
      <Card style={styles.tradeCard}>
        <View style={styles.tradeHeader}><Text style={styles.tradeLabel}>CURRENT REPLAY PRICE</Text><Text style={styles.tradePrice}>{candle?.close.toFixed(2) ?? '—'}</Text></View>
        <View style={styles.tradeButtons}>
          <Button title="Virtual buy" icon={<ArrowUp size={15} color="#10150C" />} onPress={() => recordTrade('BUY')} style={styles.tradeButton} />
          <Button title="Virtual sell" variant="secondary" icon={<ArrowDown size={15} color={colors.text} />} onPress={() => recordTrade('SELL')} style={styles.tradeButton} />
        </View>
        <Text style={[styles.pnl, { color: replayPnl >= 0 ? colors.positive : colors.negative }]}>Replay position P&L: {replayPnl >= 0 ? '+' : ''}{replayPnl.toFixed(2)} · 1 unit</Text>
        <Text style={styles.tradeDisclaimer}>Replay trades do not affect your main paper portfolio.</Text>
      </Card>

      <SectionHeading title="Decision log" subtitle={`${trades.length} replay actions`} />
      <Card style={styles.logCard}>
        {trades.length ? trades.slice().reverse().map((trade, index) => (
          <View key={`${trade.side}-${trade.step}-${index}`} style={styles.logRow}>
            <Text style={[styles.logSide, { color: trade.side === 'BUY' ? colors.positive : colors.negative }]}>{trade.side}</Text>
            <Text style={styles.logStep}>Candle {trade.step + 1}</Text>
            <Text style={styles.logPrice}>{trade.price.toFixed(2)}</Text>
          </View>
        )) : <Text style={styles.noTrades}>Start playback or step forward, then place a virtual replay trade.</Text>}
      </Card>
      <Text style={styles.footer}>Playback speed: illustrative. No timestamp or historical date is implied.</Text>
    </Screen>
  );
}

function CandleReplayChart({ candles }: { candles: ReturnType<typeof demoMarketDataProvider.getCandles> }) {
  const width = 310;
  const height = 170;
  if (!candles.length) return <View style={styles.emptyChart} />;
  const min = Math.min(...candles.map((item) => item.low));
  const max = Math.max(...candles.map((item) => item.high));
  const range = max - min || 1;
  const step = width / Math.max(candles.length, 1);
  return (
    <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
      {[0.25, 0.5, 0.75].map((fraction) => <Line key={fraction} x1={0} x2={width} y1={height * fraction} y2={height * fraction} stroke={colors.border} strokeWidth={1} />)}
      {candles.map((item, index) => {
        const x = index * step + step / 2;
        const yFor = (price: number) => height - 7 - ((price - min) / range) * (height - 14);
        const rising = item.close >= item.open;
        const color = rising ? colors.positive : colors.negative;
        const bodyTop = Math.min(yFor(item.open), yFor(item.close));
        const bodyHeight = Math.max(2, Math.abs(yFor(item.open) - yFor(item.close)));
        return (
          <G key={item.step}>
            <Line x1={x} x2={x} y1={yFor(item.high)} y2={yFor(item.low)} stroke={color} strokeWidth={1.3} />
            <Rect x={x - Math.max(1.5, step * 0.26)} y={bodyTop} width={Math.max(3, step * 0.52)} height={bodyHeight} rx={1} fill={color} />
          </G>
        );
      })}
    </Svg>
  );
}

const styles = StyleSheet.create({
  eyebrow: { color: colors.accent, fontSize: 9, fontWeight: '900', letterSpacing: 1.2, marginBottom: 5 },
  title: { color: colors.text, fontSize: 26, fontWeight: '900', letterSpacing: -0.8 },
  replayNotice: { borderColor: '#65512C', gap: 6 },
  noticeTitle: { color: colors.amber, fontSize: 12, fontWeight: '800' },
  noticeText: { color: colors.muted, fontSize: 10, lineHeight: 16 },
  symbols: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  symbolChip: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 9, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
  symbolChipSelected: { backgroundColor: '#B6F23A1A', borderColor: '#B6F23A66' },
  symbolText: { color: colors.muted, fontSize: 9, fontWeight: '800' },
  symbolTextSelected: { color: colors.accent },
  chartCard: { gap: 9 },
  chartHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chartSymbol: { color: colors.text, fontSize: 13, fontWeight: '900' },
  chartLabel: { color: colors.muted, fontSize: 9, marginTop: 4 },
  chartPrice: { color: colors.accent, fontSize: 16, fontWeight: '900' },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  progressText: { color: colors.dim, fontSize: 8, fontWeight: '800' },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  controlButton: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 11, backgroundColor: colors.cardRaised },
  playButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: colors.accent },
  emptyChart: { height: 140 },
  tradeCard: { gap: 12 },
  tradeHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tradeLabel: { color: colors.muted, fontSize: 8, fontWeight: '900', letterSpacing: 0.7 },
  tradePrice: { color: colors.text, fontSize: 15, fontWeight: '900' },
  tradeButtons: { flexDirection: 'row', gap: 8 },
  tradeButton: { flex: 1 },
  pnl: { fontSize: 11, fontWeight: '800' },
  tradeDisclaimer: { color: colors.muted, fontSize: 9 },
  logCard: { paddingVertical: 5, paddingHorizontal: 12 },
  logRow: { flexDirection: 'row', alignItems: 'center', minHeight: 40, gap: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  logSide: { width: 34, fontSize: 9, fontWeight: '900' },
  logStep: { flex: 1, color: colors.muted, fontSize: 10 },
  logPrice: { color: colors.text, fontSize: 10, fontWeight: '800' },
  noTrades: { color: colors.muted, fontSize: 11, lineHeight: 17, paddingVertical: 14, textAlign: 'center' },
  footer: { color: colors.dim, fontSize: 9, lineHeight: 14, textAlign: 'center' },
});
