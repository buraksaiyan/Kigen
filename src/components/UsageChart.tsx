import React from 'react';
import { View, Dimensions } from 'react-native';
import Svg, { Circle, G, Text as SvgText } from 'react-native-svg';

interface UsageChartProps {
  data: Array<{
    app: string;
    timeInForeground: number;
    color: string;
  }>;
  totalTime: number;
  size?: number;
}

const { width: screenWidth } = Dimensions.get('window');

export const UsageChart: React.FC<UsageChartProps> = ({ 
  data, 
  totalTime, 
  size = Math.min(screenWidth - 80, 200) 
}) => {
  const radius = size / 2 - 10;
  const circumference = 2 * Math.PI * radius;
  const centerX = size / 2;
  const centerY = size / 2;

  let cumulativePercentage = 0;

  const formatTime = (ms: number): string => {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        {/* Background Circle */}
        <Circle
          cx={centerX}
          cy={centerY}
          r={radius}
          stroke="#333333"
          strokeWidth="16"
          fill="transparent"
        />
        
        {/* Usage Segments */}
        {data.map((item, index) => {
          const percentage = totalTime > 0 ? (item.timeInForeground / totalTime) : 0;
          const strokeDasharray = `${percentage * circumference} ${circumference}`;
          const strokeDashoffset = -cumulativePercentage * circumference;
          
          cumulativePercentage += percentage;
          
          return (
            <Circle
              key={`${item.app}-${item.timeInForeground}-${index}`}
              cx={centerX}
              cy={centerY}
              r={radius}
              stroke={item.color}
              strokeWidth="16"
              fill="transparent"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform={`rotate(-90 ${centerX} ${centerY})`}
            />
          );
        })}
        
        {/* Center Text - Total Time */}
        <G>
          <SvgText
            x={centerX}
            y={centerY - 15}
            textAnchor="middle"
            fontSize="12"
            fill="#CCCCCC"
          >
            TODAY
          </SvgText>
          <SvgText
            x={centerX}
            y={centerY + 5}
            textAnchor="middle"
            fontSize="20"
            fontWeight="bold"
            fill="#FFFFFF"
          >
            {formatTime(totalTime)}
          </SvgText>
        </G>
      </Svg>
    </View>
  );
};
