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
      <Svg width="100%" height="100%" viewBox="0 0 400 600" style={StyleSheet.absoluteFillObject}>
        <Defs>
          <RadialGradient id="flowGradient" cx="50%" cy="30%" r="80%">
            <Stop offset="0%" stopColor="rgba(56, 178, 172, 0.3)" stopOpacity="1" />
            <Stop offset="50%" stopColor="rgba(129, 140, 248, 0.2)" stopOpacity="1" />
            <Stop offset="100%" stopColor="rgba(167, 139, 250, 0.1)" stopOpacity="1" />
          </RadialGradient>
        </Defs>
        
        {/* Flowing water waves */}
        <Path 
          d="M0,200 Q100,150 200,200 T400,200 L400,300 Q300,350 200,300 T0,300 Z" 
          fill="url(#flowGradient)" 
          opacity="0.4"
        />
        <Path 
          d="M0,250 Q150,200 300,250 T600,250 L600,350 Q450,400 300,350 T0,350 Z" 
          fill="url(#flowGradient)" 
          opacity="0.3"
        />
        <Path 
          d="M0,350 Q200,300 400,350 L400,450 Q200,400 0,450 Z" 
          fill="url(#flowGradient)" 
          opacity="0.2"
        />
        
        {/* Subtle flowing particles */}
        <Circle cx="80" cy="180" r="3" fill="rgba(129, 140, 248, 0.3)"/>
        <Circle cx="320" cy="220" r="2" fill="rgba(167, 139, 250, 0.3)"/>
        <Circle cx="150" cy="380" r="2.5" fill="rgba(56, 178, 172, 0.3)"/>
        <Circle cx="380" cy="320" r="2" fill="rgba(129, 140, 248, 0.3)"/>
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
