import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { MathText, MathDisplay } from './MathRenderer';

/* ─── Data ─────────────────────────────────────────── */

const SECTIONS = [
  {
    id: 'funciones',
    title: 'Funciones',
    icon: '𝑓',
    color: '#7c3aed',
    intro: 'Una función es una relación donde a cada valor de entrada $x$ le corresponde exactamente UN valor de salida $y$. Se escribe $f(x) = y$.',
    rules: [
      { rule: 'Definición', detail: 'Cada $x$ tiene exactamente un $y$. Si una $x$ produce dos $y$ distintos, NO es función.' },
      { rule: 'Composición', detail: '$(f \\circ g)(x) = f(g(x))$. Primero aplica $g$, luego aplica $f$ al resultado.' },
      { rule: 'Evaluación', detail: 'Sustituye la variable por el valor dado y simplifica.' },
    ],
    examples: [
      {
        level: 'fácil',
        levelColor: 'text-green-400',
        problem: '¿Cuánto vale $f(3)$ si $f(x) = 2x + 1$?',
        steps: [
          'Sustituir $x = 3$: $f(3) = 2(3) + 1$',
          'Calcular: $6 + 1 = 7$',
        ],
        answer: '$f(3) = 7$',
      },
      {
        level: 'medio',
        levelColor: 'text-yellow-400',
        problem: 'Si $f(x) = x^2 - 1$ y $g(x) = 3x$, calcula $f(g(2))$.',
        steps: [
          'Primero $g(2) = 3(2) = 6$',
          'Luego $f(6) = 6^2 - 1 = 36 - 1 = 35$',
        ],
        answer: '$f(g(2)) = 35$',
      },
      {
        level: 'difícil',
        levelColor: 'text-red-400',
        problem: 'Dada $f(x) = \\dfrac{x+2}{x-1}$, calcula $f(f(3))$.',
        steps: [
          '$f(3) = \\dfrac{3+2}{3-1} = \\dfrac{5}{2}$',
          '$f\\!\\left(\\dfrac{5}{2}\\right) = \\dfrac{\\frac{5}{2}+2}{\\frac{5}{2}-1} = \\dfrac{\\frac{9}{2}}{\\frac{3}{2}} = 3$',
        ],
        answer: '$f(f(3)) = 3$',
      },
    ],
  },
  {
    id: 'dominio_rango',
    title: 'Dominio y Rango',
    icon: '📐',
    color: '#0ea5e9',
    intro: 'El **dominio** es el conjunto de todos los valores de $x$ para los que la función está definida. El **rango** es el conjunto de todos los valores posibles de $y$.',
    rules: [
      { rule: 'Regla 1 – Denominador', detail: 'No puedes dividir entre cero. Iguala el denominador a $0$ y excluye esos $x$.' },
      { rule: 'Regla 2 – Raíz cuadrada', detail: 'El interior de una raíz cuadrada debe ser $\\geq 0$. Resuelve la inecuación.' },
      { rule: 'Regla 3 – Logaritmo', detail: 'El argumento de un logaritmo debe ser $> 0$.' },
      { rule: 'Regla 4 – Polinomio', detail: 'Un polinomio no tiene restricciones: dominio $= (-\\infty, +\\infty)$.' },
      { rule: 'Notación', detail: '$[a,b]$ incluye extremos · $(a,b)$ los excluye · $\\cup$ = unión de intervalos.' },
    ],
    examples: [
      {
        level: 'fácil',
        levelColor: 'text-green-400',
        problem: 'Encuentra el dominio de $f(x) = x^2 + 5$.',
        steps: [
          'Es un polinomio → sin restricciones.',
          'Dominio $= (-\\infty, +\\infty)$',
        ],
        answer: '$(-\\infty, +\\infty)$',
      },
      {
        level: 'medio',
        levelColor: 'text-yellow-400',
        problem: 'Encuentra el dominio de $g(x) = \\sqrt{4 - x}$.',
        steps: [
          'Interior $\\geq 0$: $4 - x \\geq 0$',
          '$x \\leq 4$',
          'Dominio $= (-\\infty, 4]$',
        ],
        answer: '$(-\\infty, 4]$',
      },
      {
        level: 'difícil',
        levelColor: 'text-red-400',
        problem: 'Encuentra el dominio de $h(x) = \\dfrac{\\sqrt{x-1}}{x^2-9}$.',
        steps: [
          'Raíz: $x - 1 \\geq 0 \\Rightarrow x \\geq 1$',
          'Denominador $\\neq 0$: $x^2-9=0 \\Rightarrow x=\\pm 3$',
          'Combinar: $x \\geq 1$ pero $x \\neq 3$',
          'Dominio $= [1, 3) \\cup (3, +\\infty)$',
        ],
        answer: '$[1, 3) \\cup (3, +\\infty)$',
      },
    ],
  },
  {
    id: 'formulas_notables',
    title: 'Fórmulas Notables',
    icon: '✨',
    color: '#f59e0b',
    intro: 'Las fórmulas notables son patrones algebraicos fijos que permiten expandir o factorizar expresiones sin hacer toda la multiplicación.',
    rules: [
      { rule: '$(a+b)^2$', detail: '$= a^2 + 2ab + b^2$' },
      { rule: '$(a-b)^2$', detail: '$= a^2 - 2ab + b^2$' },
      { rule: '$(a+b)(a-b)$', detail: '$= a^2 - b^2$ (diferencia de cuadrados)' },
      { rule: '$(a+b)^3$', detail: '$= a^3 + 3a^2b + 3ab^2 + b^3$' },
      { rule: '$a^3 + b^3$', detail: '$= (a+b)(a^2 - ab + b^2)$ (suma de cubos)' },
      { rule: '$a^3 - b^3$', detail: '$= (a-b)(a^2 + ab + b^2)$ (diferencia de cubos)' },
    ],
    examples: [
      {
        level: 'fácil',
        levelColor: 'text-green-400',
        problem: 'Expande $(x + 4)^2$.',
        steps: [
          'Usar $(a+b)^2 = a^2 + 2ab + b^2$ con $a=x,\\ b=4$',
          '$x^2 + 2(x)(4) + 4^2$',
          '$= x^2 + 8x + 16$',
        ],
        answer: '$x^2 + 8x + 16$',
      },
      {
        level: 'medio',
        levelColor: 'text-yellow-400',
        problem: 'Factoriza $9x^2 - 25$.',
        steps: [
          'Reconocer: $9x^2 - 25 = (3x)^2 - 5^2$',
          'Usar diferencia de cuadrados: $(a+b)(a-b)$',
          '$(3x + 5)(3x - 5)$',
        ],
        answer: '$(3x+5)(3x-5)$',
      },
      {
        level: 'difícil',
        levelColor: 'text-red-400',
        problem: 'Expande $(2x - 3)^3$.',
        steps: [
          'Usar $(a-b)^3 = a^3 - 3a^2b + 3ab^2 - b^3$ con $a=2x,\\ b=3$',
          '$(2x)^3 - 3(2x)^2(3) + 3(2x)(3)^2 - 3^3$',
          '$8x^3 - 36x^2 + 54x - 27$',
        ],
        answer: '$8x^3 - 36x^2 + 54x - 27$',
      },
    ],
  },
  {
    id: 'factorizacion',
    title: 'Factorización',
    icon: '🧩',
    color: '#10b981',
    intro: 'Factorizar es el proceso inverso de expandir: cerrar los paréntesis. Es esencial para resolver ecuaciones y simplificar expresiones.',
    rules: [
      { rule: 'Paso 1 SIEMPRE', detail: 'Busca factor común primero (MCD de coeficientes × variable de menor exponente).' },
      { rule: '2 términos', detail: 'Busca diferencia de cuadrados $a^2-b^2$ o suma/diferencia de cubos.' },
      { rule: '3 términos', detail: 'Busca cuadrado de binomio o usa la fórmula general si no hay patrón.' },
      { rule: '4 términos', detail: 'Prueba factorización por agrupación (2+2 o 3+1).' },
      { rule: 'Verificar', detail: 'Siempre expande tu resultado para confirmar que coincide con el original.' },
    ],
    examples: [
      {
        level: 'fácil',
        levelColor: 'text-green-400',
        problem: 'Factoriza $4x^2 - 16$.',
        steps: [
          'Factor común: $4(x^2 - 4)$',
          'Diferencia de cuadrados: $x^2 - 2^2$',
          '= $4(x+2)(x-2)$',
        ],
        answer: '$4(x+2)(x-2)$',
      },
      {
        level: 'medio',
        levelColor: 'text-yellow-400',
        problem: 'Factoriza $x^2 + 7x + 12$.',
        steps: [
          'Buscar dos números: suma $= 7$, producto $= 12$ → son $3$ y $4$',
          '$(x + 3)(x + 4)$',
          'Verificar: $x^2 + 4x + 3x + 12 = x^2 + 7x + 12$ ✓',
        ],
        answer: '$(x+3)(x+4)$',
      },
      {
        level: 'difícil',
        levelColor: 'text-red-400',
        problem: 'Factoriza completamente $2x^4 - 2$.',
        steps: [
          'Factor común: $2(x^4 - 1)$',
          'Diferencia de cuadrados: $2(x^2+1)(x^2-1)$',
          'Segunda diferencia de cuadrados: $2(x^2+1)(x+1)(x-1)$',
          '$x^2+1$ no factoriza en los reales.',
        ],
        answer: '$2(x^2+1)(x+1)(x-1)$',
      },
    ],
  },
  {
    id: 'formula_general',
    title: 'Fórmula General',
    icon: '⚡',
    color: '#ef4444',
    intro: 'La fórmula general (o cuadrática) resuelve cualquier ecuación de la forma $ax^2 + bx + c = 0$ donde $a \\neq 0$.',
    rules: [
      { rule: 'La fórmula', detail: '$x = \\dfrac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$' },
      { rule: 'Discriminante $\\Delta$', detail: '$\\Delta = b^2 - 4ac$' },
      { rule: '$\\Delta > 0$', detail: 'Dos raíces reales distintas.' },
      { rule: '$\\Delta = 0$', detail: 'Una raíz real (raíz doble): $x = -b / 2a$.' },
      { rule: '$\\Delta < 0$', detail: 'No hay raíces reales (raíces complejas).' },
      { rule: 'Truco', detail: 'Si $a = 1$, puedes intentar factorizar antes de usar la fórmula.' },
    ],
    examples: [
      {
        level: 'fácil',
        levelColor: 'text-green-400',
        problem: 'Resuelve $x^2 - 7x + 10 = 0$.',
        steps: [
          '$a=1,\\ b=-7,\\ c=10$',
          '$\\Delta = 49 - 40 = 9$',
          '$x = \\dfrac{7 \\pm 3}{2}$',
          '$x_1 = 5,\\quad x_2 = 2$',
        ],
        answer: '$x = 5$ ó $x = 2$',
      },
      {
        level: 'medio',
        levelColor: 'text-yellow-400',
        problem: 'Resuelve $2x^2 + 3x - 5 = 0$.',
        steps: [
          '$a=2,\\ b=3,\\ c=-5$',
          '$\\Delta = 9 + 40 = 49$',
          '$x = \\dfrac{-3 \\pm 7}{4}$',
          '$x_1 = 1,\\quad x_2 = -\\dfrac{10}{4} = -\\dfrac{5}{2}$',
        ],
        answer: '$x = 1$ ó $x = -\\dfrac{5}{2}$',
      },
      {
        level: 'difícil',
        levelColor: 'text-red-400',
        problem: 'Resuelve $3x^2 - 4x + 2 = 0$.',
        steps: [
          '$a=3,\\ b=-4,\\ c=2$',
          '$\\Delta = 16 - 24 = -8$',
          'Como $\\Delta < 0$: no existen raíces reales.',
          'Las raíces son complejas: $x = \\dfrac{4 \\pm \\sqrt{-8}}{6}$',
        ],
        answer: 'No tiene raíces reales $( \\Delta < 0 )$',
      },
    ],
  },
];

/* ─── Sub-components ────────────────────────────────── */

function RuleTable({ rules }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-700 mb-4">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-700 bg-gray-800/60">
            <th className="text-left px-4 py-2 text-gray-300 font-semibold w-1/3">Regla / Fórmula</th>
            <th className="text-left px-4 py-2 text-gray-300 font-semibold">Detalle</th>
          </tr>
        </thead>
        <tbody>
          {rules.map((r, i) => (
            <tr key={i} className={`border-b border-gray-800 ${i % 2 === 0 ? 'bg-gray-900/30' : 'bg-gray-900/10'}`}>
              <td className="px-4 py-2.5 text-purple-300 font-mono text-xs">
                <MathText text={r.rule} />
              </td>
              <td className="px-4 py-2.5 text-gray-300">
                <MathText text={r.detail} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const LEVEL_BG = {
  'fácil': 'border-green-800/50 bg-green-900/10',
  'medio': 'border-yellow-800/50 bg-yellow-900/10',
  'difícil': 'border-red-800/50 bg-red-900/10',
};

function ExampleCard({ example }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`rounded-xl border p-4 ${LEVEL_BG[example.level]}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <span className={`text-xs font-bold uppercase tracking-wider ${example.levelColor}`}>
            {example.level}
          </span>
          <p className="text-white text-sm mt-1">
            <MathText text={example.problem} />
          </p>
        </div>
        <button
          onClick={() => setOpen(o => !o)}
          className="shrink-0 text-gray-400 hover:text-white transition-colors mt-1"
        >
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {open && (
        <div className="mt-3 space-y-1.5 border-t border-gray-700/50 pt-3 animate-fade-in">
          {example.steps.map((step, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="shrink-0 w-5 h-5 rounded-full bg-purple-800/50 text-purple-300 text-xs flex items-center justify-center font-bold mt-0.5">
                {i + 1}
              </span>
              <p className="text-sm text-gray-200"><MathText text={step} /></p>
            </div>
          ))}
          <div className="mt-2 pt-2 border-t border-gray-700/40">
            <span className="text-xs text-gray-400">Respuesta: </span>
            <span className="text-sm font-semibold text-white">
              <MathText text={example.answer} />
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function SectionAccordion({ section }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-gray-800 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-800/30 transition-colors"
        style={{ background: open ? 'rgba(124,58,237,0.08)' : 'linear-gradient(135deg,#1a1a2e,#16213e)' }}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{section.icon}</span>
          <span className="text-white font-bold text-base">{section.title}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-0.5 rounded-full text-gray-400 border border-gray-700">
            {section.examples.length} ejemplos
          </span>
          {open ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
        </div>
      </button>

      {open && (
        <div className="px-5 pb-5 pt-4 space-y-4 border-t border-gray-800 animate-fade-in"
          style={{ background: '#13131f' }}>
          <p className="text-sm text-gray-300 leading-relaxed">
            <MathText text={section.intro} />
          </p>

          <div>
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              📋 Tabla de Reglas
            </h4>
            <RuleTable rules={section.rules} />
          </div>

          <div>
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
              📝 Ejemplos resueltos (clic para ver solución)
            </h4>
            <div className="space-y-3">
              {section.examples.map((ex, i) => (
                <ExampleCard key={i} example={ex} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Main Export ───────────────────────────────────── */

export default function DocsPage() {
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="text-center space-y-1 py-4">
        <h2 className="text-2xl font-bold text-white">📚 Documentación</h2>
        <p className="text-sm text-gray-400">
          Reglas, fórmulas y ejemplos resueltos para cada tema. Haz clic en un tema para expandirlo.
        </p>
      </div>

      {/* Quick reference formula card */}
      <div className="rounded-2xl border border-purple-800/30 bg-purple-900/10 p-5">
        <h3 className="text-sm font-bold text-purple-300 mb-3">⚡ Fórmulas Clave de un Vistazo</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          {[
            { label: 'Cuadrado suma', f: '(a+b)^2 = a^2+2ab+b^2' },
            { label: 'Cuadrado resta', f: '(a-b)^2 = a^2-2ab+b^2' },
            { label: 'Dif. cuadrados', f: '(a+b)(a-b) = a^2-b^2' },
            { label: 'Suma cubos', f: 'a^3+b^3=(a+b)(a^2-ab+b^2)' },
            { label: 'Dif. cubos', f: 'a^3-b^3=(a-b)(a^2+ab+b^2)' },
            { label: 'Fórmula general', f: 'x=\\frac{-b\\pm\\sqrt{b^2-4ac}}{2a}' },
          ].map(item => (
            <div key={item.label} className="rounded-lg border border-gray-700 bg-gray-900/40 px-3 py-2">
              <p className="text-gray-500 mb-1">{item.label}</p>
              <MathDisplay latex={item.f} />
            </div>
          ))}
        </div>
      </div>

      {/* Accordion sections */}
      {SECTIONS.map(section => (
        <SectionAccordion key={section.id} section={section} />
      ))}

      <div className="text-center text-xs text-gray-600 py-2">
        Todos los ejemplos están verificados matemáticamente ✓
      </div>
    </div>
  );
}
