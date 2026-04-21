import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AppLayout from '../../components/layout/AppLayout';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useTypography } from '../../hooks/useTypography';
import { useTranslation } from '../../hooks/useTranslation';
import { getRecentActivity, formatRelativeTime } from '../../lib/activityStore';

const CARD_ICON_COLOR = '#1B2A4A';

const QuickActionCard = ({ icon, title, subtitle, bg, onPress }) => {
  const t = useTypography();
  const { t: tr } = useTranslation();
  const isDark = bg === colors.dashCard;
  return (
    <TouchableOpacity style={[styles.actionCard, { backgroundColor: bg }]} onPress={onPress} activeOpacity={0.85}>
      <View style={[styles.actionIconWrap, { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : `${CARD_ICON_COLOR}12` }]}>
        <Text style={[styles.actionIconText, { color: isDark ? '#fff' : CARD_ICON_COLOR }]}>{icon}</Text>
      </View>
      <Text style={[styles.actionTitle, { color: isDark ? colors.white : colors.textDark, fontSize: t.h4.fontSize }]}>{tr(title)}</Text>
      <Text style={[styles.actionSubtitle, { color: isDark ? 'rgba(255,255,255,0.7)' : colors.textMid, fontSize: t.bodySmall.fontSize }]}>{tr(subtitle)}</Text>
    </TouchableOpacity>
  );
};

export default function DashboardScreen({ navigation }) {
  const { user, settings } = useAuth();
  const theme = useTheme();
  const t = useTypography();
  const { t: tr } = useTranslation();
  const [recentActivity, setRecentActivity] = useState([]);

  useFocusEffect(useCallback(() => {
    getRecentActivity(5).then(setRecentActivity);
  }, []));

  return (
    <AppLayout navigation={navigation}>
      <StatusBar barStyle="light-content" backgroundColor="#1B2A4A" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scroll, { backgroundColor: theme.bg }]}>
        <View style={styles.heroCard}>
          <Text style={[styles.heroLabel, { fontSize: t.bodySmall.fontSize }]}>SmartQuake</Text>
          <Text style={[styles.heroTitle, { fontSize: t.h2.fontSize }]}>
            {user?.name ? `${user.name}, stay ready for the next critical minute` : 'Prepared for the next critical minute'}
          </Text>
          <View style={styles.locationBadge}>
            <Text style={[styles.locationText, { fontSize: t.bodySmall.fontSize }]}>Language: {settings.language || 'English'}</Text>
          </View>
          <TouchableOpacity style={styles.alertBanner}>
            <Text style={[styles.alertText, { fontSize: t.bodySmall.fontSize }]}>
              {tr('Stay alert. Review the latest earthquake information and response tools.')}
            </Text>
            <Text style={styles.alertArrow}>›</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.textPrimary, fontSize: t.h3.fontSize }]}>{tr('Quick actions')}</Text>
        <Text style={[styles.sectionSubtitle, { color: theme.textSecondary, fontSize: t.bodySmall.fontSize }]}>
          {tr('Jump straight into the live backend-backed workflows.')}
        </Text>

        {/* Row 1: Impact Results + Emergency */}
        <View style={styles.actionsRow}>
          <QuickActionCard icon="📊" title="Impact Results"  subtitle="Scenario losses and casualty estimates."    bg={colors.dashCard}      onPress={() => navigation.navigate('Tabs', { screen: 'Impact' })} />
          <QuickActionCard icon="🚨" title="Emergency"       subtitle="Manage hotlines and personal contacts."     bg={colors.dashCardPink}  onPress={() => navigation.navigate('Tabs', { screen: 'Emergency' })} />
        </View>

        {/* Row 2: Earthquake Info + Offline Map */}
        <View style={styles.actionsRow}>
          <QuickActionCard icon="ℹ️" title="Earthquake Info" subtitle="Read the current info entries by language." bg={colors.dashCardWhite} onPress={() => navigation.navigate('Tabs', { screen: 'Info' })} />
          <QuickActionCard icon="📥" title="Offline Map"     subtitle="Evacuation maps available without signal."  bg={colors.dashCardLight} onPress={() => navigation.navigate('Tabs', { screen: 'OfflineMap' })} />
        </View>

        {/* Row 3: Live Map — full width */}
        <TouchableOpacity
          style={[styles.actionCardFull, { backgroundColor: colors.dashCard }]}
          onPress={() => navigation.navigate('Tabs', { screen: 'Map' })}
          activeOpacity={0.85}
        >
          <View style={[styles.actionIconWrap, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
            <Text style={styles.actionIconText}>🗺️</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.actionTitle, { color: colors.white, fontSize: t.h4.fontSize }]}>{tr('Live Map')}</Text>
            <Text style={[styles.actionSubtitle, { color: 'rgba(255,255,255,0.7)', fontSize: t.bodySmall.fontSize }]}>
              {tr('Inspect active hazard layers and GeoJSON sources.')}
            </Text>
          </View>
          <Text style={styles.actionArrow}>›</Text>
        </TouchableOpacity>

        <Text style={[styles.sectionTitle, { color: theme.textPrimary, fontSize: t.h3.fontSize }]}>{tr('Recent activity')}</Text>
        {recentActivity.length === 0 ? (
          <View style={[styles.activityItem, { backgroundColor: theme.card }]}>
            <View style={[styles.activityDot, { backgroundColor: theme.border }]} />
            <View style={styles.activityContent}>
              <Text style={[styles.activityLabel, { color: theme.textSecondary, fontSize: t.label.fontSize }]}>No activity yet</Text>
              <Text style={[styles.activitySub, { color: theme.textSecondary, fontSize: t.bodySmall.fontSize }]}>Check off a checklist item or navigate to a destination to see activity here.</Text>
            </View>
          </View>
        ) : (
          recentActivity.map((item, index) => {
            const icon = item.type === 'arrival' ? '📍' : '✅';
            return (
              <View key={index} style={[styles.activityItem, { backgroundColor: theme.card }]}>
                <Text style={styles.activityIcon}>{icon}</Text>
                <View style={styles.activityContent}>
                  <Text style={[styles.activityLabel, { color: theme.textPrimary, fontSize: t.label.fontSize }]}>{item.label}</Text>
                  <Text style={[styles.activitySub, { color: theme.textSecondary, fontSize: t.bodySmall.fontSize }]} numberOfLines={2}>{item.sub}</Text>
                </View>
                <Text style={[styles.activityTime, { color: theme.textMuted, fontSize: t.bodySmall.fontSize }]}>{formatRelativeTime(item.ts)}</Text>
              </View>
            );
          })
        )}
      </ScrollView>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 16, paddingBottom: 24, paddingTop: 12 },
  heroCard: { backgroundColor: colors.dashCard, borderRadius: 20, padding: 20, marginBottom: 24 },
  heroLabel: { ...typography.bodySmall, color: 'rgba(255,255,255,0.6)', marginBottom: 6 },
  heroTitle: { ...typography.h2, color: colors.white, marginBottom: 12, lineHeight: 30 },
  locationBadge: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, marginBottom: 12 },
  locationText: { ...typography.bodySmall, color: colors.white },
  alertBanner: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center' },
  alertText: { flex: 1, ...typography.bodySmall, color: 'rgba(255,255,255,0.85)', lineHeight: 18 },
  alertArrow: { color: colors.tabActive, fontSize: 20, marginLeft: 8 },
  sectionTitle: { ...typography.h3, marginBottom: 4 },
  sectionSubtitle: { ...typography.bodySmall, marginBottom: 14, lineHeight: 18 },
  actionsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  actionCard: { flex: 1, borderRadius: 16, padding: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6 },
  actionCardFull: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 16, padding: 16, marginBottom: 24,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6,
  },
  actionArrow: { color: 'rgba(255,255,255,0.6)', fontSize: 26, marginLeft: 4 },
  actionIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  actionIconText: { fontSize: 22 },
  actionTitle: { ...typography.h4, marginBottom: 4 },
  actionSubtitle: { ...typography.bodySmall, lineHeight: 16 },
  activityItem: { flexDirection: 'row', alignItems: 'flex-start', borderRadius: 14, padding: 14, marginBottom: 10, elevation: 1 },
  activityDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.btnPrimary, marginTop: 4, marginRight: 12 },
  activityContent: { flex: 1 },
  activityLabel: { ...typography.label, marginBottom: 2 },
  activitySub: { ...typography.bodySmall },
  activityTime: { ...typography.bodySmall },
});
