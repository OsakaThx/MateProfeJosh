/**
 * staticProblems.js
 * Banco de problemas locales precargados, usados cuando no hay API key
 * o como respaldo offline. Cada problema tiene LaTeX listo para KaTeX.
 */

export const STATIC_PROBLEMS = {
  funciones: [
    {
      id: 'f1',
      problem: 'Dada la función $f(x) = 3x^2 - 2x + 1$, calcula $f(2)$.',
      answer: '9',
      answerLatex: '9',
      steps: [
        'Sustituir $x = 2$: $f(2) = 3(2)^2 - 2(2) + 1$',
        'Calcular potencia: $3 \\cdot 4 - 4 + 1$',
        'Simplificar: $12 - 4 + 1 = 9$',
      ],
      difficulty: 'básico',
      type: 'open',
      topic: 'funciones',
      topicLabel: 'Funciones',
    },
    {
      id: 'f2',
      problem: 'Si $f(x) = 2x + 5$ y $g(x) = x^2$, calcula $f(g(3))$.',
      answer: '23',
      answerLatex: '23',
      steps: [
        'Primero calcular $g(3) = 3^2 = 9$',
        'Luego $f(9) = 2(9) + 5 = 18 + 5$',
        'Resultado: $23$',
      ],
      difficulty: 'intermedio',
      type: 'open',
      topic: 'funciones',
      topicLabel: 'Funciones',
    },
    {
      id: 'f3',
      problem: '¿Cuál de las siguientes relaciones ES una función?\na) $\\{(1,2),(1,3),(2,4)\\}$\nb) $\\{(1,2),(2,3),(3,4)\\}$\nc) $x^2 + y^2 = 25$',
      answer: 'b',
      answerLatex: 'b',
      steps: [
        'Una función requiere que cada x tenga exactamente una y.',
        'La opción (a) tiene $x=1$ con dos salidas: inválida.',
        'La opción (b) cada x tiene una sola y: es función.',
        'La opción (c) es un círculo: no es función.',
      ],
      difficulty: 'básico',
      type: 'multiple',
      topic: 'funciones',
      topicLabel: 'Funciones',
    },
    {
      id: 'f4',
      problem: 'Dada $f(x) = \\dfrac{x+1}{x-2}$, calcula $f(0) + f(4)$.',
      answer: '-1/2 + 5/2',
      answerLatex: '2',
      steps: [
        '$f(0) = \\frac{0+1}{0-2} = \\frac{1}{-2} = -\\frac{1}{2}$',
        '$f(4) = \\frac{4+1}{4-2} = \\frac{5}{2}$',
        '$f(0)+f(4) = -\\frac{1}{2}+\\frac{5}{2} = \\frac{4}{2} = 2$',
      ],
      difficulty: 'intermedio',
      type: 'open',
      topic: 'funciones',
      topicLabel: 'Funciones',
    },
    {
      id: 'f5',
      problem: 'Dada $h(x) = x^3 - 4x$, calcula $h(-2)$.',
      answer: '0',
      answerLatex: '0',
      steps: [
        'Sustituir $x = -2$: $h(-2) = (-2)^3 - 4(-2)$',
        '$= -8 + 8$',
        '$= 0$',
      ],
      difficulty: 'básico',
      type: 'open',
      topic: 'funciones',
      topicLabel: 'Funciones',
    },
  ],

  dominio_rango: [
    {
      id: 'd1',
      problem: 'Encuentra el dominio de $f(x) = \\dfrac{1}{x - 5}$.',
      answer: '(-inf,5)U(5,+inf)',
      answerLatex: '(-\\infty, 5) \\cup (5, +\\infty)',
      steps: [
        'El denominador no puede ser cero.',
        'Resolver: $x - 5 = 0 \\Rightarrow x = 5$',
        'Excluir $x = 5$: Dominio $= (-\\infty, 5) \\cup (5, +\\infty)$',
      ],
      difficulty: 'básico',
      type: 'open',
      topic: 'dominio_rango',
      topicLabel: 'Dominio y Rango',
    },
    {
      id: 'd2',
      problem: 'Encuentra el dominio de $g(x) = \\sqrt{3x - 9}$.',
      answer: '[3,+inf)',
      answerLatex: '[3, +\\infty)',
      steps: [
        'El radicando debe ser $\\geq 0$.',
        '$3x - 9 \\geq 0 \\Rightarrow 3x \\geq 9 \\Rightarrow x \\geq 3$',
        'Dominio $= [3, +\\infty)$',
      ],
      difficulty: 'básico',
      type: 'open',
      topic: 'dominio_rango',
      topicLabel: 'Dominio y Rango',
    },
    {
      id: 'd3',
      problem: 'Encuentra el dominio de $h(x) = \\dfrac{\\sqrt{x+4}}{x-1}$.',
      answer: '[-4,1)U(1,+inf)',
      answerLatex: '[-4, 1) \\cup (1, +\\infty)',
      steps: [
        'Condición 1 (raíz): $x + 4 \\geq 0 \\Rightarrow x \\geq -4$',
        'Condición 2 (denominador): $x - 1 \\neq 0 \\Rightarrow x \\neq 1$',
        'Combinar: $[-4, 1) \\cup (1, +\\infty)$',
      ],
      difficulty: 'intermedio',
      type: 'open',
      topic: 'dominio_rango',
      topicLabel: 'Dominio y Rango',
    },
    {
      id: 'd4',
      problem: '¿Cuál es el dominio de $f(x) = x^2 + 3x - 7$?',
      answer: '(-inf,+inf)',
      answerLatex: '(-\\infty, +\\infty)',
      steps: [
        'Es un polinomio: no tiene raíces ni denominadores.',
        'Está definida para todos los reales.',
        'Dominio $= (-\\infty, +\\infty)$',
      ],
      difficulty: 'básico',
      type: 'open',
      topic: 'dominio_rango',
      topicLabel: 'Dominio y Rango',
    },
    {
      id: 'd5',
      problem: 'Encuentra el dominio de $f(x) = \\dfrac{1}{x^2 - 9}$.',
      answer: '(-inf,-3)U(-3,3)U(3,+inf)',
      answerLatex: '(-\\infty,-3)\\cup(-3,3)\\cup(3,+\\infty)',
      steps: [
        'Denominador $\\neq 0$: $x^2 - 9 = 0$',
        '$(x-3)(x+3)=0 \\Rightarrow x=3$ o $x=-3$',
        'Dominio: todos los reales excepto $x=\\pm 3$',
      ],
      difficulty: 'intermedio',
      type: 'open',
      topic: 'dominio_rango',
      topicLabel: 'Dominio y Rango',
    },
  ],

  formulas_notables: [
    {
      id: 'fn1',
      problem: 'Expande $(x + 6)^2$.',
      answer: 'x^2+12x+36',
      answerLatex: 'x^2 + 12x + 36',
      steps: [
        'Usar $(a+b)^2 = a^2 + 2ab + b^2$',
        '$a = x,\\ b = 6$',
        '$x^2 + 2(x)(6) + 6^2 = x^2 + 12x + 36$',
      ],
      difficulty: 'básico',
      type: 'open',
      topic: 'formulas_notables',
      topicLabel: 'Fórmulas Notables',
    },
    {
      id: 'fn2',
      problem: 'Factoriza $x^2 - 64$.',
      answer: '(x+8)(x-8)',
      answerLatex: '(x+8)(x-8)',
      steps: [
        'Reconocer diferencia de cuadrados: $x^2 - 8^2$',
        'Usar $(a+b)(a-b) = a^2 - b^2$',
        'Resultado: $(x+8)(x-8)$',
      ],
      difficulty: 'básico',
      type: 'open',
      topic: 'formulas_notables',
      topicLabel: 'Fórmulas Notables',
    },
    {
      id: 'fn3',
      problem: 'Expande $(3x - 4)^2$.',
      answer: '9x^2-24x+16',
      answerLatex: '9x^2 - 24x + 16',
      steps: [
        'Usar $(a-b)^2 = a^2 - 2ab + b^2$',
        '$a = 3x,\\ b = 4$',
        '$(3x)^2 - 2(3x)(4) + 4^2 = 9x^2 - 24x + 16$',
      ],
      difficulty: 'básico',
      type: 'open',
      topic: 'formulas_notables',
      topicLabel: 'Fórmulas Notables',
    },
    {
      id: 'fn4',
      problem: 'Factoriza $x^3 + 27$.',
      answer: '(x+3)(x^2-3x+9)',
      answerLatex: '(x+3)(x^2-3x+9)',
      steps: [
        'Reconocer suma de cubos: $x^3 + 3^3$',
        'Fórmula: $a^3+b^3 = (a+b)(a^2-ab+b^2)$',
        '$(x+3)(x^2 - 3x + 9)$',
      ],
      difficulty: 'intermedio',
      type: 'open',
      topic: 'formulas_notables',
      topicLabel: 'Fórmulas Notables',
    },
    {
      id: 'fn5',
      problem: 'Expande $(2x + 5)(2x - 5)$.',
      answer: '4x^2-25',
      answerLatex: '4x^2 - 25',
      steps: [
        'Reconocer diferencia de cuadrados: $(a+b)(a-b)$',
        '$a = 2x,\\ b = 5$',
        '$(2x)^2 - 5^2 = 4x^2 - 25$',
      ],
      difficulty: 'básico',
      type: 'open',
      topic: 'formulas_notables',
      topicLabel: 'Fórmulas Notables',
    },
  ],

  factorizacion: [
    {
      id: 'fac1',
      problem: 'Factoriza completamente: $6x^3 - 9x^2 + 3x$.',
      answer: '3x(2x^2-3x+1)',
      answerLatex: '3x(2x^2 - 3x + 1)',
      steps: [
        'Buscar factor común: MCD(6,9,3) = 3, variable mínima: $x$',
        'Factor común = $3x$',
        '$3x(2x^2 - 3x + 1)$',
      ],
      difficulty: 'básico',
      type: 'open',
      topic: 'factorizacion',
      topicLabel: 'Factorización',
    },
    {
      id: 'fac2',
      problem: 'Factoriza: $x^2 - 5x + 6$.',
      answer: '(x-2)(x-3)',
      answerLatex: '(x-2)(x-3)',
      steps: [
        'Buscar dos números cuya suma = $-5$ y producto = $6$: son $-2$ y $-3$.',
        'Factorizar: $(x - 2)(x - 3)$',
        'Verificar: $(x-2)(x-3) = x^2-3x-2x+6 = x^2-5x+6$ ✓',
      ],
      difficulty: 'básico',
      type: 'open',
      topic: 'factorizacion',
      topicLabel: 'Factorización',
    },
    {
      id: 'fac3',
      problem: 'Factoriza completamente: $2x^3 - 8x$.',
      answer: '2x(x+2)(x-2)',
      answerLatex: '2x(x+2)(x-2)',
      steps: [
        'Factor común: $2x(x^2 - 4)$',
        'Reconocer diferencia de cuadrados: $x^2 - 2^2$',
        'Resultado: $2x(x+2)(x-2)$',
      ],
      difficulty: 'intermedio',
      type: 'open',
      topic: 'factorizacion',
      topicLabel: 'Factorización',
    },
    {
      id: 'fac4',
      problem: 'Factoriza: $3x^2 + 12x + 12$.',
      answer: '3(x+2)^2',
      answerLatex: '3(x+2)^2',
      steps: [
        'Factor común: $3(x^2 + 4x + 4)$',
        'Reconocer cuadrado perfecto: $(x+2)^2$',
        'Resultado: $3(x+2)^2$',
      ],
      difficulty: 'intermedio',
      type: 'open',
      topic: 'factorizacion',
      topicLabel: 'Factorización',
    },
    {
      id: 'fac5',
      problem: 'Factoriza: $8x^3 - 27$.',
      answer: '(2x-3)(4x^2+6x+9)',
      answerLatex: '(2x-3)(4x^2+6x+9)',
      steps: [
        'Reconocer diferencia de cubos: $(2x)^3 - 3^3$',
        'Fórmula: $a^3-b^3=(a-b)(a^2+ab+b^2)$',
        '$(2x-3)((2x)^2 + (2x)(3) + 3^2) = (2x-3)(4x^2+6x+9)$',
      ],
      difficulty: 'avanzado',
      type: 'open',
      topic: 'factorizacion',
      topicLabel: 'Factorización',
    },
  ],

  formula_general: [
    {
      id: 'fq1',
      problem: 'Resuelve usando la fórmula general: $x^2 - 5x + 6 = 0$.',
      answer: 'x=2 o x=3',
      answerLatex: 'x = 2 \\text{ ó } x = 3',
      steps: [
        '$a=1,\\ b=-5,\\ c=6$',
        '$\\Delta = (-5)^2 - 4(1)(6) = 25-24 = 1$',
        '$x = \\frac{5 \\pm \\sqrt{1}}{2} = \\frac{5 \\pm 1}{2}$',
        '$x_1 = 3,\\ x_2 = 2$',
      ],
      difficulty: 'básico',
      type: 'open',
      topic: 'formula_general',
      topicLabel: 'Fórmula General',
    },
    {
      id: 'fq2',
      problem: 'Resuelve: $2x^2 - 4x - 6 = 0$.',
      answer: 'x=3 o x=-1',
      answerLatex: 'x = 3 \\text{ ó } x = -1',
      steps: [
        '$a=2,\\ b=-4,\\ c=-6$',
        '$\\Delta = 16 + 48 = 64$',
        '$x = \\frac{4 \\pm 8}{4}$',
        '$x_1 = 3,\\ x_2 = -1$',
      ],
      difficulty: 'básico',
      type: 'open',
      topic: 'formula_general',
      topicLabel: 'Fórmula General',
    },
    {
      id: 'fq3',
      problem: 'Resuelve: $x^2 - 6x + 9 = 0$.',
      answer: 'x=3',
      answerLatex: 'x = 3 \\text{ (raíz doble)}',
      steps: [
        '$a=1,\\ b=-6,\\ c=9$',
        '$\\Delta = 36 - 36 = 0$',
        'Como $\\Delta = 0$: raíz doble.',
        '$x = \\frac{6}{2} = 3$',
      ],
      difficulty: 'básico',
      type: 'open',
      topic: 'formula_general',
      topicLabel: 'Fórmula General',
    },
    {
      id: 'fq4',
      problem: 'Resuelve: $3x^2 + 7x - 6 = 0$.',
      answer: 'x=2/3 o x=-3',
      answerLatex: 'x = \\frac{2}{3} \\text{ ó } x = -3',
      steps: [
        '$a=3,\\ b=7,\\ c=-6$',
        '$\\Delta = 49 + 72 = 121$',
        '$x = \\frac{-7 \\pm 11}{6}$',
        '$x_1 = \\frac{4}{6} = \\frac{2}{3},\\ x_2 = \\frac{-18}{6} = -3$',
      ],
      difficulty: 'intermedio',
      type: 'open',
      topic: 'formula_general',
      topicLabel: 'Fórmula General',
    },
    {
      id: 'fq5',
      problem: 'Resuelve: $x^2 + 4x + 5 = 0$.',
      answer: 'no tiene raices reales',
      answerLatex: '\\text{No tiene raíces reales } (\\Delta < 0)',
      steps: [
        '$a=1,\\ b=4,\\ c=5$',
        '$\\Delta = 16 - 20 = -4$',
        'Como $\\Delta < 0$: no existen raíces reales.',
      ],
      difficulty: 'intermedio',
      type: 'open',
      topic: 'formula_general',
      topicLabel: 'Fórmula General',
    },
  ],
};

export function getRandomProblem(topicKey) {
  const pool = STATIC_PROBLEMS[topicKey];
  if (!pool || pool.length === 0) return null;
  return { ...pool[Math.floor(Math.random() * pool.length)], id: crypto.randomUUID() };
}

export function getStaticBatch(topicKey, count = 5) {
  const pool = STATIC_PROBLEMS[topicKey];
  if (!pool) return [];
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const batch = [];
  for (let i = 0; i < count; i++) {
    batch.push({ ...shuffled[i % shuffled.length], id: crypto.randomUUID() });
  }
  return batch;
}
