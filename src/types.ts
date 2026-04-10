export type ObjectiveType = 'MAX' | 'MIN';

export interface Constraint {
  id: string;
  coefficients: number[];
  operator: '<=' | '>=' | '=';
  constant: number;
}

export interface LPProblem {
  id: string;
  name: string;
  objectiveType: ObjectiveType;
  objectiveCoefficients: number[];
  constraints: Constraint[];
  variables: string[]; // e.g., ["x1", "x2"]
  nonNegativity?: boolean;
  integerConstraints?: boolean;
}

export interface ConstraintStatus {
  id: string;
  label: string;
  value: number;
  constant: number;
  operator: string;
  slack: number;
  active: boolean;
}

export interface SolverResult {
  status: 'OPTIMAL' | 'INFEASIBLE' | 'UNBOUNDED' | 'ERROR';
  objectiveValue?: number;
  variableValues?: Record<string, number>;
  constraintStatus?: ConstraintStatus[];
  steps?: any[];
}
