import React from 'react';
import Svg, { Path, Circle, Rect, Line, Polyline } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function VehiclesIcon({ size = 28, color = '#fff', strokeWidth = 1.5 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M5 17h14M5 17a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1l2-3h8l2 3h1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2M5 17l0 2M19 17l0 2" />
      <Circle cx="7.5" cy="14" r="1.5" />
      <Circle cx="16.5" cy="14" r="1.5" />
      <Line x1="8" y1="10" x2="16" y2="10" />
    </Svg>
  );
}

export function TripsIcon({ size = 28, color = '#fff', strokeWidth = 1.5 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M3 12h4l3-9 4 18 3-9h4" />
    </Svg>
  );
}

export function LocationsIcon({ size = 28, color = '#fff', strokeWidth = 1.5 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
      <Circle cx="12" cy="9" r="2.5" />
    </Svg>
  );
}

export function ReportsIcon({ size = 28, color = '#fff', strokeWidth = 1.5 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Rect x="3" y="3" width="18" height="18" rx="2" />
      <Line x1="7" y1="17" x2="7" y2="13" />
      <Line x1="12" y1="17" x2="12" y2="9" />
      <Line x1="17" y1="17" x2="17" y2="7" />
    </Svg>
  );
}

export function TeamsIcon({ size = 28, color = '#fff', strokeWidth = 1.5 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx="9" cy="7" r="3" />
      <Path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
      <Circle cx="17" cy="9" r="2.5" />
      <Path d="M17 14.5a3.5 3.5 0 0 1 3.5 3.5V21" />
    </Svg>
  );
}

// Settings icons

export function WorkplaceIcon({ size = 28, color = '#fff', strokeWidth = 1.5 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Rect x="4" y="2" width="16" height="20" rx="2" />
      <Line x1="9" y1="6" x2="9" y2="6.01" />
      <Line x1="15" y1="6" x2="15" y2="6.01" />
      <Line x1="9" y1="10" x2="9" y2="10.01" />
      <Line x1="15" y1="10" x2="15" y2="10.01" />
      <Line x1="9" y1="14" x2="9" y2="14.01" />
      <Line x1="15" y1="14" x2="15" y2="14.01" />
      <Path d="M9 22v-4h6v4" />
    </Svg>
  );
}

export function MileageRateIcon({ size = 28, color = '#fff', strokeWidth = 1.5 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx="12" cy="12" r="10" />
      <Path d="M16 8h-4a2 2 0 0 0 0 4h2a2 2 0 0 1 0 4H8" />
      <Line x1="12" y1="6" x2="12" y2="8" />
      <Line x1="12" y1="16" x2="12" y2="18" />
    </Svg>
  );
}

export function OdometerIcon({ size = 28, color = '#fff', strokeWidth = 1.5 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
      <Path d="M12 6v6l4 2" />
      <Circle cx="12" cy="12" r="1" />
    </Svg>
  );
}

export function GenerateReportIcon({ size = 28, color = '#fff', strokeWidth = 1.5 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <Polyline points="14 2 14 8 20 8" />
      <Line x1="9" y1="13" x2="15" y2="13" />
      <Line x1="9" y1="17" x2="13" y2="17" />
    </Svg>
  );
}
