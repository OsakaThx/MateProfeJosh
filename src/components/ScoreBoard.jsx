import { Trophy, Target, TrendingUp, RotateCcw } from 'lucide-react';

export default function ScoreBoard({ score, onReset }) {
  const accuracy = score.total > 0
    ? Math.round((score.correct / score.total) * 100)
    : 0;

  const streakColor =
    score.streak >= 5 ? 'text-yellow-400' :
    score.streak >= 3 ? 'text-orange-400' :
    'text-gray-400';

  return (
    <div className="flex flex-wrap items-center gap-3 justify-center">
      {/* Correct */}
      <div className="flex items-center gap-2 rounded-xl border border-green-800/50 bg-green-900/20 px-4 py-2">
        <Trophy size={16} className="text-green-400" />
        <span className="text-sm text-gray-300">Correctas:</span>
        <span className="font-bold text-green-400">{score.correct}</span>
      </div>

      {/* Total */}
      <div className="flex items-center gap-2 rounded-xl border border-gray-700 bg-gray-800/40 px-4 py-2">
        <Target size={16} className="text-gray-400" />
        <span className="text-sm text-gray-300">Total:</span>
        <span className="font-bold text-white">{score.total}</span>
      </div>

      {/* Accuracy */}
      <div className="flex items-center gap-2 rounded-xl border border-blue-800/50 bg-blue-900/20 px-4 py-2">
        <TrendingUp size={16} className="text-blue-400" />
        <span className="text-sm text-gray-300">Precisión:</span>
        <span className="font-bold text-blue-400">{accuracy}%</span>
      </div>

      {/* Streak */}
      {score.streak > 0 && (
        <div className={`flex items-center gap-1 rounded-xl border border-yellow-800/50 bg-yellow-900/20 px-4 py-2`}>
          <span className="text-lg">🔥</span>
          <span className={`font-bold ${streakColor}`}>{score.streak} racha</span>
        </div>
      )}

      {/* Reset */}
      {score.total > 0 && (
        <button
          onClick={onReset}
          title="Reiniciar puntuación"
          className="flex items-center gap-1 rounded-xl border border-gray-700 px-3 py-2 text-xs text-gray-400 hover:text-white hover:border-gray-500 transition-colors"
        >
          <RotateCcw size={13} />
          Reset
        </button>
      )}
    </div>
  );
}
