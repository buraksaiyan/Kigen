import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Path } from 'react-native-svg';

interface NoTechBackgroundProps {
  style?: any;
}

export const NoTechBackground: React.FC<NoTechBackgroundProps> = ({ style }) => {
  return (
    <View style={[styles.container, style]}>
      {/* Black base background */}
      <View style={styles.blackBase} />
      <Svg width="100%" height="100%" viewBox="0 0 800 600" style={StyleSheet.absoluteFillObject}>
        <Defs>
          <RadialGradient id="noTechGradient" cx="50%" cy="30%" r="80%">
            <Stop offset="0%" stopColor="rgba(146, 64, 14, 0.3)" stopOpacity="1" />
            <Stop offset="50%" stopColor="rgba(180, 83, 9, 0.2)" stopOpacity="1" />
            <Stop offset="100%" stopColor="rgba(217, 119, 6, 0.1)" stopOpacity="1" />
          </RadialGradient>
        </Defs>
        
        {/* Flowing no-tech waves - full coverage */}
        <Path 
          d="M0,0 L800,0 L800,150 Q600,100 400,150 Q200,200 0,150 Z" 
          fill="url(#noTechGradient)" 
          opacity="0.8"
        />
        <Path 
          d="M0,100 Q200,50 400,100 Q600,150 800,100 L800,250 Q600,300 400,250 Q200,200 0,250 Z" 
          fill="url(#noTechGradient)" 
          opacity="0.7"
        />
        <Path 
          d="M0,200 Q150,150 300,200 Q450,250 600,200 Q750,150 800,200 L800,350 Q650,400 500,350 Q350,300 200,350 Q50,400 0,350 Z" 
          fill="url(#noTechGradient)" 
          opacity="0.8"
        />
        <Path 
          d="M0,300 Q100,250 200,300 Q300,350 400,300 Q500,250 600,300 Q700,350 800,300 L800,450 Q700,500 600,450 Q500,400 400,450 Q300,500 200,450 Q100,400 0,450 Z" 
          fill="url(#noTechGradient)" 
          opacity="0.7"
        />
        <Path 
          d="M0,400 Q200,350 400,400 Q600,450 800,400 L800,600 L0,600 Z" 
          fill="url(#noTechGradient)" 
          opacity="0.8"
        />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  blackBase: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1F2937',
  },
});
