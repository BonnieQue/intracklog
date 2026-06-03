import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect, Path, Circle, Line, G } from 'react-native-svg';

interface BarChartProps {
  data: number[];
  labels?: string[];
  width?: number;
  height?: number;
  barColor?: string;
  barColors?: string[];
  barColorMuted?: string;
  highlightMax?: boolean;
}

export function MiniBarChart({ data, labels, width = 120, height = 60, barColor = '#52AD3B', barColors, barColorMuted = 'rgba(255,255,255,0.06)', highlightMax = false }: BarChartProps) {
  if (data.length === 0) return null;
  const max = Math.max(...data, 1);
  const barWidth = Math.min(16, (width - (data.length - 1) * 6) / data.length);
  const gap = 6;
  const totalW = data.length * barWidth + (data.length - 1) * gap;
  const offsetX = (width - totalW) / 2;

  const getBarColor = (i: number) => {
    if (barColors && barColors[i]) return barColors[i];
    return barColor;
  };

  return (
    <View>
      <Svg width={width} height={height + (labels ? 16 : 0)}>
        <Line x1={0} y1={height} x2={width} y2={height} stroke={barColorMuted} strokeWidth={0.5} />
        <Line x1={0} y1={height / 2} x2={width} y2={height / 2} stroke={barColorMuted} strokeWidth={0.5} strokeDasharray="3,3" />
        {data.map((val, i) => {
          const barH = Math.max(3, (val / max) * (height - 4));
          const x = offsetX + i * (barWidth + gap);
          return (
            <Rect
              key={i}
              x={x}
              y={height - barH}
              width={barWidth}
              height={barH}
              rx={barWidth / 3}
              fill={getBarColor(i)}
            />
          );
        })}
      </Svg>
      {labels && (
        <View style={[chartStyles.labelRow, { width }]}>
          {labels.map((l, i) => (
            <Text key={i} style={[chartStyles.label, { width: barWidth + gap, color: barColors ? barColors[i] : barColor }]}>{l}</Text>
          ))}
        </View>
      )}
    </View>
  );
}

interface DonutProps {
  value: number;
  total: number;
  size?: number;
  color?: string;
  bgColor?: string;
  label?: string;
  labelColor?: string;
}

export function MiniDonut({ value, total, size = 50, color = '#E07A3A', bgColor = 'rgba(224,122,58,0.12)', label, labelColor }: DonutProps) {
  const strokeW = 5;
  const radius = (size - strokeW) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = total > 0 ? Math.min(value / total, 1) : 0;
  const dashOffset = circumference * (1 - progress);
  const cx = size / 2;
  const cy = size / 2;

  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={size} height={size}>
        <Circle cx={cx} cy={cy} r={radius} stroke={bgColor} strokeWidth={strokeW} fill="none" />
        <Circle
          cx={cx} cy={cy} r={radius}
          stroke={color} strokeWidth={strokeW} fill="none"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      </Svg>
      {label ? <Text style={[chartStyles.donutLabel, { color: labelColor || color }]}>{label}</Text> : null}
    </View>
  );
}

interface ExpenseBreakdownProps {
  categories: { name: string; amount: number; color: string }[];
  textColor?: string;
  mutedColor?: string;
}

export function ExpenseBreakdown({ categories, textColor = '#fff', mutedColor = '#8a8a96' }: ExpenseBreakdownProps) {
  const total = categories.reduce((s, c) => s + c.amount, 0) || 1;
  return (
    <View style={chartStyles.breakdownWrap}>
      {/* Stacked bar */}
      <View style={chartStyles.stackedBar}>
        {categories.map((cat, i) => (
          <View key={i} style={{ flex: cat.amount / total, backgroundColor: cat.color, borderTopLeftRadius: i === 0 ? 4 : 0, borderBottomLeftRadius: i === 0 ? 4 : 0, borderTopRightRadius: i === categories.length - 1 ? 4 : 0, borderBottomRightRadius: i === categories.length - 1 ? 4 : 0 }} />
        ))}
      </View>
      {/* Legend */}
      <View style={chartStyles.legendRow}>
        {categories.slice(0, 4).map((cat, i) => (
          <View key={i} style={chartStyles.legendItem}>
            <View style={[chartStyles.legendDot, { backgroundColor: cat.color }]} />
            <Text style={[chartStyles.legendText, { color: mutedColor }]}>{cat.name}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const chartStyles = StyleSheet.create({
  labelRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 2 },
  label: { fontSize: 8, fontFamily: 'DMSans-Regular', textAlign: 'center' },
  donutLabel: { fontFamily: 'DMSans-Bold', fontSize: 10, marginTop: 4 },
  breakdownWrap: { marginTop: 8 },
  stackedBar: { flexDirection: 'row', height: 8, borderRadius: 4, overflow: 'hidden' },
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 6, height: 6, borderRadius: 3 },
  legendText: { fontFamily: 'DMSans-Regular', fontSize: 9 },
});
