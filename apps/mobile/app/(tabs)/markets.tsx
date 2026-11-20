import { router } from 'expo-router';
import { BookmarkPlus, Check, ChevronDown, Search } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card, DataBadge, DemoNotice, InstrumentRow, Screen, SearchField, SectionHeading } from '../../components/ui';
import { useMobileApp } from '../../lib/mobile-app-context';
import { colors } from '../../lib/theme';
import { formatINR } from '../../../../src/lib/market-data';

type MarketFilter = 'NSE' | 'ALL';

export default function MarketsScreen() {
  const { market, marketLoading, marketError, marketStale, activeWatchlist, toggleSymbol } = useMobileApp();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<MarketFilter>('NSE');
  const instruments = useMemo(() => (market?.instruments ?? []).filter((instrument) => {
    const matchesExchange = filter === 'ALL' || instrument.exchange === 'NSE';
    const matchesQuery = `${instrument.symbol} ${instrument.company} ${instrument.sector}`.toLowerCase().includes(query.trim().toLowerCase());
    return matchesExchange && matchesQuery;
  }), [filter, market?.instruments, query]);

  return (
    <Screen>
      <View style={styles.titleRow}>
        <View>
          <Text style={styles.eyebrow}>DISCOVER · NSE</Text>
          <Text style={styles.title}>Markets</Text>
        </View>
        <DataBadge mode={market?.mode ?? 'DEMO'} stale={marketStale} />
      </View>
      <DemoNotice mode={market?.mode ?? 'DEMO'} updatedAt={market?.updatedAt} />
      <SearchField value={query} onChangeText={setQuery} placeholder="Search symbol, company or sector" />
      <View style={styles.filterRow}>
        {(['NSE', 'ALL'] as const).map((value) => (
          <Pressable key={value} onPress={() => setFilter(value)} style={[styles.filterChip, filter === value && styles.filterChipSelected]}>
            <Text style={[styles.filterText, filter === value && styles.filterTextSelected]}>{value === 'NSE' ? 'NSE stocks' : 'All available'}</Text>
          </Pressable>
        ))}
        <View style={styles.listCount}><Text style={styles.countText}>{instruments.length} instruments</Text><ChevronDown size={13} color={colors.muted} /></View>
      </View>

      <SectionHeading title="Stock explorer" subtitle="Select an instrument for its chart and practice actions" />
      <Card style={styles.instrumentList}>
        {marketLoading && !market ? <Text style={styles.messageText}>Connecting to market service…</Text> : null}
        {marketError ? <Text style={styles.errorText}>Market service unavailable: {marketError}{market?.updatedAt ? ' · Showing the last received snapshot.' : ' · No data is being presented as live.'}</Text> : null}
        {instruments.map((instrument) => {
          const inWatchlist = activeWatchlist.symbols.includes(instrument.symbol);
          return (
            <InstrumentRow
              key={instrument.symbol}
              symbol={instrument.symbol}
              company={instrument.company}
              price={formatINR(instrument.pricePaise)}
              changePct={instrument.changePct}
              onPress={() => router.push({ pathname: '/stock/[symbol]', params: { symbol: instrument.symbol } })}
              trailing={(
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${inWatchlist ? 'Remove' : 'Add'} ${instrument.symbol} ${inWatchlist ? 'from' : 'to'} watchlist`}
                  hitSlop={8}
                  onPress={() => toggleSymbol(instrument.symbol)}
                  style={[styles.watchButton, inWatchlist && styles.watchButtonActive]}>
                  {inWatchlist ? <Check size={15} color={colors.accent} /> : <BookmarkPlus size={15} color={colors.muted} />}
                </Pressable>
              )}
            />
          );
        })}
        {!marketLoading && instruments.length === 0 ? (
          <View style={styles.empty}>
            <Search size={20} color={colors.muted} />
            <Text style={styles.messageText}>{query ? 'No matching instruments.' : 'No market instruments are available.'}</Text>
          </View>
        ) : null}
      </Card>
      <Card style={styles.footerCard}>
        <Text style={styles.footerTitle}>Data and exchange coverage</Text>
        <Text style={styles.footerText}>The current sample directory is drawn from the existing Trade Nova adapter. Quotes are illustrative; this is not an NSE/BSE live feed.</Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eyebrow: { color: colors.accent, fontSize: 9, fontWeight: '900', letterSpacing: 1.5, marginBottom: 6 },
  title: { color: colors.text, fontSize: 26, fontWeight: '900', letterSpacing: -0.8 },
  filterRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  filterChip: { borderWidth: 1, borderColor: colors.border, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999 },
  filterChipSelected: { backgroundColor: '#B6F23A18', borderColor: '#B6F23A55' },
  filterText: { color: colors.muted, fontSize: 10, fontWeight: '700' },
  filterTextSelected: { color: colors.accent },
  listCount: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4 },
  countText: { color: colors.muted, fontSize: 10 },
  instrumentList: { paddingTop: 4, paddingBottom: 7, paddingHorizontal: 13 },
  watchButton: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cardRaised },
  watchButtonActive: { backgroundColor: '#B6F23A19' },
  messageText: { color: colors.muted, fontSize: 12, textAlign: 'center', paddingVertical: 18 },
  errorText: { color: colors.amber, fontSize: 12, lineHeight: 18, paddingVertical: 15 },
  empty: { alignItems: 'center', padding: 18, gap: 8 },
  footerCard: { gap: 7 },
  footerTitle: { color: colors.text, fontSize: 12, fontWeight: '800' },
  footerText: { color: colors.muted, fontSize: 11, lineHeight: 17 },
});
