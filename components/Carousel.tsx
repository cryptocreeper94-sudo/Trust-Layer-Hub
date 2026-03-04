import React, { useRef, useState, useCallback } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  NativeSyntheticEvent,
  NativeScrollEvent,
  LayoutChangeEvent,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";

interface CarouselProps {
  children: React.ReactNode;
  itemWidth: number;
  gap?: number;
  testID?: string;
}

export function Carousel({ children, itemWidth, gap = 12, testID }: CarouselProps) {
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const itemCount = React.Children.count(children);
  const snapInterval = itemWidth + gap;

  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / snapInterval);
    setActiveIndex(Math.max(0, Math.min(index, itemCount - 1)));
  }, [snapInterval, itemCount]);

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  }, []);

  const scrollTo = useCallback((index: number) => {
    const clampedIndex = Math.max(0, Math.min(index, itemCount - 1));
    scrollRef.current?.scrollTo({ x: clampedIndex * snapInterval, animated: true });
    setActiveIndex(clampedIndex);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [snapInterval, itemCount]);

  const canGoLeft = activeIndex > 0;
  const canGoRight = activeIndex < itemCount - 1;

  return (
    <View onLayout={handleLayout} testID={testID}>
      <View style={styles.carouselRow}>
        <Pressable
          style={[styles.arrowBtn, !canGoLeft && styles.arrowDisabled]}
          onPress={() => canGoLeft && scrollTo(activeIndex - 1)}
          hitSlop={8}
          disabled={!canGoLeft}
        >
          <Ionicons name="chevron-back" size={18} color={canGoLeft ? Colors.textPrimary : Colors.textMuted} />
        </Pressable>
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { gap }]}
          snapToInterval={snapInterval}
          decelerationRate="fast"
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {children}
        </ScrollView>
        <Pressable
          style={[styles.arrowBtn, !canGoRight && styles.arrowDisabled]}
          onPress={() => canGoRight && scrollTo(activeIndex + 1)}
          hitSlop={8}
          disabled={!canGoRight}
        >
          <Ionicons name="chevron-forward" size={18} color={canGoRight ? Colors.textPrimary : Colors.textMuted} />
        </Pressable>
      </View>
      {itemCount > 1 && (
        <View style={styles.dotsRow}>
          {Array.from({ length: itemCount }).map((_, i) => (
            <Pressable
              key={i}
              onPress={() => scrollTo(i)}
              hitSlop={6}
            >
              <View
                style={[
                  styles.dot,
                  i === activeIndex && styles.dotActive,
                ]}
              />
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  carouselRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
  },
  arrowBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  arrowDisabled: {
    opacity: 0.3,
  },
  scrollContent: {
    paddingRight: 4,
    paddingLeft: 4,
  },
  dotsRow: {
    flexDirection: "row" as const,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    gap: 6,
    marginTop: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  dotActive: {
    width: 18,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
});
