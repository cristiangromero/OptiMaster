
export interface TransportSource {
  id: string;
  name: string;
  supply: number;
}

export interface TransportDestination {
  id: string;
  name: string;
  demand: number;
}

export class TransportationSolverLib {
  static solveNorthwestCorner(sources: TransportSource[], destinations: TransportDestination[], costs: Record<string, number>) {
    const allocation: Record<string, number> = {};
    const sSupply = sources.map(s => ({ ...s }));
    const dDemand = destinations.map(d => ({ ...d }));
    
    let i = 0, j = 0;
    while (i < sSupply.length && j < dDemand.length) {
      const quantity = Math.min(sSupply[i].supply, dDemand[j].demand);
      if (quantity > 0) {
        allocation[`${sSupply[i].id}-${dDemand[j].id}`] = quantity;
      }
      sSupply[i].supply -= quantity;
      dDemand[j].demand -= quantity;
      if (sSupply[i].supply === 0) i++;
      else j++;
    }

    return this.calculateTotalCost(allocation, costs);
  }

  static solveMinimumCost(sources: TransportSource[], destinations: TransportDestination[], costs: Record<string, number>) {
    const allocation: Record<string, number> = {};
    const sSupply = sources.map(s => ({ ...s }));
    const dDemand = destinations.map(d => ({ ...d }));
    
    // Create a list of all cells sorted by cost
    const cells: { sIdx: number, dIdx: number, cost: number }[] = [];
    for (let i = 0; i < sources.length; i++) {
      for (let j = 0; j < destinations.length; j++) {
        cells.push({
          sIdx: i,
          dIdx: j,
          cost: costs[`${sources[i].id}-${destinations[j].id}`] || 0
        });
      }
    }
    cells.sort((a, b) => a.cost - b.cost);

    for (const cell of cells) {
      const { sIdx, dIdx } = cell;
      if (sSupply[sIdx].supply > 0 && dDemand[dIdx].demand > 0) {
        const quantity = Math.min(sSupply[sIdx].supply, dDemand[dIdx].demand);
        allocation[`${sources[sIdx].id}-${destinations[dIdx].id}`] = quantity;
        sSupply[sIdx].supply -= quantity;
        dDemand[dIdx].demand -= quantity;
      }
    }

    return this.calculateTotalCost(allocation, costs);
  }

  private static calculateTotalCost(allocation: Record<string, number>, costs: Record<string, number>) {
    let totalCost = 0;
    Object.entries(allocation).forEach(([key, qty]) => {
      totalCost += qty * (costs[key] || 0);
    });
    return { allocation, totalCost };
  }
}
