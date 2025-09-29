import React from 'react';
import Svg, { Rect, G, Path, Text as SvgText } from 'react-native-svg';
import { theme } from '../../config/theme';

interface Props {
  size?: number;
  color?: string;
}

export default function FlipClockIcon({ size = 56, color }: Props) {
  const primary = color || theme.colors.primary;
  const w = size;
  const h = size * 0.7;
  const cardW = w * 0.48;
  const cardH = h * 0.85;

  return (
    <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <G>
        {/* left card */}
        <Rect x={w * 0.02} y={h * 0.1} rx={4} ry={4} width={cardW} height={cardH} fill={primary} opacity={0.95} />
        {/* right card */}
        <Rect x={w * 0.5} y={h * 0.1} rx={4} ry={4} width={cardW} height={cardH} fill={primary} opacity={0.7} />

        {/* dividing line */}
        <Path d={`M ${w * 0.5} ${h * 0.12} L ${w * 0.5} ${h * 0.9}`} stroke="#ffffff33" strokeWidth={1} />

        {/* digits on left card */}
        <SvgText x={w * 0.22} y={h * 0.58} fontSize={cardH * 0.45} fill="#fff" fontWeight="700" textAnchor="middle">12</SvgText>
        {/* digits on right card */}
        <SvgText x={w * 0.74} y={h * 0.58} fontSize={cardH * 0.45} fill="#fff" fontWeight="700" textAnchor="middle">34</SvgText>
      </G>
    </Svg>
  );
}
