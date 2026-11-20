import { CheckCircle2, GraduationCap, LockKeyhole, PlayCircle } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, Card, DemoNotice, Screen, SectionHeading } from '../components/ui';
import { useMobileApp } from '../lib/mobile-app-context';
import { colors } from '../lib/theme';

type Level = 'Beginner' | 'Intermediate' | 'Advanced';
interface Lesson {
  id: string;
  title: string;
  level: Level;
  duration: string;
  description: string;
  quiz: string;
  answer: string;
  options: string[];
}

const lessons: Lesson[] = [
  { id: 'market-basics', title: 'How stock markets work', level: 'Beginner', duration: '6 min', description: 'Learn what a share represents, how exchanges match orders and why prices can move.', quiz: 'A share represents:', answer: 'Part ownership in a company', options: ['A guaranteed return', 'Part ownership in a company', 'A bank deposit'] },
  { id: 'risk-first', title: 'Risk before reward', level: 'Beginner', duration: '8 min', description: 'Understand position sizing, stop levels and the impact of a losing streak.', quiz: 'A position size should primarily reflect:', answer: 'The amount you can risk', options: ['A social media tip', 'The amount you can risk', 'The highest possible leverage'] },
  { id: 'order-types', title: 'Market and limit orders', level: 'Intermediate', duration: '7 min', description: 'Compare execution certainty with price control and review order-book basics.', quiz: 'A limit order controls:', answer: 'The worst acceptable price', options: ['The worst acceptable price', 'The exact fill time', 'The market direction'] },
  { id: 'trend-context', title: 'Trend and context', level: 'Intermediate', duration: '10 min', description: 'Use price structure and volume as context without treating an indicator as a forecast.', quiz: 'A technical indicator is best treated as:', answer: 'One input among many', options: ['A certain prediction', 'One input among many', 'A substitute for risk limits'] },
  { id: 'drawdown-discipline', title: 'Drawdown and discipline', level: 'Advanced', duration: '12 min', description: 'Review how drawdowns compound and how a written process can constrain emotional decisions.', quiz: 'After a drawdown, risk should:', answer: 'Follow a prewritten plan', options: ['Double to recover quickly', 'Follow a prewritten plan', 'Ignore position size'] },
];

export default function LearningScreen() {
  const { appState, markLessonComplete } = useMobileApp();
  const [level, setLevel] = useState<Level | 'All'>('All');
  const [openLesson, setOpenLesson] = useState<string | null>(null);
  const completed = appState.learningProgress;
  const visible = lessons.filter((lesson) => level === 'All' || lesson.level === level);

  const completeLesson = (lesson: Lesson) => {
    Alert.alert(`Knowledge check · ${lesson.title}`, lesson.quiz, [
      ...lesson.options.map((option) => ({
        text: option,
        onPress: () => {
          if (option === lesson.answer) {
            markLessonComplete(lesson.id);
            Alert.alert('Correct', 'Lesson progress saved.');
          } else {
            Alert.alert('Try again', 'Review the lesson and take another look at the question.');
          }
        },
      })),
      { text: 'Not now', style: 'cancel' as const },
    ]);
  };

  return (
    <Screen>
      <View>
        <Text style={styles.eyebrow}>LEARN AT YOUR OWN PACE</Text>
        <Text style={styles.title}>Learning Centre</Text>
      </View>
      <DemoNotice />
      <Card style={styles.progressCard}>
        <View style={styles.progressIcon}><GraduationCap size={20} color={colors.accent} /></View>
        <View style={styles.progressInfo}>
          <Text style={styles.progressTitle}>{completed.length} of {lessons.length} lessons complete</Text>
          <Text style={styles.progressSub}>Progress syncs when signed in and configured</Text>
          <View style={styles.track}><View style={[styles.fill, { width: `${(completed.length / lessons.length) * 100}%` }]} /></View>
        </View>
      </Card>
      <SectionHeading title="Choose a learning level" subtitle="Short lessons with knowledge checks" />
      <View style={styles.levels}>
        {(['All', 'Beginner', 'Intermediate', 'Advanced'] as const).map((value) => (
          <Pressable key={value} onPress={() => setLevel(value)} style={[styles.levelChip, value === level && styles.levelChipSelected]}>
            <Text style={[styles.levelText, value === level && styles.levelTextSelected]}>{value}</Text>
          </Pressable>
        ))}
      </View>
      {visible.map((lesson) => {
        const done = completed.includes(lesson.id);
        const expanded = openLesson === lesson.id;
        return (
          <Card key={lesson.id} style={styles.lessonCard}>
            <Pressable onPress={() => setOpenLesson(expanded ? null : lesson.id)} style={styles.lessonHeader}>
              <View style={[styles.lessonGlyph, done && styles.lessonGlyphDone]}>{done ? <CheckCircle2 size={18} color={colors.positive} /> : <PlayCircle size={18} color={colors.accent} />}</View>
              <View style={styles.lessonInfo}>
                <View style={styles.lessonMeta}><Text style={styles.levelLabel}>{lesson.level.toUpperCase()}</Text><Text style={styles.duration}>{lesson.duration}</Text></View>
                <Text style={styles.lessonTitle}>{lesson.title}</Text>
              </View>
              {done ? <CheckCircle2 size={17} color={colors.positive} /> : <LockKeyhole size={15} color={colors.dim} />}
            </Pressable>
            {expanded ? (
              <View style={styles.lessonBody}>
                <Text style={styles.description}>{lesson.description}</Text>
                <Button
                  title={done ? 'Review knowledge check' : 'Take knowledge check'}
                  onPress={() => completeLesson(lesson)}
                  variant={done ? 'secondary' : 'primary'}
                />
              </View>
            ) : null}
          </Card>
        );
      })}
      <SectionHeading title="Learning note" subtitle="Educational material only" />
      <Text style={styles.disclaimer}>Lessons explain common market concepts and are not personal investment recommendations. Check local rules and seek qualified advice when needed.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  eyebrow: { color: colors.accent, fontSize: 9, fontWeight: '900', letterSpacing: 1.35, marginBottom: 5 },
  title: { color: colors.text, fontSize: 26, fontWeight: '900', letterSpacing: -0.8 },
  progressCard: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  progressIcon: { width: 43, height: 43, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: '#B6F23A1A' },
  progressInfo: { flex: 1, gap: 7 },
  progressTitle: { color: colors.text, fontSize: 12, fontWeight: '800' },
  progressSub: { color: colors.muted, fontSize: 9 },
  track: { height: 6, backgroundColor: colors.background, borderRadius: 99, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: colors.accent, borderRadius: 99 },
  levels: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  levelChip: { paddingHorizontal: 10, paddingVertical: 8, borderWidth: 1, borderColor: colors.border, borderRadius: 99 },
  levelChipSelected: { backgroundColor: '#B6F23A1A', borderColor: '#B6F23A66' },
  levelText: { color: colors.muted, fontSize: 9, fontWeight: '700' },
  levelTextSelected: { color: colors.accent },
  lessonCard: { gap: 12, padding: 13 },
  lessonHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  lessonGlyph: { width: 38, height: 38, borderRadius: 13, backgroundColor: colors.cardRaised, alignItems: 'center', justifyContent: 'center' },
  lessonGlyphDone: { backgroundColor: '#57D99A19' },
  lessonInfo: { flex: 1, gap: 4 },
  lessonMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  levelLabel: { color: colors.accent, fontSize: 8, fontWeight: '900', letterSpacing: 0.6 },
  duration: { color: colors.dim, fontSize: 8 },
  lessonTitle: { color: colors.text, fontSize: 12, fontWeight: '800' },
  lessonBody: { gap: 12, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 11 },
  description: { color: colors.muted, fontSize: 11, lineHeight: 17 },
  disclaimer: { color: colors.dim, fontSize: 10, lineHeight: 16, textAlign: 'center' },
});
