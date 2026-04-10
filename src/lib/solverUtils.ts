import { LPProblem, SolverResult, ConstraintStatus } from '../types';

export interface Vertex {
  x: number;
  y: number;
  z: number;
  source: string;
}

export function calculateVertices(problem: LPProblem): Vertex[] {
  if (problem.objectiveCoefficients.length !== 2) return [];

  // 1. Lista de Ecuaciones (Restricciones + Ejes)
  const equations: { a: number; b: number; c: number; op: string; label: string }[] = problem.constraints.map((con, i) => ({
    a: con.coefficients[0],
    b: con.coefficients[1],
    c: con.constant,
    op: con.operator,
    label: `R${i + 1}: ${con.coefficients[0]}x1 + ${con.coefficients[1]}x2 ${con.operator} ${con.constant}`
  }));

  // Siempre incluir los ejes cartesianos como ecuaciones para buscar intersecciones
  equations.push({ a: 1, b: 0, c: 0, op: '>=', label: 'Eje X2 (x1 = 0)' });
  equations.push({ a: 0, b: 1, c: 0, op: '>=', label: 'Eje X1 (x2 = 0)' });

  // 2. Combinatoria Total (Intersecciones de todas las combinaciones de a dos)
  const intersections: { coords: [number, number]; source: string }[] = [];
  for (let i = 0; i < equations.length; i++) {
    for (let j = i + 1; j < equations.length; j++) {
      const e1 = equations[i];
      const e2 = equations[j];
      
      // Resolver sistema 2x2:
      // e1.a*x + e1.b*y = e1.c
      // e2.a*x + e2.b*y = e2.c
      const det = e1.a * e2.b - e1.b * e2.a;
      
      if (Math.abs(det) > 1e-9) {
        const x = (e1.c * e2.b - e1.b * e2.c) / det;
        const y = (e1.a * e2.c - e1.c * e2.a) / det;
        intersections.push({ 
          coords: [x, y], 
          source: `Intersección de ${e1.label} y ${e2.label}` 
        });
      }
    }
  }

  // 3. Filtro de Factibilidad
  // Verificamos cada punto contra TODAS las inecuaciones originales
  const feasiblePoints = intersections.filter(p => {
    const [x, y] = p.coords;
    
    // Si el problema tiene activada la no negatividad, validamos x >= 0 y y >= 0
    if (problem.nonNegativity) {
      if (x < -1e-7 || y < -1e-7) return false;
    }

    // Validar contra todas las restricciones originales del problema
    return problem.constraints.every(con => {
      const val = con.coefficients[0] * x + con.coefficients[1] * y;
      if (con.operator === '<=') return val <= con.constant + 1e-7;
      if (con.operator === '>=') return val >= con.constant - 1e-7;
      // Para el caso '='
      return Math.abs(val - con.constant) < 1e-7;
    });
  });

  // 4. Vértices Finales (Eliminar duplicados por precisión numérica)
  const uniqueVertices: { coords: [number, number]; source: string }[] = [];
  feasiblePoints.forEach(p => {
    const isDuplicate = uniqueVertices.some(v => 
      Math.abs(v.coords[0] - p.coords[0]) < 1e-7 && 
      Math.abs(v.coords[1] - p.coords[1]) < 1e-7
    );
    if (!isDuplicate) {
      uniqueVertices.push(p);
    }
  });

  return uniqueVertices.map(v => ({
    x: v.coords[0],
    y: v.coords[1],
    z: problem.objectiveCoefficients[0] * v.coords[0] + problem.objectiveCoefficients[1] * v.coords[1],
    source: v.source
  }));
}

export function solve2D(problem: LPProblem): SolverResult {
  const vertices = calculateVertices(problem);
  if (vertices.length === 0) {
    return { status: 'INFEASIBLE' };
  }

  let optimalVertex = vertices[0];
  for (let i = 1; i < vertices.length; i++) {
    if (problem.objectiveType === 'MAX') {
      if (vertices[i].z > optimalVertex.z + 1e-9) {
        optimalVertex = vertices[i];
      }
    } else {
      if (vertices[i].z < optimalVertex.z - 1e-9) {
        optimalVertex = vertices[i];
      }
    }
  }

  const variableValues = {
    x1: optimalVertex.x,
    x2: optimalVertex.y
  };

  const constraintStatus: ConstraintStatus[] = problem.constraints.map((con, i) => {
    const val = con.coefficients[0] * optimalVertex.x + con.coefficients[1] * optimalVertex.y;
    const slack = Math.abs(con.constant - val);
    return {
      id: con.id,
      label: `R${i + 1}`,
      value: val,
      constant: con.constant,
      operator: con.operator,
      slack: slack,
      active: slack < 1e-7
    };
  });

  return {
    status: 'OPTIMAL',
    objectiveValue: optimalVertex.z,
    variableValues,
    constraintStatus
  };
}
