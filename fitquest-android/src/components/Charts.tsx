interface BarDatum {
  label: string;
  value: number;
  hint?: string;
}

interface BarChartProps {
  data: BarDatum[];
  height?: number;
  unit?: string;
  formatValue?: (value: number) => string;
}

const WIDTH = 640;

const niceMax = (value: number): number => {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return step * magnitude;
};

export const BarChart = ({ data, height = 180, unit = '', formatValue }: BarChartProps) => {
  const padding = { top: 18, right: 8, bottom: 26, left: 38 };
  const innerWidth = WIDTH - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const maxValue = niceMax(Math.max(...data.map(item => item.value), 0));
  const slot = innerWidth / Math.max(data.length, 1);
  const barWidth = Math.min(slot * 0.56, 38);
  const format = formatValue || ((value: number) => Math.round(value).toLocaleString());
  const ticks = [0, 0.5, 1];

  return (
    <svg className="chart-svg" viewBox={`0 0 ${WIDTH} ${height}`} role="img" aria-label="bar chart">
      {ticks.map((tick, index) => {
        const y = padding.top + innerHeight - tick * innerHeight;
        return (
          <g key={`tick-${index}`}>
            <line
              x1={padding.left}
              x2={WIDTH - padding.right}
              y1={y}
              y2={y}
              stroke="var(--border)"
              strokeWidth={1}
              strokeDasharray={tick === 0 ? '0' : '3 4'}
            />
            <text x={padding.left - 8} y={y + 3.5} textAnchor="end" fontSize={9} fill="var(--text-muted)">
              {format(maxValue * tick)}
            </text>
          </g>
        );
      })}

      {data.map((item, index) => {
        const barHeight = maxValue > 0 ? (item.value / maxValue) * innerHeight : 0;
        const x = padding.left + slot * index + (slot - barWidth) / 2;
        const y = padding.top + innerHeight - barHeight;
        const isLast = index === data.length - 1;
        return (
          <g key={`${item.label}-${index}`}>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={Math.max(barHeight, item.value > 0 ? 2 : 0)}
              rx={4}
              fill={item.value > 0 ? 'var(--accent)' : 'var(--surface-3)'}
              opacity={isLast ? 1 : 0.55}
            >
              <title>{`${item.hint || item.label}: ${format(item.value)}${unit ? ` ${unit}` : ''}`}</title>
            </rect>
            <text
              x={x + barWidth / 2}
              y={height - 8}
              textAnchor="middle"
              fontSize={9}
              fill={isLast ? 'var(--text-2)' : 'var(--text-muted)'}
            >
              {item.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

interface LineDatum {
  label: string;
  value: number;
}

interface LineChartProps {
  data: LineDatum[];
  height?: number;
  unit?: string;
}

export const LineChart = ({ data, height = 180, unit = 'kg' }: LineChartProps) => {
  const padding = { top: 18, right: 14, bottom: 26, left: 40 };
  const innerWidth = WIDTH - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  if (data.length === 0) {
    return <div className="chart-empty">—</div>;
  }

  const values = data.map(item => item.value);
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const spread = rawMax - rawMin;
  const paddingValue = spread > 0 ? spread * 0.2 : Math.max(rawMax * 0.03, 0.5);
  const min = rawMin - paddingValue;
  const max = rawMax + paddingValue;

  const xFor = (index: number) => (
    data.length === 1
      ? padding.left + innerWidth / 2
      : padding.left + (index / (data.length - 1)) * innerWidth
  );
  const yFor = (value: number) => padding.top + innerHeight - ((value - min) / (max - min)) * innerHeight;

  const points = data.map((item, index) => ({ x: xFor(index), y: yFor(item.value), ...item }));
  const line = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(' ');
  const area = `${line} L ${points[points.length - 1].x.toFixed(1)} ${padding.top + innerHeight} L ${points[0].x.toFixed(1)} ${padding.top + innerHeight} Z`;
  const ticks = [0, 0.5, 1];
  const labelStep = Math.max(1, Math.ceil(data.length / 4));

  return (
    <svg className="chart-svg" viewBox={`0 0 ${WIDTH} ${height}`} role="img" aria-label="line chart">
      {ticks.map((tick, index) => {
        const value = min + (max - min) * tick;
        const y = yFor(value);
        return (
          <g key={`line-tick-${index}`}>
            <line
              x1={padding.left}
              x2={WIDTH - padding.right}
              y1={y}
              y2={y}
              stroke="var(--border)"
              strokeWidth={1}
              strokeDasharray={index === 0 ? '0' : '3 4'}
            />
            <text x={padding.left - 8} y={y + 3.5} textAnchor="end" fontSize={9} fill="var(--text-muted)">
              {value.toFixed(1)}
            </text>
          </g>
        );
      })}

      <path d={area} fill="var(--accent)" opacity={0.1} />
      <path d={line} fill="none" stroke="var(--accent)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

      {points.map((point, index) => (
        <g key={`${point.label}-${index}`}>
          <circle cx={point.x} cy={point.y} r={3.5} fill="var(--accent)" stroke="var(--bg)" strokeWidth={2}>
            <title>{`${point.label}: ${point.value.toFixed(1)} ${unit}`}</title>
          </circle>
          {(index % labelStep === 0 || index === points.length - 1) && (
            <text x={point.x} y={height - 8} textAnchor="middle" fontSize={9} fill="var(--text-muted)">
              {point.label}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
};

interface MuscleBalanceProps {
  data: { muscle: string; sets: number }[];
  muscleLabel: (muscle: string) => string;
  emptyLabel: string;
}

export const MuscleBalanceList = ({ data, muscleLabel, emptyLabel }: MuscleBalanceProps) => {
  if (!data.length) return <p className="chart-empty-text">{emptyLabel}</p>;
  const max = Math.max(...data.map(item => item.sets), 1);

  return (
    <div className="muscle-balance">
      {data.map(item => (
        <div key={item.muscle} className="muscle-balance-row">
          <span className="muscle-balance-label">{muscleLabel(item.muscle)}</span>
          <span className="muscle-balance-track">
            <span className="muscle-balance-fill" style={{ width: `${Math.max(6, (item.sets / max) * 100)}%` }} />
          </span>
          <span className="muscle-balance-value">{item.sets}</span>
        </div>
      ))}
    </div>
  );
};
