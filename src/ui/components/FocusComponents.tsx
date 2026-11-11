import {Ionicons} from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {useRef, type ReactNode} from 'react';
import {ActivityIndicator, Animated, PanResponder, Text, useWindowDimensions, View} from 'react-native';

import {Grain} from '@/ui/Grain';
import {Pressable} from '@/ui/HapticPressable';
import {formatDueLabel} from '@/domain/focusPriority';
import type {FocusTask} from '@/models/focusTask';
import {designTokens, radius} from '@/ui/designTokens';
import {isItemMascot, ItemMascot, Mascot, type MascotPose} from '@/mascot';

/** Past this (px), or flicked faster than FLICK, a release commits the swipe instead of snapping back. */
const SWIPE_DISTANCE = 110;
const SWIPE_FLICK = 0.6;
/** Pull-down to snooze: drag this far (finger px) and let go slowly — a drop, not a flick. A flick is the page's pull. */
const DROP_DISTANCE = 160;

type SwipeAction = {label: string; icon: keyof typeof Ionicons.glyphMap; onSwipe: () => void};

type SwipeCardProps = {
  /** Small caps label, top-left ("NOW", "COME BACK"). */
  eyebrow: string;
  /** Top-right (the item's type). */
  badge?: string;
  title: string;
  content?: string | null;
  meta?: string | null;
  /** The item's sticker; `fallbackPose` (the user's mascot) when it has none. */
  mascot?: string | null;
  fallbackPose: MascotPose;
  onPress: () => void;
  onLongPress?: () => void;
  /** Swiped right: the card stays off-screen (whatever replaces it slides in). */
  right: SwipeAction;
  /** Swiped left. `springBack`: the card returns (e.g. behind a sheet that can be cancelled). */
  left: SwipeAction & {springBack?: boolean};
  /** Pulled down: the card springs back (e.g. pushed later, and the next task takes its place). */
  down?: SwipeAction;
  /** Hint under the card, e.g. "← reschedule · done →". */
  hint: string;
  /** Extra controls at the bottom (e.g. a small text action). */
  footer?: ReactNode;
};

function SwipeHint({label, icon, opacity, side}: {label: string; icon: keyof typeof Ionicons.glyphMap; opacity: Animated.AnimatedInterpolation<number> | Animated.AnimatedMultiplication<number>; side: 'left' | 'right'}) {
  return (
    <Animated.View style={{position: 'absolute', top: 28, [side]: 28, opacity, flexDirection: 'row', alignItems: 'center', gap: 6}}>
      <Ionicons name={icon} size={18} color={designTokens.textPrimary} />
      <Text style={{color: designTokens.textPrimary, fontSize: 14, fontWeight: '600', letterSpacing: 0.5}}>{label}</Text>
    </Animated.View>
  );
}

/** The big card: tap to open, swipe right / left for its two actions. Used for the Now task and for things coming back. */
export function SwipeCard({eyebrow, badge, title, content, meta, mascot, fallbackPose, onPress, onLongPress, right, left, down, hint, footer}: SwipeCardProps) {
  const x = useRef(new Animated.Value(0)).current;
  const y = useRef(new Animated.Value(0)).current;
  /** Which way this drag goes, decided once at the start: sideways swipe or pull down. */
  const axis = useRef<'x' | 'y'>('x');
  /** Past the drop point in this drag (one tick when crossing it, so you know letting go will drop). */
  const armed = useRef(false);
  const {width} = useWindowDimensions();
  const latest = useRef({right, left, down, width});
  latest.current = {right, left, down, width};

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => {
        if (Math.abs(g.dx) > 10 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5) axis.current = 'x';
        else if (latest.current.down && g.dy > 10 && g.dy > Math.abs(g.dx) * 1.5) axis.current = 'y';
        else return false;
        return true;
      },
      // Once claimed, keep the gesture — don't hand it to the vertical scroll mid-swipe.
      onPanResponderTerminationRequest: () => false,
      // Pulled down: follows the finger at half speed, so it feels held back.
      onPanResponderMove: (_, g) => {
        if (axis.current === 'x') return x.setValue(g.dx);
        y.setValue(Math.max(0, g.dy) / 2);
        if (g.dy >= DROP_DISTANCE !== armed.current) {
          armed.current = !armed.current;
          if (armed.current) void Haptics.selectionAsync();
        }
      },
      onPanResponderRelease: (_, g) => {
        if (axis.current === 'y') {
          armed.current = false;
          if (g.dy >= DROP_DISTANCE && g.vy < SWIPE_FLICK) {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            latest.current.down?.onSwipe();
          }
          Animated.spring(y, {toValue: 0, friction: 6, useNativeDriver: true}).start();
          return;
        }
        if (Math.abs(g.dx) < SWIPE_DISTANCE && Math.abs(g.vx) < SWIPE_FLICK) {
          Animated.spring(x, {toValue: 0, friction: 6, useNativeDriver: true}).start();
          return;
        }
        const side = Math.sign(g.dx || g.vx);
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        Animated.timing(x, {toValue: side * latest.current.width * 1.5, duration: 220, useNativeDriver: true}).start(() => {
          if (side > 0) return latest.current.right.onSwipe();
          latest.current.left.onSwipe();
          if (latest.current.left.springBack) Animated.spring(x, {toValue: 0, friction: 7, useNativeDriver: true}).start();
        });
      },
      onPanResponderTerminate: () => {
        Animated.spring(x, {toValue: 0, useNativeDriver: true}).start();
        Animated.spring(y, {toValue: 0, useNativeDriver: true}).start();
      },
    }),
  ).current;

  const rotate = x.interpolate({inputRange: [-width, 0, width], outputRange: ['-12deg', '0deg', '12deg']});
  const rightHint = x.interpolate({inputRange: [0, SWIPE_DISTANCE], outputRange: [0, 1], extrapolate: 'clamp'});
  const leftHint = x.interpolate({inputRange: [-SWIPE_DISTANCE, 0], outputRange: [1, 0], extrapolate: 'clamp'});
  // The corner labels make room for the swipe hints, which appear in the same spot.
  const downHint = y.interpolate({inputRange: [DROP_DISTANCE / 4, DROP_DISTANCE / 2], outputRange: [0, 1], extrapolate: 'clamp'});
  const headerFade = Animated.multiply(
    x.interpolate({inputRange: [-SWIPE_DISTANCE / 2, 0, SWIPE_DISTANCE / 2], outputRange: [0, 1, 0], extrapolate: 'clamp'}),
    y.interpolate({inputRange: [0, DROP_DISTANCE / 4], outputRange: [1, 0], extrapolate: 'clamp'}),
  );

  return (
    <Animated.View {...pan.panHandlers} style={{transform: [{translateX: x}, {translateY: y}, {rotate}]}}>
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        accessibilityHint={`Swipe right to ${right.label.toLowerCase()}, left to ${left.label.toLowerCase()}`}
        accessibilityActions={[{name: 'right', label: right.label}, {name: 'left', label: left.label}, ...(down ? [{name: 'down', label: down.label}] : [])]}
        onAccessibilityAction={e => ({right, left, down}[e.nativeEvent.actionName as 'right' | 'left' | 'down']?.onSwipe())}
        style={{
          padding: 28,
          borderRadius: radius.xl,
          borderWidth: 1,
          borderColor: designTokens.surfaceBorder,
          backgroundColor: designTokens.card,
          boxShadow: designTokens.heroShadow,
        }}>
        {/* The gradient ignores borderRadius (it paints square corners), so it lives in a clipped layer. */}
        <View style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: radius.xl, overflow: 'hidden', pointerEvents: 'none'}}>
          <View
            style={{
              flex: 1,
              // Native on the new architecture (RN 0.77) — no gradient dependency.
              experimental_backgroundImage: designTokens.cardGradient,
            }}
          />
        </View>
        <Grain radius={radius.xl} />
        {/* Swiping right reveals its label on the left edge, and vice versa — the side being uncovered. */}
        <SwipeHint label={right.label} icon={right.icon} opacity={rightHint} side="left" />
        <SwipeHint label={left.label} icon={left.icon} opacity={leftHint} side="right" />
        {down ? <SwipeHint label={down.label} icon={down.icon} opacity={downHint} side="left" /> : null}
        <Animated.View style={{flexDirection: 'row', justifyContent: 'space-between', opacity: headerFade}}>
          <Text style={{color: designTokens.textTertiary, fontSize: 12, fontWeight: '600', letterSpacing: 1.5}}>{eyebrow}</Text>
          {badge ? <Text style={{color: designTokens.textTertiary, fontSize: 12, fontWeight: '600', letterSpacing: 1.5}}>{badge.toUpperCase()}</Text> : null}
        </Animated.View>
        <View style={{alignItems: 'center', paddingTop: 16, paddingBottom: 20}}>
          {isItemMascot(mascot) ? <ItemMascot mascot={mascot} size={120} /> : <Mascot pose={fallbackPose} width={120} />}
        </View>
        <Text style={{color: designTokens.textPrimary, fontSize: 32, fontWeight: '700', lineHeight: 38}}>
          {title}
        </Text>
        {content ? (
          <Text numberOfLines={3} style={{color: designTokens.textSecondary, fontSize: 15, lineHeight: 21, marginTop: 10}}>
            {content}
          </Text>
        ) : null}
        {meta ? (
          <Text style={{color: designTokens.textTertiary, fontSize: 13, marginTop: 14}}>{meta}</Text>
        ) : null}
        <Text style={{textAlign: 'center', color: designTokens.textTertiary, fontSize: 12, marginTop: 28, opacity: 0.7}}>
          {hint}
        </Text>
        {footer}
      </Pressable>
    </Animated.View>
  );
}

type NowCardProps = {
  task: FocusTask;
  onPress: () => void;
  onLongPress?: () => void;
  /** Swiped right. The card stays off-screen; the next task replaces it. */
  onComplete: () => void;
  /** Swiped left. The card springs back behind the date sheet, so cancelling shows it again. */
  onReschedule: () => void;
  /** Pulled down: pushed 2 hours later. */
  onSnooze?: () => void;
};

/** Card for the one task to do now: swipe right to complete, left to reschedule, pull down for +2 h, tap to open. */
export function NowCard({task, onPress, onLongPress, onComplete, onReschedule, onSnooze}: NowCardProps) {
  const meta = [formatDueLabel(task.dueAt), task.estimatedMinutes ? `${task.estimatedMinutes} min` : null].filter(Boolean).join('  ·  ');
  return (
    <SwipeCard
      eyebrow="NOW"
      badge={task.typeName}
      title={task.title}
      content={task.content}
      meta={meta}
      mascot={task.mascot}
      fallbackPose="pointing"
      onPress={onPress}
      onLongPress={onLongPress}
      right={{label: 'DONE', icon: 'checkmark', onSwipe: onComplete}}
      left={{label: 'RESCHEDULE', icon: 'calendar-outline', onSwipe: onReschedule, springBack: true}}
      down={onSnooze ? {label: '+2 HOURS', icon: 'time-outline', onSwipe: onSnooze} : undefined}
      hint={onSnooze ? '← reschedule · done →  ·  drag down & drop: +2 h' : '← reschedule · done →'}
    />
  );
}

type NextTaskRowProps = {
  task: FocusTask;
  onPress: () => void;
  onLongPress?: () => void;
};

export function NextTaskRow({task, onPress, onLongPress}: NextTaskRowProps) {
  const dueLabel = formatDueLabel(task.dueAt);

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: designTokens.surfaceBorder,
      }}>
      {isItemMascot(task.mascot) ? <ItemMascot mascot={task.mascot} size={36} /> : null}
      <View style={{flex: 1}}>
        <Text style={{color: designTokens.textSecondary, fontSize: 16, fontWeight: '500'}}>{task.title}</Text>
        {dueLabel ? (
          <Text style={{color: designTokens.textTertiary, fontSize: 12, marginTop: 2}}>{dueLabel}</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

function emptyMessage(hour = new Date().getHours()): {title: string; body: string; pose: MascotPose} {
  if (hour < 12) return {title: 'Fresh start', body: "What's first today? Pull down or tap + to capture.", pose: 'wink'};
  if (hour < 18) return {title: 'Nothing pressing', body: 'Good moment to capture something you have been putting off.', pose: 'thinking'};
  return {title: 'Quiet evening', body: 'Anything for tomorrow? Capture it now and sleep on a clear head.', pose: 'sleeping'};
}

/** `allDone`: everything due today was completed — celebrate instead of "fresh start". */
export function FocusEmptyState({allDone = false}: {allDone?: boolean}) {
  const message = allDone
    ? {title: "You're all done for today", body: "Everything's ticked off. Anything more for today? Tap + — or take the win.", pose: 'happy' as MascotPose}
    : emptyMessage();
  return (
    <View style={{paddingVertical: 48, alignItems: 'center', gap: 8}}>
      <Mascot pose={message.pose} width={140} />
      <Text style={{color: designTokens.textSecondary, fontSize: 16, fontWeight: '500'}}>
        {message.title}
      </Text>
      <Text style={{color: designTokens.textTertiary, fontSize: 14, textAlign: 'center', lineHeight: 20}}>
        {message.body}
      </Text>
    </View>
  );
}

/** Nothing to do until the next timed task: the mascot, relaxed, and when that is. */
export function FreeStretch({until}: {until: string}) {
  return (
    <View style={{paddingVertical: 28, alignItems: 'center', gap: 6}}>
      <Mascot pose="cool" width={110} />
      <Text style={{color: designTokens.textSecondary, fontSize: 16, fontWeight: '500'}}>Free until {until}</Text>
      <Text style={{color: designTokens.textTertiary, fontSize: 14}}>Nothing to do before then.</Text>
    </View>
  );
}

export function FocusLoadingState() {
  return (
    <View style={{paddingVertical: 48, alignItems: 'center'}}>
      <ActivityIndicator color={designTokens.accent} />
    </View>
  );
}
