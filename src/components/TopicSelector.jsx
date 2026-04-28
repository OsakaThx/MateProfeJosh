import { MathDisplay } from './MathRenderer';

const TOPICS = [
  {
    key: 'funciones',
    label: 'Funciones',
    icon: '𝑓',
    desc: 'Evalúa, compone y analiza funciones',
    latex: 'f(x) = y',
    color: '#7c3aed',
  },
  {
    key: 'dominio_rango',
    label: 'Dominio y Rango',
    icon: '📐',
    desc: 'Encuentra qué valores puede tomar x e y',
    latex: '[-3, +\\infty)',
    color: '#0ea5e9',
  },
  {
    key: 'formulas_notables',
    label: 'Fórmulas Notables',
    icon: '✨',
    desc: 'Cuadrados, cubos y diferencia de cuadrados',
    latex: '(a+b)^2 = a^2+2ab+b^2',
    color: '#f59e0b',
  },
  {
    key: 'factorizacion',
    label: 'Factorización',
    icon: '🧩',
    desc: 'Factor común, fórmulas notables, suma de cubos',
    latex: 'ax^2+bx+c = a(x-r_1)(x-r_2)',
    color: '#10b981',
  },
  {
    key: 'formula_general',
    label: 'Fórmula General',
    icon: '⚡',
    desc: 'Resuelve ecuaciones cuadráticas',
    latex: 'x=\\frac{-b\\pm\\sqrt{b^2-4ac}}{2a}',
    color: '#ef4444',
  },
];

export default function TopicSelector({ selected, onSelect }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {TOPICS.map(topic => {
        const isSelected = selected === topic.key;
        return (
          <button
            key={topic.key}
            onClick={() => onSelect(topic.key)}
            className={`relative text-left rounded-2xl border p-4 transition-all hover:scale-[1.02] active:scale-[0.98] ${
              isSelected
                ? 'border-purple-500 ring-1 ring-purple-500/40'
                : 'border-gray-700 hover:border-gray-500'
            }`}
            style={{
              background: isSelected
                ? `linear-gradient(135deg, ${topic.color}22, ${topic.color}11)`
                : 'linear-gradient(135deg, #1a1a2e, #16213e)',
            }}
          >
            {isSelected && (
              <div className="absolute top-2 right-2 w-2 h-2 rounded-full"
                style={{ background: topic.color }} />
            )}
            <div className="flex items-start gap-3">
              <span className="text-2xl">{topic.icon}</span>
              <div className="min-w-0">
                <p className="font-bold text-white text-sm">{topic.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{topic.desc}</p>
                <div className="mt-2 text-xs overflow-hidden"
                  style={{ color: topic.color }}>
                  <MathDisplay latex={topic.latex} />
                </div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
