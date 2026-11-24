import React from 'react';
import { Sparkles, ScrollText, Smile, Hammer, ArrowRight } from 'lucide-react';
import type { BuildingCategory } from '../../data/buildings.data';
import { CITY_POLICIES } from '../../data/policies.data';
import { PopulationSystem } from '../../systems/PopulationSystem';
import { GameController, GameSnapshot } from '../bridge/GameController';
import { SheetContainer } from './SheetContainer';

const PRIORITY_CATS: Array<[BuildingCategory, string]> = [
  ['agricultural', 'Food & Farming'],
  ['energy', 'Power & Water'],
  ['production', 'Crafting & Mills'],
  ['industrial', 'Mining & Heavy Industry'],
  ['healthcare', 'Healthcare'],
  ['educational', 'Education & Research'],
  ['commercial', 'Trade & Commerce'],
  ['environmental', 'Forestry & Ecology'],
];

export const PopulationSheet: React.FC<{ snap: GameSnapshot }> = ({ snap }) => {
  const { state } = snap;
  const { population, environment, workforcePriorities, waterGenerated, waterDemand } = state;
  const happyReport = PopulationSystem.computeHappinessReport(state);

  const liveAgents = GameController.engine.citizens.agents;
  const roleCounts = {
    normal: 0,
    laborer: 0,
    artisan: 0,
    engineer: 0,
    gov_officer: 0,
    police: 0,
    child: 0,
  };
  for (const a of liveAgents) {
    roleCounts[a.role] = (roleCounts[a.role] ?? 0) + 1;
  }

  const hasPlaza = state.buildings.some(
    (b) => b.defId === 'festival_plaza' && b.status !== 'constructing'
  );
  const baseCost = 120 + population.total * 3;
  const festCost = hasPlaza ? Math.round(baseCost * 0.5) : baseCost;
  const festRem = state.festivalTicksRemaining ?? 0;
  const festCool = state.festivalCooldownTicks ?? 0;
  const activePolicies = state.activePolicies ?? [];

  return (
    <SheetContainer
      title="Society, Happiness & Roles"
      subtitle={`Citizens: ${population.total}/${population.capacity} · Happiness: ${population.happiness}%`}
    >
      <div className="space-y-4 min-w-0">
        {/* Happiness Index & Actionable Improvement Guide */}
        <div className="p-3 rounded-2xl bg-gradient-to-b from-[#132b1f] to-[#0a1a12] border border-emerald-700/55 space-y-2.5 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-sm font-bold text-stone-100">
              <Smile className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Happiness Index &amp; Guide</span>
            </div>
            <span
              className={`text-sm font-extrabold tabular-nums ${
                happyReport.score >= 72
                  ? 'text-emerald-300'
                  : happyReport.score >= 45
                    ? 'text-amber-300'
                    : 'text-red-300'
              }`}
            >
              {happyReport.score}%
            </span>
          </div>

          <div className="w-full h-2 bg-[#06120c] border border-emerald-900/60 rounded-sm overflow-hidden">
            <div
              className={`h-full transition-all ${
                happyReport.score >= 72
                  ? 'bg-emerald-500'
                  : happyReport.score >= 45
                    ? 'bg-amber-400'
                    : 'bg-red-500'
              }`}
              style={{ width: `${Math.max(0, Math.min(100, happyReport.score))}%` }}
            />
          </div>

          <div className="space-y-1.5">
            {happyReport.drivers.map((d) => (
              <div
                key={d.id}
                className="p-2.5 rounded-xl bg-[#07150e] border border-emerald-900/50 flex flex-wrap items-center justify-between gap-2 text-xs"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-stone-100 truncate">{d.label}</span>
                    <span
                      className={`font-bold tabular-nums shrink-0 ${
                        d.delta > 0 ? 'text-emerald-300' : d.delta < 0 ? 'text-red-300' : 'text-stone-400'
                      }`}
                    >
                      {d.delta > 0 ? `+${d.delta}` : d.delta}
                    </span>
                  </div>
                  <div className="text-[11px] text-stone-400 leading-snug mt-0.5">{d.detail}</div>
                </div>
                {d.actionLabel ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (d.recommendedDefId) {
                        GameController.setTool({ mode: 'build', defId: d.recommendedDefId, rotation: 0 });
                        GameController.setActiveSheet('none');
                      } else if (d.actionSheet) {
                        GameController.setActiveSheet(d.actionSheet);
                      }
                    }}
                    className="min-h-[44px] px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-[11px] flex items-center gap-1 shrink-0"
                  >
                    {d.recommendedDefId ? <Hammer className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                    {d.actionLabel}
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        {/* City Festival Launcher */}
        <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-950/60 to-emerald-950/60 border border-amber-700/50 flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-sm font-bold text-amber-200">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              City Lantern Festival
            </div>
            <div className="text-[11px] text-stone-300 mt-0.5 tabular-nums">
              {festRem > 0
                ? `Active (${festRem}s): +Happiness, +50% Tax revenue, +35% Growth`
                : festCool > 0
                  ? `Next festival available in ${festCool}s`
                  : `+15..22 Happiness, +50% Tax & +35% Growth for 60s${hasPlaza ? ' (Plaza 50% off)' : ''}`}
            </div>
          </div>
          <button
            type="button"
            disabled={festRem > 0 || festCool > 0 || state.coins < festCost}
            onClick={() => GameController.dispatch({ type: 'START_FESTIVAL' })}
            className="min-h-[44px] px-4 rounded-xl bg-gradient-to-b from-amber-400 to-amber-500 disabled:from-stone-800 disabled:to-stone-800 disabled:text-stone-500 text-stone-950 font-bold text-xs tabular-nums shrink-0"
          >
            {festRem > 0
              ? `Live · ${festRem}s`
              : festCool > 0
                ? `Cooldown ${festCool}s`
                : `Host (${festCost}C)`}
          </button>
        </div>

        {/* Diverse Citizens & Professions Grid */}
        <div>
          <h3 className="text-xs font-semibold text-stone-300 mb-2">Citizens &amp; Professions</h3>
          <div className="grid grid-cols-3 gap-2 text-center tabular-nums mb-2">
            <div className="p-2.5 rounded-xl bg-emerald-950/50 border border-emerald-900/50">
              <div className="text-[11px] text-stone-400">Laborers</div>
              <div className="text-base font-bold text-stone-100">{population.classes.laborer}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-950/50 border border-emerald-900/50">
              <div className="text-[11px] text-stone-400">Artisans</div>
              <div className="text-base font-bold text-amber-300">{population.classes.artisan}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-950/50 border border-emerald-900/50">
              <div className="text-[11px] text-stone-400">Engineers</div>
              <div className="text-base font-bold text-sky-300">{population.classes.engineer}</div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-1.5 text-center tabular-nums text-[11px]">
            <div className="p-2 rounded-xl bg-[#07150e] border border-emerald-900/50">
              <div className="text-stone-400">Residents</div>
              <div className="font-bold text-stone-200">{roleCounts.normal}</div>
            </div>
            <div className="p-2 rounded-xl bg-[#07150e] border border-emerald-900/50">
              <div className="text-stone-400">Children</div>
              <div className="font-bold text-lime-300">
                {population.ageBreakdown.child + population.ageBreakdown.underage}
              </div>
            </div>
            <div className="p-2 rounded-xl bg-[#07150e] border border-emerald-900/50">
              <div className="text-stone-400">Officers</div>
              <div className="font-bold text-amber-200">{roleCounts.gov_officer}</div>
            </div>
            <div className="p-2 rounded-xl bg-[#07150e] border border-emerald-900/50">
              <div className="text-stone-400">Police</div>
              <div className="font-bold text-sky-300">{roleCounts.police}</div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-stone-300 px-1 tabular-nums">
          <span>Employed: {population.employed}</span>
          <span>Seeking Work: {population.unemployed}</span>
          <span>
            Water: {waterGenerated}/{waterDemand}
          </span>
        </div>

        {/* Building Operations Summary */}
        {state.buildings.length > 0 ? (() => {
          const activeCnt = state.buildings.filter((b) => b.enabled && b.status === 'active').length;
          const buildingCnt = state.buildings.filter((b) => b.status === 'constructing').length;
          const pausedCnt = state.buildings.filter((b) => !b.enabled).length;
          return (
            <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-emerald-950/50 border border-emerald-900/50 text-xs tabular-nums">
              <span className="text-stone-200">
                Buildings: <strong className="text-emerald-300">{activeCnt}</strong> active
                {buildingCnt > 0 ? ` · ${buildingCnt} building` : ''}
                {pausedCnt > 0 ? ` · ${pausedCnt} paused` : ''}
              </span>
              {pausedCnt > 0 ? (
                <button
                  type="button"
                  onClick={() => GameController.dispatch({ type: 'RESUME_ALL_BUILDINGS' })}
                  className="min-h-[34px] px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shrink-0"
                >
                  Resume All
                </button>
              ) : null}
            </div>
          );
        })() : null}

        {/* Citizen Needs */}
        <div>
          <h3 className="text-xs font-semibold text-stone-300 mb-2">Citizen Needs Coverage</h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {(
              [
                ['Food Supply', population.needs.food, '#f97316'],
                ['Clean Water', population.needs.water, '#0ea5e9'],
                ['Healthcare', population.needs.healthcare, '#10b981'],
                ['Education', population.needs.education, '#6366f1'],
                ['Safety', population.needs.safety, '#eab308'],
                ['Recreation', population.needs.recreation, '#a855f7'],
              ] as Array<[string, number, string]>
            ).map(([label, val, col]) => {
              const pct = Math.round(val * 100);
              return (
                <div key={label} className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-900/40">
                  <div className="flex justify-between text-stone-200 mb-1 tabular-nums">
                    <span>{label}</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-stone-900 rounded-sm overflow-hidden">
                    <div className="h-full" style={{ width: `${pct}%`, backgroundColor: col }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Civic Edicts & Policies */}
        <div>
          <h3 className="flex items-center gap-1.5 text-xs font-semibold text-stone-300 mb-2">
            <ScrollText className="w-3.5 h-3.5 text-amber-400" />
            Civic Edicts &amp; Policies
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {CITY_POLICIES.map((pol) => {
              const unlocked = state.level >= pol.unlockLevel;
              const enacted = activePolicies.includes(pol.id);
              return (
                <div
                  key={pol.id}
                  className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs ${
                    enacted
                      ? 'bg-emerald-900/45 border-emerald-500/70'
                      : 'bg-emerald-950/40 border-emerald-900/45'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="font-bold text-stone-100 truncate">{pol.name}</div>
                    <div className="text-[11px] text-lime-300 leading-snug">{pol.effectText}</div>
                    <div className="text-[10px] text-stone-400 leading-snug">{pol.tradeoffText}</div>
                  </div>
                  <button
                    type="button"
                    disabled={!unlocked}
                    onClick={() => GameController.dispatch({ type: 'TOGGLE_POLICY', policyId: pol.id })}
                    className={`min-h-[44px] px-3 rounded-xl font-bold text-xs shrink-0 tabular-nums ${
                      !unlocked
                        ? 'bg-stone-900 text-stone-500'
                        : enacted
                          ? 'bg-amber-500 text-stone-950'
                          : 'bg-emerald-700 text-white hover:bg-emerald-600'
                    }`}
                  >
                    {!unlocked ? `Lv.${pol.unlockLevel}` : enacted ? 'Repeal' : 'Enact'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Ecology & Sustainability */}
        <div>
          <h3 className="text-xs font-semibold text-stone-300 mb-2">Environment &amp; Sustainability</h3>
          <div className="grid grid-cols-4 gap-2 text-center text-xs tabular-nums">
            <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-900/40">
              <div className="text-[10px] text-stone-400">Forest</div>
              <div className="font-semibold text-lime-300">{environment.forestCoveragePct}%</div>
            </div>
            <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-900/40">
              <div className="text-[10px] text-stone-400">Pollution</div>
              <div className="font-semibold text-orange-300">{environment.avgPollution}</div>
            </div>
            <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-900/40">
              <div className="text-[10px] text-stone-400">Water Q.</div>
              <div className="font-semibold text-sky-300">{environment.waterQuality}%</div>
            </div>
            <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-900/40">
              <div className="text-[10px] text-stone-400">Sustain.</div>
              <div className="font-semibold text-emerald-300">{environment.sustainability}</div>
            </div>
          </div>
        </div>

        {/* Workforce Priority Controls */}
        <div>
          <h3 className="text-xs font-semibold text-stone-300 mb-2">Workforce Assignment Priorities</h3>
          <div className="space-y-1.5">
            {PRIORITY_CATS.map(([cat, label]) => {
              const prio = workforcePriorities[cat] ?? 3;
              return (
                <div
                  key={cat}
                  className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-900/40"
                >
                  <span className="text-xs text-stone-200">{label}</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((lv) => (
                      <button
                        key={lv}
                        type="button"
                        onClick={() =>
                          GameController.dispatch({
                            type: 'SET_WORKFORCE_PRIORITY',
                            category: cat,
                            priority: lv,
                          })
                        }
                        className={`w-7 h-7 rounded text-xs font-semibold tabular-nums ${
                          prio === lv
                            ? 'bg-amber-500 text-stone-950'
                            : 'bg-stone-900 text-stone-400 hover:text-white'
                        }`}
                      >
                        {lv}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </SheetContainer>
  );
};
