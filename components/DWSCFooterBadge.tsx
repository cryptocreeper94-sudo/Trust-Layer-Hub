import React, { useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Linking } from 'react-native';

export function DWSCFooterBadge() {
  const clickRef = useRef({ count: 0, timer: null as ReturnType<typeof setTimeout> | null });
  const handleClick = () => {
    clickRef.current.count++;
    if (clickRef.current.count === 3) {
      clickRef.current.count = 0;
      if (clickRef.current.timer) clearTimeout(clickRef.current.timer);
      Linking.openURL('https://dwsc.io/#portal');
    } else {
      if (clickRef.current.timer) clearTimeout(clickRef.current.timer);
      clickRef.current.timer = setTimeout(() => { clickRef.current.count = 0; }, 800);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Pressable onPress={() => Linking.openURL('https://darkwavestudios.io')}>
          <Text style={styles.text}>© 2026 DarkWave Studios</Text>
        </Pressable>
        <Text style={styles.dot}>·</Text>
        <Pressable onPress={() => Linking.openURL('https://dwtl.io')}>
          <Text style={styles.link}>Trust Layer</Text>
        </Pressable>
        <Text style={styles.dot}>·</Text>
        <Pressable onPress={handleClick}>
          <Text style={styles.dwsc}>◈</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  text: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.3)',
  },
  dot: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.15)',
  },
  link: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.35)',
    fontWeight: '500',
  },
  dwsc: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.25)',
  },
});
