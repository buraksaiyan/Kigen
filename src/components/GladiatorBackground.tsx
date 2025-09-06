import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Path, Ellipse, Circle } from 'react-native-svg';

interface GladiatorBackgroundProps {
  style?: any;
}

export const GladiatorBackground: React.FC<GladiatorBackgroundProps> = ({ style }) => {
  return (
    <View style={[styles.container, style]}>
      {/* Black base background */}
      <View style={styles.blackBase} />
      <Svg width="100%" height="100%" viewBox="0 0 400 600" style={StyleSheet.absoluteFillObject}>
        <Defs>
          <RadialGradient id="gladiatorGradient" cx="50%" cy="40%" r="70%">
            <Stop offset="0%" stopColor="rgba(251, 146, 60, 0.3)" stopOpacity="1" />
            <Stop offset="50%" stopColor="rgba(217, 119, 6, 0.2)" stopOpacity="1" />
            <Stop offset="100%" stopColor="rgba(180, 83, 9, 0.1)" stopOpacity="1" />
          </RadialGradient>
        </Defs>
        
        {/* Gladiator mask outline */}
        <Path 
          d="M200,100 C240,100 280,130 280,180 C280,200 275,220 270,240 C265,280 250,320 200,320 C150,320 135,280 130,240 C125,220 120,200 120,180 C120,130 160,100 200,100 Z" 
          fill="none" 
          stroke="url(#gladiatorGradient)" 
          strokeWidth="2" 
          opacity="0.4"
        />
        
        {/* Eye holes */}
        <Ellipse cx="170" cy="180" rx="15" ry="20" fill="none" stroke="url(#gladiatorGradient)" strokeWidth="2" opacity="0.3"/>
        <Ellipse cx="230" cy="180" rx="15" ry="20" fill="none" stroke="url(#gladiatorGradient)" strokeWidth="2" opacity="0.3"/>
        
        {/* Nose guard */}
        <Path 
          d="M200,190 L200,220 M195,210 L205,210" 
          stroke="url(#gladiatorGradient)" 
          strokeWidth="2" 
          opacity="0.3"
        />
        
        {/* Decorative elements */}
        <Path 
          d="M160,140 Q180,120 200,140 Q220,120 240,140" 
          fill="none" 
          stroke="url(#gladiatorGradient)" 
          strokeWidth="1.5" 
          opacity="0.2"
        />
        
        {/* Fire/strength symbols */}
        <Path 
          d="M100,200 Q110,180 120,200 Q130,180 140,200" 
          fill="none" 
          stroke="rgba(251, 146, 60, 0.2)" 
          strokeWidth="2"
        />
        <Path 
          d="M260,200 Q270,180 280,200 Q290,180 300,200" 
          fill="none" 
          stroke="rgba(251, 146, 60, 0.2)" 
          strokeWidth="2"
        />
        
        {/* Background texture */}
        <Circle cx="120" cy="350" r="2" fill="rgba(217, 119, 6, 0.2)"/>
        <Circle cx="280" cy="380" r="1.5" fill="rgba(180, 83, 9, 0.2)"/>
        <Circle cx="80" cy="450" r="2.5" fill="rgba(251, 146, 60, 0.2)"/>
        <Circle cx="320" cy="420" r="2" fill="rgba(217, 119, 6, 0.2)"/>
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  blackBase: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 20,
  },
});
