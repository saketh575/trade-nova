import Slider from '@react-native-community/slider';
import { AlertTriangle, Gauge, ShieldCheck } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { G, Rect, Text as SvgText } from 'react-native-svg';
import { Card, DemoNotice, LabeledInput, Screen, SectionHeading } from '../components/ui';
import { useMobileApp } from '../lib/mobile-app-context';
import { colors } from '../lib/theme';
import { formatINR } from '../../../src/lib/market-data';

export default function RiskSimulatorScreen() {
  const { market, summary } = useMobileApp();
  const [riskPct, setRiskPct] = useState(1);
  const [entryPrice, setEntryPrice] = useState('100');
  const [stopPrice, setStopPrice] = useState('96');
  const [targetPrice, setTargetPrice] = useState('108');
  const [scenarioPct, setScenarioPct] = useState(-12);

  const entry = Number(entryPrice) || 0;
  const stop = Number(stopPrice) || 0;
  const target = Number(targetPrice) || 0;
  const capital = summary.totalValuePaise / 100;
  const riskBudget = capital * riskPct / 100;
  const perShareRisk = Math.abs(entry - stop);
  const positionSize = perShareRisk > 0 ? Math.floor(riskBudget / perShareRisk) : 0;
  const notional = positionSize * entry;
  const potentialLoss = positionSize * perShareRisk;
  const potentialReward = positionSize * Math.abs(target - entry);
  const rewardRisk = potentialLoss > 0 ? potentialReward / potentialLoss : 0;
  const exposurePct = capital > 0 ? (summary.marketValuePaise / 100 / capital) * 100 : 0;
  const scenarioLoss = Math.abs(Math.min(0, scenarioPct)) * capital / 100;
  const stressScenarios = useMemo(() => [-5, -10, -15, -20].map((lossPct) => ({ lossPct, loss: capital * Math.abs(lossPct) / 100 })), [capital]);

  return (
    <Screen>
      <View>
        <Text style={styles.eyebrow}>SCENARIO TOOL · NOT INVESTMENT ADVICE</Text>
        <Text style={styles.title}>Risk Simulator</Text>
      </View>
      <DemoNotice mode={market?.mode ?? 'DEMO'} />
      <Card style={styles.capitalCard}>
        <View style={styles.capitalIcon}><ShieldCheck size={19} color={colors.accent} /></View>
        <View style={styles.flex}>
          <Text style={styles.capitalLabel}>SIMULATED PORTFOLIO CAPITAL</Text>
          <Text style={styles.capitalValue}>{formatINR(summary.totalValuePaise)}</Text>
        </View>
        <Text style={styles.exposure}>{exposurePct.toFixed(1)}%{'\n'}exposed</Text>
      </Card>

      <SectionHeading title="Position sizing" subtitle="Risk budget determines maximum share quantity" />
      <Card style={styles.calculatorCard}>
        <View style={styles.sliderHeading}>
          <Text style={styles.sliderLabel}>Risk budget per trade</Text>
          <Text style={styles.sliderValue}>{riskPct.toFixed(2)}%</Text>
        </View>
        <Slider
          accessibilityLabel="Risk percent"
          minimumValue={0.25}
          maximumValue={5}
          step={0.25}
          value={riskPct}
          onValueChange={setRiskPct}
          minimumTrackTintColor={colors.accent}
          maximumTrackTintColor={colors.border}
          thumbTintColor={colors.accent}
        />
        <View style={styles.sliderEnds}><Text style={styles.smallLabel}>0.25%</Text><Text style={styles.smallLabel}>5%</Text></View>
        <View style={styles.priceFields}>
          <View style={styles.priceField}><LabeledInput label="Entry · ₹" value={entryPrice} onChangeText={setEntryPrice} keyboardType="decimal-pad" /></View>
          <View style={styles.priceField}><LabeledInput label="Stop · ₹" value={stopPrice} onChangeText={setStopPrice} keyboardType="decimal-pad" /></View>
          <View style={styles.priceField}><LabeledInput label="Target · ₹" value={targetPrice} onChangeText={setTargetPrice} keyboardType="decimal-pad" /></View>
        </View>
        <View style={styles.resultCard}>
          <Text style={styles.resultLabel}>SUGGESTED MAXIMUM SIZE</Text>
          <Text style={styles.resultValue}>{positionSize.toLocaleString('en-IN')} <Text style={styles.resultUnit}>shares</Text></Text>
          <Text style={styles.smallLabel}>A calculator output, not a recommendation.</Text>
        </View>
        <View style={styles.resultRow}><Text style={styles.smallLabel}>Risk budget</Text><Text style={styles.resultDetail}>{formatINR(Math.round(riskBudget * 100))}</Text></View>
        <View style={styles.resultRow}><Text style={styles.smallLabel}>Position notional</Text><Text style={styles.resultDetail}>{formatINR(Math.round(notional * 100))}</Text></View>
        <View style={styles.resultRow}><Text style={styles.smallLabel}>Loss at stop · before fees and slippage</Text><Text style={[styles.resultDetail, { color: colors.negative }]}>{formatINR(Math.round(potentialLoss * 100))}</Text></View>
        <View style={styles.resultRow}><Text style={styles.smallLabel}>Reward / risk to target</Text><Text style={styles.resultDetail}>{rewardRisk.toFixed(2)} : 1</Text></View>
      </Card>

      <SectionHeading title="Portfolio exposure" subtitle="Open holdings from your paper account" />
      <Card style={styles.exposureCard}>
        <View style={styles.gaugeHeader}><Gauge size={17} color={colors.accent} /><Text style={styles.gaugeTitle}>Current exposure</Text><Text style={styles.gaugeValue}>{exposurePct.toFixed(1)}%</Text></View>
        <View style={styles.exposureTrack}><View style={[styles.exposureFill, { width: `${Math.min(exposurePct, 100)}%` }]} /></View>
        <Text style={styles.smallLabel}>{formatINR(summary.marketValuePaise)} open market value · cash {formatINR(summary.cashPaise)}</Text>
      </Card>

      <SectionHeading title="Drawdown scenarios" subtitle="Illustrative portfolio loss if value falls by the selected percentage" />
      <Card style={styles.scenarioCard}>
        <View style={styles.sliderHeading}>
          <Text style={styles.sliderLabel}>Stress move</Text>
          <Text style={[styles.sliderValue, { color: colors.negative }]}>{scenarioPct.toFixed(0)}%</Text>
        </View>
        <Slider
          accessibilityLabel="Portfolio drawdown scenario"
          minimumValue={-30}
          maximumValue={0}
          step={1}
          value={scenarioPct}
          onValueChange={setScenarioPct}
          minimumTrackTintColor={colors.negative}
          maximumTrackTintColor={colors.border}
          thumbTintColor={colors.negative}
        />
        <Text style={styles.scenarioLoss}>Estimated value impact: −{formatINR(Math.round(scenarioLoss * 100))}</Text>
        <ScenarioBars capital={capital} scenarios={stressScenarios} />
      </Card>
      <Card style={styles.cautionCard}>
        <AlertTriangle size={17} color={colors.amber} />
        <Text style={styles.cautionText}>Illustrative scenarios exclude gaps, liquidity, slippage, fees, correlation and changing market conditions. They do not predict future losses.</Text>
      </Card>
    </Screen>
  );
}

function ScenarioBars({ capital, scenarios }: { capital: number; scenarios: { lossPct: number; loss: number }[] }) {
  const width = 300;
  const height = 118;
  const maxLoss = capital * 0.2 || 1;
  const barWidth = 34;
  const gap = 34;
  return (
    <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
      {scenarios.map((scenario, index) => {
        const x = 26 + index * (barWidth + gap);
        const barHeight = Math.max(4, Math.min(70, (scenario.loss / maxLoss) * 70));
        return (
          <G key={scenario.lossPct}>
            <Rect x={x} y={79 - barHeight} width={barWidth} height={barHeight} rx={6} fill={colors.negative} opacity={0.82} />
            <SvgText x={x + barWidth / 2} y={99} textAnchor="middle" fill={colors.muted} fontSize={9}>{scenario.lossPct}%</SvgText>
          </G>
        );
      })}
      <SvgText x={width - 10} y={14} textAnchor="end" fill={colors.dim} fontSize={8}>DRAWDOWN SAMPLES</SvgText>
    </Svg>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  eyebrow: { color: colors.accent, fontSize: 9, fontWeight: '900', letterSpacing: 1.15, marginBottom: 5 },
  title: { color: colors.text, fontSize: 26, fontWeight: '900', letterSpacing: -0.8 },
  capitalCard: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  capitalIcon: { width: 40, height: 40, borderRadius: 13, backgroundColor: '#B6F23A1A', alignItems: 'center', justifyContent: 'center' },
  capitalLabel: { color: colors.muted, fontSize: 8, fontWeight: '900', letterSpacing: 0.7 },
  capitalValue: { color: colors.text, fontSize: 17, fontWeight: '900', marginTop: 4 },
  exposure: { color: colors.accent, fontSize: 9, fontWeight: '900', textAlign: 'right', lineHeight: 14 },
  calculatorCard: { gap: 12 },
  sliderHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sliderLabel: { color: colors.text, fontSize: 12, fontWeight: '800' },
  sliderValue: { color: colors.accent, fontSize: 13, fontWeight: '900' },
  sliderEnds: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -7 },
  smallLabel: { color: colors.muted, fontSize: 9, lineHeight: 14 },
  priceFields: { flexDirection: 'row', gap: 8 },
  priceField: { flex: 1 },
  resultCard: { backgroundColor: colors.background, borderRadius: 13, borderWidth: 1, borderColor: colors.border, padding: 13, gap: 5 },
  resultLabel: { color: colors.muted, fontSize: 8, fontWeight: '900', letterSpacing: 0.7 },
  resultValue: { color: colors.accent, fontSize: 24, fontWeight: '900' },
  resultUnit: { color: colors.muted, fontSize: 11, fontWeight: '600' },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  resultDetail: { color: colors.text, fontSize: 10, fontWeight: '800', textAlign: 'right' },
  exposureCard: { gap: 12 },
  gaugeHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  gaugeTitle: { flex: 1, color: colors.text, fontSize: 11, fontWeight: '800' },
  gaugeValue: { color: colors.accent, fontSize: 12, fontWeight: '900' },
  exposureTrack: { height: 9, backgroundColor: colors.background, borderRadius: 99, overflow: 'hidden' },
  exposureFill: { height: '100%', backgroundColor: colors.accent, borderRadius: 99 },
  scenarioCard: { gap: 11 },
  scenarioLoss: { color: colors.negative, fontSize: 12, fontWeight: '800' },
  cautionCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, borderColor: '#65512C' },
  cautionText: { flex: 1, color: colors.muted, fontSize: 10, lineHeight: 16 },
});
