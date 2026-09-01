"use client"

import React, { useRef, useState, useEffect } from 'react';

export interface TrendChartDataPoint {
  date: string; // YYYY-MM-DD
  value: number;
  isLogged: boolean;
}

export interface TrendChartProps {
  data: TrendChartDataPoint[];
  referenceLine?: number | null;
  metricColor?: string; // CSS color string, e.g. "var(--color-macro-calories)"
  height?: number;
  className?: string;
  yAxisLabel?: string;
  fixedYAxisRange?: [number, number];
  ariaLabel?: string;
}

export function TrendChart({
  data,
  referenceLine,
  metricColor = "var(--color-primary-500)",
  height = 240,
  className = "",
  yAxisLabel,
  fixedYAxisRange,
  ariaLabel = "Trend chart"
}: TrendChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(entries => {
      setWidth(entries[0].contentRect.width);
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  if (!data || data.length === 0) {
    return (
      <div className={`flex items-center justify-center bg-[var(--color-neutral-50)] rounded-xl border border-[var(--color-neutral-200)] ${className}`} style={{ height }}>
        <p className="text-[var(--color-neutral-500)] text-sm">No data available</p>
      </div>
    );
  }

  // Dimensions
  const padding = { top: 20, right: 20, bottom: 40, left: 40 };
  const chartWidth = Math.max(0, width - padding.left - padding.right);
  const chartHeight = Math.max(0, height - padding.top - padding.bottom);

  // Scales
  const validValues = data.filter(d => d.isLogged).map(d => d.value);
  const maxDataValue = validValues.length > 0 ? Math.max(...validValues) : 0;
  const maxValue = Math.max(maxDataValue, referenceLine || 0);
  
  let yMin = 0;
  let yMax = maxValue === 0 ? 100 : maxValue * 1.1;

  if (fixedYAxisRange) {
    yMin = fixedYAxisRange[0];
    yMax = fixedYAxisRange[1];
  }

  const yRange = yMax - yMin;

  const getX = (index: number) => padding.left + (data.length > 1 ? (index / (data.length - 1)) * chartWidth : chartWidth / 2);
  const getY = (value: number) => padding.top + chartHeight - ((value - yMin) / (yRange === 0 ? 1 : yRange)) * chartHeight;

  // Build Path (skipping gap days to create breaks)
  let pathD = "";
  let isDrawing = false;

  data.forEach((point, index) => {
    if (point.isLogged) {
      const x = getX(index);
      const y = getY(point.value);
      if (!isDrawing) {
        pathD += `M ${x} ${y} `;
        isDrawing = true;
      } else {
        pathD += `L ${x} ${y} `;
      }
    } else {
      isDrawing = false;
    }
  });

  // Calculate X-axis labels to avoid crowding
  const maxLabels = width < 500 ? 5 : 10;
  const labelStep = Math.max(1, Math.ceil(data.length / maxLabels));

  return (
    <figure 
      ref={containerRef} 
      className={`relative w-full ${className}`} 
      style={{ height }}
      aria-label={ariaLabel}
    >
      <div className="sr-only">
        <table>
          <caption>{ariaLabel} data</caption>
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">Value</th>
            </tr>
          </thead>
          <tbody>
            {data.map((point, index) => (
              <tr key={index}>
                <td>{point.date}</td>
                <td>{point.isLogged ? point.value : "No data"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {width > 0 && (
        <svg width={width} height={height} className="absolute inset-0" aria-hidden="true">
          
          {/* Y-Axis Guidelines & Labels (0, 50%, 100%) */}
          {[0, 0.5, 1].map(ratio => {
            const y = padding.top + chartHeight - (chartHeight * ratio);
            const val = fixedYAxisRange ? Math.round(yMin + (yRange * ratio)) : Math.round(yMax * ratio);
            return (
              <g key={`y-axis-${ratio}`}>
                <line 
                  x1={padding.left} 
                  y1={y} 
                  x2={width - padding.right} 
                  y2={y} 
                  stroke="var(--color-neutral-200)" 
                  strokeDasharray={ratio === 0 ? "" : "4 4"}
                  strokeWidth="1"
                />
                <text 
                  x={padding.left - 8} 
                  y={y + 4} 
                  fontSize="10" 
                  fill="var(--color-neutral-400)" 
                  textAnchor="end"
                >
                  {val}
                </text>
              </g>
            );
          })}
          {yAxisLabel && (
            <text 
              x={10} 
              y={padding.top - 5} 
              fontSize="10" 
              fill="var(--color-neutral-500)"
              fontWeight="bold"
            >
              {yAxisLabel}
            </text>
          )}

          {/* Reference Line */}
          {referenceLine != null && (
            <g>
              <line 
                x1={padding.left} 
                y1={getY(referenceLine)} 
                x2={width - padding.right} 
                y2={getY(referenceLine)} 
                stroke={metricColor} 
                strokeDasharray="6 4"
                strokeWidth="2"
                opacity="0.5"
              />
            </g>
          )}

          {/* Trend Line */}
          {pathD && (
            <path 
              d={pathD} 
              fill="none" 
              stroke={metricColor} 
              strokeWidth="3" 
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Data Points & X-Axis Indicators */}
          {data.map((point, index) => {
            const x = getX(index);
            const showLabel = index % labelStep === 0 || index === data.length - 1;
            
            // Format date MM/DD
            const dateObj = new Date(point.date);
            // using UTC to avoid timezone shift on YYYY-MM-DD
            const formattedDate = `${dateObj.getUTCMonth() + 1}/${dateObj.getUTCDate()}`;

            return (
              <g key={`point-${index}`}>
                {/* Line Data Point */}
                {point.isLogged && (
                  <circle 
                    cx={x} 
                    cy={getY(point.value)} 
                    r="4" 
                    fill="white" 
                    stroke={metricColor} 
                    strokeWidth="2" 
                  />
                )}

                {/* X-Axis Logged Indicator */}
                <circle 
                  cx={x} 
                  cy={height - 20} 
                  r="3" 
                  fill={point.isLogged ? metricColor : "transparent"} 
                  stroke={point.isLogged ? metricColor : "var(--color-neutral-300)"} 
                  strokeWidth="1.5" 
                />

                {/* X-Axis Label */}
                {showLabel && (
                  <text 
                    x={x} 
                    y={height - 5} 
                    fontSize="10" 
                    fill="var(--color-neutral-500)" 
                    textAnchor="middle"
                  >
                    {formattedDate}
                  </text>
                )}
              </g>
            );
          })}

        </svg>
      )}
    </figure>
  );
}
