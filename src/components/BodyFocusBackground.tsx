import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Path, Circle } from 'react-native-svg';
import { theme } from '../config/theme';

interface BodyFocusBackgroundProps {
  style?: any;
  fullCoverage?: boolean;
}

export const BodyFocusBackground: React.FC<BodyFocusBackgroundProps> = ({ style, fullCoverage = false }) => {
  const viewBox = fullCoverage ? "0 0 1000 800" : "0 0 800 600";
  const svgStyle = fullCoverage ? [StyleSheet.absoluteFillObject, { transform: [{ scale: 1.2 }] }] : StyleSheet.absoluteFillObject;
  
  return (
    <View style={[styles.container, style]}>
      {/* Black base background */}
      <View style={styles.blackBase} />
      <Svg width="100%" height="100%" viewBox={viewBox} style={svgStyle}>
        <Defs>
          <RadialGradient id="bodyFocusGradient" cx="50%" cy="30%" r="80%">
            <Stop offset="0%" stopColor="rgba(139, 69, 19, 0.3)" stopOpacity="1" />
            <Stop offset="30%" stopColor="rgba(220, 38, 127, 0.3)" stopOpacity="1" />
            <Stop offset="70%" stopColor="rgba(239, 68, 68, 0.2)" stopOpacity="1" />
            <Stop offset="100%" stopColor="rgba(127, 29, 29, 0.1)" stopOpacity="1" />
          </RadialGradient>
        </Defs>
        
        {/* Intense body focus waves - full coverage */}
        <Path 
          d="M0,0 L800,0 L800,150 Q600,100 400,150 Q200,200 0,150 Z" 
          fill="url(#bodyFocusGradient)" 
          opacity="0.9"
        />
        <Path 
          d="M0,100 Q200,50 400,100 Q600,150 800,100 L800,250 Q600,300 400,250 Q200,200 0,250 Z" 
          fill="url(#bodyFocusGradient)" 
          opacity="0.8"
        />
        <Path 
          d="M0,200 Q150,150 300,200 Q450,250 600,200 Q750,150 800,200 L800,350 Q750,400 600,350 Q450,300 300,350 Q150,400 0,350 Z" 
          fill="url(#bodyFocusGradient)" 
          opacity="0.9"
        />
        <Path 
          d="M0,300 Q100,250 200,300 Q300,350 400,300 Q500,250 600,300 Q700,350 800,300 L800,450 Q700,500 600,450 Q500,400 400,450 Q300,500 200,450 Q100,400 0,450 Z" 
          fill="url(#bodyFocusGradient)" 
          opacity="0.8"
        />
        <Path 
          d="M0,400 Q200,350 400,400 Q600,450 800,400 L800,600 L0,600 Z" 
          fill="url(#bodyFocusGradient)" 
          opacity="0.9"
        />
        
        {/* Body focus energy particles scattered across full area */}
        <Circle cx="150" cy="120" r="4" fill="rgba(220, 38, 127, 0.5)" opacity="0.8" />
        <Circle cx="650" cy="180" r="3" fill="rgba(239, 68, 68, 0.4)" opacity="0.7" />
        <Circle cx="300" cy="250" r="5" fill="rgba(139, 69, 19, 0.4)" opacity="0.6" />
        <Circle cx="500" cy="320" r="3" fill="rgba(220, 38, 127, 0.5)" opacity="0.8" />
        <Circle cx="750" cy="380" r="4" fill="rgba(127, 29, 29, 0.4)" opacity="0.6" />
        <Circle cx="100" cy="450" r="3" fill="rgba(239, 68, 68, 0.5)" opacity="0.7" />
        <Circle cx="450" cy="500" r="4" fill="rgba(220, 38, 127, 0.4)" opacity="0.8" />
        <Circle cx="600" cy="80" r="2" fill="rgba(139, 69, 19, 0.5)" opacity="0.6" />
        <Circle cx="200" cy="380" r="3" fill="rgba(127, 29, 29, 0.4)" opacity="0.7" />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  blackBase: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.background,
  },
  container: {
    ...StyleSheet.absoluteFillObject,
  },
});
