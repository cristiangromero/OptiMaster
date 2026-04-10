import React from 'react';
import { LPProblem, ObjectiveType, Constraint } from '../types';
import { Plus, Trash2, Info, RotateCcw, CheckCircle2 } from 'lucide-react';

interface ProblemFormProps {
  problem: LPProblem;
  onChange: (problem: LPProblem) => void;
}

export const ProblemForm: React.FC<ProblemFormProps> = ({ problem, onChange }) => {
  const handleObjectiveTypeChange = (type: ObjectiveType) => {
    onChange({ ...problem, objectiveType: type });
  };

  const clearAll = () => {
    onChange({
      id: Date.now().toString(),
      name: 'Nuevo Problema',
      objectiveType: 'MAX',
      objectiveCoefficients: [0, 0],
      variables: ['x1', 'x2'],
      constraints: [
        { id: Math.random().toString(36).substr(2, 9), coefficients: [0, 0], operator: '<=', constant: 0 }
      ],
    });
  };

  const handleObjectiveCoefficientChange = (index: number, value: string) => {
    const newCoeffs = [...problem.objectiveCoefficients];
    newCoeffs[index] = parseFloat(value) || 0;
    onChange({ ...problem, objectiveCoefficients: newCoeffs });
  };

  const addConstraint = () => {
    const newConstraint: Constraint = {
      id: Math.random().toString(36).substr(2, 9),
      coefficients: new Array(problem.objectiveCoefficients.length).fill(0),
      operator: '<=',
      constant: 0,
    };
    onChange({ ...problem, constraints: [...problem.constraints, newConstraint] });
  };

  const removeConstraint = (id: string) => {
    onChange({ ...problem, constraints: problem.constraints.filter(c => c.id !== id) });
  };

  const handleConstraintCoefficientChange = (cId: string, vIdx: number, value: string) => {
    const newConstraints = problem.constraints.map(c => {
      if (c.id === cId) {
        const newCoeffs = [...c.coefficients];
        newCoeffs[vIdx] = parseFloat(value) || 0;
        return { ...c, coefficients: newCoeffs };
      }
      return c;
    });
    onChange({ ...problem, constraints: newConstraints });
  };

  const handleConstraintConstantChange = (cId: string, value: string) => {
    const newConstraints = problem.constraints.map(c => {
      if (c.id === cId) return { ...c, constant: parseFloat(value) || 0 };
      return c;
    });
    onChange({ ...problem, constraints: newConstraints });
  };

  const handleOperatorChange = (cId: string, op: '<=' | '>=' | '=') => {
    const newConstraints = problem.constraints.map(c => {
      if (c.id === cId) return { ...c, operator: op };
      return c;
    });
    onChange({ ...problem, constraints: newConstraints });
  };

  const addVariable = () => {
    const nextIdx = problem.objectiveCoefficients.length + 1;
    onChange({
      ...problem,
      objectiveCoefficients: [...problem.objectiveCoefficients, 0],
      variables: [...problem.variables, `x${nextIdx}`],
      constraints: problem.constraints.map(c => ({
        ...c,
        coefficients: [...c.coefficients, 0]
      }))
    });
  };

  return (
    <div className="space-y-8">
      {/* Objective Function */}
      <section className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Función Objetivo</h2>
            <button 
              onClick={clearAll}
              className="flex items-center gap-1.5 px-3 py-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-xs font-bold transition-all"
            >
              <RotateCcw size={14} />
              Limpiar Todo
            </button>
          </div>
          <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
            <button
              onClick={() => handleObjectiveTypeChange('MAX')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${problem.objectiveType === 'MAX' ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
            >
              Maximizar
            </button>
            <button
              onClick={() => handleObjectiveTypeChange('MIN')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${problem.objectiveType === 'MIN' ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
            >
              Minimizar
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="text-gray-400 font-serif italic text-xl mr-2">Z =</span>
          {problem.objectiveCoefficients.map((coeff, idx) => (
            <React.Fragment key={idx}>
              <div className="flex flex-col">
                <input
                  type="number"
                  value={coeff}
                  onChange={(e) => handleObjectiveCoefficientChange(idx, e.target.value)}
                  className="w-20 px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-center font-mono dark:text-white"
                />
                <span className="text-[10px] text-center text-gray-400 mt-1 uppercase font-bold tracking-tighter">x{idx + 1}</span>
              </div>
              {idx < problem.objectiveCoefficients.length - 1 && (
                <span className="text-gray-300 text-2xl font-light">+</span>
              )}
            </React.Fragment>
          ))}
          <button
            onClick={addVariable}
            className="ml-4 p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors"
            title="Agregar Variable"
          >
            <Plus size={20} />
          </button>
        </div>
      </section>

      {/* Constraints */}
      <section className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Restricciones</h2>
          <button
            onClick={addConstraint}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-all shadow-md shadow-blue-100 dark:shadow-none"
          >
            <Plus size={16} />
            Nueva Restricción
          </button>
        </div>

        <div className="space-y-4">
          {problem.constraints.map((constraint, cIdx) => (
            <div key={constraint.id} className="flex flex-wrap items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 group">
              <span className="text-xs font-bold text-gray-400 w-6">R{cIdx + 1}</span>
              {constraint.coefficients.map((coeff, vIdx) => (
                <React.Fragment key={vIdx}>
                  <div className="flex flex-col">
                    <input
                      type="number"
                      value={coeff}
                      onChange={(e) => handleConstraintCoefficientChange(constraint.id, vIdx, e.target.value)}
                      className="w-16 px-2 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-center font-mono text-sm dark:text-white"
                    />
                    <span className="text-[9px] text-center text-gray-400 mt-0.5 uppercase font-bold">x{vIdx + 1}</span>
                  </div>
                  {vIdx < constraint.coefficients.length - 1 && (
                    <span className="text-gray-300">+</span>
                  )}
                </React.Fragment>
              ))}

              <select
                value={constraint.operator}
                onChange={(e) => handleOperatorChange(constraint.id, e.target.value as any)}
                className="px-2 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-bold text-gray-700 dark:text-gray-300 outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="<=">≤</option>
                <option value=">=">≥</option>
                <option value="=">=</option>
              </select>

              <input
                type="number"
                value={constraint.constant}
                onChange={(e) => handleConstraintConstantChange(constraint.id, e.target.value)}
                className="w-20 px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-center font-mono text-sm dark:text-white"
              />

              <button
                onClick={() => removeConstraint(constraint.id)}
                className="ml-auto p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          
          {problem.constraints.length === 0 && (
            <div className="text-center py-12 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-2xl">
              <p className="text-gray-400 text-sm italic">No hay restricciones definidas.</p>
            </div>
          )}
        </div>
      </section>

      {/* Variables Configuration */}
      <section className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Configuración de Variables</h2>
        <div className="flex flex-wrap gap-8">
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative flex items-center justify-center">
              <input
                type="checkbox"
                checked={problem.nonNegativity}
                onChange={(e) => onChange({ ...problem, nonNegativity: e.target.checked })}
                className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-gray-300 dark:border-gray-700 transition-all checked:bg-blue-600 checked:border-blue-600"
              />
              <CheckCircle2 className="absolute text-white opacity-0 peer-checked:opacity-100 pointer-events-none" size={14} />
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-blue-600 transition-colors">No admitir negativos (xᵢ ≥ 0)</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative flex items-center justify-center">
              <input
                type="checkbox"
                checked={problem.integerConstraints}
                onChange={(e) => onChange({ ...problem, integerConstraints: e.target.checked })}
                className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-gray-300 dark:border-gray-700 transition-all checked:bg-blue-600 checked:border-blue-600"
              />
              <CheckCircle2 className="absolute text-white opacity-0 peer-checked:opacity-100 pointer-events-none" size={14} />
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-blue-600 transition-colors">No admitir decimales (Enteros)</span>
          </label>
        </div>
      </section>

      <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
        <Info className="text-blue-500 shrink-0 mt-0.5" size={18} />
        <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
          <strong>Guía rápida:</strong> Define tu función objetivo y agrega las restricciones necesarias. 
          El sistema resolverá automáticamente usando el método Simplex. Si tienes exactamente 2 variables, 
          podrás visualizar el gráfico de la región factible.
        </p>
      </div>
    </div>
  );
};
