import React, { useState } from 'react';
import { Plus, Trash2, Calculator, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { TransportationSolverLib, TransportSource, TransportDestination } from '../lib/transportation';

interface TransportationSolverProps {
  precision?: number;
}

export const TransportationSolver: React.FC<TransportationSolverProps> = ({ precision = 4 }) => {
  const [sources, setSources] = useState<TransportSource[]>([{ id: 's1', name: 'Origen 1', supply: 100 }]);
  const [destinations, setDestinations] = useState<TransportDestination[]>([{ id: 'd1', name: 'Destino 1', demand: 80 }]);
  const [costs, setCosts] = useState<Record<string, number>>({ 's1-d1': 10 });
  const [method, setMethod] = useState<'NW' | 'MIN'>('NW');
  const [result, setResult] = useState<any>(null);

  const totalSupply = sources.reduce((sum, s) => sum + s.supply, 0);
  const totalDemand = destinations.reduce((sum, d) => sum + d.demand, 0);
  const isBalanced = totalSupply === totalDemand;

  const addSource = () => {
    const id = `s${sources.length + 1}`;
    setSources([...sources, { id, name: `Origen ${sources.length + 1}`, supply: 0 }]);
  };

  const removeSource = (id: string) => {
    if (sources.length > 1) {
      setSources(sources.filter(s => s.id !== id));
    }
  };

  const addDestination = () => {
    const id = `d${destinations.length + 1}`;
    setDestinations([...destinations, { id, name: `Destino ${destinations.length + 1}`, demand: 0 }]);
  };

  const removeDestination = (id: string) => {
    if (destinations.length > 1) {
      setDestinations(destinations.filter(d => d.id !== id));
    }
  };

  const solve = () => {
    let res;
    if (method === 'NW') {
      res = TransportationSolverLib.solveNorthwestCorner(sources, destinations, costs);
    } else {
      res = TransportationSolverLib.solveMinimumCost(sources, destinations, costs);
    }
    setResult(res);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl ${isBalanced ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
            {isBalanced ? <CheckCircle2 size={24} /> : <AlertTriangle size={24} />}
          </div>
          <div>
            <h3 className="font-bold">Estado del Problema</h3>
            <p className="text-xs text-gray-400">
              Oferta: <span className="font-mono font-bold text-gray-600 dark:text-gray-300">{totalSupply}</span> | 
              Demanda: <span className="font-mono font-bold text-gray-600 dark:text-gray-300">{totalDemand}</span>
            </p>
          </div>
        </div>
        {!isBalanced && (
          <p className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-4 py-2 rounded-lg font-medium">
            El problema no está balanceado. Se recomienda añadir un origen o destino ficticio.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Sources */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 dark:text-white">Orígenes (Oferta)</h3>
            <button onClick={addSource} className="text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 p-2 rounded-lg"><Plus size={18}/></button>
          </div>
          <div className="space-y-3">
            {sources.map(s => (
              <div key={s.id} className="flex items-center gap-3 group">
                <input 
                  value={s.name} 
                  onChange={e => setSources(sources.map(x => x.id === s.id ? {...x, name: e.target.value} : x))}
                  className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 px-3 py-1.5 rounded-lg text-sm dark:text-white"
                />
                <input 
                  type="number" 
                  value={s.supply} 
                  onChange={e => setSources(sources.map(x => x.id === s.id ? {...x, supply: parseInt(e.target.value) || 0} : x))}
                  className="w-20 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 px-3 py-1.5 rounded-lg text-sm font-mono dark:text-white"
                />
                <button 
                  onClick={() => removeSource(s.id)}
                  className="p-1.5 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Destinations */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 dark:text-white">Destinos (Demanda)</h3>
            <button onClick={addDestination} className="text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 p-2 rounded-lg"><Plus size={18}/></button>
          </div>
          <div className="space-y-3">
            {destinations.map(d => (
              <div key={d.id} className="flex items-center gap-3 group">
                <input 
                  value={d.name} 
                  onChange={e => setDestinations(destinations.map(x => x.id === d.id ? {...x, name: e.target.value} : x))}
                  className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 px-3 py-1.5 rounded-lg text-sm dark:text-white"
                />
                <input 
                  type="number" 
                  value={d.demand} 
                  onChange={e => setDestinations(destinations.map(x => x.id === d.id ? {...x, demand: parseInt(e.target.value) || 0} : x))}
                  className="w-20 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 px-3 py-1.5 rounded-lg text-sm font-mono dark:text-white"
                />
                <button 
                  onClick={() => removeDestination(d.id)}
                  className="p-1.5 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cost Matrix */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-x-auto">
        <h3 className="font-bold text-gray-900 dark:text-white mb-6">Matriz de Costos</h3>
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="p-2"></th>
              {destinations.map(d => <th key={d.id} className="p-2 text-gray-400 font-medium">{d.name}</th>)}
            </tr>
          </thead>
          <tbody>
            {sources.map(s => (
              <tr key={s.id}>
                <td className="p-2 font-bold text-gray-500">{s.name}</td>
                {destinations.map(d => (
                  <td key={d.id} className="p-2">
                    <input 
                      type="number"
                      value={costs[`${s.id}-${d.id}`] || 0}
                      onChange={e => setCosts({...costs, [`${s.id}-${d.id}`]: parseInt(e.target.value) || 0})}
                      className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 px-2 py-1.5 rounded-lg text-center font-mono dark:text-white"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl flex">
          <button 
            onClick={() => setMethod('NW')}
            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${method === 'NW' ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm' : 'text-gray-400'}`}
          >
            Esquina Noroeste
          </button>
          <button 
            onClick={() => setMethod('MIN')}
            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${method === 'MIN' ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm' : 'text-gray-400'}`}
          >
            Costo Mínimo
          </button>
        </div>
        <button 
          onClick={solve}
          className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 dark:shadow-none flex items-center justify-center gap-2"
        >
          <Calculator size={20} />
          Resolver
        </button>
      </div>

      {result && (
        <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xl">
          <h3 className="text-xl font-bold mb-6 dark:text-white">Resultado de Asignación</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <p className="text-xs text-gray-400 uppercase font-bold tracking-widest">Costo Total</p>
              <p className="text-4xl font-black text-blue-600 dark:text-blue-400 font-mono">${result.totalCost.toFixed(precision)}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl">
              <p className="text-xs text-gray-400 uppercase font-bold tracking-widest mb-4">Detalle de Envíos</p>
              <div className="space-y-2">
                {Object.entries(result.allocation).map(([key, qty]) => {
                  if (qty === 0) return null;
                  const [sId, dId] = (key as string).split('-');
                  const sName = sources.find(x => x.id === sId)?.name;
                  const dName = destinations.find(x => x.id === dId)?.name;
                  return (
                    <div key={key} className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">{sName} → {dName}</span>
                      <span className="font-bold dark:text-white">{qty} unidades</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
