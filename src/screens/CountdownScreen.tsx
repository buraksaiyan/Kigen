import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  AppState,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import * as Notifications from 'expo-notifications';
import Svg, { Circle } from 'react-native-svg';
import { theme } from '../config/theme';
import { KigenKanjiBackground } from '../components/KigenKanjiBackground';
import BackgroundTimerService from '../services/BackgroundTimerService';
import TimerSoundService from '../services/TimerSoundService';
import { useSettings } from '../hooks/useSettings';

const { width, height } = Dimensions.get('window');

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
  size?: 'large' | 'small';
}

// Simple digital display without flip animation
const SimpleDigit: React.FC<{ digit: string; size?: 'large' | 'small' }> = ({ digit, size = 'large' }) => {
  return (
    <Text style={[
      styles.simpleDigitText, 
      size === 'small' ? styles.simpleDigitTextSmall : styles.simpleDigitTextLarge
    ]}>
      {digit}
    </Text>
  );
};

export const CountdownScreen: React.FC<CountdownScreenProps> = ({
  visible,
  mode,
  totalHours,
  totalMinutes,
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

  // Set counter state for Body Focus mode
  const [setCount, setSetCount] = useState(0);

  // Meditation sound selection state
  const [selectedMeditationSound, setSelectedMeditationSound] = useState<MeditationSound | null>(null);

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

    // Start meditation sounds if enabled
    if (mode.id === 'meditation' && settings.meditationSoundsEnabled) {
      // TODO: Start meditation ambient sounds
      console.log('Starting meditation sounds...');
    }
    
    return () => {
      StatusBar.setHidden(false);
      deactivateKeepAwake();
      
      // Stop meditation sounds if they were playing
      if (mode.id === 'meditation') {
        // TODO: Stop meditation ambient sounds
        console.log('Stopping meditation sounds...');
      }
      
      // Clean up background timer on unmount
      if (!isRunning) {
        BackgroundTimerService.stopTimer();
      }
    };
  }, [isRunning, mode.id, settings.meditationSoundsEnabled]);

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
    let interval: NodeJS.Timeout;
    
    if (isRunning && !isPaused && timeLeft > 0) {
      interval = setInterval(async () => {
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
        clearInterval(interval);
      }
    };
  }, [isRunning, isPaused, onComplete, settings.timerSoundsEnabled, settings.soundVolume]);

  // Meditation sound control effect
  useEffect(() => {
    if (mode.id === 'meditation' && selectedMeditationSound) {
      if (isRunning && !isPaused) {
        // Resume meditation sound when timer is running
        MeditationSoundService.resumeSound();
      } else {
        // Pause meditation sound when timer is paused
        MeditationSoundService.pauseSound();
      }
    }
  }, [isRunning, isPaused, mode.id, selectedMeditationSound]);

  // Cleanup meditation sound when component unmounts or timer completes
  useEffect(() => {
    return () => {
      if (mode.id === 'meditation') {
        MeditationSoundService.cleanup();
      }
    };
  }, [mode.id]);

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

  return (
    <View style={[styles.container, { backgroundColor: '#000000' }]}>
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
                  width: `${progressPercentage}%` 
                }
              ]} 
            />
          </View>
        </View>

        {/* Selected Goal Display - Only show for Executioner mode */}
        {mode.id === 'executioner' && selectedGoal && (
          <View style={styles.goalDisplayContainer}>
            <Text style={[styles.goalLabel, { color: mode.color }]}>FOCUSING ON</Text>
            <View style={[styles.goalCard, { borderColor: mode.color }]}>
              <Text style={styles.goalTitle}>{selectedGoal.title}</Text>
              {selectedGoal.description && (
                <Text style={styles.goalDescription}>{selectedGoal.description}</Text>
              )}
            </View>
          </View>
        )}

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

          {/* Meditation Sound Selector - only show for meditation mode */}
          {mode.id === 'meditation' && (
            <View style={styles.meditationSoundContainer}>
              <Text style={[styles.soundSelectorLabel, { color: mode.color }]}>
                MEDITATION SOUND
              </Text>
              
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.soundScrollView}
                contentContainerStyle={styles.soundScrollContent}
              >
                {/* None Option */}
                <TouchableOpacity 
                  style={[
                    styles.soundCard,
                    !selectedMeditationSound && [styles.soundCardActive, { borderColor: mode.color }]
                  ]}
                  onPress={() => {
                    setSelectedMeditationSound(null);
                    MeditationSoundService.stopSound();
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[
                    styles.soundCardTitle, 
                    !selectedMeditationSound && { color: mode.color }
                  ]}>
                    None
                  </Text>
                  <Text style={styles.soundCardDescription}>
                    Silent meditation
                  </Text>
                </TouchableOpacity>
                
                {/* Preset Sounds */}
                {PRESET_MEDITATION_SOUNDS.map((sound) => (
                  <TouchableOpacity
                    key={sound.id}
                    style={[
                      styles.soundCard,
                      selectedMeditationSound?.id === sound.id && [styles.soundCardActive, { borderColor: mode.color }]
                    ]}
                    onPress={() => {
                      setSelectedMeditationSound(sound);
                      MeditationSoundService.playSound(sound, 0.3);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={[
                      styles.soundCardTitle,
                      selectedMeditationSound?.id === sound.id && { color: mode.color }
                    ]}>
                      {sound.name}
                    </Text>
                    <Text style={styles.soundCardDescription}>
                      {sound.description}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
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
                <Text style={[styles.primaryTimeText, { color: '#FFFFFF' }]}>
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
          {/* Abort Button */}
          <TouchableOpacity
            style={[styles.controlButton, styles.abortButton]}
            onPress={handleAbort}
            activeOpacity={0.6}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={[styles.secondaryButtonText, { color: '#888691' }]}>Abort</Text>
          </TouchableOpacity>

          {/* Main Pause/Resume Button */}
          <TouchableOpacity
            style={[styles.controlButton, { backgroundColor: mode.color, borderRadius: 25 }]}
            onPress={handlePause}
            activeOpacity={0.6}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={[styles.primaryButtonText, { color: '#FFFFFF' }]}>
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
            <Text style={[styles.secondaryButtonText, { color: '#888691' }]} numberOfLines={1}>Early Finish</Text>
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
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.md,
  },
  smallControlButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    borderWidth: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  controlButton: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: 20,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    maxWidth: 120,
  },
  abortButton: {
    backgroundColor: 'rgba(255,68,68,0.1)',
    borderWidth: 1,
    borderColor: '#888691',
  },
  earlyFinishButton: {
    backgroundColor: 'rgba(34,197,94,0.1)',
    borderWidth: 1,
    borderColor: '#888691',
    minWidth: 130, // Wider to fit "Early Finish" on one line
    maxWidth: 140,
  },
  primaryButton: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  secondaryButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
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
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: theme.spacing.sm,
  },
  quoteAuthor: {
    ...theme.typography.caption,
    color: 'rgba(255,255,255,0.7)',
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
  // New circular timer styles
  circularTimerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  progressCircle: {
    width: 420,
    height: 420,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginTop: -30, // Move circle up slightly
  },
  progressRing: {
    position: 'absolute',
    width: 330,
    height: 330,
    borderRadius: 165,
    borderWidth: 6,
    borderColor: 'rgba(255,255,255,0.15)',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  progressArc: {
    position: 'absolute',
    width: 330,
    height: 330,
    borderRadius: 165,
    borderWidth: 6,
    borderColor: '#FFFFFF',
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  timeDisplayContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  primaryTimeContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  primaryTimeText: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    fontFamily: 'monospace',
    letterSpacing: 2,
  },
  primaryLabelsContainer: {
    flexDirection: 'row',
    marginTop: theme.spacing.xs,
    gap: theme.spacing.lg,
  },
  primaryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  secondaryTimeContainer: {
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  secondaryTimeText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    fontFamily: 'monospace',
    letterSpacing: 1,
  },
  secondaryLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  // Simple text styles for backup
  simpleDigitText: {
    fontFamily: 'monospace',
    fontWeight: 'bold',
    color: '#FFFFFF',
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  setCounterButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  setCounterValue: {
    fontSize: 32,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  setResetButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  setResetButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  // Meditation sound selector styles
  meditationSoundContainer: {
    width: '90%',
    marginBottom: theme.spacing.lg,
  },
  soundSelectorLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  soundScrollView: {
    flexGrow: 0,
  },
  soundScrollContent: {
    paddingHorizontal: theme.spacing.sm,
    alignItems: 'center',
  },
  soundCard: {
    width: 120,
    height: 80,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: theme.spacing.xs,
    padding: theme.spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  soundCardActive: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 2,
  },
  soundCardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 2,
  },
  soundCardDescription: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    lineHeight: 12,
  },
  // SVG progress circle styles
  progressSvg: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -170, // Half of SVG height (340/2)
    marginLeft: -170, // Half of SVG width (340/2)
  },
  // Goal display styles
  goalDisplayContainer: {
    width: '90%',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
    alignSelf: 'center',
  },
  goalLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
    opacity: 0.8,
  },
  goalCard: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  goalDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 20,
  },
  // Custom sound styles
  customSoundCard: {
    borderColor: 'rgba(255,215,0,0.3)', // Golden border for custom sounds
    backgroundColor: 'rgba(255,215,0,0.05)',
  },
  addSoundCard: {
    borderWidth: 2,
    borderStyle: 'dashed',
    backgroundColor: 'transparent',
  },
});
