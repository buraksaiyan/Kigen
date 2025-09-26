import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  AppState,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import Svg, { Circle } from 'react-native-svg';
import { theme } from '../config/theme';
import BackgroundTimerService from '../services/BackgroundTimerService';
import TimerSoundService from '../services/TimerSoundService';
import { useSettings } from '../hooks/useSettings';

const { width } = Dimensions.get('window');

interface FocusMode {
  id: string;
  title: string;
  subtitle: string;
  color: string;
  description: string;
}

interface Goal {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  createdAt: string;
}

interface CountdownScreenProps {
  visible: boolean;
  mode: FocusMode;
  totalHours: number;
  totalMinutes: number;
  breakMinutes: number;
  selectedGoal?: Goal | null; // Add goal support
  onComplete: () => void;
  onPause: () => void;
  onEarlyFinish: () => void;
  onAbort: () => void;
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
  /*
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
  */
};

export const CountdownScreen: React.FC<CountdownScreenProps> = ({
  visible,
  mode,
  totalHours,
  totalMinutes,
  breakMinutes,
  selectedGoal,
  onComplete,
  onPause,
  onEarlyFinish,
  onAbort,
}) => {
  const [timeLeft, setTimeLeft] = useState(totalHours * 3600 + totalMinutes * 60);
  const [isRunning, setIsRunning] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [startTime] = useState(Date.now());
  const [selectedQuote] = useState(() => {
    // Select random quote based on mode
    const quotes = FOCUS_QUOTES[mode.id as keyof typeof FOCUS_QUOTES] || FOCUS_QUOTES.meditation;
    return quotes[Math.floor(Math.random() * quotes.length)];
  });

  // Break-related state
  const [isInBreak, setIsInBreak] = useState(false);
  const [breakTimeLeft, setBreakTimeLeft] = useState(breakMinutes * 60);
  const [pausedFocusTime, setPausedFocusTime] = useState(0);

  // Set counter state for Body Focus mode
  const [setCount, setSetCount] = useState(0);

  // Settings for sounds
  const { settings } = useSettings();

  // Calculate progress percentage based on timeLeft
  const totalSeconds = totalHours * 3600 + totalMinutes * 60;
  const progressPercentage = totalSeconds > 0 ? ((totalSeconds - timeLeft) / totalSeconds) * 100 : 0;

  useEffect(() => {
    StatusBar.setHidden(true);
    
    // Keep screen awake during focus session
    activateKeepAwakeAsync();
    
    // Initialize timer sound service
    TimerSoundService.initialize();
    
    // Register background task and request permissions
    BackgroundTimerService.requestPermissions();
    BackgroundTimerService.registerBackgroundTask();
    
    return () => {
      StatusBar.setHidden(false);
      deactivateKeepAwake();
      
      // Clean up background timer on unmount
      if (!isRunning) {
        BackgroundTimerService.stopTimer();
      }
    };
  }, [isRunning, mode.id]);

  // Show notification when timer starts
  useEffect(() => {
    if (visible && isRunning && !isPaused) {
      const showStartNotification = async () => {
        try {
          const totalTimeFormatted = `${totalHours.toString().padStart(2, '0')}:${totalMinutes.toString().padStart(2, '0')}:00`;
          
          // Only show start notification, don't show completion notification immediately
          console.log(`Starting ${mode.title} focus session for ${totalTimeFormatted}`);
          
        } catch (error) {
          console.log('Failed to show start notification:', error);
        }
      };

      showStartNotification();
      
      // Start background timer
      BackgroundTimerService.startTimer({
        id: startTime.toString(),
        startTime,
        duration: totalHours * 3600 + totalMinutes * 60,
        isPaused: false,
        isRunning: true,
        mode: {
          title: mode.title,
          color: mode.color,
        },
      });
    }
  }, [visible, isRunning, isPaused, mode.title, totalHours, totalMinutes, startTime]);

  // Background state sync
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: string) => {
      if (nextAppState === 'active') {
        // App came back to foreground, sync with background timer
        try {
          const backgroundState = await BackgroundTimerService.getTimer();
          if (backgroundState) {
            const elapsed = Math.floor((Date.now() - backgroundState.startTime) / 1000);
            const newTimeLeft = Math.max(0, backgroundState.duration - elapsed);
            setTimeLeft(newTimeLeft);
            setIsPaused(backgroundState.isPaused);
            setIsRunning(backgroundState.isRunning && newTimeLeft > 0);
          }
        } catch (error) {
          console.log('Failed to sync background timer:', error);
        }
      }
    };
    
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, []);

  // Animate progress circle smoothly
  // Handle set counter for Body Focus mode
  const handleSetIncrement = () => {
    setSetCount(prev => prev + 1);
  };

  const handleSetReset = () => {
    setSetCount(0);
  };

  // TODO: Re-implement background timer sync after fixing the issues
  // useEffect(() => {
  //   const handleAppStateChange = async (nextAppState: string) => {
  //     // Background sync logic will be added back after fixes
  //   };
  //   const subscription = AppState.addEventListener('change', handleAppStateChange);
  //   return () => subscription?.remove();
  // }, [onComplete]);

  useEffect(() => {
  let interval: ReturnType<typeof globalThis.setInterval>;
    
    if (isRunning && !isPaused && timeLeft > 0 && !isInBreak) {
  interval = globalThis.setInterval(async () => {
        setTimeLeft(prevTime => {
          const newTime = prevTime - 1;
          
          // Play tick sound if enabled in settings (but not for meditation)
          if (settings.timerSoundsEnabled && newTime > 0 && mode.id !== 'meditation') {
            TimerSoundService.playTick(settings.soundVolume, false).catch(err => 
              console.log('Timer tick sound error:', err)
            );
          }
          
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
        globalThis.clearInterval(interval);
      }
    };
  }, [isRunning, isPaused, onComplete, settings.timerSoundsEnabled, settings.soundVolume, isInBreak]);

  // Break timer effect
  useEffect(() => {
    let breakInterval: ReturnType<typeof globalThis.setInterval>;
    
    if (isInBreak && breakTimeLeft > 0) {
      breakInterval = globalThis.setInterval(() => {
        setBreakTimeLeft(prevTime => {
          const newTime = prevTime - 1;
          
          if (newTime <= 0) {
            // Break is over, resume focus session
            handleBreakComplete();
            return 0;
          }
          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (breakInterval) {
        globalThis.clearInterval(breakInterval);
      }
    };
  }, [isInBreak, breakTimeLeft]);

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

  const handlePause = () => {
    const newPausedState = !isPaused;
    setIsPaused(newPausedState);
    
    // Update background timer state
    BackgroundTimerService.updateTimer({
      isPaused: newPausedState,
    });
    
    onPause();
  };

  const handleBreak = () => {
    // Pause the main focus timer
    setPausedFocusTime(timeLeft);
    setIsPaused(true);
    setIsInBreak(true);
    setBreakTimeLeft(breakMinutes * 60); // Reset break timer
  };

  const handleBreakComplete = () => {
    // Resume the main focus timer from where it left off
    setTimeLeft(pausedFocusTime);
    setIsInBreak(false);
    setIsPaused(false);
  };

  const handleContinueFromBreak = () => {
    // User manually continues from break
    handleBreakComplete();
  };

  const handleEarlyFinish = async () => {
    try {
      // Stop background timer and cancel any scheduled notifications
      await BackgroundTimerService.stopTimer();
      setIsRunning(false);
      
      // Call the original early finish handler
      onEarlyFinish();
    } catch (error) {
      console.error('Error stopping timer on early finish:', error);
      // Still call early finish even if stopping timer fails
      onEarlyFinish();
    }
  };

  const handleAbort = async () => {
    try {
      // Stop background timer and cancel any scheduled notifications
      await BackgroundTimerService.stopTimer();
      setIsRunning(false);
      
      // Call the original abort handler
      onAbort();
    } catch (error) {
      console.error('Error stopping timer on abort:', error);
      // Still call abort even if stopping timer fails
      onAbort();
    }
  };

  if (!visible) return null;

  // Show break screen if in break mode
  if (isInBreak) {
    const breakTime = formatTime(breakTimeLeft);
    const breakProgressPercentage = breakMinutes > 0 ? ((breakMinutes * 60 - breakTimeLeft) / (breakMinutes * 60)) * 100 : 0;

    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <SafeAreaView style={styles.safeArea}>
          {/* Break Header */}
          <View style={styles.header}>
            <Text style={[styles.modeTitle, { color: '#22C55E' }]}>
              Break Time
            </Text>
            <View style={[styles.progressBar, { backgroundColor: '#22C55E20' }]}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    backgroundColor: '#22C55E',
                    width: `${breakProgressPercentage}%` 
                  }
                ]} 
              />
            </View>
          </View>

          {/* Break Timer Display */}
          <View style={styles.circularTimerContainer}>
            <View style={styles.progressCircle}>
              <Svg width={340} height={340} style={styles.progressSvg}>
                {/* Background circle - gray */}
                <Circle
                  cx={170}
                  cy={170}
                  r={155}
                  stroke="#333333"
                  strokeWidth={8}
                  fill="transparent"
                />
                {/* Progress circle - green for break */}
                <Circle
                  cx={170}
                  cy={170}
                  r={155}
                  stroke="#22C55E"
                  strokeWidth={8}
                  fill="transparent"
                  strokeDasharray={`${2 * Math.PI * 155}`}
                  strokeDashoffset={`${2 * Math.PI * 155 * (1 - breakProgressPercentage / 100)}`}
                  strokeLinecap="round"
                  transform="rotate(-90 170 170)"
                />
              </Svg>
              
              {/* Break Time Display */}
              <View style={styles.timeDisplayContainer}>
                <View style={styles.primaryTimeContainer}>
                  <Text style={[styles.primaryTimeText, { color: theme.colors.text.primary }]}>
                    {breakTime.m1}{breakTime.m2}:{breakTime.s1}{breakTime.s2}
                  </Text>
                  <View style={styles.primaryLabelsContainer}>
                    <Text style={styles.primaryLabel}>MINUTES</Text>
                    <Text style={styles.primaryLabel}>SECONDS</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Break Controls */}
          <View style={styles.controls}>
            <View style={styles.controlButton} />
            
            <TouchableOpacity
              style={[styles.controlButton, styles.continueButton, { backgroundColor: '#22C55E', borderRadius: 25 }]}
              onPress={handleContinueFromBreak}
              activeOpacity={0.6}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={[styles.primaryButtonText, { color: theme.colors.text.primary }]}>
                Continue
              </Text>
            </TouchableOpacity>

            <View style={styles.controlButton} />
          </View>

          {/* Break Quote */}
          <View style={styles.quoteContainer}>
            <Text style={styles.quoteText}>
              &quot;Take a deep breath. You&apos;ve earned this break.&quot;
            </Text>
            <Text style={styles.quoteAuthor}>— Your Focus Guide</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      
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
                  width: `${progressPercentage}%` 
                }
              ]} 
            />
          </View>
        </View>

        {/* Circular Timer Display */}
        <View style={styles.circularTimerContainer}>
          {/* Body Focus Set Counter - only show for body mode */}
          {mode.id === 'body' && (
            <View style={styles.setCounterContainer}>
              <Text style={[styles.setCounterLabel, { color: mode.color }]}>SETS</Text>
              <View style={styles.setCounterRow}>
                <TouchableOpacity 
                  style={[styles.setCounterButton, { borderColor: mode.color }]}
                  onPress={handleSetIncrement}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.setCounterValue, { color: mode.color }]}>{setCount}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.setResetButton, { backgroundColor: mode.color }]}
                  onPress={handleSetReset}
                  activeOpacity={0.8}
                >
                  <Text style={styles.setResetButtonText}>RESET</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Progress Circle */}
          <View style={styles.progressCircle}>
            <Svg width={340} height={340} style={styles.progressSvg}>
              {/* Background circle - gray */}
              <Circle
                cx={170}
                cy={170}
                r={155}
                stroke="#333333"
                strokeWidth={8}
                fill="transparent"
              />
              {/* Progress circle - colored based on mode */}
              <Circle
                cx={170}
                cy={170}
                r={155}
                stroke={mode.color}
                strokeWidth={8}
                fill="transparent"
                strokeDasharray={`${2 * Math.PI * 155}`}
                strokeDashoffset={`${2 * Math.PI * 155 * (1 - progressPercentage / 100)}`}
                strokeLinecap="round"
                transform="rotate(-90 170 170)"
              />
            </Svg>
            
            {/* Time Display */}
            <View style={styles.timeDisplayContainer}>
              {/* Hours and Minutes - Large */}
              <View style={styles.primaryTimeContainer}>
                <Text style={[styles.primaryTimeText, { color: theme.colors.text.primary }]}>
                  {currentTime.h1}{currentTime.h2}:{currentTime.m1}{currentTime.m2}
                </Text>
                <View style={styles.primaryLabelsContainer}>
                  <Text style={styles.primaryLabel}>HOURS</Text>
                  <Text style={styles.primaryLabel}>MINUTES</Text>
                </View>
              </View>
              
              {/* Seconds - Small */}
              <View style={styles.secondaryTimeContainer}>
                <Text style={[styles.secondaryTimeText, { color: mode.color }]}>
                  {currentTime.s1}{currentTime.s2}
                </Text>
                <Text style={styles.secondaryLabel}>SECONDS</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          {/* Break Button */}
          <TouchableOpacity
            style={[styles.controlButton, styles.breakButton]}
            onPress={handleBreak}
            activeOpacity={0.6}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={[styles.secondaryButtonText, { color: theme.colors.text.tertiary }]}>Break</Text>
          </TouchableOpacity>

          {/* Main Pause/Resume Button */}
          <TouchableOpacity
            style={[styles.controlButton, { backgroundColor: mode.color, borderRadius: 25 }]}
            onPress={handlePause}
            activeOpacity={0.6}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={[styles.primaryButtonText, { color: theme.colors.text.primary }]}>
              {isPaused ? 'Resume' : 'Pause'}
            </Text>
          </TouchableOpacity>

          {/* Early Finish Button */}
          <TouchableOpacity
            style={[styles.controlButton, styles.earlyFinishButton]}
            onPress={handleEarlyFinish}
            activeOpacity={0.6}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={[styles.secondaryButtonText, { color: theme.colors.text.tertiary }]} numberOfLines={1}>Finish</Text>
          </TouchableOpacity>
        </View>

        {/* Zen Quote */}
        <View style={styles.quoteContainer}>
          <Text style={styles.quoteText}>
            &quot;{selectedQuote?.text || 'Focus on the present moment.'}&quot;
          </Text>
          <Text style={styles.quoteAuthor}>— {selectedQuote?.author || 'Anonymous'}</Text>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  abortButton: {
    backgroundColor: theme.colors.overlayLight,
    borderColor: theme.colors.border,
    borderWidth: 1,
  },
  breakButton: {
    backgroundColor: theme.colors.overlayLight,
    borderColor: theme.colors.border,
    borderWidth: 1,
  },
  continueButton: {
    minWidth: 160,
    paddingVertical: theme.spacing.sm,
  },
  // New circular timer styles
  circularTimerContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingVertical: theme.spacing.xl,
  },
  clockContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  container: {
    backgroundColor: theme.colors.background,
    flex: 1,
  },
  controlButton: {
    alignItems: 'center',
    borderRadius: 20,
    flex: 1,
    justifyContent: 'center',
    maxWidth: 120,
    minWidth: 100,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  controls: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
    justifyContent: 'center',
    marginBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.md,
  },
  digitBottom: {
    borderTopColor: theme.colors.overlayLight,
    borderTopWidth: 1,
    bottom: 0,
  },
  digitCard: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    height: 80,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 60,
  },
  digitContainer: {
    height: 80,
    marginHorizontal: 2,
    position: 'relative',
    width: 60,
  },
  digitHalf: {
    alignItems: 'center',
    borderRadius: 8,
    elevation: 5,
    height: '50%',
    justifyContent: 'center',
    position: 'absolute',
    shadowColor: theme.colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    width: '100%',
  },
  digitText: {
    color: theme.colors.text.primary,
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  digitTop: {
    borderBottomColor: theme.colors.overlay,
    borderBottomWidth: 1,
    top: 0,
  },
  earlyFinishButton: {
    backgroundColor: theme.colors.overlayLight,
    borderColor: theme.colors.border,
    borderWidth: 1,
    maxWidth: 140,
    minWidth: 130, // Wider to fit "Early Finish" on one line
  },
  flipContainer: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    paddingTop: theme.spacing.lg,
  },
  modeTitle: {
    ...theme.typography.h2,
    fontWeight: '700',
    marginBottom: theme.spacing.md,
  },
  primaryButton: {
    elevation: 8,
    shadowColor: theme.colors.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  primaryButtonText: {
    ...theme.typography.bodyLarge,
    color: theme.colors.text.primary,
    fontWeight: '700',
  },
  primaryLabel: {
    color: theme.colors.text.secondary,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  primaryLabelsContainer: {
    flexDirection: 'row',
    gap: theme.spacing.lg,
    marginTop: theme.spacing.xs,
  },
  primaryTimeContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  primaryTimeText: {
    color: theme.colors.text.primary,
    fontFamily: 'monospace',
    fontSize: 64,
    fontWeight: 'bold',
    letterSpacing: 2,
    textAlign: 'center',
  },
  // eslint-disable-next-line react-native/no-color-literals
  progressArc: {
    borderBottomColor: 'transparent',
    borderLeftColor: theme.colors.primary,
    borderRadius: 165,
    borderRightColor: 'transparent',
    borderTopColor: 'transparent',
    borderWidth: 6,
    height: 330,
    position: 'absolute',
    width: 330,
  },
  progressBar: {
    borderRadius: 2,
    height: 4,
    overflow: 'hidden',
    width: width * 0.8,
  },
  progressCircle: {
    alignItems: 'center',
    height: 420,
    justifyContent: 'center',
    marginTop: -30,
    position: 'relative',
    width: 420, // Move circle up slightly
  },
  progressFill: {
    borderRadius: 2,
    height: '100%',
  },
  progressRing: {
    borderColor: theme.colors.overlayLight,
    borderRadius: 165,
    borderWidth: 6,
    height: 330,
    position: 'absolute',
    width: 330,
  },
  quoteAuthor: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  quoteContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
  },
  quoteText: {
    ...theme.typography.body,
    color: theme.colors.text.primary,
    fontStyle: 'italic',
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  secondaryButton: {
    backgroundColor: theme.colors.overlay,
    borderColor: theme.colors.overlayLight,
    borderWidth: 2,
  },
  secondaryButtonText: {
    ...theme.typography.bodyLarge,
    color: theme.colors.text.secondary,
    fontWeight: '700',
  },
  secondaryTimeContainer: {
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  secondaryTimeText: {
    color: theme.colors.text.primary,
    fontFamily: 'monospace',
    fontSize: 36,
    fontWeight: 'bold',
    letterSpacing: 1,
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
  smallButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  smallControlButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.overlay,
    borderRadius: 22.5,
    borderWidth: 2,
    height: 45,
    justifyContent: 'center',
    width: 45,
  },
  timeDisplayContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
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
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 2,
  },
  timeLabelSmall: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
  },
  timeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: theme.spacing.lg,
    width: '100%',
  },
  secondaryLabel: {
    color: theme.colors.text.secondary,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.5,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  // Simple text styles for backup
  simpleDigitText: {
    color: theme.colors.text.primary,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  simpleDigitTextLarge: {
    fontSize: 48,
  },
  simpleDigitTextSmall: {
    fontSize: 28,
  },
  // Set counter styles for Body Focus mode
  setCounterContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  setCounterLabel: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: theme.spacing.xs,
    textTransform: 'uppercase',
  },
  setCounterRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  setCounterButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.overlayLight,
    borderRadius: 40,
    borderWidth: 3,
    height: 80,
    justifyContent: 'center',
    width: 80,
  },
  setCounterValue: {
    fontFamily: 'monospace',
    fontSize: 32,
    fontWeight: 'bold',
  },
  setResetButton: {
    alignItems: 'center',
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  setResetButtonText: {
    color: theme.colors.text.primary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  // SVG progress circle styles
  progressSvg: {
    left: '50%',
    marginLeft: -170, // Half of SVG width (340/2)
    marginTop: -170, // Half of SVG height (340/2)
    position: 'absolute',
    top: '50%',
  },
});
