import { BUILDINGS, getBuildingFootprint } from '../data/buildings.data';
import type { BuildingInstance, WorldEngineState } from '../core/GameState';

export interface BuildingServiceCoverage {
  hasCivicHqOrSub: boolean;
  hasTaxCoverage: boolean;
  hasEducationCoverage: boolean;
  hasWorkerCoverage: boolean;
  hasGovCoverage: boolean;
  taxBonusMult: number;
  prodBonusMult: number;
  educationBonusMult: number;
}

/**
 * Evaluates local district service coverage provided by Regional Sub-Offices
 * (default radius 12 tiles) as well as world-wide Main HQ institutions.
 */
export class DistrictServiceSystem {
  public static getBuildingCoverage(
    b: BuildingInstance,
    state: WorldEngineState
  ): BuildingServiceCoverage {
    const def = BUILDINGS[b.defId];
    const fp = def ? getBuildingFootprint(def, b.rotation ?? 0) : { width: 1, height: 1 };
    const cx = b.gx + fp.width * 0.5;
    const cy = b.gy + fp.height * 0.5;

    let hasCivicHqOrSub = false;
    let hasTaxCoverage = false;
    let hasEducationCoverage = false;
    let hasWorkerCoverage = false;
    let hasGovCoverage = false;

    for (const office of state.buildings) {
      if (office.status === 'constructing' || !office.enabled) continue;
      const oDef = BUILDINGS[office.defId];
      if (!oDef || (!oDef.isMainHq && !oDef.isSubOffice)) continue;

      const oFp = getBuildingFootprint(oDef, office.rotation ?? 0);
      const ox = office.gx + oFp.width * 0.5;
      const oy = office.gy + oFp.height * 0.5;
      const dist = Math.hypot(cx - ox, cy - oy);

      // Main HQ covers the whole home city (same cityId) or within 28 tiles;
      // Regional Sub-Offices serve local districts within serviceRadius (default 12) + level bonus.
      const radius = oDef.isSubOffice
        ? (oDef.serviceRadius ?? 12) + (office.level - 1) * 2
        : 28 + (office.level - 1) * 4;
      const inSameCity = (office.cityId ?? 1) === (b.cityId ?? 1);
      const covers = oDef.isMainHq ? inSameCity || dist <= radius : dist <= radius;
      if (!covers) continue;

      if (office.defId === 'main_town_hall' || office.defId === 'sub_town_hall') {
        hasCivicHqOrSub = true;
      } else if (office.defId === 'government_office' || office.defId === 'sub_government_office') {
        hasGovCoverage = true;
      } else if (office.defId === 'tax_office' || office.defId === 'sub_tax_office') {
        hasTaxCoverage = true;
      } else if (office.defId === 'education_ministry' || office.defId === 'sub_education_office') {
        hasEducationCoverage = true;
      } else if (office.defId === 'worker_office' || office.defId === 'sub_worker_office') {
        hasWorkerCoverage = true;
      }
    }

    return {
      hasCivicHqOrSub,
      hasTaxCoverage,
      hasEducationCoverage,
      hasWorkerCoverage,
      hasGovCoverage,
      taxBonusMult: hasTaxCoverage ? 1.15 : 1.0,
      prodBonusMult: (hasWorkerCoverage ? 1.12 : 1.0) * (hasGovCoverage ? 1.05 : 1.0),
      educationBonusMult: hasEducationCoverage ? 1.25 : 1.0,
    };
  }

  public static computeWorldServiceCoveragePct(state: WorldEngineState): number {
    const targets = state.buildings.filter((b) => {
      if (b.status === 'constructing') return false;
      const def = BUILDINGS[b.defId];
      return Boolean(def && !def.isMainHq && !def.isSubOffice);
    });
    if (targets.length === 0) return 100;

    let covered = 0;
    for (const b of targets) {
      const cov = this.getBuildingCoverage(b, state);
      if (
        cov.hasCivicHqOrSub ||
        cov.hasTaxCoverage ||
        cov.hasEducationCoverage ||
        cov.hasWorkerCoverage ||
        cov.hasGovCoverage
      ) {
        covered++;
      }
    }
    const pct = Math.round((covered / targets.length) * 100);
    if (state.utilitySummary) {
      state.utilitySummary.serviceCoveragePct = pct;
    }
    return pct;
  }
}
