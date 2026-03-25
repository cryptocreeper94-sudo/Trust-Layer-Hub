/**
 * PresaleBanner — React Native Signal Charging promotion.
 * Works on both web and native. Dismissible per-session.
 */
import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, Linking, Platform, StyleSheet } from 'react-native';

const PRESALE_URL = 'https://dwtl.io/presale';

// sessionStorage only available on web
function isDismissed(): boolean {
  if (Platform.OS !== 'web') return false;
  try { return sessionStorage.getItem('presale-banner-dismissed') === 'true'; } catch { return false; }
}
function setDismissed() {
  if (Platform.OS === 'web') {
    try { sessionStorage.setItem('presale-banner-dismissed', 'true'); } catch {}
  }
}

export function PresaleBanner() {
  const [hidden, setHidden] = useState(isDismissed);

  const handleDismiss = useCallback(() => {
    setHidden(true);
    setDismissed();
  }, []);

  const handlePress = useCallback(() => {
    Linking.openURL(PRESALE_URL);
  }, []);

  if (hidden) return null;

  return (
    <View style={styles.banner}>
      <View style={styles.inner}>
        {/* LIVE badge */}
        <View style={styles.liveBadge}>
          <View style={styles.dot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>

        {/* Token info */}
        <Text style={styles.tokenText}>
          Signal Charging{' '}
          <Text style={styles.price}>$0.001</Text>
          {' → '}
          <Text style={styles.tge}>$0.01 at TGE</Text>
          {'  '}
          <Text style={styles.multiplier}>10×</Text>
        </Text>

        {/* CTA */}
        <TouchableOpacity style={styles.cta} onPress={handlePress} activeOpacity={0.8}>
          <Text style={styles.ctaText}>⚡ Start Charging</Text>
        </TouchableOpacity>
      </View>

      {/* Dismiss */}
      <TouchableOpacity style={styles.dismiss} onPress={handleDismiss} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Text style={styles.dismissText}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'relative',
    backgroundColor: 'rgba(6,182,212,0.06)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(6,182,212,0.25)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    zIndex: 50,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 10,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(16,185,129,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.25)',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34d399',
  },
  liveText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: '#6ee7b7',
    textTransform: 'uppercase',
  },
  tokenText: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
  },
  price: {
    fontSize: 14,
    fontWeight: '900',
    color: '#67e8f9',
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
  },
  tge: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
  multiplier: {
    fontSize: 11,
    fontWeight: '900',
    color: '#67e8f9',
  },
  cta: {
    paddingHorizontal: 20,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: '#06b6d4',
  },
  ctaText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  dismiss: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: [{ translateY: -7 }],
  },
  dismissText: {
    color: 'rgba(255,255,255,0.2)',
    fontSize: 14,
  },
});
