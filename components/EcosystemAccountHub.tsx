/**
 * EcosystemAccountHub V2 — React Native (Expo)
 * Premium + Rotating Affiliate Bonus. RN primitives only.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Modal, Linking,
  Platform, StyleSheet, Dimensions,
} from 'react-native';

const SSO = 'https://dwtl.io';
const PRE = 'https://dwtl.io/presale';
const W = Math.min(Dimensions.get('window').width, 400);

/* ── Embedded Bonus Rotation ── */
const BONUSES = [
  { id:'chronicles',app:'Chronicles',icon:'📜',headline:'Legacy Founders Drive',reward:'Refer a friend to Chronicles',sig:500,mult:'2×',perk:'Founder Badge',url:'https://yourlegacy.io/chronicles/login',ac:'#06b6d4',s:'2026-03-24',e:'2026-04-07' },
  { id:'orbit',app:'ORBIT',icon:'🌐',headline:'ORBIT Member Drive',reward:'Onboard someone to ORBIT',sig:1000,mult:'3×',perk:'Hallmark boost',url:'https://orbitstaffing.io',ac:'#8b5cf6',s:'2026-04-07',e:'2026-04-21' },
  { id:'trustgen',app:'TrustGen 3D',icon:'🎨',headline:'Creator Collective',reward:'Bring 3 users to TrustGen',sig:750,mult:'2×',perk:'3D asset pack',url:'https://trustgen.tlid.io/explore',ac:'#f43f5e',s:'2026-04-21',e:'2026-05-05' },
  { id:'bomber',app:'Bomber 3D',icon:'⛳',headline:'Long Drive Challenge',reward:'Invite players to Bomber',sig:300,mult:'2×',perk:'Pro skin',url:'https://bomber.tlid.io',ac:'#10b981',s:'2026-05-05',e:'2026-05-19' },
  { id:'vault',app:'TrustVault',icon:'🔐',headline:'Secure the Network',reward:'Refer friends to TrustVault',sig:600,mult:'2×',perk:'Vault tier up',url:'https://trustvault.tlid.io',ac:'#06b6d4',s:'2026-05-19',e:'2026-06-02' },
  { id:'void',app:'THE VOID',icon:'🕳️',headline:'Void Explorers',reward:'Bring friends into THE VOID',sig:400,mult:'2×',perk:'Void ID skin',url:'https://intothevoid.app',ac:'#8b5cf6',s:'2026-06-02',e:'2026-06-16' },
  { id:'lotops',app:'Lot Ops Pro',icon:'🚗',headline:'Fleet Expansion',reward:'Onboard a dealer',sig:1500,mult:'5×',perk:'Analytics unlock',url:'https://lotopspro.io',ac:'#f59e0b',s:'2026-06-16',e:'2026-06-30' },
  { id:'lume',app:'Lume',icon:'💡',headline:'Language Pioneers',reward:'Invite devs to Lume',sig:500,mult:'2×',perk:'v1.0 early access',url:'https://lume-lang.org',ac:'#06b6d4',s:'2026-06-30',e:'2026-07-14' },
];
function getBonus() { const t=new Date().toISOString().split('T')[0]; const m=BONUSES.find(b=>t>=b.s&&t<b.e); if(m)return m; const y=new Date(),st=new Date(y.getFullYear(),0,1),w=Math.ceil(((y.getTime()-st.getTime())/864e5+st.getDay()+1)/7); return BONUSES[w%BONUSES.length]; }
function timeLeft(b:any):string { const d=new Date(b.e).getTime()-Date.now(); if(d<=0)return'Ending soon'; const days=Math.floor(d/864e5); return days>1?`${days} days left`:`${Math.floor((d%864e5)/36e5)}h left`; }

const APPS = [
  { name: 'Trust Hub', url: 'https://trusthub.tlid.io', icon: '🛡️' },
  { name: 'TrustGen 3D', url: 'https://trustgen.tlid.io', icon: '🎨' },
  { name: 'TrustVault', url: 'https://trustvault.tlid.io', icon: '🔐' },
  { name: 'Chronicles', url: 'https://yourlegacy.io', icon: '📜' },
  { name: 'ORBIT', url: 'https://orbitstaffing.io', icon: '🌐' },
  { name: 'Lume', url: 'https://lume-lang.org', icon: '💡' },
  { name: 'Bomber 3D', url: 'https://bomber.tlid.io', icon: '⛳' },
  { name: 'THE VOID', url: 'https://intothevoid.app', icon: '🕳️' },
  { name: 'Lot Ops', url: 'https://lotopspro.io', icon: '🚗' },
  { name: 'SignalCast', url: 'https://signalcast.tlid.io', icon: '📡' },
];

function getLocalUser() {
  if (Platform.OS !== 'web') return null;
  for (const k of ['tl_user','trustlayer_user','user','auth_user','dwtl_user','eco_user']) {
    try { const r=localStorage.getItem(k); if(r){const d=JSON.parse(r); if(d&&(d.name||d.email||d.username||d.displayName)) return {name:d.displayName||d.name||d.username||d.email?.split('@')[0],email:d.email}} } catch{}
  }
  return null;
}
function ini(n:string):string { return n.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2); }

function Row({ icon, title, subtitle, badge, badgeColor, url }: any) {
  return (
    <TouchableOpacity style={s.row} onPress={() => Linking.openURL(url)} activeOpacity={0.7}>
      <View style={s.rowIcon}><Text style={{ fontSize: 14 }}>{icon}</Text></View>
      <View style={s.rowContent}>
        <Text style={s.rowTitle}>{title}</Text>
        {subtitle && <Text style={s.rowSub}>{subtitle}</Text>}
      </View>
      {badge && (
        <View style={[s.badge, badgeColor === 'green' ? s.badgeGreen : s.badgeCyan]}>
          <Text style={[s.badgeText, badgeColor === 'green' ? s.badgeGT : s.badgeCT]}>{badge}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function Section({ label, children }: any) {
  return <View style={s.section}><Text style={s.sectionLabel}>{label}</Text>{children}</View>;
}

export function EcosystemAccountHub() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const bonus = getBonus();
  const [tl, setTl] = useState(timeLeft(bonus));

  useEffect(() => { setUser(getLocalUser()); }, []);
  useEffect(() => { const iv=setInterval(()=>setTl(timeLeft(bonus)),60000); return()=>clearInterval(iv); }, [bonus]);

  const toggle = useCallback(() => setOpen(o => !o), []);
  const close = useCallback(() => setOpen(false), []);

  return (
    <>
      <TouchableOpacity style={[s.trigger, open && s.triggerActive]} onPress={toggle} activeOpacity={0.8}>
        <Text style={s.triggerText}>{user?.name ? ini(user.name) : '👤'}</Text>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="slide" onRequestClose={close}>
        <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={close} />
        <View style={s.panel}>
          {/* Drag indicator */}
          <View style={s.drag}><View style={s.dragBar} /></View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={s.header}>
              <View style={s.avatar}><Text style={{ fontSize: 20 }}>{user?.name ? ini(user.name) : '👤'}</Text></View>
              <View style={s.info}>
                <Text style={s.name}>{user?.name || 'Trust Layer'}</Text>
                <Text style={s.tlid}>{user?.email || 'Connect your account'}</Text>
              </View>
              <TouchableOpacity style={s.closeBtn} onPress={close}><Text style={s.closeBtnText}>✕</Text></TouchableOpacity>
            </View>

            {/* 🔥 BONUS CARD */}
            <View style={[s.bonusCard, { backgroundColor: `${bonus.ac}08` }]}>
              <View style={s.bonusLabel}>
                <View style={[s.bonusDot, { backgroundColor: bonus.ac }]} />
                <Text style={[s.bonusLabelText, { color: bonus.ac }]}>🔥 THIS WEEK'S BONUS</Text>
              </View>
              <Text style={s.bonusHeadline}>{bonus.icon} {bonus.headline}</Text>
              <Text style={s.bonusReward}>{bonus.reward}</Text>
              <View style={s.bonusStats}>
                <View style={s.bonusSig}><Text style={s.bonusSigText}>⚡ {bonus.sig.toLocaleString()} SIG</Text></View>
                {bonus.mult && <View style={s.bonusMult}><Text style={s.bonusMultText}>{bonus.mult}</Text></View>}
                {bonus.perk && <View style={s.bonusPerk}><Text style={s.bonusPerkText}>+ {bonus.perk}</Text></View>}
              </View>
              <Text style={s.bonusTimer}>⏱ {tl}</Text>
              <TouchableOpacity
                style={[s.bonusCta, { backgroundColor: bonus.ac }]}
                onPress={() => Linking.openURL(`${bonus.url}?bonus=${bonus.id}`)}
                activeOpacity={0.8}
              >
                <Text style={s.bonusCtaText}>🚀 Refer & Earn</Text>
              </TouchableOpacity>
            </View>

            {user ? (
              <>
                <Section label="Signal Wallet">
                  <Row icon="⚡" title="Signal (SIG)" subtitle="Signal Charging · $0.001" badge="LIVE" url={PRE} />
                  <Row icon="💎" title="Manage Wallet" subtitle="Balance, transactions" url={`${SSO}/wallet`} />
                </Section>
                <Section label="Trust & Identity">
                  <Row icon="🏛️" title="DW-STAMP Hallmark" subtitle="Trust verification & tier" badge="✓" badgeColor="green" url={`${SSO}/hallmark`} />
                  <Row icon="🆔" title="Trust Layer ID" subtitle="Manage your TLID" url={`${SSO}/profile`} />
                </Section>
                <Section label="Rewards">
                  <Row icon="🎁" title="Ecosystem Rewards" subtitle="Points, referrals, bonuses" url={`${SSO}/rewards`} />
                  <Row icon="🤝" title="Affiliate Program" subtitle="Earn from referrals" url={`${SSO}/affiliate`} />
                </Section>
                <Section label="Ecosystem Apps">
                  <View style={s.appsGrid}>
                    {APPS.map(app => (
                      <TouchableOpacity key={app.name} style={s.appBadge} onPress={() => Linking.openURL(app.url)} activeOpacity={0.7}>
                        <Text style={{ fontSize: 12 }}>{app.icon}</Text>
                        <Text style={s.appBadgeText}>{app.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </Section>
                <Section label="Settings">
                  <Row icon="⚙️" title="Account Settings" subtitle="Preferences, security" url={`${SSO}/settings`} />
                </Section>
              </>
            ) : (
              <>
                <View style={s.connect}>
                  <Text style={{ fontSize: 44, opacity: 0.5 }}>🛡️</Text>
                  <Text style={s.connectTitle}>Connect to Trust Layer</Text>
                  <Text style={s.connectDesc}>Sign in with your Trust Layer ID to access your wallet, hallmark, rewards, and ecosystem apps.</Text>
                  <TouchableOpacity style={s.connectBtn} onPress={() => Linking.openURL(`${SSO}/login`)} activeOpacity={0.8}>
                    <Text style={s.connectBtnText}>🔗 Connect Account</Text>
                  </TouchableOpacity>
                </View>
                <Section label="Signal Charging">
                  <Row icon="⚡" title="Start Charging" subtitle="SIG $0.001 → $0.01 at TGE" badge="10×" url={PRE} />
                </Section>
                <Section label="Explore the Ecosystem">
                  <View style={s.appsGrid}>
                    {APPS.map(app => (
                      <TouchableOpacity key={app.name} style={s.appBadge} onPress={() => Linking.openURL(app.url)} activeOpacity={0.7}>
                        <Text style={{ fontSize: 12 }}>{app.icon}</Text>
                        <Text style={s.appBadgeText}>{app.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </Section>
              </>
            )}
          </ScrollView>

          <View style={s.footer}><Text style={s.footerText}>Trust Layer · Ecosystem Account Hub</Text></View>
        </View>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  trigger: { position: 'absolute', top: 14, right: 16, zIndex: 9998, width: 38, height: 38, borderRadius: 19, borderWidth: 2, borderColor: 'rgba(6,182,212,0.35)', backgroundColor: 'rgba(8,10,18,0.9)', alignItems: 'center', justifyContent: 'center' },
  triggerActive: { borderColor: '#06b6d4' },
  triggerText: { fontSize: 14, color: '#67e8f9', fontWeight: '800' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  panel: { position: 'absolute', top: 0, right: 0, width: W, height: '100%', backgroundColor: 'rgba(8,10,18,0.98)', borderLeftWidth: 1, borderLeftColor: 'rgba(6,182,212,0.1)' },
  drag: { alignItems: 'center', paddingTop: 10, paddingBottom: 4 },
  dragBar: { width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.12)' },
  header: { padding: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)', flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: 'rgba(6,182,212,0.3)', backgroundColor: 'rgba(6,182,212,0.1)', alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700', color: 'rgba(255,255,255,0.92)' },
  tlid: { fontSize: 11, color: 'rgba(6,182,212,0.5)', marginTop: 2 },
  closeBtn: { width: 30, height: 30, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)', backgroundColor: 'rgba(255,255,255,0.02)', alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { color: 'rgba(255,255,255,0.25)', fontSize: 12 },
  bonusCard: { margin: 16, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(6,182,212,0.12)' },
  bonusLabel: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  bonusDot: { width: 6, height: 6, borderRadius: 3 },
  bonusLabelText: { fontSize: 9, fontWeight: '800', letterSpacing: 1.4, textTransform: 'uppercase' },
  bonusHeadline: { fontSize: 16, fontWeight: '800', color: 'rgba(255,255,255,0.92)', marginBottom: 4 },
  bonusReward: { fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 12, lineHeight: 17 },
  bonusStats: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' },
  bonusSig: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8, backgroundColor: 'rgba(6,182,212,0.08)', borderWidth: 1, borderColor: 'rgba(6,182,212,0.15)' },
  bonusSigText: { fontSize: 12, fontWeight: '900', color: '#67e8f9' },
  bonusMult: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: 'rgba(168,85,247,0.1)', borderWidth: 1, borderColor: 'rgba(168,85,247,0.2)' },
  bonusMultText: { fontSize: 11, fontWeight: '900', color: '#c4b5fd' },
  bonusPerk: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: 'rgba(16,185,129,0.06)', borderWidth: 1, borderColor: 'rgba(16,185,129,0.15)' },
  bonusPerkText: { fontSize: 10, fontWeight: '700', color: '#6ee7b7' },
  bonusTimer: { fontSize: 10, color: 'rgba(255,255,255,0.25)', marginBottom: 4 },
  bonusCta: { marginTop: 10, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  bonusCtaText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  section: { paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.02)' },
  sectionLabel: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2, color: 'rgba(255,255,255,0.18)', marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12, marginBottom: 1, minHeight: 48 },
  rowIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.02)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)', alignItems: 'center', justifyContent: 'center' },
  rowContent: { flex: 1 },
  rowTitle: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.65)' },
  rowSub: { fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  badgeCyan: { backgroundColor: 'rgba(6,182,212,0.08)', borderWidth: 1, borderColor: 'rgba(6,182,212,0.15)' },
  badgeCT: { color: '#67e8f9', fontSize: 10, fontWeight: '800' },
  badgeGreen: { backgroundColor: 'rgba(16,185,129,0.08)', borderWidth: 1, borderColor: 'rgba(16,185,129,0.15)' },
  badgeGT: { color: '#6ee7b7', fontSize: 10, fontWeight: '800' },
  badgeText: { fontSize: 10, fontWeight: '800' },
  appsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 12 },
  appBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.02)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)', minHeight: 32 },
  appBadgeText: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.5)' },
  connect: { padding: 32, alignItems: 'center', gap: 16 },
  connectTitle: { fontSize: 17, fontWeight: '800', color: 'rgba(255,255,255,0.88)' },
  connectDesc: { fontSize: 12, color: 'rgba(255,255,255,0.35)', lineHeight: 18, textAlign: 'center', maxWidth: 260 },
  connectBtn: { paddingHorizontal: 36, paddingVertical: 14, borderRadius: 999, backgroundColor: '#06b6d4', minHeight: 48 },
  connectBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  footer: { paddingVertical: 14, paddingHorizontal: 20, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.02)' },
  footerText: { fontSize: 10, color: 'rgba(255,255,255,0.12)', textAlign: 'center' },
});
