import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../config/theme';
import { KigenKanjiBackground } from '../components/KigenKanjiBackground';

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
      text: "Wherever you are, be there totally. If you find your here and now intolerable, you have options: remove yourself, change it, or accept it totally.",
      author: "Eckhart Tolle"
    },
    {
      text: "The present moment is the only time over which we have dominion.",
      author: "Thích Nhất Hạnh"
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
      text: "We are not going to be able to operate our Spaceship Earth successfully nor for much longer unless we see it as a whole spaceship and our fate as common.",
      author: "Buckminster Fuller"
    },
    {
      text: "Sometimes you need to disconnect to stay connected. Sometimes you need to go offline to get your life online.",
      author: "Anonymous"
    },
    {
      text: "Technology is a useful servant but a dangerous master.",
      author: "Christian Lous Lange"
    }
  ]
};

interface FlipDigitProps {
  digit: string;
  nextDigit: string;
  color: string;
  isFlipping: boolean;
}

const FlipDigit: React.FC<FlipDigitProps> = ({ digit, nextDigit, color, isFlipping }) => {
  const flipAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isFlipping) {
      flipAnimation.setValue(0);
      Animated.timing(flipAnimation, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }
  }, [isFlipping, flipAnimation]);

  const topRotation = flipAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['0deg', '-90deg', '-90deg'],
  });

  const bottomRotation = flipAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['90deg', '90deg', '0deg'],
  });

  const topOpacity = flipAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0, 0],
  });

  const bottomOpacity = flipAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  return (
    <View style={styles.digitContainer}>
      {/* Top half - current digit */}
      <Animated.View 
        style={[
          styles.digitHalf,
          styles.digitTop,
          { backgroundColor: color },
          {
            transform: [{ rotateX: topRotation }],
            opacity: topOpacity,
          },
        ]}
      >
        <Text style={styles.digitText}>{digit}</Text>
      </Animated.View>

      {/* Bottom half - next digit */}
      <Animated.View 
        style={[
          styles.digitHalf,
          styles.digitBottom,
          { backgroundColor: color },
          {
            transform: [{ rotateX: bottomRotation }],
            opacity: bottomOpacity,
          },
        ]}
      >
        <Text style={styles.digitText}>{nextDigit}</Text>
      </Animated.View>

      {/* Static bottom half - current digit */}
      <View style={[styles.digitHalf, styles.digitBottom, { backgroundColor: color }]}>
        <Text style={styles.digitText}>{digit}</Text>
      </View>

      {/* Static top half - next digit */}
      <View style={[styles.digitHalf, styles.digitTop, { backgroundColor: color }]}>
        <Text style={styles.digitText}>{nextDigit}</Text>
      </View>
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
  const [selectedQuote] = useState(() => {
    // Select random quote based on mode
    const quotes = FOCUS_QUOTES[mode.id as keyof typeof FOCUS_QUOTES] || FOCUS_QUOTES.meditation;
    return quotes[Math.floor(Math.random() * quotes.length)];
  });

  const pulseAnimation = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    StatusBar.setHidden(true);
    return () => StatusBar.setHidden(false);
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

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && !isPaused && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prevTime => {
          if (prevTime <= 1) {
            setIsRunning(false);
            onComplete();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, isPaused, timeLeft, onComplete]);

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
    setIsPaused(!isPaused);
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
            />
            <FlipDigit 
              digit={prevTime.h2} 
              nextDigit={currentTime.h2} 
              color={mode.color} 
              isFlipping={isFlipping.h2}
            />
            <Text style={[styles.separator, { color: mode.color }]}>:</Text>
            <FlipDigit 
              digit={prevTime.m1} 
              nextDigit={currentTime.m1} 
              color={mode.color} 
              isFlipping={isFlipping.m1}
            />
            <FlipDigit 
              digit={prevTime.m2} 
              nextDigit={currentTime.m2} 
              color={mode.color} 
              isFlipping={isFlipping.m2}
            />
            <Text style={[styles.separator, { color: mode.color }]}>:</Text>
            <FlipDigit 
              digit={prevTime.s1} 
              nextDigit={currentTime.s1} 
              color={mode.color} 
              isFlipping={isFlipping.s1}
            />
            <FlipDigit 
              digit={prevTime.s2} 
              nextDigit={currentTime.s2} 
              color={mode.color} 
              isFlipping={isFlipping.s2}
            />
          </View>
          
          <View style={styles.timeLabels}>
            <Text style={styles.timeLabel}>HOURS</Text>
            <Text style={styles.timeLabel}>MINUTES</Text>
            <Text style={styles.timeLabel}>SECONDS</Text>
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
});
