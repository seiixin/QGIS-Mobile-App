import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import AppLayout from '../../components/layout/AppLayout';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

const QuickActionCard = ({ icon, title, subtitle, bg, onPress }) => (
  <TouchableOpacity style={[styles.actionCard, { backgroundColor: bg }]} onPress={onPress} activeOpacity={0.85}>
    <Text style={styles.actionIcon}>{icon}</Text>
    <Text style={[styles.actionTitle, { color: bg === colors.dashCard ? colors.white : colors.textDark }]}>
      {title}
    </Text>
    <Text style={[styles.actionSubtitle, { color: bg === colors.dashCard ? 'rgba(255,255,255,0.7)' : colors.textMid }]}>
      {subtitle}
    </Text>
  </TouchableOpacity>
);

export default function DashboardScreen({ navigation }) {
  return (
    <AppLayout navigation={navigation}>
      <StatusBar barStyle="light-content" backgroundColor="#1B2A4A" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Hero card */}
        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>SmartQuake</Text>
          <Text style={styles.heroTitle}>Prepared for the next critical minute</Text>
          <View style={styles.locationBadge}>
            <Text style={styles.locationText}>📍 Apalit, Pampanga</Text>
          </View>
          <TouchableOpacity style={styles.alertBanner}>
            <Text style={styles.alertText}>
              Stay alert. Review the latest earthquake information and response tools.
            </Text>
            <Text style={styles.alertArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick actions</Text>
        <Text style={styles.sectionSubtitle}>
          Jump straight into the workflows used during preparedness and response.
        </Text>

        <View style={styles.actionsGrid}>
          <QuickActionCard
            icon="📊"
            title="Impact Results"
            subtitle="Scenario losses and casualty estimates."
            bg={colors.dashCard}
            onPress={() => navigation.navigate('Tabs', { screen: 'Impact' })}
          />
          <QuickActionCard
            icon="🗺️"
            title="Live Map"
            subtitle="Inspect active layers and hazard context."
            bg={colors.dashCardLight}
            onPress={() => navigation.navigate('Tabs', { screen: 'Map' })}
          />
          <QuickActionCard
            icon="ℹ️"
            title="Earthquake Info"
            subtitle="Learn what to do before, during, and after."
            bg={colors.dashCardWhite}
            onPress={() => navigation.navigate('Tabs', { screen: 'Info' })}
          />
          <QuickActionCard
            icon="🚨"
            title="Emergency"
            subtitle="Reach hotlines and personal contacts fast."
            bg={colors.dashCardPink}
            onPress={() => navigation.navigate('Tabs', { screen: 'Emergency' })}
          />
        </View>

        {/* Recent Activity */}
        <Text style={styles.sectionTitle}>Recent activity</Text>
        {[
          { label: 'M7.2 West Valley Fault', sub: 'Impact scenario updated', time: '2h ago' },
          { label: 'Checklist updated', sub: 'Before earthquake — 3 items pending', time: '1d ago' },
          { label: 'New evacuation map', sub: 'Barangay Lourdes layer added', time: '3d ago' },
        ].map((item, i) => (
          <View key={i} style={styles.activityItem}>
            <View style={styles.activityDot} />
            <View style={styles.activityContent}>
              <Text style={styles.activityLabel}>{item.label}</Text>
              <Text style={styles.activitySub}>{item.sub}</Text>
            </View>
            <Text style={styles.activityTime}>{item.time}</Text>
          </View>
        ))}
      </ScrollView>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 16, paddingBottom: 24, paddingTop: 12, backgroundColor: colors.dashBg },

  heroCard: {
    backgroundColor: colors.dashCard,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
  },
  heroLabel: { ...typography.bodySmall, color: 'rgba(255,255,255,0.6)', marginBottom: 6 },
  heroTitle: { ...typography.h2, color: colors.white, marginBottom: 12, lineHeight: 30 },
  locationBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 12,
  },
  locationText: { ...typography.bodySmall, color: colors.white },
  alertBanner: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertText: { flex: 1, ...typography.bodySmall, color: 'rgba(255,255,255,0.85)', lineHeight: 18 },
  alertArrow: { color: colors.tabActive, fontSize: 20, marginLeft: 8 },

  sectionTitle: { ...typography.h3, color: colors.textDark, marginBottom: 4 },
  sectionSubtitle: { ...typography.bodySmall, color: colors.textMid, marginBottom: 14, lineHeight: 18 },

  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  actionCard: {
    width: '47%',
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  actionIcon: { fontSize: 24, marginBottom: 8 },
  actionTitle: { ...typography.h4, marginBottom: 4 },
  actionSubtitle: { ...typography.bodySmall, lineHeight: 16 },

  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    elevation: 1,
  },
  activityDot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: colors.btnPrimary,
    marginTop: 4, marginRight: 12,
  },
  activityContent: { flex: 1 },
  activityLabel: { ...typography.label, color: colors.textDark, marginBottom: 2 },
  activitySub: { ...typography.bodySmall, color: colors.textMid },
  activityTime: { ...typography.bodySmall, color: colors.textLight },
});
