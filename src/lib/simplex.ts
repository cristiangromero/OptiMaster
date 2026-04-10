export class SimplexSolver {
  static solve(
    objectiveType: 'MAX' | 'MIN',
    c: number[],
    constraints: { coefficients: number[]; operator: string; constant: number }[]
  ) {
    const M = 1e9; // Big M constant
    let objCoeffs = [...c];
    if (objectiveType === 'MIN') objCoeffs = objCoeffs.map(v => -v);

    const numVars = objCoeffs.length;
    const numConstraints = constraints.length;

    // Determine how many extra variables we need
    let slackCount = 0;
    let surplusCount = 0;
    let artificialCount = 0;

    constraints.forEach(con => {
      if (con.operator === '<=') slackCount++;
      else if (con.operator === '>=') { surplusCount++; artificialCount++; }
      else if (con.operator === '=') artificialCount++;
    });

    const totalCols = numVars + slackCount + surplusCount + artificialCount + 1;
    const tableau: number[][] = [];

    let currentSlack = 0;
    let currentSurplus = 0;
    let currentArtificial = 0;

    for (let i = 0; i < numConstraints; i++) {
      const row = new Array(totalCols).fill(0);
      const con = constraints[i];
      
      // Original variables
      for (let j = 0; j < numVars; j++) row[j] = con.coefficients[j];

      if (con.operator === '<=') {
        row[numVars + currentSlack] = 1;
        currentSlack++;
      } else if (con.operator === '>=') {
        row[numVars + slackCount + currentSurplus] = -1;
        row[numVars + slackCount + surplusCount + currentArtificial] = 1;
        currentSurplus++;
        currentArtificial++;
      } else if (con.operator === '=') {
        row[numVars + slackCount + surplusCount + currentArtificial] = 1;
        currentArtificial++;
      }

      row[totalCols - 1] = con.constant;
      tableau.push(row);
    }

    // Objective row
    const objRow = new Array(totalCols).fill(0);
    for (let j = 0; j < numVars; j++) objRow[j] = -objCoeffs[j];
    
    // Add Big M for artificial variables
    // For maximization, artificial variables have -M in objective
    // So in tableau (which is Z - ... = 0), they have +M
    for (let i = 0; i < artificialCount; i++) {
      objRow[numVars + slackCount + surplusCount + i] = M;
    }
    tableau.push(objRow);

    // Adjust objective row for artificial variables (Phase 0 of Big M)
    // We need to make artificial variables basic (coeff 0 in obj row)
    currentArtificial = 0;
    for (let i = 0; i < numConstraints; i++) {
      if (constraints[i].operator === '>=' || constraints[i].operator === '=') {
        const factor = M;
        for (let j = 0; j < totalCols; j++) {
          tableau[numConstraints][j] -= factor * tableau[i][j];
        }
        currentArtificial++;
      }
    }

    // Simplex Iterations
    const maxIters = 200;
    let iters = 0;
    while (iters < maxIters) {
      let pivotCol = -1;
      let minVal = -1e-7;
      for (let j = 0; j < totalCols - 1; j++) {
        if (tableau[numConstraints][j] < minVal) {
          minVal = tableau[numConstraints][j];
          pivotCol = j;
        }
      }

      if (pivotCol === -1) break;

      let pivotRow = -1;
      let minRatio = Infinity;
      for (let i = 0; i < numConstraints; i++) {
        if (tableau[i][pivotCol] > 1e-9) {
          const ratio = tableau[i][totalCols - 1] / tableau[i][pivotCol];
          if (ratio < minRatio) {
            minRatio = ratio;
            pivotRow = i;
          }
        }
      }

      if (pivotRow === -1) return { status: 'UNBOUNDED' };

      const pVal = tableau[pivotRow][pivotCol];
      for (let j = 0; j < totalCols; j++) tableau[pivotRow][j] /= pVal;
      for (let i = 0; i < numConstraints + 1; i++) {
        if (i !== pivotRow) {
          const f = tableau[i][pivotCol];
          for (let j = 0; j < totalCols; j++) tableau[i][j] -= f * tableau[pivotRow][j];
        }
      }
      iters++;
    }

    // Check for artificial variables in basis
    for (let i = 0; i < numConstraints; i++) {
      const artStart = numVars + slackCount + surplusCount;
      for (let j = artStart; j < artStart + artificialCount; j++) {
        if (Math.abs(tableau[i][j] - 1) < 1e-7 && tableau[i][totalCols - 1] > 1e-7) {
          return { status: 'INFEASIBLE' };
        }
      }
    }

    const variableValues: Record<string, number> = {};
    for (let j = 0; j < numVars; j++) {
      let rowIdx = -1;
      let ones = 0;
      for (let i = 0; i < numConstraints; i++) {
        if (Math.abs(tableau[i][j] - 1) < 1e-7) { ones++; rowIdx = i; }
        else if (Math.abs(tableau[i][j]) > 1e-7) ones = 2;
      }
      variableValues[`x${j + 1}`] = (ones === 1) ? tableau[rowIdx][totalCols - 1] : 0;
    }

    let z = tableau[numConstraints][totalCols - 1];
    if (objectiveType === 'MIN') z = -z;

    const constraintStatus = constraints.map((con, i) => {
      let val = 0;
      for (let j = 0; j < numVars; j++) {
        val += con.coefficients[j] * (variableValues[`x${j + 1}`] || 0);
      }
      const slack = Math.abs(con.constant - val);
      return {
        id: `c${i}`,
        label: `R${i + 1}`,
        value: val,
        constant: con.constant,
        operator: con.operator,
        slack: slack,
        active: slack < 1e-7
      };
    });

    return { status: 'OPTIMAL', objectiveValue: z, variableValues, constraintStatus };
  }
}
