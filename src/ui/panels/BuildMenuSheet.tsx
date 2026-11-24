import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Coins,
  Compass,
  Droplets,
  Factory,
  Hammer,
  HelpCircle,
  Lock,
  Mountain,
  Waves,
  Zap,
} from 'lucide-react';
import { formatInGameHourlyRate, getRecipeHourlyAmount } from '../../core/Formatters';
import {
  BUILDING_LIST,
  BuildingCategory,
  BuildingDef,
  getBuildingLevelMultiplier,
  isLargeFactory,
} from '../../data/buildings.data';
import { RESOURCES, ResourceId } from '../../data/resources.data';
import { BUILDABLE_ROADS } from '../../data/roads.data';
import { TECH_MAP } from '../../data/techTree.data';
import { BuildingSystem } from '../../systems/BuildingSystem';
import { EconomySystem } from '../../systems/EconomySystem';
import { GameController, GameSnapshot } from '../bridge/GameController';
import { SheetContainer } from './SheetContainer';

type FilterTab =
  | 'all'
  | 'ready'
  | 'residential'
  | 'agricultural'
  | 'production'
  | 'roads'
  | 'industrial'
  | 'services'
  | 'energy';

const SERVICE_CATS: BuildingCategory[] = [
  'storage',
  'commercial',
  'educational',
  'healthcare',
  'government',
  'recreational',
  'transportation',
];

const BuildingMiniPreview: React.FC<{ def: BuildingDef }> = ({ def }) => (
  <svg
    viewBox="0 0 44 44"
    className="w-11 h-11 shrink-0 rounded-xl bg-[#07150e] border border-emerald-800/60 p-1 shadow-inner"
    aria-hidden="true"
  >
    <polygon points="22,28 38,34 22,40 6,34" fill="#1b4332" stroke="#2d6a4f" strokeWidth="1" />
    {def.category === 'agricultural' || def.id === 'village_park' || def.id === 'fountain_plaza' ? (
      <>
        <polygon points="22,24 35,30 22,36 9,30" fill={def.roofColor} />
        <circle cx="16" cy="29" r="2.4" fill={def.accentColor} />
        <circle cx="28" cy="29" r="2.4" fill={def.accentColor} />
        <rect x="19" y="14" width="6" height="9" fill={def.wallColor} />
        <polygon points="22,9 27,14 17,14" fill={def.accentColor} />
      </>
    ) : def.requiredDeposit || def.id === 'marble_quarry' ? (
      <>
        <ellipse cx="22" cy="31" rx="10" ry="5" fill="#1e293b" />
        <polyline points="14,32 22,12 30,32" fill="none" stroke={def.accentColor} strokeWidth="2.4" />
        <circle cx="22" cy="16" r="2.8" fill="#e2e8f0" />
        <rect x="26" y="27" width="8" height="6" fill={def.wallColor} />
      </>
    ) : def.category === 'industrial' || def.id === 'brick_kiln' || def.id === 'coal_power_plant' ? (
      <>
        <polygon points="11,20 22,25 22,36 11,31" fill={def.wallColor} />
        <polygon points="22,25 33,20 33,31 22,36" fill={def.wallColor} fillOpacity="0.72" />
        <polygon points="22,14 33,19 22,24 11,19" fill={def.roofColor} />
        <rect x="15" y="7" width="3.5" height="10" fill="#475569" />
        <rect x="25" y="5" width="3.5" height="12" fill="#475569" />
        <rect x="15" y="7" width="3.5" height="2" fill={def.accentColor} />
        <rect x="25" y="5" width="3.5" height="2" fill={def.accentColor} />
      </>
    ) : def.id === 'wind_turbine' || def.id === 'windmill' || def.id === 'watchtower' ? (
      <>
        <rect x="20" y="13" width="4" height="21" fill="#cbd5e1" />
        <line x1="22" y1="14" x2="22" y2="5" stroke={def.accentColor} strokeWidth="2.2" />
        <line x1="22" y1="14" x2="13" y2="20" stroke={def.accentColor} strokeWidth="2.2" />
        <line x1="22" y1="14" x2="31" y2="20" stroke={def.accentColor} strokeWidth="2.2" />
      </>
    ) : (
      <>
        <polygon points="11,19 22,24 22,36 11,31" fill={def.wallColor} />
        <polygon points="22,24 33,19 33,31 22,36" fill={def.wallColor} fillOpacity="0.72" />
        <polygon points="22,9 35,18 22,25 9,18" fill={def.roofColor} />
        <circle cx="22" cy="15" r="2.4" fill={def.accentColor} />
      </>
    )}
  </svg>
);

export const BuildMenuSheet: React.FC<{ snap: GameSnapshot }> = ({ snap }) => {
  const [tab, setTab] = useState<FilterTab>('all');
  const [query, setQuery] = useState('');
  const [expandedTipId, setExpandedTipId] = useState<string | null>(null);
  const { state, buildQueueActive, buildQueueCap } = snap;
  const q = query.trim().toLowerCase();
  const queueFull = buildQueueActive >= buildQueueCap;

  const activeConstructing = state.buildings.find((b) => b.status === 'constructing');

  const filteredBuildings = BUILDING_LIST.filter((b) => {
    if (tab === 'roads') return false;
    if (q && !b.name.toLowerCase().includes(q) && !b.description.toLowerCase().includes(q)) {
      return false;
    }
    if (tab === 'ready') {
      return BuildingSystem.getGlobalBuildRequirements(b.id, state).readyToPlace;
    }
    if (tab === 'all') return true;
    if (tab === 'services') return SERVICE_CATS.includes(b.category);
    if (tab === 'energy') return b.category === 'energy' || b.category === 'environmental';
    return b.category === tab;
  });

  return (
    <SheetContainer
      title="Construct & Infrastructure"
      subtitle={`Coins: ${Math.floor(state.coins).toLocaleString()} · Build Queue: ${buildQueueActive}/${buildQueueCap}`}
    >
      {/* Queue Banner */}
      {queueFull && activeConstructing ? (
        <div className="mb-3 p-3 rounded-xl bg-amber-950/65 border border-amber-600/60 flex items-center justify-between gap-2 text-xs min-w-0">
          <div className="min-w-0">
            <div className="font-bold text-amber-200">
              Construction Queue Full ({buildQueueActive}/{buildQueueCap})
            </div>
            <div className="text-[11px] text-stone-300">
              Wait for active sites to finish or jump to one and tap Rush.
            </div>
          </div>
          <button
            type="button"
            onClick={() => GameController.focusBuilding(activeConstructing.id)}
            className="min-h-[44px] px-3 rounded-xl bg-amber-500 text-stone-950 font-bold shrink-0"
          >
            Jump to Site
          </button>
        </div>
      ) : null}

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={`Search ${BUILDING_LIST.length} blueprints (e.g. Complex, Bakery, Mine, Park)...`}
        className="w-full mb-2.5 px-3 py-2.5 rounded-xl bg-[#07150e] border border-emerald-800/60 text-xs text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-amber-400"
      />

      {/* Interactive Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-3 mb-3 border-b border-emerald-800/45">
        {(
          [
            ['all', 'All'],
            ['ready', 'Ready Now'],
            ['residential', 'Housing'],
            ['agricultural', 'Food'],
            ['production', 'Craft'],
            ['roads', 'Roads'],
            ['industrial', 'Industry'],
            ['services', 'Services'],
            ['energy', 'Utility'],
          ] as Array<[FilterTab, string]>
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`min-h-[44px] px-3.5 rounded-xl text-xs whitespace-nowrap shrink-0 transition-all ${
              tab === id
                ? 'bg-gradient-to-b from-amber-400 to-amber-500 text-stone-950 font-bold shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_2px_0_#92400e]'
                : 'bg-[#0a1d14] border border-emerald-800/50 text-stone-300 font-medium hover:text-white hover:border-emerald-700/70'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Draggable Land <-> Water Terraforming Card */}
      {(tab === 'energy' || tab === 'all') && !q && (
        <div className="mb-4 p-3 rounded-2xl bg-gradient-to-b from-[#0d2433] to-[#081722] border border-sky-700/55 space-y-2.5 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Waves className="w-4 h-4 text-sky-300 shrink-0" />
              <div className="min-w-0">
                <div className="text-xs font-bold text-stone-100 truncate">
                  Terrain Sculptor (Land ↔ Water)
                </div>
                <div className="text-[11px] text-sky-200/80">
                  Drag across unlocked tiles to carve canals or reclaim water (75C/tile).
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => GameController.startTerraformTool('to_water')}
              className="min-h-[44px] px-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs"
            >
              Paint Water (75C)
            </button>
            <button
              type="button"
              onClick={() => GameController.startTerraformTool('to_land')}
              className="min-h-[44px] px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
            >
              Reclaim Land (75C)
            </button>
          </div>
        </div>
      )}

      {/* Road Painting Cards */}
      {(tab === 'roads' || tab === 'all') && (
        <div className="mb-4">
          <div className="flex items-center justify-between gap-2 mb-2 min-w-0">
            <div className="text-xs font-bold text-amber-300/90 tracking-wide uppercase truncate">
              Roads, Bridges &amp; Railways
            </div>
            <button
              type="button"
              onClick={() => {
                GameController.setTool({ mode: 'demolish' });
                GameController.setActiveSheet('none');
              }}
              className="min-h-[44px] px-3 rounded-xl bg-red-950/75 border border-red-800/60 text-red-200 hover:text-white text-xs font-bold shrink-0"
            >
              Remove Mode
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {BUILDABLE_ROADS.map((road) => {
              const levelOk = state.level >= road.unlockLevel;
              const techOk = !road.requiredTech || state.unlockedTechIds.includes(road.requiredTech);
              const unlocked = levelOk && techOk;
              const missingParts: string[] = [];
              if (state.coins < road.coinCost) {
                missingParts.push(`Need ${road.coinCost - Math.floor(state.coins)}C`);
              }
              for (const [k, rawNeed] of Object.entries(road.materialCost)) {
                const need = rawNeed ?? 0;
                const rid = k as ResourceId;
                const have = Math.floor(state.resources[rid] ?? 0);
                if (have < need) {
                  missingParts.push(`Need ${need - have} ${RESOURCES[rid]?.name ?? rid} (${have}/${need})`);
                }
              }
              const affordable = missingParts.length === 0;

              return (
                <button
                  key={road.id}
                  type="button"
                  disabled={!unlocked}
                  onClick={() => {
                    GameController.setTool({ mode: 'road', roadType: road.id });
                    GameController.setActiveSheet('none');
                  }}
                  className={`w-full min-w-0 text-left p-3 rounded-2xl border transition-all flex items-center justify-between gap-2.5 min-h-[66px] ${
                    unlocked
                      ? 'bg-gradient-to-b from-[#132b1f] to-[#0b1c13] border-emerald-700/55 hover:border-amber-400/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.07)]'
                      : 'bg-[#0b1611]/70 border-stone-800/80 opacity-65'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-8 h-8 rounded-xl shrink-0 border border-white/20 shadow-inner"
                      style={{ backgroundColor: road.color }}
                    />
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-stone-100 truncate">{road.name}</div>
                      <div className="text-[11px] text-stone-300/85 mt-0.5 tabular-nums truncate">
                        {unlocked
                          ? `${road.coinCost}C${Object.entries(road.materialCost)
                              .map(([k, v]) => ` · ${v} ${RESOURCES[k as ResourceId]?.name ?? k}`)
                              .join('')} · ${road.speedMultiplier}×`
                          : `Requires Lv.${road.unlockLevel}${
                              road.requiredTech ? ` · ${TECH_MAP[road.requiredTech]?.name}` : ''
                            }`}
                      </div>
                      {unlocked && !affordable ? (
                        <div className="text-[10px] font-semibold text-red-300 mt-0.5 truncate">
                          {missingParts.join(' · ')}
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <span
                    className={`text-xs font-bold shrink-0 ${
                      !unlocked
                        ? 'text-stone-500'
                        : affordable
                          ? 'text-emerald-300'
                          : 'text-amber-300'
                    }`}
                  >
                    {unlocked ? (affordable ? 'Paint →' : 'Select →') : 'Locked'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Building Blueprint Cards */}
      {tab !== 'roads' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filteredBuildings.length === 0 ? (
            <div className="col-span-full p-4 rounded-2xl bg-[#0a1c13] border border-emerald-800/50 text-xs text-stone-300 text-center">
              No blueprints match your current filter. Try switching to All or clearing the search box.
            </div>
          ) : null}

          {filteredBuildings.map((b) => {
            const req = BuildingSystem.getGlobalBuildRequirements(b.id, state);
            const showTip = expandedTipId === b.id;
            const largeFactory = isLargeFactory(b);
            const rotatable = b.width !== b.height && b.footprintRotatable !== false;

            const outputLines = b.recipe
              ? Object.entries(b.recipe.outputs)
                  .filter(([, amt]) => (amt ?? 0) > 0)
                  .map(([k, amt]) => {
                    const rid = k as ResourceId;
                    const lv1 = getRecipeHourlyAmount(amt ?? 0, b.recipe!.cycleSeconds, getBuildingLevelMultiplier(1, b));
                    const lv2 =
                      b.maxLevel >= 2
                        ? getRecipeHourlyAmount(amt ?? 0, b.recipe!.cycleSeconds, getBuildingLevelMultiplier(2, b))
                        : null;
                    return {
                      name: RESOURCES[rid]?.name ?? rid,
                      lv1,
                      lv2,
                    };
                  })
              : [];

            const missingItems = req.missingMaterials.map((m) => ({
              resourceId: m.resourceId,
              amount: m.missing,
            }));
            const buyQuote =
              req.unlocked && missingItems.length > 0
                ? EconomySystem.quoteMissingMaterialsCost(state, missingItems, true)
                : null;

            return (
              <div
                key={b.id}
                className={`p-3.5 rounded-2xl border flex flex-col justify-between gap-2.5 min-w-0 transition-all ${
                  req.readyToPlace
                    ? 'bg-gradient-to-b from-[#143022] to-[#0b1d14] border-emerald-600/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
                    : req.unlocked
                      ? 'bg-gradient-to-b from-[#17261f] to-[#0b1611] border-amber-700/45'
                      : 'bg-[#0b1611]/75 border-stone-800/80 opacity-80'
                }`}
              >
                {/* Header */}
                <div className="flex items-start gap-2.5 min-w-0">
                  <BuildingMiniPreview def={b} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1.5 min-w-0">
                      <span className="text-sm font-bold text-stone-100 truncate">{b.name}</span>
                      <span className="text-[11px] font-semibold text-stone-300 tabular-nums shrink-0">
                        {b.width}×{b.height}
                        {rotatable ? ' ↻' : ''}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-300/85 line-clamp-2 mt-0.5 leading-snug">
                      {b.description}
                    </p>
                    {largeFactory ? (
                      <div className="flex items-center gap-1 text-[10px] font-semibold text-amber-300 mt-1">
                        <Factory className="w-3 h-3 shrink-0" />
                        <span>Mega Industrial Complex · Lv.1→Lv.{b.maxLevel}</span>
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Clear Diagnostic Status */}
                {req.readyToPlace ? (
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-950/75 border border-emerald-600/45 text-[11px] font-semibold text-emerald-300 min-w-0">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">
                      Ready to Place
                      {req.requiredDepositName ? ` · On ${req.requiredDepositName}` : ''}
                      {req.requiresCoast ? ' · Bordering Water' : ''}
                    </span>
                  </div>
                ) : !req.unlocked ? (
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-stone-900/90 border border-stone-700/60 text-[11px] font-semibold text-stone-300 min-w-0">
                    <Lock className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    <span className="truncate">
                      {!req.levelOk
                        ? `Unlocks at City Level ${b.unlockLevel} (Currently Lv.${state.level})`
                        : `Research "${req.missingTechName}" in Tech first`}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-start gap-1.5 px-2.5 py-1.5 rounded-xl bg-red-950/60 border border-red-700/50 text-[11px] font-semibold text-red-200 leading-snug min-w-0">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-300 shrink-0 mt-0.5" />
                    <span>{req.summaryReason}</span>
                  </div>
                )}

                {/* Per-Hour Capacity & Cost Readout (Zero Pill Bloat) */}
                {outputLines.length > 0 ? (
                  <div className="text-[11px] text-emerald-200/95 bg-[#07150e] border border-emerald-900/60 rounded-xl px-2.5 py-1.5 tabular-nums">
                    {outputLines.map((o) => (
                      <div key={o.name} className="flex items-center justify-between gap-2">
                        <span className="truncate">{o.name} Output:</span>
                        <span className="font-bold text-amber-300 shrink-0">
                          {formatInGameHourlyRate(o.lv1)} Lv.1
                          {o.lv2 !== null ? ` → ${formatInGameHourlyRate(o.lv2)} Lv.2` : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : null}

                {/* Material & Coin Requirements */}
                <div className="text-[11px] tabular-nums space-y-0.5 px-1">
                  <div className={req.missingCoins === 0 ? 'text-amber-300 font-semibold' : 'text-red-300 font-semibold'}>
                    Coins: {req.coinsHave.toLocaleString()}/{req.coinsNeed}
                    {req.missingCoins > 0 ? ` (-${req.missingCoins})` : ''}
                  </div>
                  {req.materials.length > 0 ? (
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                      {req.materials.map((m) => (
                        <span
                          key={m.resourceId}
                          className={m.missing === 0 ? 'text-emerald-300 font-medium' : 'text-red-300 font-semibold'}
                        >
                          {m.name}: {m.have}/{m.need}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>

                {/* Placement Conditions & Utilities */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-stone-300/90 tabular-nums px-1">
                  <span>
                    {b.maxWorkers > 0 ? `${b.minWorkers}-${b.maxWorkers} ${b.workerClass}s` : 'Automated'}
                  </span>
                  {b.requiresRoad ? <span>Needs {req.minRoadTierName ?? 'Road'}</span> : null}
                  {b.powerDemand ? (
                    <span className="inline-flex items-center gap-0.5 text-amber-200">
                      <Zap className="w-3 h-3" />
                      {b.powerDemand} MW
                    </span>
                  ) : null}
                  {b.waterDemand ? (
                    <span className="inline-flex items-center gap-0.5 text-sky-300">
                      <Droplets className="w-3 h-3" />
                      {b.waterDemand} Water
                    </span>
                  ) : null}
                </div>

                {/* Where to get missing items */}
                {req.unlocked && (req.missingMaterials.length > 0 || showTip) ? (
                  <div className="text-[11px] text-stone-300 bg-[#07150e]/90 border border-emerald-900/60 rounded-xl px-2.5 py-2 space-y-1">
                    {req.missingMaterials.length > 0 ? (
                      req.missingMaterials.map((m) => (
                        <div key={m.resourceId}>
                          <strong className="text-amber-300">{m.name}:</strong>{' '}
                          {m.producers.length > 0
                            ? m.producers.slice(0, 3).join(' · ')
                            : 'Available via Trading Post Market'}
                        </div>
                      ))
                    ) : (
                      <div>
                        <strong className="text-emerald-300">Placement Tip:</strong> Clear trees/boulders on a{' '}
                        {b.width}×{b.height} plot
                        {rotatable ? ' (tap Rotate while placing)' : ''}
                        {b.requiresRoad ? `, beside a ${req.minRoadTierName ?? 'Road'}` : ''}.
                      </div>
                    )}
                  </div>
                ) : null}

                {/* Action Buttons (Min 44px touch targets) */}
                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-emerald-800/40">
                  {req.unlocked ? (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          GameController.setTool({ mode: 'build', defId: b.id, rotation: 0 });
                          GameController.setActiveSheet('none');
                        }}
                        className={`flex-1 min-h-[44px] px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 ${
                          req.readyToPlace
                            ? 'bg-gradient-to-b from-amber-400 to-amber-500 text-stone-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_2px_0_#92400e]'
                            : 'bg-[#10291d] border border-emerald-600/60 text-stone-100 hover:bg-[#173929]'
                        }`}
                      >
                        <Hammer className="w-3.5 h-3.5" />
                        {req.readyToPlace ? 'Place on Map' : 'Preview Ghost'}
                      </button>

                      {buyQuote && buyQuote.totalCost > 0 ? (
                        <button
                          type="button"
                          disabled={!buyQuote.canPurchase}
                          onClick={() =>
                            GameController.dispatch({
                              type: 'BUY_MISSING_FOR_BUILDING',
                              defId: b.id,
                              allowEmergency: true,
                            })
                          }
                          title={
                            buyQuote.usesCourierFee
                              ? 'Emergency courier delivery (+45% fee when no Trading Post)'
                              : 'Buy exact missing materials at market rate'
                          }
                          className="min-h-[44px] px-3 rounded-xl bg-sky-700 hover:bg-sky-600 disabled:bg-stone-800 disabled:text-stone-500 text-white font-bold text-xs flex items-center gap-1 tabular-nums"
                        >
                          <Coins className="w-3.5 h-3.5" />
                          Buy Missing ({buyQuote.totalCost}C)
                        </button>
                      ) : null}

                      {b.requiredDeposit ? (
                        <button
                          type="button"
                          onClick={() => GameController.locateTarget({ depositType: b.requiredDeposit })}
                          className="min-h-[44px] px-2.5 rounded-xl bg-[#0a1d14] border border-sky-700/60 text-sky-200 text-xs font-semibold flex items-center gap-1"
                        >
                          <Mountain className="w-3.5 h-3.5" />
                          Locate
                        </button>
                      ) : b.requiresCoast ? (
                        <button
                          type="button"
                          onClick={() => GameController.locateTarget({ coast: true })}
                          className="min-h-[44px] px-2.5 rounded-xl bg-[#0a1d14] border border-sky-700/60 text-sky-200 text-xs font-semibold flex items-center gap-1"
                        >
                          <Compass className="w-3.5 h-3.5" />
                          Water
                        </button>
                      ) : req.missingMaterials.length === 0 ? (
                        <button
                          type="button"
                          aria-label="Placement help"
                          onClick={() => setExpandedTipId(showTip ? null : b.id)}
                          className="min-w-[44px] min-h-[44px] rounded-xl bg-[#0a1d14] border border-emerald-800/60 text-stone-300 flex items-center justify-center"
                        >
                          <HelpCircle className="w-4 h-4" />
                        </button>
                      ) : null}
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        GameController.setActiveSheet(!req.techOk && req.levelOk ? 'tech' : 'quests')
                      }
                      className="w-full min-h-[44px] px-3 rounded-xl bg-[#0e2017] border border-stone-700/70 text-stone-200 text-xs font-semibold flex items-center justify-center gap-1.5"
                    >
                      {!req.techOk && req.levelOk ? 'Open Tech Tree to Research' : 'View Missions to Earn XP'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </SheetContainer>
  );
};
