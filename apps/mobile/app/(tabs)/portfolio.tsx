import { Alert } from 'react-native';
import { Circle, Path } from 'react-native-svg';
import Svg from 'react-native-svg';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card, DemoNotice, EmptyState, InstrumentRow, MetricCard, Screen, SectionHeading } from '../../components/ui';
import { useMobileApp } from '../../lib/mobile-app-context';
import { colors } from '../../lib/theme';
import { formatINR } from '../../../../src/lib/market-data';

export default function PortfolioScreen() {
  const { market, marketError, paperState, summary } = useMobileApp();
  const allocations = useMemo(() => summary.holdings
    .map((holding) => ({ ...holding, share: summary.marketValuePaise > 0 ? holding.marketValuePaise / summary.marketValuePaise : 0 }))
    .sort((a, b) => b.marketValuePaise - a.marketValuePaise), [summary]);
  const orders = paperState.orders.slice(0, 8);

  return (
    <Screen>
      <View>
        <Text style={styles.eyebrow}>PAPER ACCOUNT · INR</Text>
        <Text style={styles.title}>Portfolio</Text>
      </View>
      <DemoNotice mode={market?.mode ?? 'DEMO'} updatedAt={market?.updatedAt} />
      {marketError ? <Card><Text style={styles.warning}>{marketError} Portfolio value uses the most recently available quote sample.</Text></Card> : null}
      <Card style={styles.heroCard}>
        <Text style={styles.heroLabel}>TOTAL PRACTICE ACCOUNT VALUE</Text>
        <Text adjustsFontSizeToFit numberOfLines={1} style={styles.heroValue}>{formatINR(summary.totalValuePaise)}</Text>
        <Text style={[styles.heroChange, { color: summary.totalPnLPaise >= 0 ? colors.positive : colors.negative }]}>
          {summary.totalPnLPaise >= 0 ? '+' : ''}{formatINR(summary.totalPnLPaise)} ({summary.returnPct.toFixed(2)}%) overall
        </Text>
        <Text style={styles.heroFootnote}>Calculated from virtual cash, filled orders, fees and available quotes.</Text>
      </Card>
      <View style={styles.metricGrid}>
        <MetricCard label="Invested" value={formatINR(summary.investedPaise)} detail={`${summary.holdings.length} holdings`} />
        <MetricCard label="Virtual cash" value={formatINR(summary.cashPaise)} detail="Available to practice" />
        <MetricCard label="Unrealised P&L" value={formatINR(summary.unrealizedPnLPaise)} detail="Open positions" positive={summary.unrealizedPnLPaise >= 0} />
        <MetricCard label="Realised P&L" value={formatINR(summary.realizedPnLPaise)} detail="Closed positions" positive={summary.realizedPnLPaise >= 0} />
      </View>

      <SectionHeading title="Account performance" subtitle="Equity points are recorded after simulated fills" />
      <Card style={styles.chartCard}>
        <View style={styles.chartLegend}>
          <View style={styles.legendDot} />
          <Text style={styles.legendText}>PAPER ACCOUNT VALUE</Text>
        </View>
        <EquityChart values={paperState.equitySnapshots.map((point) => point.valuePaise)} />
        <View style={styles.chartAxis}>
          <Text style={styles.axisText}>{paperState.equitySnapshots.length > 1 ? 'First recorded' : 'Account opened'}</Text>
          <Text style={styles.axisText}>Current · {formatINR(summary.totalValuePaise)}</Text>
        </View>
      </Card>

      <SectionHeading title="Allocation" subtitle={summary.marketValuePaise > 0 ? 'Share of open holdings at available quote' : 'No invested holdings yet'} />
      {allocations.length ? (
        <Card style={styles.allocationCard}>
          <View style={styles.allocationBar}>
            {allocations.map((holding, index) => <View key={holding.symbol} style={[styles.allocationSegment, { flex: Math.max(holding.share, 0.02), backgroundColor: allocationColors[index % allocationColors.length] }]} />)}
          </View>
          {allocations.map((holding, index) => (
            <View key={holding.symbol} style={styles.allocationRow}>
              <View style={[styles.allocationDot, { backgroundColor: allocationColors[index % allocationColors.length] }]} />
              <Text style={styles.allocationSymbol}>{holding.symbol}</Text>
              <Text style={styles.allocationQuantity}>{holding.quantity} shares</Text>
              <Text style={styles.allocationValue}>{(holding.share * 100).toFixed(1)}%</Text>
            </View>
          ))}
        </Card>
      ) : <EmptyState title="Your allocation starts with your first practice order" message="Add a simulated position in Paper Trading to see holdings and portfolio allocation." />}

      <SectionHeading title="Open holdings" subtitle="Valued using the current data mode" />
      <Card style={styles.listCard}>
        {summary.holdings.length ? summary.holdings.map((holding) => {
          const instrument = market?.instruments.find((item) => item.symbol === holding.symbol);
          const change = holding.averagePricePaise > 0 ? (holding.unrealizedPnLPaise / (holding.averagePricePaise * holding.quantity)) * 100 : 0;
          return (
            <InstrumentRow
              key={holding.symbol}
              symbol={holding.symbol}
              company={instrument?.company ?? holding.symbol}
              price={`${holding.quantity} × ${formatINR(instrument?.pricePaise ?? 0)}`}
              changePct={change}
              onPress={() => Alert.alert(holding.symbol, `Average cost ${formatINR(holding.averagePricePaise)} · Market value ${formatINR(holding.marketValuePaise)} · Unrealised P&L ${formatINR(holding.unrealizedPnLPaise)}`)}
            />
          );
        }) : <Text style={styles.emptyText}>No open holdings. Your starting virtual cash is available for practice orders.</Text>}
      </Card>

      <SectionHeading title="Order activity" subtitle="Local and account-synced simulated order ledger" />
      <Card style={styles.orderCard}>
        {orders.length ? orders.map((order) => (
          <View key={order.id} style={styles.orderRow}>
            <View style={[styles.sideTag, { backgroundColor: order.side === 'buy' ? '#57D99A19' : '#E0787819' }]}>
              <Text style={{ color: order.side === 'buy' ? colors.positive : colors.negative, fontSize: 9, fontWeight: '900' }}>{order.side.toUpperCase()}</Text>
            </View>
            <View style={styles.orderBody}>
              <Text style={styles.orderMain}>{order.symbol} · {order.quantity} shares</Text>
              <Text style={styles.orderSub}>{new Date(order.createdAt).toLocaleDateString()} · {order.orderType.toUpperCase()} · {order.status.toUpperCase()}</Text>
            </View>
            <Text style={styles.orderPrice}>{formatINR(order.pricePaise)}</Text>
          </View>
        )) : <Text style={styles.emptyText}>Filled, pending and cancelled practice orders will appear here.</Text>}
      </Card>
      <Text style={styles.disclaimer}>This portfolio is simulated. It does not represent a brokerage, custodian or real-money account.</Text>
    </Screen>
  );
}

function EquityChart({ values }: { values: number[] }) {
  const width = 320;
  const height = 120;
  const points = values.length < 2 ? [values[0] ?? 100_000_000, values[0] ?? 100_000_000] : values;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || Math.max(max * 0.02, 1);
  const path = points.map((value, index) => {
    const x = 7 + (index / (points.length - 1)) * (width - 14);
    const y = height - 8 - ((value - min) / range) * (height - 16);
    return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(' ');
  const first = path.match(/^M([\d.]+)\s([\d.]+)/);
  const last = path.match(/L([\d.]+)\s([\d.]+)$/);
  const areaPath = first && last ? `${path} L${last[1]} ${height - 8} L${first[1]} ${height - 8} Z` : path;

  return (
    <Svg width="100%" height={130} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <Path d={`M7 25 H${width - 7} M7 60 H${width - 7} M7 95 H${width - 7}`} stroke={colors.border} strokeWidth={1} />
      <Path d={areaPath} fill="#B6F23A12" />
      <Path d={path} fill="none" stroke={colors.accent} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      {last ? <Circle cx={Number(last[1])} cy={Number(last[2])} r={3.5} fill={colors.accent} /> : null}
    </Svg>
  );
}

const allocationColors = [colors.accent, colors.cyan, colors.positive, colors.amber, '#9C8FEA', '#E07878'];
const styles = StyleSheet.create({
  eyebrow: { color: colors.accent, fontSize: 9, fontWeight: '900', letterSpacing: 1.5, marginBottom: 5 },
  title: { color: colors.text, fontSize: 26, fontWeight: '900', letterSpacing: -0.8 },
  warning: { color: colors.amber, fontSize: 11, lineHeight: 16 },
  heroCard: { padding: 18, gap: 8, borderColor: '#36472D' },
  heroLabel: { color: colors.muted, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  heroValue: { color: colors.text, fontSize: 31, fontWeight: '900', letterSpacing: -1.2 },
  heroChange: { fontSize: 12, fontWeight: '800' },
  heroFootnote: { color: colors.muted, fontSize: 10, lineHeight: 15, marginTop: 2 },
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  chartCard: { gap: 10, paddingVertical: 14 },
  chartLegend: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  legendDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.accent },
  legendText: { color: colors.muted, fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
  chartAxis: { flexDirection: 'row', justifyContent: 'space-between' },
  axisText: { color: colors.dim, fontSize: 9 },
  allocationCard: { gap: 12 },
  allocationBar: { flexDirection: 'row', height: 8, overflow: 'hidden', borderRadius: 6, gap: 2 },
  allocationSegment: { borderRadius: 5 },
  allocationRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  allocationDot: { width: 7, height: 7, borderRadius: 4 },
  allocationSymbol: { flex: 1, color: colors.text, fontSize: 11, fontWeight: '800' },
  allocationQuantity: { color: colors.muted, fontSize: 10 },
  allocationValue: { color: colors.text, fontSize: 10, fontWeight: '800', minWidth: 42, textAlign: 'right' },
  listCard: { paddingVertical: 5, paddingHorizontal: 12 },
  emptyText: { color: colors.muted, fontSize: 11, lineHeight: 17, paddingVertical: 15, textAlign: 'center' },
  orderCard: { paddingVertical: 4, paddingHorizontal: 12 },
  orderRow: { flexDirection: 'row', alignItems: 'center', gap: 9, minHeight: 59, borderBottomWidth: 1, borderBottomColor: colors.border },
  sideTag: { minWidth: 42, paddingVertical: 7, alignItems: 'center', borderRadius: 8 },
  orderBody: { flex: 1, gap: 4 },
  orderMain: { color: colors.text, fontSize: 11, fontWeight: '800' },
  orderSub: { color: colors.muted, fontSize: 9 },
  orderPrice: { color: colors.text, fontSize: 10, fontWeight: '700' },
  disclaimer: { color: colors.dim, fontSize: 10, lineHeight: 15, textAlign: 'center' },
});
