import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import {
  MATERIALS_RATING_LABELS,
  SERVICES_RATING_LABELS,
  computeCategoryOverall,
} from '../lib/vendorFeedbackRatingConfig';

const RATING_INSTRUCTIONS = `Rate each parameter from 1 to 5 stars. You can give an overall rating (item 10) as a manual direct entry, or rate items 1–9 and item 10 will be calculated as the average of those. If you have rated any of items 1–9, item 10 is locked; clear all of 1–9 to enter item 10 manually. Skip any parameter that is not applicable; skipped ratings will not be included in the overall score.`;

function StarRow({ label, value, onChange, disabled, isOverall }) {
  return (
    <div className={`flex flex-wrap items-center gap-2 py-1.5 border-b border-slate-900/50 last:border-b-0 ${isOverall ? 'bg-cyan-950/20 rounded-md px-2 -mx-1 border-l-2 border-cyan-500' : ''}`}>
      <div className={`flex-1 min-w-0 ${isOverall ? 'text-xs font-bold text-cyan-400' : 'text-xs text-slate-300'}`}>
        {label}
        {isOverall && <span className="ml-1 text-[10px] font-semibold text-cyan-500/80">(manual direct entry)</span>}
      </div>
      <div className="flex items-center gap-0.5 flex-shrink-0">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            disabled={disabled}
            onClick={() => onChange(value === n ? null : n)}
            className="p-0.5 focus:outline-none disabled:opacity-30 disabled:cursor-not-allowed text-amber-400 hover:text-amber-500 transition-colors"
            style={{ opacity: (value != null && value >= n) ? 1 : 0.25 }}
            aria-label={`${n} star${n > 1 ? 's' : ''}`}
          >
            <FontAwesomeIcon icon={faStar} className="w-3.5 h-3.5" />
          </button>
        ))}
      </div>
    </div>
  );
}

function CategoryColumn({ title, labels, ratings, onChange, disabled }) {
  const overall = computeCategoryOverall(ratings);
  const hasAnyIndividualRating = [1, 2, 3, 4, 5, 6, 7, 8, 9].some((k) => ratings[k] != null && ratings[k] >= 1 && ratings[k] <= 5);
  const hasManualOverall = ratings[10] != null && ratings[10] >= 1 && ratings[10] <= 5;
  return (
    <div className="flex-1 min-w-0 flex flex-col border border-slate-800 rounded-lg bg-slate-900/40 shadow-inner overflow-hidden">
      <div className="px-3.5 py-2 bg-slate-900/80 text-slate-300 font-bold text-xs uppercase tracking-wider border-b border-slate-800">
        {title}
      </div>
      <div className="p-3 space-y-0">
        {labels.map((label, i) => {
          const key = i + 1;
          const value = ratings[key] ?? null;
          const isRow10 = key === 10;
          const rowDisabled = disabled || (isRow10 && hasAnyIndividualRating) || (!isRow10 && hasManualOverall);
          return (
            <StarRow
              key={key}
              label={`${key}) ${label}`}
              value={value}
              onChange={(v) => onChange({ ...ratings, [key]: v })}
              disabled={rowDisabled}
              isOverall={isRow10}
            />
          );
        })}
      </div>
      {overall != null && (
        <div className="px-3.5 py-1.5 bg-slate-900/60 text-xs text-slate-400 border-t border-slate-800 flex justify-between items-center">
          <span>Computed overall score:</span>
          <span className="font-black text-amber-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-850">{overall.toFixed(1)} / 5</span>
        </div>
      )}
    </div>
  );
}

export default function VendorFeedbackRatingCard({
  ratingMaterials = {},
  ratingServices = {},
  onMaterialsChange,
  onServicesChange,
  disabled = false,
  disableMaterials = false,
  disableServices = false,
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/20 p-4 shadow-lg">
      <div className="mb-4 p-3 rounded-lg bg-slate-950 border border-slate-850 text-xs">
        <p className="font-bold text-cyan-400 mb-1 flex items-center gap-1.5">
          <FontAwesomeIcon icon={faInfoCircle} className="text-cyan-500" />
          Rating Instructions
        </p>
        <p className="text-slate-400 leading-normal">{RATING_INSTRUCTIONS}</p>
      </div>
      <div className="flex flex-col md:flex-row gap-4">
        <div className={`flex-1 transition-all duration-300 ${disableMaterials ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
          <CategoryColumn
            title="Materials (if applicable)"
            labels={MATERIALS_RATING_LABELS}
            ratings={ratingMaterials}
            onChange={onMaterialsChange}
            disabled={disabled || disableMaterials}
          />
        </div>
        <div className={`flex-1 transition-all duration-300 ${disableServices ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
          <CategoryColumn
            title="Services (if applicable)"
            labels={SERVICES_RATING_LABELS}
            ratings={ratingServices}
            onChange={onServicesChange}
            disabled={disabled || disableServices}
          />
        </div>
      </div>
    </div>
  );
}
