import React, { useState } from 'react';
import { Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { parseLPProblem } from '../lib/aiService';
import { LPProblem } from '../types';

interface AIParserProps {
  onParsed: (problem: LPProblem) => void;
}

export const AIParser: React.FC<AIParserProps> = ({ onParsed }) => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleParse = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const parsed = await parseLPProblem(text);
      if (parsed.name) {
        onParsed({
          ...parsed,
          id: Math.random().toString(36).substr(2, 9),
        } as LPProblem);
        setText('');
      }
    } catch (err: any) {
      setError(err.message || 'Error al procesar el texto.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-3xl text-white shadow-xl shadow-blue-200/50 mb-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
          <Sparkles size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold">Asistente IA</h2>
          <p className="text-blue-100 text-sm">Describe tu problema y deja que la IA lo modele por ti.</p>
        </div>
      </div>

      <div className="space-y-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ejemplo: Una fábrica produce dos tipos de sillas. La silla A requiere 2 horas de carpintería y 1 de pintura, con un beneficio de $40. La silla B requiere 1 de carpintería y 1 de pintura, con un beneficio de $30. Disponemos de 100 horas de carpintería y 80 de pintura..."
          className="w-full h-32 bg-white/10 border border-white/20 rounded-2xl p-4 text-sm placeholder:text-blue-200/50 focus:ring-2 focus:ring-white/50 outline-none transition-all resize-none"
        />

        {error && (
          <div className="flex items-center gap-2 text-red-200 text-xs bg-red-500/20 p-3 rounded-xl border border-red-500/30">
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        <button
          onClick={handleParse}
          disabled={loading || !text.trim()}
          className="w-full bg-white text-blue-600 py-3 rounded-2xl font-bold text-sm hover:bg-blue-50 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-black/10"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              Analizando problema...
            </>
          ) : (
            <>
              <Sparkles size={18} />
              Modelar Problema
            </>
          )}
        </button>
      </div>
    </div>
  );
};
