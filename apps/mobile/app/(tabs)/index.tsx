import { Link } from 'expo-router';
import { ArrowRight, BookOpen, Bot, CirclePlay, ShieldCheck, Sparkles } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppHeader, Card, DataBadge, DemoNotice, IndexCard, InstrumentRow, LinkRow, MarketChart, Screen, SectionHeading } from '../../components/ui';
import { useMobileApp } from '../../lib/mobile-app-context';
import { colors } from '../../lib/theme';
import { formatINR } from '../../../../src/lib/market-data';

export default function HomeScreen() {
  const { appState, summary, market, marketLoading, marketError, marketStale, refreshMarket } = useMobileApp();
  const currentWatchlist = useMemo(() => appState.paperTrading.watchlists.find((item) => item.id === appState.paperTrading.activeWatchlistId), [appState.paperTrading]);
  const watchlistInstruments = useMemo(
    () => (currentWatchlist?.symbols ?? []).map((symbol) => market?.instruments.find((item) => item.symbol === symbol)).filter((item) => item !== undefined).slice(0, 4),
    [currentWatchlist?.symbols, market?.instruments],
  );
  const recentOrders = appState.paperTrading.orders.slice(0, 3);

  return (
    <Screen>
      <AppHeader />
      <View style={styles.welcomeRow}>
        <View style={styles.welcomeText}>
          <Text style={styles.welcomeEyebrow}>YOUR MARKET BRIEF</Text>
          <Text style={styles.welcomeTitle}>Good morning, {appState.settings.displayName.split(' ')[0]}</Text>
          <Text style={styles.welcomeSub}>Think Smarter. Trade Wiser.</Text>
        </View>
        <DataBadge mode={market?.mode ?? 'DEMO'} stale={marketStale} />
      </View>

      <DemoNotice mode={market?.mode ?? 'DEMO'} updatedAt={market?.updatedAt} />
      {marketError ? (
        <Card style={styles.errorCard}>
          <Text style={styles.errorTitle}>Market service unavailable</Text>
          <Text style={styles.errorText}>{marketError} {market?.updatedAt ? 'Showing the last received snapshot.' : 'No quotes are being presented as live.'}</Text>
          <Pressable onPress={() => void refreshMarket()}><Text style={styles.retry}>Try again</Text></Pressable>
        </Card>
      ) : null}

      <SectionHeading title="Market pulse" subtitle="Indian benchmarks · data status shown above" />
      <View style={styles.grid}>
        {(market?.indices ?? []).filter((index) => index.symbol !== 'INDIAVIX').slice(0, 3).map((index) => (
          <IndexCard key={index.symbol} name={index.name} value={index.displayValue} changePct={index.changePct} />
        ))}
      </View>

      <SectionHeading title="Your practice account" subtitle="Paper trading only · virtual funds" action={{ label: 'Portfolio', href: '/portfolio' }} />
      <View style={styles.grid}>
        <Card style={styles.accountCard}>
          <Text style={styles.accountLabel}>ACCOUNT VALUE</Text>
          <Text adjustsFontSizeToFit numberOfLines={1} style={styles.accountValue}>{formatINR(summary.totalValuePaise)}</Text>
          <Text style={[styles.accountChange, { color: summary.totalPnLPaise >= 0 ? colors.positive : colors.negative }]}>
            {summary.totalPnLPaise >= 0 ? '+' : ''}{formatINR(summary.totalPnLPaise)} · {summary.returnPct.toFixed(2)}%
          </Text>
        </Card>
        <Card style={styles.accountCard}>
          <Text style={styles.accountLabel}>AVAILABLE VIRTUAL CASH</Text>
          <Text adjustsFontSizeToFit numberOfLines={1} style={styles.accountValue}>{formatINR(summary.cashPaise)}</Text>
          <Text style={styles.accountHint}>Starts at ₹10,00,000</Text>
        </Card>
      </View>

      {market ? (
        <>
          <SectionHeading title="NIFTY 50" subtitle="Illustrative market trend" action={{ label: 'Explore', href: '/markets' }} />
          <MarketChart symbol="NIFTY 50" mode={market.mode} candles={market.candles} />
        </>
      ) : marketLoading ? (
        <Card style={styles.loadingCard}><Text style={styles.loadingText}>Connecting to the configured market service…</Text></Card>
      ) : null}

      <SectionHeading title="On your watchlist" subtitle={currentWatchlist?.name ?? 'Your symbols'} action={{ label: 'View all', href: '/watchlist' }} />
      <Card style={styles.listCard}>
        {watchlistInstruments.length ? watchlistInstruments.map((instrument) => (
          <InstrumentRow
            key={instrument.symbol}
            symbol={instrument.symbol}
            company={instrument.company}
            price={formatINR(instrument.pricePaise)}
            changePct={instrument.changePct}
          />
        )) : (
          <View style={styles.emptyWatchlist}>
            <Text style={styles.emptyTitle}>Your watchlist is ready</Text>
            <Text style={styles.emptyText}>Add NSE symbols from Markets to see them here.</Text>
          </View>
        )}
      </Card>

      <SectionHeading title="Practice & learn" subtitle="Tools for informed, risk-aware decisions" />
      <Card style={styles.toolsCard}>
        <LinkRow title="Paper trading" subtitle="Practice with virtual funds" href="/paper-trading" icon={<CirclePlay size={18} color={colors.accent} />} />
        <LinkRow title="NEON Intelligence" subtitle="Locally calculated indicators, not predictions" href="/neon-intelligence" icon={<Bot size={18} color={colors.accent} />} />
        <LinkRow title="Market Replay" subtitle="Practice on illustrative sample candles" href="/market-replay" icon={<Sparkles size={18} color={colors.accent} />} />
        <LinkRow title="Risk Simulator" subtitle="Explore position size and downside" href="/risk-simulator" icon={<ShieldCheck size={18} color={colors.accent} />} />
        <LinkRow title="Learning Centre" subtitle="Lessons and quick knowledge checks" href="/learning" icon={<BookOpen size={18} color={colors.accent} />} />
      </Card>

      <SectionHeading title="Recent practice activity" subtitle="Simulated orders · never routed to a broker" action={{ label: 'Trade', href: '/paper-trading' }} />
      <Card style={styles.listCard}>
        {recentOrders.length ? recentOrders.map((order) => (
          <View key={order.id} style={styles.orderRow}>
            <View style={[styles.orderMark, { backgroundColor: order.side === 'buy' ? '#57D99A19' : '#E0787819' }]}>
              <Text style={{ color: order.side === 'buy' ? colors.positive : colors.negative, fontSize: 10, fontWeight: '900' }}>{order.side.toUpperCase()}</Text>
            </View>
            <View style={styles.orderDetail}>
              <Text style={styles.orderSymbol}>{order.symbol} · {order.quantity} shares</Text>
              <Text style={styles.orderMeta}>{order.orderType.toUpperCase()} · {order.status.toUpperCase()}</Text>
            </View>
            <Text style={styles.orderPrice}>{formatINR(order.pricePaise)}</Text>
          </View>
        )) : (
          <View style={styles.emptyWatchlist}>
            <Text style={styles.emptyTitle}>No practice trades yet</Text>
            <Text style={styles.emptyText}>Explore the simulated trading terminal when you are ready.</Text>
            <Link href="/paper-trading" asChild><Pressable style={styles.tradeLink}><Text style={styles.tradeLinkText}>Open paper trading</Text><ArrowRight size={14} color={colors.accent} /></Pressable></Link>
          </View>
        )}
      </Card>
      <Text style={styles.disclaimer}>Educational practice only. No live brokerage connection or financial advice.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  welcomeRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginTop: 1 },
  welcomeText: { flex: 1 },
  welcomeEyebrow: { color: colors.accent, fontSize: 9, fontWeight: '900', letterSpacing: 1.6, marginBottom: 8 },
  welcomeTitle: { color: colors.text, fontSize: 23, fontWeight: '900', letterSpacing: -0.8 },
  welcomeSub: { color: colors.muted, fontSize: 12, marginTop: 6 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  accountCard: { flex: 1, minWidth: '47%', gap: 8 },
  accountLabel: { color: colors.muted, fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
  accountValue: { color: colors.text, fontSize: 19, fontWeight: '900', letterSpacing: -0.6 },
  accountChange: { fontSize: 11, fontWeight: '800' },
  accountHint: { color: colors.muted, fontSize: 10 },
  errorCard: { borderColor: '#805F30', gap: 6 },
  errorTitle: { color: colors.amber, fontSize: 13, fontWeight: '800' },
  errorText: { color: colors.muted, fontSize: 11, lineHeight: 16 },
  retry: { color: colors.accent, fontSize: 12, fontWeight: '800', marginTop: 3 },
  loadingCard: { minHeight: 100, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: colors.muted, fontSize: 12 },
  listCard: { paddingVertical: 6, paddingHorizontal: 13 },
  toolsCard: { paddingVertical: 4, paddingHorizontal: 14 },
  emptyWatchlist: { alignItems: 'center', paddingVertical: 20, gap: 7 },
  emptyTitle: { color: colors.text, fontSize: 13, fontWeight: '800' },
  emptyText: { color: colors.muted, fontSize: 11, textAlign: 'center', lineHeight: 16 },
  tradeLink: { marginTop: 5, flexDirection: 'row', alignItems: 'center', gap: 5 },
  tradeLinkText: { color: colors.accent, fontSize: 11, fontWeight: '800' },
  orderRow: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  orderMark: { minWidth: 45, paddingVertical: 7, alignItems: 'center', borderRadius: 9 },
  orderDetail: { flex: 1, gap: 4 },
  orderSymbol: { color: colors.text, fontSize: 12, fontWeight: '800' },
  orderMeta: { color: colors.muted, fontSize: 9, letterSpacing: 0.5 },
  orderPrice: { color: colors.text, fontSize: 11, fontWeight: '700' },
  disclaimer: { color: colors.dim, fontSize: 10, lineHeight: 16, textAlign: 'center', paddingHorizontal: 10 },
});
