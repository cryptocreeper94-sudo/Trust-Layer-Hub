import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet } from "react-native";
import Colors from "@/constants/colors";
import { GlassCard } from "@/components/GlassCard";
import { GradientText } from "@/components/GradientText";

const LAUNCH_DATE = new Date("2026-08-23T00:00:00-05:00");

function getTimeRemaining() {
  const now = new Date();
  const diff = LAUNCH_DATE.getTime() - now.getTime();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

function TimeBlock({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.timeBlock}>
      <View style={styles.timeValueContainer}>
        <Text style={styles.timeValue}>{String(value).padStart(2, "0")}</Text>
      </View>
      <Text style={styles.timeLabel}>{label}</Text>
    </View>
  );
}

export function CountdownTimer() {
  const [time, setTime] = useState(getTimeRemaining());
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setTime(getTimeRemaining());
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <GlassCard glow>
      <View style={styles.header}>
        <GradientText text="Launch Countdown" style={styles.title} />
        <Text style={styles.date}>August 23, 2026</Text>
      </View>
      <View style={styles.timerRow}>
        <TimeBlock value={time.days} label="DAYS" />
        <Text style={styles.separator}>:</Text>
        <TimeBlock value={time.hours} label="HRS" />
        <Text style={styles.separator}>:</Text>
        <TimeBlock value={time.minutes} label="MIN" />
        <Text style={styles.separator}>:</Text>
        <TimeBlock value={time.seconds} label="SEC" />
      </View>
      <Text style={styles.tagline}>One Year. One Vision. Launch Day.</Text>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center" as const,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
  },
  date: {
    fontSize: 12,
    color: Colors.textTertiary,
    fontFamily: "Inter_400Regular",
    marginTop: 4,
  },
  timerRow: {
    flexDirection: "row" as const,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    gap: 8,
  },
  timeBlock: {
    alignItems: "center" as const,
  },
  timeValueContainer: {
    backgroundColor: "rgba(0,255,255,0.08)",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(0,255,255,0.15)",
    minWidth: 52,
    alignItems: "center" as const,
  },
  timeValue: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: Colors.primary,
    fontFamily: "Inter_700Bold",
  },
  timeLabel: {
    fontSize: 9,
    color: Colors.textTertiary,
    fontFamily: "Inter_500Medium",
    marginTop: 4,
    letterSpacing: 1,
  },
  separator: {
    fontSize: 24,
    color: Colors.textMuted,
    fontWeight: "700" as const,
    marginBottom: 16,
  },
  tagline: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: "Inter_400Regular",
    textAlign: "center" as const,
    marginTop: 14,
    fontStyle: "italic" as const,
  },
});
