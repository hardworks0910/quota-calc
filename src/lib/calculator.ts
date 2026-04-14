import type {
  IndustryId,
  FnbData,
  ManufacturingData,
  ConstructionData,
  AgricultureData,
  CleaningData,
} from "./schemas";

export type CalculationInput =
  | FnbData
  | ManufacturingData
  | ConstructionData
  | AgricultureData
  | CleaningData;

export function calculateQuota(
  industry: IndustryId,
  data: CalculationInput
): number {
  switch (industry) {
    case "fnb": {
      const d = data as FnbData;
      return d.localStaffCount * 3;
    }
    case "manufacturing": {
      const d = data as ManufacturingData;
      const base = d.factoryScale === "mnc" ? 50 : 20;
      const exportBonus = Math.floor(d.exportPercentage / 10) * 5;
      return base + exportBonus;
    }
    case "construction": {
      const d = data as ConstructionData;
      const baseQuota = Math.floor(d.projectValue / 500_000) * 5;
      const cidbBonus = d.cidbRegistered ? Math.ceil(baseQuota * 0.2) : 0;
      return Math.max(baseQuota + cidbBonus, 1);
    }
    case "agriculture": {
      const d = data as AgricultureData;
      return Math.ceil(d.landSize * 1.5);
    }
    case "cleaning": {
      const d = data as CleaningData;
      return Math.floor(d.contractValue / 100_000) * 3 || 1;
    }
    default:
      return 0;
  }
}
