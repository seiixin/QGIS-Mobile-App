import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';

const { width, height } = Dimensions.get('window');
const BOTTOM_HEIGHT = height * 0.38;

// ─── Slide data ───────────────────────────────────────────────────────────────
const slides = [
  {
    id: '1',
    title: 'Stay Prepared',
    subtitle: 'Build your response plan before the ground starts moving.',
    image: require('../../../assets/stay-prepared.png'),
    btnLabel: 'Next',
    gradientColors: ['#1a2fd4', '#3B4FE0', '#6B7FFF'],
    bgColor: '#3B4FE0',
    titleColor: '#202964',
    highlightColor: '#202964',
    btnGradient: ['#5B6EF5', '#202964'],
    orbs: [
      { color: 'rgba(255,255,255,0.13)', size: width * 1.1, top: -width * 0.45, left: -width * 0.25 },
      { color: 'rgba(120,150,255,0.28)', size: width * 0.75, top: height * 0.12, right: -width * 0.22 },
      { color: 'rgba(180,200,255,0.18)', size: width * 0.55, bottom: BOTTOM_HEIGHT + 30, left: -width * 0.1 },
    ],
  },
  {
    id: '2',
    title: 'Know Your Area',
    subtitle: 'Explore hazard zones, live map layers, and safer nearby areas.',
    image: require('../../../assets/know-your-area.png'),
    btnLabel: 'Next',
    highlightWord: 'Area',
    gradientColors: ['#e65100', '#F9A825', '#FFD54F'],
    bgColor: '#F9A825',
    titleColor: '#5D4037',
    highlightColor: '#5D4037',
    btnGradient: ['#A0714F', '#4E2C0E'],
    orbs: [
      { color: 'rgba(255,255,255,0.20)', size: width * 1.1, top: -width * 0.45, left: -width * 0.25 },
      { color: 'rgba(255,210,80,0.35)',  size: width * 0.75, top: height * 0.12, right: -width * 0.22 },
      { color: 'rgba(255,240,180,0.22)', size: width * 0.55, bottom: BOTTOM_HEIGHT + 30, left: -width * 0.1 },
    ],
  },
  {
    id: '3',
    title: 'Stay Safe',
    subtitle: 'Keep guidance and emergency contacts ready at any time.',
    image: require('../../../assets/stay-safe.png'),
    btnLabel: "Let's Start",
    gradientColors: ['#1a2fd4', '#3B4FE0', '#6B7FFF'],
    bgColor: '#3B4FE0',
    titleColor: '#202964',
    highlightColor: '#202964',
    btnGradient: ['#5B6EF5', '#202964'],
    orbs: [
      { color: 'rgba(255,255,255,0.13)', size: width * 1.1, top: -width * 0.45, left: -width * 0.25 },
      { color: 'rgba(120,150,255,0.28)', size: width * 0.75, top: height * 0.12, right: -width * 0.22 },
      { color: 'rgba(180,200,255,0.18)', size: width * 0.55, bottom: BOTTOM_HEIGHT + 30, left: -width * 0.1 },
    ],
  },
];

// ─── Animated orb ─────────────────────────────────────────────────────────────
function AnimatedOrb({ color, size, style, delay = 0, duration = 3000 }) {
  const scale   = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.85)).current;
  const shiftX  = useRef(new Animated.Value(0)).current;
  const shiftY  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.delay(delay),
      Animated.timing(scale, { toValue: 1.18, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(scale, { toValue: 0.88, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: duration * 0.5, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ])).start();
    Animated.loop(Animated.sequence([
      Animated.delay(delay),
      Animated.timing(opacity, { toValue: 1,    duration: duration * 0.8, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0.55, duration: duration * 0.8, useNativeDriver: true }),
    ])).start();
    Animated.loop(Animated.sequence([
      Animated.delay(delay),
      Animated.timing(shiftX, { toValue: 14,  duration: duration * 1.3, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(shiftX, { toValue: -10, duration: duration * 1.3, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(shiftX, { toValue: 0,   duration: duration,       easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    ])).start();
    Animated.loop(Animated.sequence([
      Animated.delay(delay + 400),
      Animated.timing(shiftY, { toValue: -16, duration: duration * 1.2, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(shiftY, { toValue: 12,  duration: duration * 1.2, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(shiftY, { toValue: 0,   duration: duration,       easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    ])).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.orb,
        { width: size, height: size, backgroundColor: color },
        style,
        { opacity, transform: [{ scale }, { translateX: shiftX }, { translateY: shiftY }] },
      ]}
    />
  );
}

// ─── Floating character image ─────────────────────────────────────────────────
function FloatingImage({ source, style }) {
  const floatY = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(floatY, { toValue: -18, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(floatY, { toValue: 0,   duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ])).start();
  }, []);
  return (
    <Animated.Image
      source={source}
      style={[style, { transform: [{ translateY: floatY }] }]}
      resizeMode="contain"
    />
  );
}

// ─── Animated text — cross-fade on slide change ───────────────────────────────
function CrossFadeText({ value, style, children }) {
  const opacity = useRef(new Animated.Value(1)).current;
  const prevValue = useRef(value);

  useEffect(() => {
    if (prevValue.current !== value) {
      prevValue.current = value;
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0, duration: 160, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 260, useNativeDriver: true }),
      ]).start();
    }
  }, [value]);

  return (
    <Animated.View style={{ opacity }}>
      {style ? <Text style={style}>{children}</Text> : children}
    </Animated.View>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function OnboardingScreen({ navigation }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);
  const slide = slides[currentIndex];

  const titleFont = Platform.OS === 'android' ? 'sans-serif-medium' : undefined;

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
      setCurrentIndex(currentIndex + 1);
    } else {
      navigation.replace('Auth');
    }
  };

  const handleSkip = () => navigation.replace('Auth');

  // ── SCROLLING LAYER: gradient + orbs + character + wave + white sheet ────────
  const renderSlide = ({ item }) => (
    <View style={[styles.slide, { backgroundColor: item.bgColor }]}>
      <LinearGradient
        colors={item.gradientColors}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
      />

      {item.orbs.map((orb, i) => {
        const { color, size, ...pos } = orb;
        return <AnimatedOrb key={i} color={color} size={size} style={pos} delay={i * 600} duration={2800 + i * 500} />;
      })}

      {/* Character floats in the upper section */}
      <View style={styles.illustrationContainer}>
        <FloatingImage source={item.image} style={styles.illustration} />
      </View>

      {/* White container + wave — swipes with the background */}
      <View style={styles.bottomSheet}>
        <Svg height="70" width={width} viewBox={`0 0 ${width} 70`} style={styles.wave}>
          <Path
            d={`M0,35 Q${width * 0.25},0 ${width * 0.5},35 T${width},35 L${width},70 L0,70 Z`}
            fill="white"
          />
        </Svg>
        {/* Empty — text content is in the fixed overlay below */}
        <View style={{ flex: 1 }} />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={slide.bgColor} />

      {/* ── Layer 1: scrollable background ── */}
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        scrollEnabled
        showsHorizontalScrollIndicator={false}
        style={StyleSheet.absoluteFill}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(idx);
        }}
      />

      {/* ── Layer 2: fixed overlay — logo, title, subtitle, button, dots ── */}

      {/* Logo + app name — top center, never moves */}
      <View style={styles.logoRow} pointerEvents="none">
        <View style={styles.logoPill}>
          <Image
            source={require('../../../assets/smartquake-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={[styles.appName, { fontFamily: titleFont, color: '#202964' }]}>SmartQuake</Text>
        </View>
      </View>

      {/* Fixed bottom content panel — sits on top of the white area */}
      <View style={styles.fixedContent} pointerEvents="box-none">

        {/* Title — cross-fades on slide change */}
        <CrossFadeText
          value={slide.title}
          style={[styles.title, { fontFamily: titleFont, color: slide.titleColor }]}
        >
          {slide.highlightWord
            ? slide.title.split(slide.highlightWord).map((part, i, arr) =>
                i < arr.length - 1 ? (
                  <React.Fragment key={i}>
                    <Text style={{ color: slide.titleColor }}>{part}</Text>
                    <Text style={{ color: slide.highlightColor }}>{slide.highlightWord}</Text>
                  </React.Fragment>
                ) : (
                  <Text key={i} style={{ color: slide.titleColor }}>{part}</Text>
                )
              )
            : slide.title
          }
        </CrossFadeText>

        {/* Subtitle — cross-fades on slide change */}
        <CrossFadeText value={slide.subtitle} style={styles.subtitle}>
          {slide.subtitle}
        </CrossFadeText>

        {/* Button — fades on label + color change */}
        <CrossFadeText value={slide.btnLabel} style={null}>
          <TouchableOpacity
            style={styles.btn}
            onPress={handleNext}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={slide.btnGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.btnGradient}
            >
              <Text style={[styles.btnText, { fontFamily: titleFont }]}>{slide.btnLabel}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </CrossFadeText>

        {/* Dots centered, Skip absolutely right */}
        <View style={styles.footer}>
          <View style={styles.dots}>
            {slides.map((_, i) => (
              <View key={i} style={[styles.dot, i === currentIndex ? styles.dotActive : styles.dotInactive]} />
            ))}
          </View>
          <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  slide: { width, height, overflow: 'hidden' },
  orb: { position: 'absolute', borderRadius: 9999 },

  illustrationContainer: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    bottom: BOTTOM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustration: { width: width * 0.74, height: height * 0.44 },

  // white sheet scrolls with the slide
  bottomSheet: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: BOTTOM_HEIGHT,
    backgroundColor: '#fff',
  },
  wave: { position: 'absolute', top: -69, left: 0 },

  // ── Fixed overlay ──────────────────────────────────────────────────────────

  logoRow: {
    position: 'absolute',
    top: 52,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 30,
  },
  logoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 50,
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  logo: { width: 36, height: 36 },
  appName: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.4,
  },

  // fixed content sits over the white area
  fixedContent: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: BOTTOM_HEIGHT,
    paddingHorizontal: 28,
    paddingTop: 28,
    alignItems: 'center',
    zIndex: 20,
  },

  title: {
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 22,
  },

  btn: {
    borderRadius: 30,
    overflow: 'hidden',
    marginBottom: 18,
    elevation: 6,
    shadowColor: '#202964',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    minWidth: 200,
  },
  btnGradient: {
    paddingVertical: 14,
    paddingHorizontal: 60,
    alignItems: 'center',
    borderRadius: 30,
  },
  btnText: { fontSize: 16, fontWeight: '700', color: '#fff', letterSpacing: 0.5 },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 4,
  },
  dots: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  dot: { height: 8, borderRadius: 4 },
  dotActive:   { width: 24, backgroundColor: '#202964' },
  dotInactive: { width: 8,  backgroundColor: '#6B7A99' },
  skipBtn: { position: 'absolute', right: 4 },
  skipText: { fontSize: 13, fontWeight: '700', color: '#202964' },
});
