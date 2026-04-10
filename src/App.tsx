import React, { useState, useEffect } from 'react';
import { LPProblem, SolverResult } from './types';
import { SimplexSolver } from './lib/simplex';
import { ProblemForm } from './components/ProblemForm';
import { GraphicalSolver } from './components/GraphicalSolver';
import { TransportationSolver } from './components/TransportationSolver';
import { AIParser } from './components/AIParser';
import { 
  Calculator, 
  Download, 
  Upload, 
  BookOpen, 
  BarChart3, 
  CheckCircle2, 
  AlertCircle,
  History,
  Settings2,
  Truck,
  Briefcase,
  FileText,
  FileDown,
  Moon,
  Sun,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AssignmentSolverComponent } from './components/AssignmentSolver';
import { calculateVertices, solve2D } from './lib/solverUtils';

const INITIAL_PROBLEM: LPProblem = {
  id: '1',
  name: 'Nuevo Problema',
  objectiveType: 'MAX',
  objectiveCoefficients: [3, 5],
  variables: ['x1', 'x2'],
  constraints: [
    { id: 'c1', coefficients: [1, 0], operator: '<=', constant: 4 },
    { id: 'c2', coefficients: [0, 2], operator: '<=', constant: 12 },
    { id: 'c3', coefficients: [3, 2], operator: '<=', constant: 18 },
  ],
};

export default function App() {
  const [problem, setProblem] = useState<LPProblem>({ ...INITIAL_PROBLEM, nonNegativity: true, integerConstraints: false });
  const [result, setResult] = useState<SolverResult | null>(null);
  const [activeTab, setActiveTab] = useState<'solver' | 'transport' | 'assignment' | 'history' | 'guide'>('solver');
  const [precision, setPrecision] = useState(4);
  const [showAI, setShowAI] = useState(false);
  const [history, setHistory] = useState<{problem: LPProblem, date: string}[]>([]);

  const effectivePrecision = problem.integerConstraints ? 0 : precision;

  useEffect(() => {
    document.documentElement.classList.add('dark');
    const savedHistory = localStorage.getItem('optimaster_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Error loading history", e);
      }
    }
  }, []);

  const solveProblem = () => {
    try {
      let res: SolverResult;
      
      if (problem.objectiveCoefficients.length === 2) {
        // Use robust vertex-based solver for 2D problems
        res = solve2D(problem);
      } else {
        // Use Simplex for more variables
        res = SimplexSolver.solve(
          problem.objectiveType,
          problem.objectiveCoefficients,
          problem.constraints
        ) as SolverResult;
      }

      setResult(res);
      
      // Save to history
      const newHistoryItem = {
        problem: { ...problem, id: Date.now().toString() },
        date: new Date().toLocaleString()
      };
      const updatedHistory = [newHistoryItem, ...history.slice(0, 19)];
      setHistory(updatedHistory);
      localStorage.setItem('optimaster_history', JSON.stringify(updatedHistory));
    } catch (error) {
      console.error(error);
      setResult({ status: 'ERROR' });
    }
  };

  const exportProblem = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(problem));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${problem.name.replace(/\s+/g, '_')}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const importProblem = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const json = JSON.parse(e.target?.result as string);
          setProblem(json);
        } catch (err) {
          alert('Error al importar el archivo.');
        }
      };
      reader.readAsText(file);
    }
  };

  const loadExample = () => {
    setProblem({
      id: 'ex1',
      name: 'Ejemplo: Maximización de Producción',
      objectiveType: 'MAX',
      objectiveCoefficients: [40, 30],
      variables: ['x1', 'x2'],
      constraints: [
        { id: 'c1', coefficients: [2, 1], operator: '<=', constant: 100 },
        { id: 'c2', coefficients: [1, 1], operator: '<=', constant: 80 },
        { id: 'c3', coefficients: [1, 0], operator: '<=', constant: 40 },
      ],
    });
    setResult(null);
  };

  const handleAIResult = (parsed: LPProblem) => {
    setProblem(parsed);
    setShowAI(false);
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans selection:bg-blue-100 transition-colors duration-300">
      {/* Sidebar Navigation */}
      <nav className="fixed left-0 top-0 h-full w-20 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col items-center py-8 gap-8 z-50">
        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200 mb-4">
          <Calculator className="text-white" size={24} />
        </div>
        
        <div className="flex flex-col gap-6">
          <button 
            onClick={() => setActiveTab('solver')}
            className={`p-3 rounded-xl transition-all ${activeTab === 'solver' ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
            title="Programación Lineal (Simplex / Gráfico)"
          >
            <Settings2 size={24} />
          </button>
          <button 
            onClick={() => setActiveTab('transport')}
            className={`p-3 rounded-xl transition-all ${activeTab === 'transport' ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
            title="Modelo de Transporte"
          >
            <Truck size={24} />
          </button>
          <button 
            onClick={() => setActiveTab('assignment')}
            className={`p-3 rounded-xl transition-all ${activeTab === 'assignment' ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
            title="Modelo de Asignación"
          >
            <Briefcase size={24} />
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`p-3 rounded-xl transition-all ${activeTab === 'history' ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
            title="Historial de Ejercicios"
          >
            <History size={24} />
          </button>
          <button 
            onClick={() => setActiveTab('guide')}
            className={`p-3 rounded-xl transition-all ${activeTab === 'guide' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
            title="Guía de Uso"
          >
            <BookOpen size={24} />
          </button>
        </div>

        <div className="mt-auto flex flex-col gap-4 pb-4">
          <div className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${problem.integerConstraints ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800' : 'bg-gray-50 dark:bg-gray-800'}`}>
            <span className={`text-[10px] font-bold uppercase ${problem.integerConstraints ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`}>Dec</span>
            <select 
              value={effectivePrecision} 
              onChange={(e) => setPrecision(parseInt(e.target.value))}
              disabled={problem.integerConstraints}
              className={`bg-transparent text-xs font-bold outline-none cursor-pointer transition-colors ${problem.integerConstraints ? 'text-blue-600 dark:text-blue-400 cursor-not-allowed' : 'text-blue-600'}`}
              title={problem.integerConstraints ? "Deshabilitado por restricción de enteros" : "Precisión decimal"}
            >
              {[0, 1, 2, 3, 4, 5, 6].map(v => (
                <option key={v} value={v} className="bg-white dark:bg-gray-900">{v}</option>
              ))}
            </select>
          </div>
          <label 
            className="p-3 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-800 rounded-xl cursor-pointer transition-all"
            title="Importar Problema (.json)"
          >
            <Upload size={24} />
            <input type="file" className="hidden" onChange={importProblem} accept=".json" />
          </label>
          <button 
            onClick={exportProblem}
            className="p-3 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
            title="Exportar Problema (.json)"
          >
            <Download size={24} />
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pl-20 min-h-screen">
        <header className="h-20 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-12 sticky top-0 z-40">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">OptiMaster</h1>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-widest">Investigación Operativa</p>
          </div>

          <div className="flex items-center gap-4">
            {activeTab === 'solver' && (
              <>
                <button 
                  onClick={() => setShowAI(!showAI)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${showAI ? 'bg-indigo-600 text-white' : 'text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'}`}
                >
                  <Sparkles size={18} />
                  IA
                </button>
                <button 
                  onClick={loadExample}
                  className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline px-2"
                >
                  Cargar Ejemplo
                </button>
                <input 
                  type="text" 
                  value={problem.name}
                  onChange={(e) => setProblem({...problem, name: e.target.value})}
                  className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-2 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none w-64 dark:text-white"
                  placeholder="Nombre del ejercicio..."
                />
                <button 
                  onClick={solveProblem}
                  className="bg-blue-600 text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 dark:shadow-none flex items-center gap-2"
                >
                  <BarChart3 size={18} />
                  Resolver
                </button>
              </>
            )}
            {activeTab === 'transport' && (
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Modelo de Transporte</h2>
            )}
            {activeTab === 'assignment' && (
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Modelo de Asignación</h2>
            )}
          </div>
        </header>

        <div className="p-12 max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'solver' && (
              <motion.div 
                key="solver"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-12"
              >
                {/* Left Column: Inputs */}
                <div className="lg:col-span-7 space-y-8">
                  {showAI && <AIParser onParsed={handleAIResult} />}
                  <ProblemForm problem={problem} onChange={setProblem} />
                </div>

                {/* Right Column: Results & Visualization */}
                <div className="lg:col-span-5 space-y-8">
                  {result ? (
                    <motion.div 
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xl shadow-gray-200/50 dark:shadow-none"
                    >
                      <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                          {result.status === 'OPTIMAL' ? (
                            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center">
                              <CheckCircle2 size={24} />
                            </div>
                          ) : (
                            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center">
                              <AlertCircle size={24} />
                            </div>
                          )}
                          <div>
                            <h3 className="text-lg font-bold">Resultado: {result.status === 'OPTIMAL' ? 'Óptimo' : result.status}</h3>
                            <p className="text-xs text-gray-400">Cálculo finalizado</p>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <button 
                            onClick={() => {
                              const vertices = calculateVertices(problem);
                              const formatVar = (v: string) => v.toUpperCase();
                              const resultsText = `Reporte de optimización: ${problem.name}
==================================================

a) Variables de decisión:
--------------------------------------------------
${problem.variables.map(formatVar).join(', ')}

b) Tipo de modelo:
--------------------------------------------------
${problem.objectiveType === 'MAX' ? 'Maximizar' : 'Minimizar'}

c) Función objetivo:
--------------------------------------------------
Z = ${problem.objectiveCoefficients.map((c, i) => `${c}${formatVar(problem.variables[i])}`).join(' + ')}

d) Restricciones del problema:
--------------------------------------------------
${problem.constraints.map((c, i) => `R${i + 1}: ${c.coefficients.map((coeff, idx) => `${coeff}${formatVar(problem.variables[idx])}`).join(' + ')} ${c.operator} ${c.constant}`).join('\n')}
${problem.nonNegativity ? problem.variables.map(v => `${formatVar(v)} >= 0`).join(', ') : ''}

e) Cálculo de vértices (región factible):
--------------------------------------------------
${vertices.map((v, i) => `V${i + 1}: (${v.x.toFixed(effectivePrecision)}, ${v.y.toFixed(effectivePrecision)}) - Fórmula: ${v.source.replace(/x(\d+)/g, (m) => m.toUpperCase())}`).join('\n')}

f) Evaluación de la función objetivo en vértices:
--------------------------------------------------
${vertices.map((v, i) => `Z(V${i + 1}) = ${v.z.toFixed(effectivePrecision)}`).join('\n')}

g) Solución óptima:
==================================================
Estado: ${result.status}
Valor óptimo (Z): ${result.objectiveValue?.toFixed(effectivePrecision)}

Valores de las variables:
${Object.entries(result.variableValues || {}).map(([key, val]) => `${formatVar(key)} = ${(val as number).toFixed(effectivePrecision)}`).join('\n')}

h) Estado de las restricciones:
--------------------------------------------------
${(result.constraintStatus || []).map(cs => `${cs.label}: ${cs.active ? 'ACTIVA' : 'HOLGURA'} (Valor: ${cs.value.toFixed(effectivePrecision)}, Holgura/Excedente: ${cs.slack.toFixed(effectivePrecision)})`).join('\n')}
==================================================
`;
                              navigator.clipboard.writeText(resultsText);
                              alert('Resultados copiados al portapapeles');
                            }}
                            className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-bold hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all"
                            title="Copiar Resultados"
                          >
                            <FileText size={16} />
                            Copiar Texto
                          </button>
                        </div>
                      </div>

                      {result.status === 'OPTIMAL' && problem.integerConstraints && Object.values(result.variableValues || {}).some((v: any) => Math.abs(v - Math.round(v)) > 1e-7) && (
                        <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-2xl flex items-start gap-3">
                          <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={18} />
                          <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                            <strong>Nota:</strong> Se detectaron valores decimales en un problema con restricción de enteros. 
                            La solución mostrada es el óptimo lineal. Se recomienda usar métodos de ramificación y acotamiento para precisión entera.
                          </p>
                        </div>
                      )}

                      {result.status === 'OPTIMAL' && (
                        <div className="space-y-6">
                          <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700">
                            <p className="text-xs text-gray-400 uppercase font-bold tracking-widest mb-1">Valor de la Función Objetivo (Z)</p>
                            <p className="text-4xl font-black text-blue-600 dark:text-blue-400 font-mono">
                              {result.objectiveValue !== undefined ? result.objectiveValue.toFixed(effectivePrecision) : '0'.repeat(effectivePrecision || 1)}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-gray-400 uppercase font-bold tracking-widest mb-4">Variables de Decisión</p>
                            <div className="grid grid-cols-2 gap-4">
                              {Object.entries(result.variableValues || {}).map(([key, val]) => (
                                <div key={key} className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center justify-between">
                                  <span className="text-sm font-bold text-gray-500">{key}</span>
                                  <span className="text-lg font-mono font-bold text-gray-900 dark:text-white">{(val as number).toFixed(effectivePrecision)}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {result.constraintStatus && (
                            <div>
                              <p className="text-xs text-gray-400 uppercase font-bold tracking-widest mb-4">Estado de Restricciones</p>
                              <div className="space-y-3">
                                {result.constraintStatus.map((cs) => (
                                  <div key={cs.id} className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
                                    <div className="flex justify-between items-center mb-2">
                                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cs.active ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'}`}>
                                        {cs.label}: {cs.active ? 'ACTIVA' : 'HOLGURA'}
                                      </span>
                                      <span className="text-xs font-mono text-gray-400">
                                        {cs.value.toFixed(effectivePrecision)} {cs.operator} {cs.constant}
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center text-[10px] text-gray-400 uppercase tracking-wider">
                                      <span>Holgura / Excedente</span>
                                      <span className="font-bold text-gray-600 dark:text-gray-300">{cs.slack.toFixed(effectivePrecision)}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Detailed Results Section */}
                          <div className="pt-6 border-t border-gray-100 dark:border-gray-800 space-y-4">
                            <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-tight">Detalle del Modelo</h4>
                            <div className="text-xs space-y-2 text-gray-600 dark:text-gray-400 font-mono bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl">
                              <p><span className="text-blue-500 font-bold">OBJ:</span> {problem.objectiveType} Z = {problem.objectiveCoefficients.map((c, i) => `${c}${problem.variables[i]}`).join(' + ')}</p>
                              <div className="space-y-1">
                                <p className="text-blue-500 font-bold">S.A:</p>
                                {problem.constraints.map((c, i) => (
                                  <p key={i} className="pl-4">R{i+1}: {c.coefficients.map((coeff, idx) => `${coeff}${problem.variables[idx]}`).join(' + ')} {c.operator} {c.constant}</p>
                                ))}
                                {problem.nonNegativity && <p className="pl-4">{problem.variables.join(', ')} ≥ 0</p>}
                              </div>
                            </div>

                            {problem.objectiveCoefficients.length === 2 && (
                              <div className="space-y-4">
                                <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-tight">Análisis de Vértices</h4>
                                <div className="space-y-3">
                                  {calculateVertices(problem).map((v, i) => (
                                    <div key={i} className="bg-gray-50 dark:bg-gray-800/30 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                                      <div className="flex justify-between items-center mb-1">
                                        <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">Vértice V{i+1}</span>
                                        <span className="font-mono text-xs font-bold text-gray-900 dark:text-white">Z = {v.z.toFixed(effectivePrecision)}</span>
                                      </div>
                                      <p className="font-mono text-sm mb-1 text-gray-900 dark:text-white">({v.x.toFixed(effectivePrecision)}, {v.y.toFixed(effectivePrecision)})</p>
                                      <p className="text-[10px] text-gray-400 italic leading-tight">{v.source}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ) : (
                    <div className="bg-white dark:bg-gray-900 p-12 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800 flex flex-col items-center justify-center text-center">
                      <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4 text-gray-300 dark:text-gray-700">
                        <BarChart3 size={32} />
                      </div>
                      <h3 className="text-gray-400 font-medium">Esperando ejecución...</h3>
                      <p className="text-xs text-gray-300 dark:text-gray-600 mt-2 max-w-xs">Configura los parámetros y presiona "Resolver" para ver los resultados.</p>
                    </div>
                  )}

                  {problem.objectiveCoefficients.length === 2 && (
                    <GraphicalSolver 
                      problem={problem} 
                      optimalPoint={result?.status === 'OPTIMAL' ? result.variableValues : undefined} 
                      precision={effectivePrecision}
                    />
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'transport' && (
              <motion.div
                key="transport"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <TransportationSolver precision={effectivePrecision} />
              </motion.div>
            )}

            {activeTab === 'assignment' && (
              <motion.div
                key="assignment"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <AssignmentSolverComponent precision={effectivePrecision} />
              </motion.div>
            )}

            {activeTab === 'guide' && (
              <motion.div 
                key="guide"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="max-w-4xl mx-auto space-y-12"
              >
                <div className="text-center">
                  <h2 className="text-3xl font-bold mb-4">Guía de Uso</h2>
                  <p className="text-gray-500">Aprende a utilizar OptiMaster para tus problemas de Investigación Operativa.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-3">
                      <span className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center text-sm">1</span>
                      Programación Lineal
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                      Ingresa los coeficientes de tu función objetivo y añade las restricciones. El sistema utiliza el algoritmo Simplex para encontrar la solución óptima.
                    </p>
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl text-sm text-blue-700 dark:text-blue-300 italic">
                      Tip: Para problemas de 2 variables, se habilitará automáticamente el gráfico interactivo.
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-3">
                      <span className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center text-sm">2</span>
                      Modelo de Transporte
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                      Resuelve problemas de logística asignando suministros de orígenes a destinos con costo mínimo.
                    </p>
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl text-sm text-indigo-700 dark:text-indigo-300 italic">
                      Métodos: Esquina Noroeste y Costo Mínimo disponibles.
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-3">
                      <span className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center text-sm">3</span>
                      Modelo de Asignación
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                      Utiliza el Algoritmo Húngaro para asignar tareas a trabajadores de forma que el costo total sea el menor posible.
                    </p>
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl text-sm text-green-700 dark:text-green-300 italic">
                      Ideal para: Asignación de personal, máquinas o proyectos.
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-3">
                      <span className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center text-sm">4</span>
                      Asistente de IA
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                      Pega el enunciado de tu problema y deja que la IA detecte automáticamente las variables, función objetivo y restricciones.
                    </p>
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl text-sm text-purple-700 dark:text-purple-300 italic">
                      Uso: Haz clic en el botón "IA" en la cabecera del Solver.
                    </div>
                  </div>
                </div>

                <div className="bg-blue-600 rounded-3xl p-12 text-white">
                  <h3 className="text-2xl font-bold mb-6">Resultados Listos para Copiar</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center"><FileText size={20}/></div>
                      <h4 className="font-bold">Formato Estructurado</h4>
                      <p className="text-sm text-blue-100">Obtén un resumen detallado con variables, restricciones y solución óptima listo para tus informes.</p>
                    </div>
                    <div className="space-y-2">
                      <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center"><Sparkles size={20}/></div>
                      <h4 className="font-bold">Análisis de Vértices</h4>
                      <p className="text-sm text-blue-100">Visualiza y copia la evaluación de la función objetivo en cada punto extremo de la región factible.</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'history' && (
              <motion.div 
                key="history"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-4xl mx-auto space-y-8"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Historial de Ejercicios</h2>
                  <button 
                    onClick={() => {
                      setHistory([]);
                      localStorage.removeItem('optimaster_history');
                    }}
                    className="text-sm text-red-500 hover:underline"
                  >
                    Borrar Todo
                  </button>
                </div>

                {history.length > 0 ? (
                  <div className="grid gap-4">
                    {history.map((item, index) => (
                      <div 
                        key={index}
                        className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center justify-between hover:border-blue-200 dark:hover:border-blue-900 transition-all group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl flex items-center justify-center">
                            <FileText size={20} />
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900 dark:text-white">{item.problem.name}</h4>
                            <p className="text-xs text-gray-400">{item.date} • {item.problem.objectiveType} • {item.problem.variables.length} variables</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => {
                              setProblem(item.problem);
                              setActiveTab('solver');
                              setResult(null);
                            }}
                            className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-sm font-bold hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all"
                          >
                            Cargar
                          </button>
                          <button 
                            onClick={() => {
                              const newHistory = history.filter((_, i) => i !== index);
                              setHistory(newHistory);
                              localStorage.setItem('optimaster_history', JSON.stringify(newHistory));
                            }}
                            className="p-2 text-gray-300 hover:text-red-500 transition-all"
                          >
                            <AlertCircle size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-24">
                    <History size={48} className="mx-auto text-gray-200 mb-4" />
                    <h3 className="text-xl font-bold text-gray-400">Historial Vacío</h3>
                    <p className="text-gray-300 mt-2">Tus ejercicios resueltos aparecerán aquí.</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
