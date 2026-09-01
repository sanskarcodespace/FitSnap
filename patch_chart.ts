import fs from 'fs';
const path = 'src/components/ui/trend-chart.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  '  fixedYAxisRange?: [number, number];\n}',
  '  fixedYAxisRange?: [number, number];\n  ariaLabel?: string;\n}'
);

content = content.replace(
  '  fixedYAxisRange\n}: TrendChartProps) {',
  '  fixedYAxisRange,\n  ariaLabel = "Trend chart"\n}: TrendChartProps) {'
);

const newRender = `  return (
    <figure 
      ref={containerRef} 
      className={\`relative w-full \${className}\`} 
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
        <svg width={width} height={height} className="absolute inset-0" aria-hidden="true">`;

content = content.replace(
  '  return (\n    <div ref={containerRef} className={`relative w-full ${className}`} style={{ height }}>\n      {width > 0 && (\n        <svg width={width} height={height} className="absolute inset-0">',
  newRender
);

content = content.replace(
  '        </svg>\n      )}\n    </div>\n  );',
  '        </svg>\n      )}\n    </figure>\n  );'
);

fs.writeFileSync(path, content);
console.log("Patched trend-chart.tsx");
