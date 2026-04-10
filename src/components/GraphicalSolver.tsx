import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { LPProblem } from '../types';
import { Download } from 'lucide-react';

interface GraphicalSolverProps {
  problem: LPProblem;
  optimalPoint?: Record<string, number>;
  precision?: number;
}

export const GraphicalSolver: React.FC<GraphicalSolverProps> = ({ problem, optimalPoint, precision = 4 }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const format = (val: number) => val.toFixed(precision);

  const downloadJPG = () => {
    if (!svgRef.current) return;
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const canvas = document.createElement('canvas');
    const svgSize = svgRef.current.getBoundingClientRect();
    canvas.width = svgSize.width * 2; // High res
    canvas.height = svgSize.height * 2;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      const jpgUrl = canvas.toDataURL('image/jpeg', 0.9);
      const link = document.createElement('a');
      link.download = `grafico_${problem.name.replace(/\s+/g, '_')}.jpg`;
      link.href = jpgUrl;
      link.click();
    };
    img.src = url;
  };

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || problem.objectiveCoefficients.length !== 2) return;

    const containerWidth = containerRef.current.clientWidth;
    const width = containerWidth;
    const legendHeight = problem.constraints.length * 20 + 20;
    const plotHeight = Math.min(containerWidth, 400);
    const height = plotHeight + legendHeight + 60;
    const margin = { top: 40, right: 40, bottom: 40, left: 40 };

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .style('background-color', 'white');
    
    svg.selectAll('*').remove();

    // Background rect for exports
    svg.append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', 'white');

    // 1. Find all intersection points
    const lines: { a: number; b: number; c: number; op: string }[] = problem.constraints.map(con => ({
      a: con.coefficients[0],
      b: con.coefficients[1],
      c: con.constant,
      op: con.operator
    }));

    lines.push({ a: 1, b: 0, c: 0, op: '>=' });
    lines.push({ a: 0, b: 1, c: 0, op: '>=' });

    const points: [number, number][] = [];
    for (let i = 0; i < lines.length; i++) {
      for (let j = i + 1; j < lines.length; j++) {
        const l1 = lines[i];
        const l2 = lines[j];
        const det = l1.a * l2.b - l1.b * l2.a;
        if (Math.abs(det) > 1e-9) {
          const x = (l1.c * l2.b - l1.b * l2.c) / det;
          const y = (l1.a * l2.c - l1.c * l2.a) / det;
          points.push([x, y]);
        }
      }
    }

    const feasiblePoints = points.filter(([x, y]) => {
      if (x < -1e-9 || y < -1e-9) return false;
      return lines.every(l => {
        const val = l.a * x + l.b * y;
        if (l.op === '<=') return val <= l.c + 1e-7;
        if (l.op === '>=') return val >= l.c - 1e-7;
        return Math.abs(val - l.c) < 1e-7;
      });
    });

    let maxVal = 10;
    if (feasiblePoints.length > 0) {
      maxVal = Math.max(...feasiblePoints.map(p => Math.max(p[0], p[1]))) * 1.2;
    } else {
      problem.constraints.forEach(c => {
        if (c.coefficients[0] !== 0) maxVal = Math.max(maxVal, c.constant / c.coefficients[0]);
        if (c.coefficients[1] !== 0) maxVal = Math.max(maxVal, c.constant / c.coefficients[1]);
      });
      maxVal *= 1.2;
    }
    if (isNaN(maxVal) || !isFinite(maxVal)) maxVal = 100;

    const xScale = d3.scaleLinear().domain([0, maxVal]).range([margin.left, width - margin.right]);
    const yScale = d3.scaleLinear().domain([0, maxVal]).range([plotHeight + margin.top, margin.top]);

    // Legend data
    const legendData = problem.constraints.map((c, i) => ({
      label: `${c.coefficients.map((coeff, idx) => `${coeff}x${idx + 1}`).join(' + ')} ${c.operator} ${c.constant}`,
      color: d3.schemeCategory10[i % 10]
    }));

    // Axes
    svg.append('g')
      .attr('transform', `translate(0,${plotHeight + margin.top})`)
      .call(d3.axisBottom(xScale))
      .style('color', '#94a3b8');

    svg.append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(yScale))
      .style('color', '#94a3b8');
    
    // Soft grid lines
    svg.append('g')
      .attr('class', 'grid')
      .attr('transform', `translate(0,${plotHeight + margin.top})`)
      .call(d3.axisBottom(xScale).tickSize(-plotHeight).tickFormat(() => ''))
      .style('stroke', '#f1f5f9')
      .style('stroke-opacity', 0.5);

    svg.append('g')
      .attr('class', 'grid')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(yScale).tickSize(-width + margin.left + margin.right).tickFormat(() => ''))
      .style('stroke', '#f1f5f9')
      .style('stroke-opacity', 0.5);

    if (feasiblePoints.length > 2) {
      const cx = d3.mean(feasiblePoints, p => p[0]) || 0;
      const cy = d3.mean(feasiblePoints, p => p[1]) || 0;
      const sortedPoints = [...feasiblePoints].sort((a, b) => Math.atan2(a[1] - cy, a[0] - cx) - Math.atan2(b[1] - cy, b[0] - cx));

      svg.append('polygon')
        .datum(sortedPoints)
        .attr('points', d => d.map(p => [xScale(p[0]), yScale(p[1])].join(',')).join(' '))
        .attr('fill', '#3b82f6')
        .attr('fill-opacity', 0.2)
        .attr('stroke', '#3b82f6')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '4,4');

      // Add labels for each vertex
      sortedPoints.forEach(p => {
        const isOptimal = optimalPoint && 
          Math.abs(p[0] - (optimalPoint['x1'] || 0)) < 1e-7 && 
          Math.abs(p[1] - (optimalPoint['x2'] || 0)) < 1e-7;

        if (!isOptimal) {
          svg.append('circle')
            .attr('cx', xScale(p[0]))
            .attr('cy', yScale(p[1]))
            .attr('r', 3)
            .attr('fill', '#3b82f6');

          svg.append('text')
            .attr('x', xScale(p[0]) + 5)
            .attr('y', yScale(p[1]) - 5)
            .text(`(${format(p[0])}, ${format(p[1])})`)
            .style('font-size', '10px')
            .style('fill', '#64748b')
            .style('font-weight', '500');
        }
      });
    }

    problem.constraints.forEach((c, i) => {
      let lineData: [number, number][] = [];
      if (c.coefficients[0] === 0) {
        lineData = [[0, c.constant / c.coefficients[1]], [maxVal, c.constant / c.coefficients[1]]];
      } else if (c.coefficients[1] === 0) {
        lineData = [[c.constant / c.coefficients[0], 0], [c.constant / c.coefficients[0], maxVal]];
      } else {
        const x_int = c.constant / c.coefficients[0];
        const y_int = c.constant / c.coefficients[1];
        lineData = [[0, y_int], [x_int, 0]];
      }

      svg.append('line')
        .attr('x1', xScale(lineData[0][0]))
        .attr('y1', yScale(lineData[0][1]))
        .attr('x2', xScale(lineData[1][0]))
        .attr('y2', yScale(lineData[1][1]))
        .attr('stroke', d3.schemeCategory10[i % 10])
        .attr('stroke-width', 2);
    });

    if (optimalPoint && optimalPoint['x1'] !== undefined && optimalPoint['x2'] !== undefined) {
      const ox = optimalPoint['x1'];
      const oy = optimalPoint['x2'];
      
      svg.append('circle')
        .attr('cx', xScale(ox))
        .attr('cy', yScale(oy))
        .attr('r', 6)
        .attr('fill', '#ef4444')
        .attr('stroke', 'white')
        .attr('stroke-width', 2);

      svg.append('text')
        .attr('x', xScale(ox) + 10)
        .attr('y', yScale(oy) - 10)
        .text(`Óptimo (${format(ox)}, ${format(oy)})`)
        .style('font-size', '12px')
        .style('font-weight', 'bold')
        .style('fill', '#ef4444');
    }

    // Draw Legend outside plot area
    const legend = svg.append('g')
      .attr('transform', `translate(${margin.left}, ${plotHeight + margin.top + 40})`);

    legend.append('text')
      .attr('x', 0)
      .attr('y', -10)
      .text('Referencias de Restricciones:')
      .style('font-size', '11px')
      .style('font-weight', 'bold')
      .style('fill', '#475569');

    legendData.forEach((d, i) => {
      const g = legend.append('g')
        .attr('transform', `translate(0, ${i * 20})`);
      
      g.append('rect')
        .attr('width', 12)
        .attr('height', 12)
        .attr('fill', d.color)
        .attr('rx', 2);

      g.append('text')
        .attr('x', 20)
        .attr('y', 10)
        .text(d.label)
        .style('font-size', '10px')
        .style('fill', '#64748b')
        .style('font-weight', '500');
    });

  }, [problem, optimalPoint]);

  const copyImage = async () => {
    if (!svgRef.current) return;
    try {
      const svgData = new XMLSerializer().serializeToString(svgRef.current);
      const canvas = document.createElement('canvas');
      const svgSize = svgRef.current.getBoundingClientRect();
      canvas.width = svgSize.width * 2;
      canvas.height = svgSize.height * 2;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = new Image();
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      img.onload = async () => {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        
        canvas.toBlob(async (blob) => {
          if (blob) {
            try {
              await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': blob })
              ]);
              alert('Imagen copiada al portapapeles');
            } catch (err) {
              console.error('Error al copiar imagen:', err);
              alert('No se pudo copiar la imagen automáticamente. Prueba descargándola.');
            }
          }
        }, 'image/png');
      };
      img.src = url;
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div ref={containerRef} className="flex flex-col items-center bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 w-full overflow-hidden">
      <div className="flex items-center justify-between w-full mb-6">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Visualización 2D</h3>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 mr-4">
            <div className="w-3 h-3 bg-blue-500 bg-opacity-20 border border-blue-500 border-dashed rounded-sm"></div>
            <span className="text-[10px] text-gray-500 font-bold uppercase">Región Factible</span>
          </div>
          <button 
            onClick={copyImage}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-800 rounded-lg transition-all"
            title="Copiar Imagen"
          >
            <Download size={16} className="rotate-180" />
          </button>
          <button 
            onClick={downloadJPG}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-800 rounded-lg transition-all"
            title="Descargar JPG"
          >
            <Download size={16} />
          </button>
        </div>
      </div>
      <div id="graph-svg-container" className="w-full flex justify-center bg-white">
        <svg ref={svgRef} className="max-w-full h-auto" />
      </div>
    </div>
  );
};
