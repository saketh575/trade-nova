import { router, useLocalSearchParams } from 'expo-router';
import { ArrowDownRight, ArrowUpRight, Bookmark, BookmarkCheck, ChartNoAxesCombined } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, Card, DataBadge, DemoNotice, MarketChart, Screen, SectionHeading } from '../../components/ui';
import { useMobileApp } from '../../lib/mobile-app-context';
import { colors } from '../../lib/theme';
import { formatCompactNumber, formatINR } from '../../../../src/lib/market-data';

export default function StockDetailsScreen() {
  const { symbol: routeSymbol } = useLocalSearchParams<{ symbol: string }>();
  const symbol = Array.isArray(routeSymbol) ? routeSymbol[0] : routeSymbol;
  const { activeWatchlist, market, marketError, marketLoading, toggleSymbol } = useMobileApp();
  const instrument = market?.instruments.find((item) => item.symbol === symbol);
  const saved = activeWatchlist.symbols.includes(symbol ?? '');

  return (
    <Screen>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>INSTRUMENT OVERVIEW</Text>
          <Text style={styles.title}>{instrument?.symbol ?? symbol ?? 'Instrument'}</Text>
          <Text style={styles.company}>{instrument?.company ?? (marketLoading ? 'Connecting to the market service…' : 'Not found in available instruments')}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={saved ? 'Remove from watchlist' : 'Add to watchlist'}
          onPress={() => symbol && toggleSymbol(symbol)}
          style={styles.bookmark}>
          {saved ? <BookmarkCheck size={18} color={colors.accent} /> : <Bookmark size={18} color={colors.muted} />}
        </Pressable>
      </View>
      <DemoNotice mode={market?.mode ?? 'DEMO'} updatedAt={market?.updatedAt} />
      {instrument && market ? (
        <>
          <Card style={styles.priceCard}>
            <View style={styles.priceTop}>
              <Text style={styles.price}>{formatINR(instrument.pricePaise)}</Text>
              <DataBadge mode={market.mode} />
            </View>
            <Text style={[styles.change, { color: instrument.changePct >= 0 ? colors.positive : colors.negative }]}>
              {instrument.changePct >= 0 ? <ArrowUpRight size={14} color={colors.positive} /> : <ArrowDownRight size={14} color={colors.negative} />}
              {' '}{instrument.changePct > 0 ? '+' : ''}{instrument.changePct.toFixed(2)}% today · {instrument.exchange}
            </Text>
            <View style={styles.actionRow}>
              <Button title="Practice trade" icon={<ChartNoAxesCombined size={15} color="#10150C" />} onPress={() => router.push({ pathname: '/paper-trading', params: { symbol: instrument.symbol } })} style={styles.actionButton} />
              <Button title={saved ? 'Saved' : 'Watch'} variant="secondary" onPress={() => toggleSymbol(instrument.symbol)} style={styles.actionButton} />
            </View>
          </Card>
          <MarketChart symbol={instrument.symbol} mode={market.mode} candles={market.candles} />
          <SectionHeading title="Market statistics" subtitle="Numbers from the selected data mode" />
          <View style={styles.statsGrid}>
            <Card style={styles.statCard}><Text style={styles.statLabel}>SECTOR</Text><Text style={styles.statValue}>{instrument.sector}</Text></Card>
            <Card style={styles.statCard}><Text style={styles.statLabel}>EXCHANGE</Text><Text style={styles.statValue}>{instrument.exchange}</Text></Card>
            <Card style={styles.statCard}><Text style={styles.statLabel}>VOLUME</Text><Text style={styles.statValue}>{formatCompactNumber(instrument.volume)}</Text></Card>
            <Card style={styles.statCard}><Text style={styles.statLabel}>MARKET CAP (CR)</Text><Text style={styles.statValue}>{instrument.marketCapCrore ? formatCompactNumber(instrument.marketCapCrore) : '—'}</Text></Card>
          </View>
          <Card style={styles.infoCard}>
            <Text style={styles.infoTitle}>About this quote</Text>
            <Text style={styles.infoText}>This view uses {market.provider}. {market.mode === 'DEMO' ? 'The displayed values and chart are illustrative samples—not live, delayed, or historical market data.' : 'Review the provider and licensing status before making decisions.'}</Text>
            {marketError ? <Text style={styles.errorText}>Refresh issue: {marketError}</Text> : null}
          </Card>
        </>
      ) : (
        <Card style={styles.infoCard}>
          <Text style={styles.infoTitle}>{marketLoading ? 'Loading instrument' : 'Instrument unavailable'}</Text>
          <Text style={styles.infoText}>{marketError ?? 'Search the available market directory and choose an NSE symbol.'}</Text>
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  eyebrow: { color: colors.accent, fontSize: 9, fontWeight: '900', letterSpacing: 1.4, marginBottom: 5 },
  title: { color: colors.text, fontSize: 25, fontWeight: '900', letterSpacing: -0.8 },
  company: { color: colors.muted, fontSize: 11, marginTop: 4 },
  bookmark: { height: 42, width: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
  priceCard: { gap: 8, padding: 17 },
  priceTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
  price: { color: colors.text, fontSize: 28, fontWeight: '900', letterSpacing: -1 },
  change: { flexDirection: 'row', alignItems: 'center', fontSize: 12, fontWeight: '800' },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 9 },
  actionButton: { flex: 1 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  statCard: { minWidth: '47%', flex: 1, gap: 8 },
  statLabel: { color: colors.muted, fontSize: 9, fontWeight: '800', letterSpacing: 0.6 },
  statValue: { color: colors.text, fontSize: 12, fontWeight: '800' },
  infoCard: { gap: 8 },
  infoTitle: { color: colors.text, fontSize: 13, fontWeight: '800' },
  infoText: { color: colors.muted, fontSize: 11, lineHeight: 17 },
  errorText: { color: colors.amber, fontSize: 10, lineHeight: 15 },
});
