import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, StatusBar,
} from 'react-native';
import AppLayout from '../../components/layout/AppLayout';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

const sections = [
  { id: 'basics', icon: 'ℹ️', title: 'Basic Information', content: [{ heading: 'What is an Earthquake?', body: 'An earthquake is the shaking of the surface of the Earth resulting from a sudden release of energy in the lithosphere that creates seismic waves.' }, { heading: 'Causes', body: 'Earthquakes are caused by tectonic plate movements, volcanic activity, and human-induced activities such as mining or reservoir-induced seismicity.' }] },
  { id: 'faults', icon: 'ℹ️', title: 'Major Faults in Pampanga', content: [{ heading: 'West Valley Fault', body: 'A 100 km fault running through Metro Manila and nearby provinces. Capable of producing a magnitude 7.2 earthquake.' }, { heading: 'East Zambales Fault', body: 'Located west of Pampanga, capable of producing a magnitude 6.5 earthquake along the Zambales mountain range.' }] },
  { id: 'history', icon: 'ℹ️', title: 'History of Major Earthquakes', content: [{ heading: '1990 Luzon Earthquake (M7.8)', body: 'Struck July 16, 1990. Epicenter near Cabanatuan, Nueva Ecija. Over 1,600 casualties and ₱10 billion in damages.' }, { heading: '2019 Zambales Earthquake (M6.1)', body: 'Struck April 22, 2019. 18 casualties, hundreds injured, significant structural damage in Pampanga and Metro Manila.' }] },
  { id: 'safety', icon: 'ℹ️', title: 'Safety Guidelines', content: [{ heading: 'Before an Earthquake', body: '• Secure heavy furniture\n• Prepare emergency kit\n• Know evacuation routes\n• Practice Drop, Cover, Hold On' }, { heading: 'During an Earthquake', body: '• DROP to hands and knees\n• COVER under sturdy table\n• HOLD ON until shaking stops\n• Stay away from windows' }, { heading: 'After an Earthquake', body: '• Check for injuries\n• Inspect for gas leaks\n• Listen to official announcements\n• Prepare for aftershocks' }] },
  { id: 'checklist', icon: 'ℹ️', title: 'Preparedness Checklist', content: [{ heading: 'To-Do Before an Earthquake', body: '☐ Store 3-day water supply\n☐ Prepare first aid kit\n☐ Secure heavy furniture\n☐ Know your evacuation route\n☐ Save emergency contacts' }, { heading: 'To-Do After an Earthquake', body: '☐ Check household for injuries\n☐ Turn off gas if you smell leaks\n☐ Avoid damaged buildings\n☐ Monitor official updates\n☐ Help neighbors if safe to do so' }] },
];

const AccordionItem = ({ section }) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <View style={styles.accordion}>
      <TouchableOpacity style={styles.accordionHeader} onPress={() => setExpanded(!expanded)} activeOpacity={0.8}>
        <View style={styles.accordionIconBg}><Text style={{ fontSize: 14 }}>{section.icon}</Text></View>
        <Text style={styles.accordionTitle}>{section.title}</Text>
        <Text style={styles.chevron}>{expanded ? '▲' : '▼'}</Text>
      </TouchableOpacity>
      {expanded && (
        <View style={styles.accordionBody}>
          {section.content.map((item, i) => (
            <View key={i} style={styles.contentItem}>
              <Text style={styles.contentHeading}>{item.heading}</Text>
              <Text style={styles.contentBody}>{item.body}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

export default function InfoScreen({ navigation }) {
  const [language, setLanguage] = useState('English');

  return (
    <AppLayout navigation={navigation}>
      <StatusBar barStyle="light-content" backgroundColor="#1B2A4A" />
      {/* Hero banner */}
      <View style={styles.heroBanner}>
        <Text style={styles.heroEyebrow}>Earthquake info</Text>
        <View style={styles.heroRow}>
          <Text style={styles.heroTitle}>Readable guidance with multilingual support</Text>
          <View style={styles.heroIcon}><Text style={{ fontSize: 20 }}>🔊</Text></View>
        </View>
      </View>

      <ScrollView style={styles.bg} contentContainerStyle={styles.scroll}>
        {/* Language selector */}
        <View style={styles.langRow}>
          {['English', 'Tagalog', 'Kapampangan'].map((lang) => (
            <TouchableOpacity
              key={lang}
              style={[styles.langChip, language === lang && styles.langChipActive]}
              onPress={() => setLanguage(lang)}
            >
              <Text style={[styles.langChipText, language === lang && styles.langChipTextActive]}>{lang}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {sections.map((section) => (
          <AccordionItem key={section.id} section={section} />
        ))}
      </ScrollView>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  bg: { backgroundColor: colors.dashBg },
  heroBanner: {
    backgroundColor: '#1B2A4A',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  heroEyebrow: { ...typography.bodySmall, color: 'rgba(255,255,255,0.6)', marginBottom: 6 },
  heroRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  heroTitle: { ...typography.h3, color: colors.white, flex: 1, lineHeight: 26, marginRight: 12 },
  heroIcon: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  scroll: { padding: 16, paddingBottom: 24 },
  langRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  langChip: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 20, backgroundColor: colors.white,
    borderWidth: 1.5, borderColor: colors.inputBorder,
  },
  langChipActive: { backgroundColor: colors.btnPrimary, borderColor: colors.btnPrimary },
  langChipText: { ...typography.bodySmall, color: colors.textMid },
  langChipTextActive: { color: colors.white, fontWeight: '700' },

  accordion: {
    backgroundColor: colors.white,
    borderRadius: 14,
    marginBottom: 10,
    overflow: 'hidden',
    elevation: 1,
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  accordionIconBg: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.dashBg,
    alignItems: 'center', justifyContent: 'center',
  },
  accordionTitle: { flex: 1, ...typography.h4, color: colors.textDark },
  chevron: { fontSize: 11, color: colors.textLight },
  accordionBody: {
    paddingHorizontal: 16, paddingBottom: 16,
    borderTopWidth: 1, borderTopColor: colors.inputBorder,
  },
  contentItem: { marginTop: 12 },
  contentHeading: { ...typography.label, color: colors.textAccent, marginBottom: 4 },
  contentBody: { ...typography.body, color: colors.textMid, lineHeight: 22 },
});
