import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Path, Circle } from 'react-native-svg';

interface FlowBackgroundProps {
  style?: any;
  fullCoverage?: boolean;
}

export const FlowBackground: React.FC<FlowBackgroundProps> = ({ style, fullCoverage = false }) => {
  const viewBox = fullCoverage ? "0 0 1000 800" : "0 0 800 600";
  const svgStyle = fullCoverage ? [StyleSheet.absoluteFillObject, { transform: [{ scale: 1.2 }] }] : StyleSheet.absoluteFillObject;
  
  return (
    <View style={[styles.container, style]}>
      {/* Black base background */}
      <View style={styles.blackBase} />
      <Svg width="100%" height="100%" viewBox={viewBox} style={svgStyle}>
        <Defs>
          <RadialGradient id="flowGradient" cx="50%" cy="30%" r="80%">
            <Stop offset="0%" stopColor="rgba(56, 178, 172, 0.3)" stopOpacity="1" />
            <Stop offset="50%" stopColor="rgba(129, 140, 248, 0.2)" stopOpacity="1" />
            <Stop offset="100%" stopColor="rgba(167, 139, 250, 0.1)" stopOpacity="1" />
          </RadialGradient>
        </Defs>
        
        {/* Flowing water waves - full coverage */}
        <Path 
          d="M0,0 L800,0 L800,150 Q600,100 400,150 Q200,200 0,150 Z" 
          fill="url(#flowGradient)" 
          opacity="0.9"
        />
        <Path 
          d="M0,100 Q200,50 400,100 Q600,150 800,100 L800,250 Q600,300 400,250 Q200,200 0,250 Z" 
          fill="url(#flowGradient)" 
          opacity="0.7"
        />
        <Path 
          d="M0,200 Q150,150 300,200 Q450,250 600,200 Q750,150 800,200 L800,350 Q750,400 600,350 Q450,300 300,350 Q150,400 0,350 Z" 
          fill="url(#flowGradient)" 
          opacity="0.8"
        />
        <Path 
          d="M0,300 Q100,250 200,300 Q300,350 400,300 Q500,250 600,300 Q700,350 800,300 L800,450 Q700,500 600,450 Q500,400 400,450 Q300,500 200,450 Q100,400 0,450 Z" 
          fill="url(#flowGradient)" 
          opacity="0.6"
        />
        <Path 
          d="M0,400 Q200,350 400,400 Q600,450 800,400 L800,600 L0,600 Z" 
          fill="url(#flowGradient)" 
          opacity="0.7"
        />
        
        {/* Flowing particles scattered across full area */}
        <Circle cx="80" cy="120" r="3" fill="rgba(129, 140, 248, 0.5)"/>
        <Circle cx="220" cy="100" r="2.5" fill="rgba(167, 139, 250, 0.5)"/>
        <Circle cx="360" cy="180" r="2" fill="rgba(56, 178, 172, 0.5)"/>
        <Circle cx="140" cy="280" r="2.5" fill="rgba(129, 140, 248, 0.4)"/>
        <Circle cx="300" cy="220" r="2" fill="rgba(167, 139, 250, 0.5)"/>
        <Circle cx="460" cy="160" r="3" fill="rgba(56, 178, 172, 0.4)"/>
        <Circle cx="180" cy="380" r="2" fill="rgba(129, 140, 248, 0.4)"/>
        <Circle cx="420" cy="340" r="2.5" fill="rgba(167, 139, 250, 0.4)"/>
        <Circle cx="600" cy="300" r="2" fill="rgba(56, 178, 172, 0.4)"/>
        <Circle cx="720" cy="220" r="2.5" fill="rgba(129, 140, 248, 0.4)"/>
        <Circle cx="680" cy="400" r="3" fill="rgba(167, 139, 250, 0.4)"/>
        <Circle cx="520" cy="480" r="2" fill="rgba(56, 178, 172, 0.4)"/>
        <Circle cx="240" cy="500" r="2.5" fill="rgba(129, 140, 248, 0.3)"/>
        <Circle cx="380" cy="520" r="2" fill="rgba(167, 139, 250, 0.3)"/>
        
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
