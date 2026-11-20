import { router } from 'expo-router';
import { Check, Plus, Trash2 } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Button, Card, DemoNotice, InstrumentRow, Screen, SearchField, SectionHeading } from '../../components/ui';
import { showMessage, useMobileApp } from '../../lib/mobile-app-context';
import { colors } from '../../lib/theme';
import { formatINR } from '../../../../src/lib/market-data';

export default function WatchlistScreen() {
  const { activeWatchlist, appState, createWatchlist, deleteWatchlist, market, selectWatchlist, toggleSymbol } = useMobileApp();
  const [query, setQuery] = useState('');
  const [listName, setListName] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [sortByChange, setSortByChange] = useState(false);
  const matching = useMemo(() => {
    const rows = activeWatchlist.symbols
      .map((symbol) => market?.instruments.find((item) => item.symbol === symbol))
      .filter((item) => item !== undefined)
      .filter((item) => `${item.symbol} ${item.company}`.toLowerCase().includes(query.trim().toLowerCase()));
    return rows.sort((a, b) => sortByChange ? b.changePct - a.changePct : a.symbol.localeCompare(b.symbol));
  }, [activeWatchlist.symbols, market?.instruments, query, sortByChange]);
  const suggestions = (market?.instruments ?? []).filter((item) => item.exchange === 'NSE'
    && query.trim()
    && !activeWatchlist.symbols.includes(item.symbol)
    && `${item.symbol} ${item.company}`.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 4);

  const handleCreate = () => {
    const error = createWatchlist(listName);
    if (error) {
      showMessage('Watchlist not created', error);
      return;
    }
    setListName('');
    setShowCreate(false);
  };

  return (
    <Screen>
      <View style={styles.titleRow}>
        <View>
          <Text style={styles.eyebrow}>YOUR MARKET COLLECTIONS</Text>
          <Text style={styles.title}>Watchlist</Text>
        </View>
        <Pressable accessibilityRole="button" onPress={() => setShowCreate((current) => !current)} style={styles.iconButton}>
          <Plus size={19} color={colors.accent} />
        </Pressable>
      </View>
      <DemoNotice mode={market?.mode ?? 'DEMO'} updatedAt={market?.updatedAt} />
      <View style={styles.listTabs}>
        {appState.paperTrading.watchlists.map((list) => (
          <Pressable key={list.id} onPress={() => selectWatchlist(list.id)} style={[styles.listTab, list.id === activeWatchlist.id && styles.listTabSelected]}>
            <Text numberOfLines={1} style={[styles.listTabText, list.id === activeWatchlist.id && styles.listTabTextSelected]}>{list.name}</Text>
            <Text style={[styles.listCount, list.id === activeWatchlist.id && styles.listTabTextSelected]}>{list.symbols.length}</Text>
          </Pressable>
        ))}
      </View>
      {showCreate ? (
        <Card style={styles.createCard}>
          <Text style={styles.createTitle}>Create a watchlist</Text>
          <TextInput value={listName} onChangeText={setListName} maxLength={32} placeholder="e.g. Long-term ideas" placeholderTextColor={colors.dim} style={styles.nameInput} />
          <View style={styles.createActions}>
            <Button title="Cancel" variant="quiet" onPress={() => setShowCreate(false)} style={styles.flexButton} />
            <Button title="Create list" icon={<Plus size={15} color="#10150C" />} onPress={handleCreate} style={styles.flexButton} />
          </View>
        </Card>
      ) : null}
      <SectionHeading
        title={activeWatchlist.name}
        subtitle={`${activeWatchlist.symbols.length} saved symbols · ${sortByChange ? 'sorted by daily change' : 'sorted by symbol'}`}
      />
      <Pressable onPress={() => setSortByChange((value) => !value)} style={styles.sortButton}>
        <Text style={styles.sortText}>{sortByChange ? 'Sort by symbol' : 'Sort by change'}</Text>
      </Pressable>
      <SearchField value={query} onChangeText={setQuery} placeholder="Search or add an NSE symbol" />
      {suggestions.length > 0 ? (
        <Card style={styles.suggestions}>
          <Text style={styles.suggestionTitle}>ADD TO {activeWatchlist.name.toUpperCase()}</Text>
          {suggestions.map((item) => (
            <Pressable key={item.symbol} onPress={() => { toggleSymbol(item.symbol); setQuery(''); }} style={styles.suggestionRow}>
              <View style={styles.flex}>
                <Text style={styles.suggestionSymbol}>{item.symbol}</Text>
                <Text style={styles.suggestionCompany}>{item.company}</Text>
              </View>
              <Plus size={17} color={colors.accent} />
            </Pressable>
          ))}
        </Card>
      ) : null}

      {matching.length > 0 ? (
        <Card style={styles.listCard}>
          {matching.map((item) => (
            <InstrumentRow
              key={item.symbol}
              symbol={item.symbol}
              company={item.company}
              price={formatINR(item.pricePaise)}
              changePct={item.changePct}
              onPress={() => router.push({ pathname: '/stock/[symbol]', params: { symbol: item.symbol } })}
              trailing={(
                <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${item.symbol} from watchlist`} hitSlop={8} onPress={() => toggleSymbol(item.symbol)}>
                  <Trash2 size={15} color={colors.dim} />
                </Pressable>
              )}
            />
          ))}
        </Card>
      ) : (
        <Card style={styles.emptyCard}>
          <View style={styles.emptyGlyph}><Check size={20} color={colors.accent} /></View>
          <Text style={styles.emptyTitle}>{query ? 'No matching symbols' : 'This list is ready for its first symbol'}</Text>
          <Text style={styles.emptyText}>{query ? 'Search for an available NSE instrument above to add it.' : 'Search an instrument or browse the market explorer to begin.'}</Text>
        </Card>
      )}
      {appState.paperTrading.watchlists.length > 1 ? (
        <Button
          title="Delete selected watchlist"
          variant="quiet"
          icon={<Trash2 size={14} color={colors.muted} />}
          onPress={() => {
            const error = deleteWatchlist(activeWatchlist.id);
            if (error) showMessage('Could not delete watchlist', error);
          }}
        />
      ) : null}
      <Text style={styles.footnote}>Watchlists sync to your Supabase account when configured and signed in; otherwise they stay on this device.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  eyebrow: { color: colors.accent, fontSize: 9, fontWeight: '900', letterSpacing: 1.4, marginBottom: 5 },
  title: { color: colors.text, fontSize: 26, fontWeight: '900', letterSpacing: -0.8 },
  iconButton: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card, borderRadius: 14, borderColor: colors.border, borderWidth: 1 },
  listTabs: { flexDirection: 'row', gap: 7, paddingBottom: 2 },
  listTab: { maxWidth: 155, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 11, paddingVertical: 9, borderRadius: 11, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
  listTabSelected: { borderColor: '#B6F23A66', backgroundColor: '#B6F23A16' },
  listTabText: { maxWidth: 115, color: colors.muted, fontSize: 10, fontWeight: '700' },
  listTabTextSelected: { color: colors.accent },
  listCount: { color: colors.dim, fontSize: 9, fontWeight: '800' },
  createCard: { gap: 11 },
  createTitle: { color: colors.text, fontSize: 13, fontWeight: '800' },
  nameInput: { minHeight: 44, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: 11, color: colors.text, paddingHorizontal: 12, fontSize: 13 },
  createActions: { flexDirection: 'row', gap: 8 },
  flexButton: { flex: 1 },
  sortButton: { alignSelf: 'flex-end', marginTop: -7, marginBottom: -8 },
  sortText: { color: colors.accent, fontSize: 10, fontWeight: '700' },
  suggestions: { padding: 11 },
  suggestionTitle: { color: colors.muted, fontSize: 9, fontWeight: '900', letterSpacing: 1, paddingBottom: 5 },
  suggestionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderTopWidth: 1, borderTopColor: colors.border },
  suggestionSymbol: { color: colors.text, fontSize: 12, fontWeight: '800' },
  suggestionCompany: { color: colors.muted, fontSize: 10, marginTop: 3 },
  listCard: { paddingVertical: 5, paddingHorizontal: 12 },
  emptyCard: { alignItems: 'center', gap: 9, paddingVertical: 25 },
  emptyGlyph: { width: 42, height: 42, borderRadius: 15, backgroundColor: '#B6F23A19', alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { color: colors.text, fontSize: 13, fontWeight: '800', textAlign: 'center' },
  emptyText: { color: colors.muted, fontSize: 11, lineHeight: 17, textAlign: 'center' },
  footnote: { color: colors.dim, textAlign: 'center', fontSize: 10, lineHeight: 15, paddingHorizontal: 8 },
});
