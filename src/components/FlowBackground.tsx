import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Path, Circle } from 'react-native-svg';

interface FlowBackgroundProps {
  style?: any;
}

export const FlowBackground: React.FC<FlowBackgroundProps> = ({ style }) => {
  return (
    <View style={[styles.container, style]}>
      {/* Black base background */}
      <View style={styles.blackBase} />
      <Svg width="100%" height="100%" viewBox="0 0 800 600" style={StyleSheet.absoluteFillObject}>
        <Defs>
          <RadialGradient id="flowGradient" cx="50%" cy="30%" r="80%">
            <Stop offset="0%" stopColor="rgba(56, 178, 172, 0.3)" stopOpacity="1" />
            <Stop offset="50%" stopColor="rgba(129, 140, 248, 0.2)" stopOpacity="1" />
            <Stop offset="100%" stopColor="rgba(167, 139, 250, 0.1)" stopOpacity="1" />
          </RadialGradient>
        </Defs>
        
        {/* Flowing water waves - full width coverage */}
        <Path 
          d="M0,150 Q200,100 400,150 Q600,200 800,150 L800,250 Q600,300 400,250 Q200,200 0,250 Z" 
          fill="url(#flowGradient)" 
          opacity="0.5"
        />
        <Path 
          d="M0,200 Q150,150 300,200 Q450,250 600,200 Q750,150 900,200 L900,300 Q750,350 600,300 Q450,250 300,300 Q150,350 0,300 Z" 
          fill="url(#flowGradient)" 
          opacity="0.4"
        />
        <Path 
          d="M0,300 Q100,250 200,300 Q300,350 400,300 Q500,250 600,300 Q700,350 800,300 L800,400 Q700,450 600,400 Q500,350 400,400 Q300,450 200,400 Q100,350 0,400 Z" 
          fill="url(#flowGradient)" 
          opacity="0.3"
        />
        <Path 
          d="M0,400 Q250,350 500,400 Q750,450 1000,400 L1000,500 Q750,550 500,500 Q250,450 0,500 Z" 
          fill="url(#flowGradient)" 
          opacity="0.2"
        />
        
        {/* Flowing particles scattered across full width */}
        <Circle cx="60" cy="180" r="3" fill="rgba(129, 140, 248, 0.4)"/>
        <Circle cx="200" cy="160" r="2.5" fill="rgba(167, 139, 250, 0.4)"/>
        <Circle cx="340" cy="220" r="2" fill="rgba(56, 178, 172, 0.4)"/>
        <Circle cx="120" cy="380" r="2.5" fill="rgba(129, 140, 248, 0.3)"/>
        <Circle cx="280" cy="320" r="2" fill="rgba(167, 139, 250, 0.4)"/>
        <Circle cx="350" cy="180" r="3" fill="rgba(56, 178, 172, 0.3)"/>
        <Circle cx="80" cy="450" r="2.5" fill="rgba(129, 140, 248, 0.4)"/>
        <Circle cx="240" cy="480" r="2" fill="rgba(167, 139, 250, 0.3)"/>
        <Circle cx="380" cy="420" r="3" fill="rgba(56, 178, 172, 0.4)"/>
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
