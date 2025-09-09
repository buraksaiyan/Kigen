import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
  AppState,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { activateKeepAwake, deactivateKeepAwake } from 'expo-keep-awake';
import * as Notifications from 'expo-notifications';
import { theme } from '../config/theme';
import { KigenKanjiBackground } from '../components/KigenKanjiBackground';
import BackgroundTimerService from '../services/BackgroundTimerService';

const { width, height } = Dimensions.get('window');

interface FocusMode {
  id: string;
  title: string;
  subtitle: string;
  color: string;
  description: string;
}

interface CountdownScreenProps {
  visible: boolean;
  mode: FocusMode;
  totalHours: number;
  totalMinutes: number;
  onComplete: () => void;
  onPause: () => void;
  onStop: () => void;
}

// Mode-specific quote databases
const FOCUS_QUOTES = {
  flow: [
    {
      text: "Flow state is being completely involved in an activity for its own sake. The ego falls away.",
      author: "Mihaly Csikszentmihalyi"
    },
    {
      text: "In the zone, there is no time, no thought, no self - only pure action.",
      author: "Ancient Zen Saying"
    },
    {
      text: "The deepest experience of the creator arises out of a state of intensified attention.",
      author: "Dag Hammarskjöld"
    },
    {
      text: "Concentration is the secret of strength in politics, in war, in trade, in short in all management.",
      author: "Ralph Waldo Emerson"
    },
    {
      text: "The ability to concentrate and to use your time well is everything if you want to succeed.",
      author: "Lee Iacocca"
    },
    {
      text: "Focus is a matter of deciding what things you're not going to do.",
      author: "John Carmack"
    },
    {
      text: "The successful warrior is the average man with laser-like focus.",
      author: "Bruce Lee"
    },
    {
      text: "Where focus goes, energy flows and results show.",
      author: "Tony Robbins"
    },
    {
      text: "It is during our darkest moments that we must focus to see the light.",
      author: "Aristotle"
    },
    {
      text: "The art of being wise is knowing what to overlook.",
      author: "William James"
    },
    {
      text: "Concentrate all your thoughts upon the work at hand. The sun's rays do not burn until brought to a focus.",
      author: "Alexander Graham Bell"
    },
    {
      text: "One reason so few of us achieve what we truly want is that we never direct our focus; we never concentrate our power.",
      author: "Tony Robbins"
    },
    {
      text: "The immersion in the flow of pure activity is in itself beautiful and uplifting.",
      author: "Mihaly Csikszentmihalyi"
    },
    {
      text: "When we are in flow, the ego disappears and we become the activity.",
      author: "Mihaly Csikszentmihalyi"
    },
    {
      text: "Deep work is the ability to focus without distraction on a cognitively demanding task.",
      author: "Cal Newport"
    }
  ],
  executioner: [
    {
      text: "Excellence is never an accident. It is always the result of high intention and intelligent execution.",
      author: "Aristotle"
    },
    {
      text: "The way to get started is to quit talking and begin doing.",
      author: "Walt Disney"
    },
    {
      text: "Success is where preparation and opportunity meet.",
      author: "Bobby Unser"
    },
    {
      text: "Do something today that your future self will thank you for.",
      author: "Sean Patrick Flanery"
    },
    {
      text: "The expert in anything was once a beginner who refused to give up.",
      author: "Helen Hayes"
    },
    {
      text: "Discipline is choosing between what you want now and what you want most.",
      author: "Abraham Lincoln"
    },
    {
      text: "Action is the foundational key to all success.",
      author: "Pablo Picasso"
    },
    {
      text: "You don't have to be great to get started, but you have to get started to be great.",
      author: "Les Brown"
    },
    {
      text: "The future depends on what you do today.",
      author: "Mahatma Gandhi"
    },
    {
      text: "A goal without a plan is just a wish.",
      author: "Antoine de Saint-Exupéry"
    },
    {
      text: "Don't wait for opportunity. Create it.",
      author: "George Bernard Shaw"
    },
    {
      text: "The time for action is now. It's never too late to do something.",
      author: "Carl Sandburg"
    },
    {
      text: "Execution is everything. Ideas are worthless without action.",
      author: "Gary Vaynerchuk"
    },
    {
      text: "Stop talking about what you're going to do and start doing it.",
      author: "Gary Vaynerchuk"
    },
    {
      text: "The difference between ordinary and extraordinary is that little extra.",
      author: "Jimmy Johnson"
    },
    {
      text: "Champions don't become champions in the ring. They become champions in their training.",
      author: "Muhammad Ali"
    },
    {
      text: "Success is the sum of small efforts repeated day in and day out.",
      author: "Robert Collier"
    },
    {
      text: "What we think, we become. What we feel, we attract. What we imagine, we create.",
      author: "Buddha"
    }
  ],
  meditation: [
    {
      text: "Focus on the present moment. It is the only time over which we have dominion.",
      author: "Thích Nhất Hạnh"
    },
    {
      text: "Meditation is not about stopping thoughts, but recognizing that we are more than our thoughts.",
      author: "Arianna Huffington"
    },
    {
      text: "Peace comes from within. Do not seek it without.",
      author: "Buddha"
    },
    {
      text: "Wherever you are, be there totally.",
      author: "Eckhart Tolle"
    },
    {
      text: "The present moment is the only time over which we have dominion.",
      author: "Thích Nhất Hạnh"
    },
    {
      text: "Meditation is the tongue of the soul and the language of our spirit.",
      author: "Jeremy Taylor"
    },
    {
      text: "The goal of meditation is not to control your thoughts, it's to stop letting them control you.",
      author: "Anonymous"
    },
    {
      text: "Quiet the mind, and the soul will speak.",
      author: "Ma Jaya Sati Bhagavati"
    },
    {
      text: "In the midst of movement and chaos, keep stillness inside of you.",
      author: "Deepak Chopra"
    },
    {
      text: "Meditation is a way for nourishing and blossoming the divinity within you.",
      author: "Amit Ray"
    },
    {
      text: "Your calm mind is the ultimate weapon against your challenges.",
      author: "Bryant McGill"
    },
    {
      text: "The mind is everything. What you think you become.",
      author: "Buddha"
    },
    {
      text: "Meditation brings wisdom; lack of meditation leaves ignorance.",
      author: "Buddha"
    },
    {
      text: "The quieter you become, the more able you are to hear.",
      author: "Rumi"
    },
    {
      text: "Meditation is not evasion; it is a serene encounter with reality.",
      author: "Thích Nhất Hạnh"
    },
    {
      text: "Through meditation, the higher self is experienced.",
      author: "Bhagavad Gita"
    },
    {
      text: "Be still and know that I am God.",
      author: "Psalm 46:10"
    },
    {
      text: "The soul becomes dyed with the color of its thoughts.",
      author: "Marcus Aurelius"
    }
  ],
  body: [
    {
      text: "The body achieves what the mind believes.",
      author: "Napoleon Hill"
    },
    {
      text: "Strength does not come from physical capacity. It comes from an indomitable will.",
      author: "Mahatma Gandhi"
    },
    {
      text: "The groundwork for all happiness is good health.",
      author: "Leigh Hunt"
    },
    {
      text: "Take care of your body. It's the only place you have to live.",
      author: "Jim Rohn"
    },
    {
      text: "Physical fitness is not only one of the most important keys to a healthy body, it is the basis of dynamic and creative intellectual activity.",
      author: "John F. Kennedy"
    },
    {
      text: "A healthy outside starts from the inside.",
      author: "Robert Urich"
    },
    {
      text: "Your body can stand almost anything. It's your mind that you have to convince.",
      author: "Anonymous"
    },
    {
      text: "Health is not about the weight you lose, but about the life you gain.",
      author: "Dr. Josh Axe"
    },
    {
      text: "The first wealth is health.",
      author: "Ralph Waldo Emerson"
    },
    {
      text: "Movement is a medicine for creating change in a person's physical, emotional, and mental states.",
      author: "Carol Welch"
    },
    {
      text: "The pain you feel today will be the strength you feel tomorrow.",
      author: "Anonymous"
    },
    {
      text: "Exercise is king. Nutrition is queen. Put them together and you've got a kingdom.",
      author: "Jack LaLanne"
    },
    {
      text: "The human body is the best picture of the human soul.",
      author: "Ludwig Wittgenstein"
    },
    {
      text: "A strong body makes the mind strong.",
      author: "Thomas Jefferson"
    },
    {
      text: "Health is a relationship between you and your body.",
      author: "Terri Guillemets"
    },
    {
      text: "Wellness is not a 'medical fix' but a way of living.",
      author: "Greg Anderson"
    },
    {
      text: "To keep the body in good health is a duty... otherwise we shall not be able to keep our mind strong and clear.",
      author: "Buddha"
    }
  ],
  notech: [
    {
      text: "Almost everything will work again if you unplug it for a few minutes, including you.",
      author: "Anne Lamott"
    },
    {
      text: "The real question is not whether machines think but whether men do.",
      author: "B.F. Skinner"
    },
    {
      text: "Sometimes you need to disconnect to stay connected. Sometimes you need to go offline to get your life online.",
      author: "Anonymous"
    },
    {
      text: "Technology is a useful servant but a dangerous master.",
      author: "Christian Lous Lange"
    },
    {
      text: "The art of living is more like wrestling than dancing.",
      author: "Marcus Aurelius"
    },
    {
      text: "In a world of noise, find your silence.",
      author: "Anonymous"
    },
    {
      text: "Digital minimalism is a philosophy of technology use in which you focus your online time on a small number of carefully selected activities.",
      author: "Cal Newport"
    },
    {
      text: "The most precious gift we can offer others is our presence.",
      author: "Thích Nhất Hạnh"
    },
    {
      text: "Silence is not empty. It is full of answers.",
      author: "Anonymous"
    },
    {
      text: "We have become slaves to our own devices.",
      author: "Sherry Turkle"
    },
    {
      text: "Connection is why we're here; it is what gives purpose and meaning to our lives.",
      author: "Brené Brown"
    },
    {
      text: "The cave you fear to enter holds the treasure you seek.",
      author: "Joseph Campbell"
    },
    {
      text: "Simplicity is the ultimate sophistication.",
      author: "Leonardo da Vinci"
    },
    {
      text: "Be where you are, not where you think you should be.",
      author: "Anonymous"
    },
    {
      text: "Nature does not hurry, yet everything is accomplished.",
      author: "Lao Tzu"
    },
    {
      text: "The quieter you become, the more you can hear.",
      author: "Ram Dass"
    },
    {
      text: "Solitude is where I place my chaos to rest and awaken my inner peace.",
      author: "Nikki Rowe"
    },
    {
      text: "In the depth of silence is the voice of God.",
      author: "Sathya Sai Baba"
    }
  ]
};

interface FlipDigitProps {
  digit: string;
  nextDigit: string;
  color: string;
  isFlipping: boolean;
  size?: 'large' | 'small'; // New prop for different sizes
}

const FlipDigit: React.FC<FlipDigitProps> = ({ digit, nextDigit, color, isFlipping, size = 'large' }) => {
  const flipAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isFlipping) {
      flipAnimation.setValue(0);
      Animated.timing(flipAnimation, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();
    }
  }, [isFlipping, flipAnimation]);

  const topRotation = flipAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['0deg', '-90deg', '-90deg'],
    extrapolate: 'clamp',
  });

  const bottomRotation = flipAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['90deg', '90deg', '0deg'],
    extrapolate: 'clamp',
  });

  return (
    <View style={[styles.digitContainer, size === 'small' ? styles.digitContainerSmall : styles.digitContainerLarge]}>
      {/* Main static digit - what user normally sees */}
      <View style={[styles.digitCard, { backgroundColor: color }, size === 'small' ? styles.digitCardSmall : styles.digitCardLarge]}>
        <Text style={[styles.digitText, size === 'small' ? styles.digitTextSmall : styles.digitTextLarge]}>{isFlipping ? nextDigit : digit}</Text>
      </View>
      
      {/* Flip animation overlay - only during flip */}
      {isFlipping && (
        <View style={styles.flipContainer}>
          {/* Top half flipping */}
          <Animated.View 
            style={[
              styles.digitHalf,
              styles.digitTop,
              { backgroundColor: color },
              size === 'small' ? styles.digitHalfSmall : styles.digitHalfLarge,
              {
                transform: [{ rotateX: topRotation }],
                zIndex: 3,
              },
            ]}
          >
            <Text style={[styles.digitText, size === 'small' ? styles.digitTextSmall : styles.digitTextLarge]}>{digit}</Text>
          </Animated.View>

          {/* Bottom half flipping */}
          <Animated.View 
            style={[
              styles.digitHalf,
              styles.digitBottom,
              { backgroundColor: color },
              size === 'small' ? styles.digitHalfSmall : styles.digitHalfLarge,
              {
                transform: [{ rotateX: bottomRotation }],
                zIndex: 3,
              },
            ]}
          >
            <Text style={[styles.digitText, size === 'small' ? styles.digitTextSmall : styles.digitTextLarge]}>{nextDigit}</Text>
          </Animated.View>
        </View>
      )}
    </View>
  );
};

export const CountdownScreen: React.FC<CountdownScreenProps> = ({
  visible,
  mode,
  totalHours,
  totalMinutes,
  onComplete,
  onPause,
  onStop,
}) => {
  const [timeLeft, setTimeLeft] = useState(totalHours * 3600 + totalMinutes * 60);
  const [isRunning, setIsRunning] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [prevTime, setPrevTime] = useState({ h1: '0', h2: '0', m1: '0', m2: '0', s1: '0', s2: '0' });
  const [isFlipping, setIsFlipping] = useState({ h1: false, h2: false, m1: false, m2: false, s1: false, s2: false });
  const [startTime] = useState(Date.now());
  const [selectedQuote] = useState(() => {
    // Select random quote based on mode
    const quotes = FOCUS_QUOTES[mode.id as keyof typeof FOCUS_QUOTES] || FOCUS_QUOTES.meditation;
    return quotes[Math.floor(Math.random() * quotes.length)];
  });

  const pulseAnimation = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    StatusBar.setHidden(true);
    
    // Keep screen awake during focus session
    activateKeepAwake();
    
    // Request notification permissions for future use
    BackgroundTimerService.requestPermissions();
    
    return () => {
      StatusBar.setHidden(false);
      deactivateKeepAwake();
    };
  }, []);

  useEffect(() => {
    const pulse = () => {
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start(() => pulse());
    };
    pulse();
  }, [pulseAnimation]);

  // Show notification when timer starts
  useEffect(() => {
    if (visible && isRunning && !isPaused) {
      const showStartNotification = async () => {
        try {
          const totalTimeFormatted = `${totalHours.toString().padStart(2, '0')}:${totalMinutes.toString().padStart(2, '0')}:00`;
          
          await Notifications.scheduleNotificationAsync({
            content: {
              title: `${mode.title} Focus Mode Active`,
              body: `Your ${totalTimeFormatted} focus session has started. Stay focused!`,
              data: { 
                sessionId: startTime,
                mode: mode.title,
                duration: totalHours * 3600 + totalMinutes * 60 
              },
            },
            trigger: null, // Show immediately
          });
        } catch (error) {
          console.log('Failed to show start notification:', error);
        }
      };

      showStartNotification();
    }
  }, [visible, isRunning, isPaused, mode.title, totalHours, totalMinutes, startTime]);

  // TODO: Re-implement background timer sync after fixing the issues
  // useEffect(() => {
  //   const handleAppStateChange = async (nextAppState: string) => {
  //     // Background sync logic will be added back after fixes
  //   };
  //   const subscription = AppState.addEventListener('change', handleAppStateChange);
  //   return () => subscription?.remove();
  // }, [onComplete]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && !isPaused && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prevTime => {
          const newTime = prevTime - 1;
          if (newTime <= 0) {
            setIsRunning(false);
            onComplete();
            return 0;
          }
          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRunning, isPaused, onComplete]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    return {
      h1: Math.floor(h / 10).toString(),
      h2: (h % 10).toString(),
      m1: Math.floor(m / 10).toString(),
      m2: (m % 10).toString(),
      s1: Math.floor(s / 10).toString(),
      s2: (s % 10).toString(),
    };
  };

  const currentTime = formatTime(timeLeft);

  useEffect(() => {
    // Check for digit changes to trigger flip animations
    const newFlipping = {
      h1: currentTime.h1 !== prevTime.h1,
      h2: currentTime.h2 !== prevTime.h2,
      m1: currentTime.m1 !== prevTime.m1,
      m2: currentTime.m2 !== prevTime.m2,
      s1: currentTime.s1 !== prevTime.s1,
      s2: currentTime.s2 !== prevTime.s2,
    };

    setIsFlipping(newFlipping);
    setPrevTime(currentTime);

    // Reset flipping state after animation
    setTimeout(() => {
      setIsFlipping({ h1: false, h2: false, m1: false, m2: false, s1: false, s2: false });
    }, 600);
  }, [timeLeft]);

  const handlePause = () => {
    const newPausedState = !isPaused;
    setIsPaused(newPausedState);
    onPause();
  };

  const handleStop = () => {
    setIsRunning(false);
    onStop();
  };

  const getProgressPercentage = () => {
    const totalSeconds = totalHours * 3600 + totalMinutes * 60;
    return ((totalSeconds - timeLeft) / totalSeconds) * 100;
  };

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <KigenKanjiBackground />
      
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.modeTitle, { color: mode.color }]}>
            {mode.title}
          </Text>
          <View style={[styles.progressBar, { backgroundColor: `${mode.color}20` }]}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  backgroundColor: mode.color,
                  width: `${getProgressPercentage()}%` 
                }
              ]} 
            />
          </View>
        </View>

        {/* Zen Clock Display */}
        <Animated.View 
          style={[
            styles.clockContainer,
            { transform: [{ scale: pulseAnimation }] }
          ]}
        >
          <View style={styles.timeRow}>
            <FlipDigit 
              digit={prevTime.h1} 
              nextDigit={currentTime.h1} 
              color={mode.color} 
              isFlipping={isFlipping.h1}
              size="large"
            />
            <FlipDigit 
              digit={prevTime.h2} 
              nextDigit={currentTime.h2} 
              color={mode.color} 
              isFlipping={isFlipping.h2}
              size="large"
            />
            <Text style={[styles.separatorLarge, { color: mode.color }]}>:</Text>
            <FlipDigit 
              digit={prevTime.m1} 
              nextDigit={currentTime.m1} 
              color={mode.color} 
              isFlipping={isFlipping.m1}
              size="large"
            />
            <FlipDigit 
              digit={prevTime.m2} 
              nextDigit={currentTime.m2} 
              color={mode.color} 
              isFlipping={isFlipping.m2}
              size="large"
            />
            <Text style={[styles.separatorSmall, { color: mode.color }]}>:</Text>
            <FlipDigit 
              digit={prevTime.s1} 
              nextDigit={currentTime.s1} 
              color={mode.color} 
              isFlipping={isFlipping.s1}
              size="small"
            />
            <FlipDigit 
              digit={prevTime.s2} 
              nextDigit={currentTime.s2} 
              color={mode.color} 
              isFlipping={isFlipping.s2}
              size="small"
            />
          </View>
          
          <View style={styles.timeLabels}>
            <Text style={styles.timeLabelLarge}>HOURS</Text>
            <Text style={styles.timeLabelLarge}>MINUTES</Text>
            <Text style={styles.timeLabelSmall}>SECONDS</Text>
          </View>
        </Animated.View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.controlButton, styles.secondaryButton]}
            onPress={handleStop}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>Stop</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, styles.primaryButton, { backgroundColor: mode.color }]}
            onPress={handlePause}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>
              {isPaused ? 'Resume' : 'Pause'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Zen Quote */}
        <View style={styles.quoteContainer}>
          <Text style={styles.quoteText}>
            "{selectedQuote?.text || 'Focus on the present moment.'}"
          </Text>
          <Text style={styles.quoteAuthor}>— {selectedQuote?.author || 'Anonymous'}</Text>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  header: {
    alignItems: 'center',
    paddingTop: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  modeTitle: {
    ...theme.typography.h2,
    fontWeight: '700',
    marginBottom: theme.spacing.md,
  },
  progressBar: {
    width: width * 0.8,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  clockContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  digitContainer: {
    width: 60,
    height: 80,
    marginHorizontal: 2,
    position: 'relative',
  },
  digitHalf: {
    position: 'absolute',
    width: '100%',
    height: '50%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  digitTop: {
    top: 0,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.2)',
  },
  digitBottom: {
    bottom: 0,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  digitText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  separator: {
    fontSize: 32,
    fontWeight: 'bold',
    marginHorizontal: theme.spacing.sm,
  },
  separatorLarge: {
    fontSize: 48,
    fontWeight: 'bold',
    marginHorizontal: theme.spacing.sm,
  },
  separatorSmall: {
    fontSize: 28,
    fontWeight: 'bold',
    marginHorizontal: theme.spacing.xs,
  },
  timeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: theme.spacing.lg,
  },
  timeLabel: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    fontWeight: '600',
    letterSpacing: 2,
  },
  timeLabelLarge: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    fontWeight: '600',
    letterSpacing: 2,
    fontSize: 14,
  },
  timeLabelSmall: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    fontWeight: '600',
    letterSpacing: 1,
    fontSize: 10,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  controlButton: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.md,
    minWidth: 120,
    alignItems: 'center',
  },
  primaryButton: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: theme.colors.text.secondary,
  },
  primaryButtonText: {
    ...theme.typography.bodyLarge,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  secondaryButtonText: {
    ...theme.typography.bodyLarge,
    color: theme.colors.text.secondary,
    fontWeight: '700',
  },
  quoteContainer: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  quoteText: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: theme.spacing.sm,
  },
  quoteAuthor: {
    ...theme.typography.caption,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
  },
  digitCard: {
    width: 60,
    height: 80,
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  flipContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  // Large digit styles (for hours and minutes)
  digitContainerLarge: {
    width: 80,
    height: 100,
  },
  digitCardLarge: {
    width: 80,
    height: 100,
  },
  digitTextLarge: {
    fontSize: 48,
  },
  digitHalfLarge: {
    height: 50,
  },
  // Small digit styles (for seconds)
  digitContainerSmall: {
    width: 50,
    height: 70,
  },
  digitCardSmall: {
    width: 50,
    height: 70,
  },
  digitTextSmall: {
    fontSize: 28,
  },
  digitHalfSmall: {
    height: 35,
  },
});
