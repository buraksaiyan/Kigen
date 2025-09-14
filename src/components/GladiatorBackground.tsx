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
      <Svg width="100%" height="100%" viewBox="0 0 800 600" style={StyleSheet.absoluteFillObject}>
        <Defs>
          <RadialGradient id="executionerGradient" cx="50%" cy="30%" r="80%">
            <Stop offset="0%" stopColor="rgba(239, 68, 68, 0.4)" stopOpacity="1" />
            <Stop offset="50%" stopColor="rgba(220, 38, 38, 0.3)" stopOpacity="1" />
            <Stop offset="100%" stopColor="rgba(153, 27, 27, 0.2)" stopOpacity="1" />
          </RadialGradient>
        </Defs>
        
        {/* Flowing power waves - full coverage with red theme */}
        <Path 
          d="M0,0 L800,0 L800,150 Q600,100 400,150 Q200,200 0,150 Z" 
          fill="url(#executionerGradient)" 
          opacity="0.7"
        />
        <Path 
          d="M0,100 Q200,50 400,100 Q600,150 800,100 L800,250 Q600,300 400,250 Q200,200 0,250 Z" 
          fill="url(#executionerGradient)" 
          opacity="0.8"
        />
        <Path 
          d="M0,200 Q150,150 300,200 Q450,250 600,200 Q750,150 800,200 L800,350 Q750,400 600,350 Q450,300 300,350 Q150,400 0,350 Z" 
          fill="url(#executionerGradient)" 
          opacity="0.7"
        />
        <Path 
          d="M0,300 Q100,250 200,300 Q300,350 400,300 Q500,250 600,300 Q700,350 800,300 L800,450 Q700,500 600,450 Q500,400 400,450 Q300,500 200,450 Q100,400 0,450 Z" 
          fill="url(#executionerGradient)" 
          opacity="0.6"
        />
        <Path 
          d="M0,400 Q200,350 400,400 Q600,450 800,400 L800,600 L0,600 Z" 
          fill="url(#executionerGradient)" 
          opacity="0.8"
        />
        
        {/* Power particles scattered across full area */}
        <Circle cx="80" cy="120" r="3" fill="rgba(239, 68, 68, 0.6)"/>
        <Circle cx="220" cy="100" r="2.5" fill="rgba(220, 38, 38, 0.6)"/>
        <Circle cx="360" cy="180" r="2" fill="rgba(153, 27, 27, 0.6)"/>
        <Circle cx="140" cy="280" r="2.5" fill="rgba(239, 68, 68, 0.5)"/>
        <Circle cx="300" cy="220" r="2" fill="rgba(220, 38, 38, 0.6)"/>
        <Circle cx="460" cy="160" r="3" fill="rgba(153, 27, 27, 0.5)"/>
        <Circle cx="180" cy="380" r="2" fill="rgba(239, 68, 68, 0.5)"/>
        <Circle cx="420" cy="340" r="2.5" fill="rgba(220, 38, 38, 0.5)"/>
        <Circle cx="600" cy="300" r="2" fill="rgba(153, 27, 27, 0.5)"/>
        <Circle cx="720" cy="220" r="2.5" fill="rgba(239, 68, 68, 0.5)"/>
        <Circle cx="680" cy="400" r="3" fill="rgba(220, 38, 38, 0.5)"/>
        <Circle cx="520" cy="480" r="2" fill="rgba(153, 27, 27, 0.5)"/>
        <Circle cx="240" cy="500" r="2.5" fill="rgba(239, 68, 68, 0.4)"/>
        <Circle cx="380" cy="520" r="2" fill="rgba(220, 38, 38, 0.4)"/>
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  blackBase: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 20,
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  container: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
});
