import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Path, Circle } from 'react-native-svg';

interface MeditationBackgroundProps {
  style?: any;
}

export const MeditationBackground: React.FC<MeditationBackgroundProps> = ({ style }) => {
  return (
    <View style={[styles.container, style]}>
      {/* Black base background */}
      <View style={styles.blackBase} />
      <Svg width="100%" height="100%" viewBox="0 0 800 600" style={StyleSheet.absoluteFillObject}>
        <Defs>
          <RadialGradient id="meditationGradient" cx="50%" cy="30%" r="80%">
            <Stop offset="0%" stopColor="rgba(34, 197, 94, 0.3)" stopOpacity="1" />
            <Stop offset="50%" stopColor="rgba(16, 185, 129, 0.2)" stopOpacity="1" />
            <Stop offset="100%" stopColor="rgba(5, 150, 105, 0.1)" stopOpacity="1" />
          </RadialGradient>
        </Defs>
        
        {/* Peaceful meditation waves - full coverage */}
        <Path 
          d="M0,0 L800,0 L800,150 Q600,100 400,150 Q200,200 0,150 Z" 
          fill="url(#meditationGradient)" 
          opacity="0.6"
        />
        <Path 
          d="M0,100 Q200,50 400,100 Q600,150 800,100 L800,250 Q600,300 400,250 Q200,200 0,250 Z" 
          fill="url(#meditationGradient)" 
          opacity="0.5"
        />
        <Path 
          d="M0,200 Q150,150 300,200 Q450,250 600,200 Q750,150 800,200 L800,350 Q750,400 600,350 Q450,300 300,350 Q150,400 0,350 Z" 
          fill="url(#meditationGradient)" 
          opacity="0.4"
        />
        <Path 
          d="M0,300 Q100,250 200,300 Q300,350 400,300 Q500,250 600,300 Q700,350 800,300 L800,450 Q700,500 600,450 Q500,400 400,450 Q300,500 200,450 Q100,400 0,450 Z" 
          fill="url(#meditationGradient)" 
          opacity="0.3"
        />
        <Path 
          d="M0,400 Q200,350 400,400 Q600,450 800,400 L800,600 Q600,550 400,600 Q200,550 0,600 Z" 
          fill="url(#meditationGradient)" 
          opacity="0.2"
        />
        
        {/* Meditation particles scattered across full area */}
        <Circle cx="150" cy="120" r="3" fill="rgba(34, 197, 94, 0.4)" opacity="0.8" />
        <Circle cx="650" cy="180" r="4" fill="rgba(16, 185, 129, 0.3)" opacity="0.6" />
        <Circle cx="300" cy="250" r="2" fill="rgba(34, 197, 94, 0.5)" opacity="0.7" />
        <Circle cx="500" cy="320" r="3" fill="rgba(5, 150, 105, 0.4)" opacity="0.5" />
        <Circle cx="750" cy="380" r="4" fill="rgba(16, 185, 129, 0.3)" opacity="0.6" />
        <Circle cx="100" cy="450" r="2" fill="rgba(34, 197, 94, 0.5)" opacity="0.8" />
        <Circle cx="450" cy="500" r="3" fill="rgba(5, 150, 105, 0.4)" opacity="0.7" />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  blackBase: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
  },
});
