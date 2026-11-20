import { useLocalSearchParams } from 'expo-router';
import { ArrowDownRight, ArrowUpRight, BadgeDollarSign, CircleHelp } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppDialog, Button, Card, DataBadge, DemoNotice, LabeledInput, Screen, SectionHeading, TogglePill } from '../components/ui';
import { showMessage, useMobileApp } from '../lib/mobile-app-context';
import { colors } from '../lib/theme';
import { formatINR } from '../../../src/lib/market-data';

export default function PaperTradingScreen() {
  const { symbol: routeSymbol } = useLocalSearchParams<{ symbol?: string }>();
  const {
    fillLimitOrder, market, paperState, placeOrder, cancelOrder, summary,
  } = useMobileApp();
  const symbols = (market?.instruments ?? []).filter((item) => item.exchange === 'NSE');
  const [selectedSymbol, setSelectedSymbol] = useState(Array.isArray(routeSymbol) ? routeSymbol[0] : routeSymbol ?? 'RELIANCE');
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT'>('MARKET');
  const [quantity, setQuantity] = useState('1');
  const [limitPrice, setLimitPrice] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [dialog, setDialog] = useState<{
    title: string;
    message: string;
    confirmLabel: string;
    onConfirm: () => void;
    cancelLabel?: string;
    onCancel?: () => void;
  } | null>(null);
  const selected = symbols.find((item) => item.symbol === selectedSymbol);
  const pricePaise = selected?.pricePaise ?? 0;
  const quantityNumber = Math.max(0, Math.floor(Number(quantity) || 0));
  const estimatedPaise = orderType === 'LIMIT' && Number(limitPrice) > 0 ? Math.round(Number(limitPrice) * 100) * quantityNumber : pricePaise * quantityNumber;
  const estimatedFees = estimatedPaise ? Math.max(100, Math.round(estimatedPaise * 0.0003)) : 0;
  const openOrders = useMemo(() => paperState.orders.filter((order) => order.status === 'pending'), [paperState.orders]);
  const positions = summary.holdings;

  const submit = () => {
    if (!selected) {
      showMessage('Choose an instrument', 'Select an available NSE sample instrument.');
      return;
    }
    if (quantityNumber < 1) {
      showMessage('Invalid quantity', 'Enter a whole-share quantity greater than zero.');
      return;
    }
    if (orderType === 'LIMIT' && !(Number(limitPrice) > 0)) {
      showMessage('Invalid limit price', 'Enter a limit price in rupees.');
      return;
    }
    const description = `${side} ${quantityNumber} ${selected.symbol} at ${orderType === 'MARKET' ? formatINR(pricePaise) : `limit ${formatINR(Math.round(Number(limitPrice) * 100))}`} · estimated fees ${formatINR(estimatedFees)}.`;
    setDialog({
      title: 'Confirm simulated order',
      message: `${description}\n\nVirtual funds only. No broker will receive this order.`,
      confirmLabel: `Confirm ${side.toLowerCase()}`,
      cancelLabel: 'Review later',
      onCancel: () => setDialog(null),
      onConfirm: () => {
        const result = placeOrder({
          symbol: selected.symbol,
          side: side.toLowerCase() as 'buy' | 'sell',
          orderType: orderType.toLowerCase() as 'market' | 'limit',
          quantity: quantityNumber,
          referencePricePaise: pricePaise,
          limitPricePaise: orderType === 'LIMIT' ? Math.round(Number(limitPrice) * 100) : undefined,
          stopLossPaise: Number(stopLoss) > 0 ? Math.round(Number(stopLoss) * 100) : undefined,
          targetPricePaise: Number(targetPrice) > 0 ? Math.round(Number(targetPrice) * 100) : undefined,
        });
        setDialog({
          title: result.ok ? 'Practice order submitted' : 'Order not placed',
          message: result.message,
          confirmLabel: 'Done',
          onConfirm: () => setDialog(null),
        });
      },
    });
  };

  return (
    <Screen>
      <View>
        <Text style={styles.eyebrow}>SIMULATED ORDER TERMINAL</Text>
        <Text style={styles.title}>Paper Trading</Text>
      </View>
      <DemoNotice mode={market?.mode ?? 'DEMO'} updatedAt={market?.updatedAt} />
      <Card style={styles.balanceCard}>
        <View style={styles.balanceIcon}><BadgeDollarSign size={19} color={colors.accent} /></View>
        <View style={styles.balanceInfo}>
          <Text style={styles.balanceLabel}>AVAILABLE VIRTUAL CASH</Text>
          <Text style={styles.balanceValue}>{formatINR(summary.cashPaise)}</Text>
        </View>
        <DataBadge mode={market?.mode ?? 'DEMO'} />
      </Card>
      <SectionHeading title="Choose NSE instrument" subtitle={selected?.company ?? 'Market data unavailable'} />
      <View style={styles.symbols}>
        {symbols.slice(0, 8).map((item) => (
          <Pressable key={item.symbol} onPress={() => setSelectedSymbol(item.symbol)} style={[styles.symbolChip, selectedSymbol === item.symbol && styles.symbolChipSelected]}>
            <Text style={[styles.symbolText, selectedSymbol === item.symbol && styles.symbolTextSelected]}>{item.symbol}</Text>
          </Pressable>
        ))}
      </View>
      <Card style={styles.quoteCard}>
        <View>
          <Text style={styles.quoteSymbol}>{selected?.symbol ?? '—'}</Text>
          <Text style={styles.quoteLabel}>Selected quote · {market?.mode ?? 'DEMO'}</Text>
        </View>
        <Text style={styles.quotePrice}>{selected ? formatINR(selected.pricePaise) : '—'}</Text>
      </Card>

      <Card style={styles.orderCard}>
        <Text style={styles.cardTitle}>Build your practice order</Text>
        <TogglePill labels={['BUY', 'SELL']} selected={side} onSelect={(value) => setSide(value as 'BUY' | 'SELL')} />
        <TogglePill labels={['MARKET', 'LIMIT']} selected={orderType} onSelect={(value) => setOrderType(value as 'MARKET' | 'LIMIT')} />
        <LabeledInput label="Quantity · whole shares" value={quantity} onChangeText={setQuantity} placeholder="1" keyboardType="number-pad" />
        {orderType === 'LIMIT' ? <LabeledInput label="Limit price · ₹" value={limitPrice} onChangeText={setLimitPrice} placeholder={selected ? (selected.pricePaise / 100).toFixed(2) : '0.00'} keyboardType="decimal-pad" /> : null}
        <View style={styles.riskInputs}>
          <View style={styles.riskInput}><LabeledInput label="Stop note · ₹" value={stopLoss} onChangeText={setStopLoss} placeholder="Optional" keyboardType="decimal-pad" /></View>
          <View style={styles.riskInput}><LabeledInput label="Target note · ₹" value={targetPrice} onChangeText={setTargetPrice} placeholder="Optional" keyboardType="decimal-pad" /></View>
        </View>
        <View style={styles.estimateRow}><Text style={styles.estimateLabel}>Estimated order value</Text><Text style={styles.estimateValue}>{formatINR(estimatedPaise)}</Text></View>
        <View style={styles.estimateRow}><Text style={styles.estimateLabel}>Estimated practice fees</Text><Text style={styles.estimateValue}>{formatINR(estimatedFees)}</Text></View>
        <Button
          title={`Review ${side.toLowerCase()} order`}
          icon={side === 'BUY' ? <ArrowUpRight size={16} color="#10150C" /> : <ArrowDownRight size={16} color="#10150C" />}
          onPress={submit}
          style={side === 'SELL' ? styles.sellButton : undefined}
        />
        <View style={styles.disclaimerRow}><CircleHelp size={13} color={colors.muted} /><Text style={styles.disclaimer}>Stop and target are saved as notes; they do not trigger automatically.</Text></View>
      </Card>

      <SectionHeading title="Open positions" subtitle={`${positions.length} positions · ledger-derived`} />
      <Card style={styles.listCard}>
        {positions.length ? positions.map((position) => (
          <View key={position.symbol} style={styles.dataRow}>
            <View style={styles.flex}>
              <Text style={styles.dataMain}>{position.symbol} · {position.quantity} shares</Text>
              <Text style={styles.dataSub}>Average cost {formatINR(position.averagePricePaise)}</Text>
            </View>
            <View style={styles.dataRight}>
              <Text style={styles.dataMain}>{formatINR(position.marketValuePaise)}</Text>
              <Text style={[styles.dataSub, { color: position.unrealizedPnLPaise >= 0 ? colors.positive : colors.negative }]}>{formatINR(position.unrealizedPnLPaise)} P&L</Text>
            </View>
          </View>
        )) : <Text style={styles.emptyText}>Practice positions appear here after a simulated buy fills.</Text>}
      </Card>

      <SectionHeading title="Pending limit orders" subtitle="Simulate a fill or cancel an order" />
      <Card style={styles.listCard}>
        {openOrders.length ? openOrders.map((order) => (
          <View key={order.id} style={styles.pendingRow}>
            <View style={styles.flex}>
              <Text style={styles.dataMain}>{order.side.toUpperCase()} {order.symbol} · {order.quantity}</Text>
              <Text style={styles.dataSub}>Limit {formatINR(order.limitPricePaise ?? order.pricePaise)}</Text>
            </View>
            <View style={styles.pendingActions}>
              <Pressable accessibilityRole="button" onPress={() => {
                const result = fillLimitOrder(order.id);
                setDialog({ title: result.ok ? 'Order filled' : 'Could not fill order', message: result.message, confirmLabel: 'Done', onConfirm: () => setDialog(null) });
              }}><Text style={styles.fillText}>Fill</Text></Pressable>
              <Pressable accessibilityRole="button" onPress={() => {
                const cancelled = cancelOrder(order.id);
                setDialog({ title: cancelled ? 'Order cancelled' : 'Could not cancel', message: 'Pending order status updated in the simulated ledger.', confirmLabel: 'Done', onConfirm: () => setDialog(null) });
              }}><Text style={styles.cancelText}>Cancel</Text></Pressable>
            </View>
          </View>
        )) : <Text style={styles.emptyText}>No pending simulated orders.</Text>}
      </Card>

      <SectionHeading title="Order history" subtitle="Most recent simulated activity" />
      <Card style={styles.listCard}>
        {paperState.orders.slice(0, 8).map((order) => (
          <View key={order.id} style={styles.historyRow}>
            <Text style={[styles.historySide, { color: order.side === 'buy' ? colors.positive : colors.negative }]}>{order.side.toUpperCase()}</Text>
            <Text style={styles.historySymbol}>{order.symbol} · {order.quantity}</Text>
            <Text style={styles.historyState}>{order.status.toUpperCase()}</Text>
            <Text style={styles.historyPrice}>{formatINR(order.pricePaise)}</Text>
          </View>
        ))}
        {!paperState.orders.length ? <Text style={styles.emptyText}>Your first practice order will appear in this history.</Text> : null}
      </Card>
      <AppDialog
        visible={dialog !== null}
        title={dialog?.title ?? ''}
        message={dialog?.message ?? ''}
        confirmLabel={dialog?.confirmLabel}
        cancelLabel={dialog?.cancelLabel}
        onCancel={dialog?.onCancel}
        onConfirm={() => {
          const confirm = dialog?.onConfirm;
          setDialog(null);
          confirm?.();
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  eyebrow: { color: colors.accent, fontSize: 9, fontWeight: '900', letterSpacing: 1.5, marginBottom: 5 },
  title: { color: colors.text, fontSize: 26, fontWeight: '900', letterSpacing: -0.8 },
  balanceCard: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 14 },
  balanceIcon: { width: 39, height: 39, borderRadius: 13, backgroundColor: '#B6F23A1A', alignItems: 'center', justifyContent: 'center' },
  balanceInfo: { flex: 1, gap: 4 },
  balanceLabel: { color: colors.muted, fontSize: 8, fontWeight: '900', letterSpacing: 0.7 },
  balanceValue: { color: colors.text, fontSize: 17, fontWeight: '900' },
  symbols: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  symbolChip: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 9, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
  symbolChipSelected: { backgroundColor: '#B6F23A1A', borderColor: '#B6F23A66' },
  symbolText: { color: colors.muted, fontSize: 9, fontWeight: '800' },
  symbolTextSelected: { color: colors.accent },
  quoteCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  quoteSymbol: { color: colors.text, fontSize: 14, fontWeight: '900' },
  quoteLabel: { color: colors.muted, fontSize: 9, marginTop: 4 },
  quotePrice: { color: colors.text, fontSize: 19, fontWeight: '900' },
  orderCard: { gap: 13 },
  cardTitle: { color: colors.text, fontSize: 15, fontWeight: '900' },
  riskInputs: { flexDirection: 'row', gap: 9 },
  riskInput: { flex: 1 },
  estimateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  estimateLabel: { color: colors.muted, fontSize: 11 },
  estimateValue: { color: colors.text, fontSize: 11, fontWeight: '800' },
  sellButton: { backgroundColor: '#D56B6B' },
  disclaimerRow: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  disclaimer: { flex: 1, color: colors.muted, fontSize: 9, lineHeight: 14 },
  listCard: { paddingVertical: 5, paddingHorizontal: 12 },
  dataRow: { minHeight: 56, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.border, gap: 9 },
  dataMain: { color: colors.text, fontSize: 11, fontWeight: '800' },
  dataSub: { color: colors.muted, fontSize: 9, marginTop: 4 },
  dataRight: { alignItems: 'flex-end' },
  emptyText: { color: colors.muted, fontSize: 11, lineHeight: 17, paddingVertical: 15, textAlign: 'center' },
  pendingRow: { minHeight: 61, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.border, gap: 10 },
  pendingActions: { flexDirection: 'row', gap: 12 },
  fillText: { color: colors.accent, fontSize: 10, fontWeight: '800' },
  cancelText: { color: colors.negative, fontSize: 10, fontWeight: '800' },
  historyRow: { minHeight: 45, flexDirection: 'row', alignItems: 'center', gap: 7, borderBottomWidth: 1, borderBottomColor: colors.border },
  historySide: { fontSize: 8, fontWeight: '900', width: 32 },
  historySymbol: { flex: 1, color: colors.text, fontSize: 10, fontWeight: '700' },
  historyState: { color: colors.muted, fontSize: 8, fontWeight: '700' },
  historyPrice: { color: colors.text, fontSize: 9, fontWeight: '700' },
});
