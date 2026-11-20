import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Activity, BrainCircuit, ClipboardCheck, Sparkles } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Button, Card, DataBadge, DemoNotice, LabeledInput, Screen, SectionHeading } from '../components/ui';
import { showMessage, useMobileApp } from '../lib/mobile-app-context';
import { colors } from '../lib/theme';

export default function NeonIntelligenceScreen() {
  const { addJournalEntry, appState, market } = useMobileApp();
  const [symbol, setSymbol] = useState('RELIANCE');
  const [note, setNote] = useState('');
  const closes = useMemo(() => (market?.candles ?? []).map((candle) => candle.close), [market?.candles]);
  const changePct = closes.length > 1 && closes[0] !== 0 ? ((closes.at(-1)! - closes[0]) / closes[0]) * 100 : 0;
  const average = closes.length ? closes.reduce((sum, value) => sum + value, 0) / closes.length : 0;
  const rsi = calculateRsi(closes);
  const volatility = closes.length > 1 ? Math.sqrt(closes.slice(1).reduce((sum, value, index) => {
    const change = (value - closes[index]) / Math.max(closes[index], 1);
    return sum + change * change;
  }, 0) / (closes.length - 1)) * Math.sqrt(252) * 100 : 0;
  const breadth = useMemo(() => {
    const rows = market?.instruments ?? [];
    return rows.length ? rows.reduce((sum, item) => sum + item.changePct, 0) / rows.length : 0;
  }, [market?.instruments]);
  const trendLabel = changePct > 0.35 ? 'Positive sample trend' : changePct < -0.35 ? 'Negative sample trend' : 'Mixed sample trend';

  const saveReview = () => {
    const error = addJournalEntry(symbol, note);
    if (error) {
      showMessage('Review not saved', error);
      return;
    }
    setNote('');
    Alert.alert('Journal entry saved', 'Your review is stored in this practice account.');
  };

  return (
    <Screen>
      <View>
        <Text style={styles.eyebrow}>CALCULATED CONTEXT · NOT A PREDICTION</Text>
        <Text style={styles.title}>NEON Intelligence</Text>
      </View>
      <DemoNotice mode={market?.mode ?? 'DEMO'} />
      <Card style={styles.aiNotice}>
        <View style={styles.noticeIcon}><BrainCircuit color={colors.accent} size={19} /></View>
        <View style={styles.noticeBody}>
          <Text style={styles.noticeTitle}>Local indicators only</Text>
          <Text style={styles.noticeText}>No AI provider is configured. The values below are calculated from the selected sample series; they are not generated AI advice or forecasts.</Text>
        </View>
      </Card>

      <SectionHeading title="Market breadth sample" subtitle="Average daily movement of available NSE sample symbols" />
      <Card style={styles.sentimentCard}>
        <View style={styles.sentimentHeader}>
          <View>
            <Text style={styles.kicker}>SAMPLE BREADTH</Text>
            <Text style={[styles.sentimentValue, { color: breadth >= 0 ? colors.positive : colors.negative }]}>{breadth >= 0 ? '+' : ''}{breadth.toFixed(2)}%</Text>
          </View>
          <DataBadge mode={market?.mode ?? 'DEMO'} />
        </View>
        <View style={styles.meterTrack}><View style={[styles.meterFill, { width: `${Math.min(100, Math.max(0, 50 + breadth * 8))}%`, backgroundColor: breadth >= 0 ? colors.positive : colors.negative }]} /></View>
        <Text style={styles.helper}>An arithmetic summary of illustrative daily changes—not a market sentiment feed.</Text>
      </Card>

      <SectionHeading title="Technical snapshot" subtitle="NIFTY sample candle series · local calculations" />
      <View style={styles.indicatorGrid}>
        <IndicatorCard label="SERIES DIRECTION" value={trendLabel} detail={`${changePct >= 0 ? '+' : ''}${changePct.toFixed(2)}% across shown candles`} />
        <IndicatorCard label="RSI · 14" value={rsi.toFixed(1)} detail={rsi >= 70 ? 'Historically overbought range' : rsi <= 30 ? 'Historically oversold range' : 'Within common reference band'} />
        <IndicatorCard label="SERIES MEAN" value={average ? average.toFixed(2) : '—'} detail="Mean of illustrative closes" />
        <IndicatorCard label="VOLATILITY SAMPLE" value={`${volatility.toFixed(1)}%`} detail="Annualised stdev estimate" />
      </View>

      <SectionHeading title="Trade review journal" subtitle="Record the reasoning and risk before or after a practice trade" />
      <Card style={styles.journalCard}>
        <LabeledInput label="Symbol or market" value={symbol} onChangeText={setSymbol} placeholder="RELIANCE" autoCapitalize="characters" />
        <LabeledInput label="Decision note" value={note} onChangeText={setNote} placeholder="What supports the idea? What would invalidate it?" />
        <Button title="Save journal review" icon={<ClipboardCheck size={16} color="#10150C" />} onPress={saveReview} />
      </Card>
      <Card style={styles.checklist}>
        <View style={styles.checkTitleRow}><Activity size={16} color={colors.accent} /><Text style={styles.checkTitle}>Pre-trade reflection</Text></View>
        <Reflection prompt="What is the maximum amount I can lose?" />
        <Reflection prompt="Where would I exit if the idea is invalidated?" />
        <Reflection prompt="Is this position size consistent with my plan?" />
      </Card>

      <SectionHeading title="Your recent reviews" subtitle={`${appState.journalEntries.length} saved practice notes`} />
      {appState.journalEntries.length ? appState.journalEntries.slice(0, 6).map((entry) => (
        <Card key={entry.id} style={styles.entryCard}>
          <View style={styles.entryTop}><Text style={styles.entrySymbol}>{entry.symbol}</Text><Text style={styles.entryDate}>{new Date(entry.createdAt).toLocaleDateString()}</Text></View>
          <Text style={styles.entryText}>{entry.note}</Text>
        </Card>
      )) : (
        <Card style={styles.emptyCard}>
          <Sparkles color={colors.accent} size={18} />
          <Text style={styles.emptyTitle}>No reviews saved yet</Text>
          <Text style={styles.helper}>Add your reasoning above to start a private practice journal.</Text>
        </Card>
      )}
      <Text style={styles.disclaimer}>Indicators and checklists are educational tools. They are not recommendations, predictions, or a guarantee of results.</Text>
    </Screen>
  );
}

function IndicatorCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <Card style={styles.indicatorCard}><Text style={styles.kicker}>{label}</Text><Text numberOfLines={1} adjustsFontSizeToFit style={styles.indicatorValue}>{value}</Text><Text style={styles.helper}>{detail}</Text></Card>;
}

function Reflection({ prompt }: { prompt: string }) {
  const [checked, setChecked] = useState(false);
  return (
    <Pressable onPress={() => setChecked((value) => !value)} style={styles.reflectionRow}>
      <View style={[styles.checkSquare, checked && styles.checkSquareSelected]}>{checked ? <Text style={styles.checkMark}>✓</Text> : null}</View>
      <Text style={styles.reflectionText}>{prompt}</Text>
    </Pressable>
  );
}

function calculateRsi(values: number[]) {
  if (values.length < 2) return 50;
  const start = Math.max(1, values.length - 14);
  let gains = 0;
  let losses = 0;
  for (let index = start; index < values.length; index += 1) {
    const delta = values[index] - values[index - 1];
    if (delta > 0) gains += delta;
    else losses -= delta;
  }
  if (losses === 0) return 100;
  const relativeStrength = gains / losses;
  return 100 - 100 / (1 + relativeStrength);
}

const styles = StyleSheet.create({
  eyebrow: { color: colors.accent, fontSize: 9, fontWeight: '900', letterSpacing: 1.15, marginBottom: 5 },
  title: { color: colors.text, fontSize: 25, fontWeight: '900', letterSpacing: -0.8 },
  aiNotice: { flexDirection: 'row', gap: 11, borderColor: '#36472D' },
  noticeIcon: { width: 38, height: 38, borderRadius: 13, backgroundColor: '#B6F23A1A', alignItems: 'center', justifyContent: 'center' },
  noticeBody: { flex: 1, gap: 5 },
  noticeTitle: { color: colors.text, fontSize: 12, fontWeight: '800' },
  noticeText: { color: colors.muted, fontSize: 10, lineHeight: 16 },
  sentimentCard: { gap: 13 },
  sentimentHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  kicker: { color: colors.muted, fontSize: 8, fontWeight: '900', letterSpacing: 0.7 },
  sentimentValue: { fontSize: 23, fontWeight: '900', marginTop: 4 },
  meterTrack: { height: 8, backgroundColor: colors.background, borderRadius: 99, overflow: 'hidden' },
  meterFill: { height: '100%', borderRadius: 99 },
  helper: { color: colors.muted, fontSize: 10, lineHeight: 15 },
  indicatorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  indicatorCard: { flex: 1, minWidth: '47%', gap: 8, padding: 13 },
  indicatorValue: { color: colors.text, fontSize: 15, fontWeight: '900' },
  journalCard: { gap: 12 },
  checklist: { gap: 10 },
  checkTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  checkTitle: { color: colors.text, fontSize: 12, fontWeight: '800' },
  reflectionRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  checkSquare: { height: 18, width: 18, borderRadius: 6, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  checkSquareSelected: { backgroundColor: colors.accent, borderColor: colors.accent },
  checkMark: { color: colors.background, fontSize: 11, fontWeight: '900' },
  reflectionText: { flex: 1, color: colors.muted, fontSize: 10, lineHeight: 15 },
  entryCard: { gap: 8 },
  entryTop: { flexDirection: 'row', justifyContent: 'space-between' },
  entrySymbol: { color: colors.accent, fontSize: 10, fontWeight: '900' },
  entryDate: { color: colors.dim, fontSize: 9 },
  entryText: { color: colors.text, fontSize: 11, lineHeight: 17 },
  emptyCard: { alignItems: 'center', gap: 7 },
  emptyTitle: { color: colors.text, fontSize: 12, fontWeight: '800' },
  disclaimer: { color: colors.dim, fontSize: 10, lineHeight: 15, textAlign: 'center' },
});
