
import React, { useState } from 'react';
import { AssignmentSolver } from '../lib/assignment';
import { motion } from 'motion/react';
import { Plus, Minus, Calculator, CheckCircle2, AlertCircle } from 'lucide-react';

interface AssignmentSolverProps {
  precision?: number;
}

export function AssignmentSolverComponent({ precision = 4 }: AssignmentSolverProps) {
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  const [matrix, setMatrix] = useState<number[][]>(
    Array.from({ length: 3 }, () => Array(3).fill(0))
  );
  const [type, setType] = useState<'MIN' | 'MAX'>('MIN');
  const [result, setResult] = useState<{ assignments: [number, number][], totalCost: number } | null>(null);

  const handleMatrixChange = (r: number, c: number, val: string) => {
    const newMatrix = [...matrix];
    newMatrix[r][c] = parseFloat(val) || 0;
    setMatrix(newMatrix);
  };

  const addRow = () => {
    setRows(rows + 1);
    setMatrix([...matrix, Array(cols).fill(0)]);
  };

  const removeRow = () => {
    if (rows > 1) {
      setRows(rows - 1);
      setMatrix(matrix.slice(0, -1));
    }
  };

  const addCol = () => {
    setCols(cols + 1);
    setMatrix(matrix.map(row => [...row, 0]));
  };

  const removeCol = () => {
    if (cols > 1) {
      setCols(cols - 1);
      setMatrix(matrix.map(row => row.slice(0, -1)));
    }
  };

  const solve = () => {
    const res = AssignmentSolver.solve(matrix, type);
    setResult(res);
  };

  return (
    <div className="space-y-8">
      <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xl shadow-gray-200/50 dark:shadow-none">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold">Modelo de Asignación</h2>
            <p className="text-gray-400 text-sm">Asigna tareas a trabajadores de forma óptima.</p>
          </div>
          <div className="flex gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
            <button 
              onClick={() => setType('MIN')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${type === 'MIN' ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm' : 'text-gray-400'}`}
            >
              MINIMIZAR
            </button>
            <button 
              onClick={() => setType('MAX')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${type === 'MAX' ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm' : 'text-gray-400'}`}
            >
              MAXIMIZAR
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-gray-500">Filas:</span>
              <div className="flex items-center gap-2">
                <button onClick={removeRow} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-400"><Minus size={16}/></button>
                <span className="w-8 text-center font-mono font-bold">{rows}</span>
                <button onClick={addRow} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-400"><Plus size={16}/></button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-gray-500">Columnas:</span>
              <div className="flex items-center gap-2">
                <button onClick={removeCol} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-400"><Minus size={16}/></button>
                <span className="w-8 text-center font-mono font-bold">{cols}</span>
                <button onClick={addCol} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-400"><Plus size={16}/></button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto pb-4">
            <table className="w-full border-separate border-spacing-2">
              <thead>
                <tr>
                  <th className="w-12"></th>
                  {Array.from({ length: cols }).map((_, j) => (
                    <th key={j} className="text-xs font-bold text-gray-400 uppercase tracking-widest text-center">T{j+1}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrix.map((row, i) => (
                  <tr key={i}>
                    <td className="text-xs font-bold text-gray-400 uppercase tracking-widest text-right pr-2">W{i+1}</td>
                    {row.map((val, j) => (
                      <td key={j}>
                        <input 
                          type="number" 
                          value={val}
                          onChange={(e) => handleMatrixChange(i, j, e.target.value)}
                          className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-3 rounded-xl text-center font-mono font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button 
            onClick={solve}
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 dark:shadow-none flex items-center justify-center gap-2"
          >
            <Calculator size={20} />
            Resolver Asignación
          </button>
        </div>
      </div>

      {result && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8"
        >
          <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xl">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold">Asignación Óptima</h3>
                <p className="text-xs text-gray-400">Resultados del algoritmo húngaro</p>
              </div>
            </div>

            <div className="space-y-4">
              {result.assignments.map(([w, t], idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-bold text-gray-500">Trabajador {w+1}</span>
                    <div className="h-px w-8 bg-gray-200 dark:bg-gray-700"></div>
                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400">Tarea {t+1}</span>
                  </div>
                  <span className="font-mono font-bold text-gray-900 dark:text-white">{matrix[w][t]}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-blue-600 p-8 rounded-3xl text-white flex flex-col justify-center items-center text-center">
            <p className="text-blue-100 uppercase font-bold tracking-widest text-xs mb-2">Costo Total Óptimo</p>
            <p className="text-6xl font-black font-mono">{result.totalCost.toFixed(precision)}</p>
            <div className="mt-8 p-4 bg-blue-500/30 rounded-2xl text-sm border border-white/10">
              Esta es la combinación que {type === 'MIN' ? 'minimiza' : 'maximiza'} el valor total de la matriz.
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
