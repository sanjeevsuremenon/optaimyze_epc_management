import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar } from '@fortawesome/free-solid-svg-icons';
import {
  MATERIALS_RATING_LABELS,
  SERVICES_RATING_LABELS,
  computeCategoryOverall,
} from '../lib/vendorFeedbackRatingConfig';

const RATING_INSTRUCTIONS = `Rate each parameter from 1 to 5 stars. You can give an overall rating (item 10) as a manual direct entry, or rate items 1–9 and item 10 will be calculated as the average of those. If you have rated any of items 1–9, item 10 is locked; clear all of 1–9 to enter item 10 manually. Skip any parameter that is not applicable; skipped ratings will not be included in the overall score.`;

function StarRow({ label, value, onChange, disabled, isOverall }) {
  return (
    <div className={`flex flex-wrap items-center gap-2 py-2 border-b border-gray-100 last:border-b-0 ${isOverall ? 'bg-indigo-50/80 rounded-md px-2 -mx-1 border-l-2 border-indigo-400' : ''}`}>
      <div className={`flex-1 min-w-0 ${isOverall ? 'text-sm font-semibold text-indigo-800' : 'text-sm text-gray-700'}`}>
        {label}
        {isOverall && <span className="ml-1 font-semibold text-indigo-600">(manual direct entry)</span>}
      </div>
      <div className="flex items-center gap-0.5 flex-shrink-0">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            disabled={disabled}
            onClick={() => onChange(value === n ? null : n)}
            className="p-0.5 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed text-amber-500 hover:text-amber-600 transition-colors"
            style={{ opacity: (value != null && value >= n) ? 1 : 0.35 }}
            aria-label={`${n} star${n > 1 ? 's' : ''}`}
          >
            <FontAwesomeIcon icon={faStar} className="w-4 h-4" />
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
    <div className="flex-1 min-w-0 flex flex-col border border-gray-200 rounded-lg bg-white shadow-sm overflow-hidden">
      <div className="px-4 py-3 bg-gray-700 text-white font-semibold text-sm">
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
        <div className="px-4 py-2 bg-gray-50 text-sm text-gray-600 border-t border-gray-200">
          Computed overall: <span className="font-medium text-amber-700">{overall.toFixed(1)}</span> / 5
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
}) {
  return (
    <div className="rounded-xl border-2 border-gray-300 bg-gray-100 p-4 shadow-md">
      <div className="mb-4 p-3 rounded-lg bg-blue-50 border border-blue-200 text-sm text-gray-800">
        <p className="font-semibold text-blue-900 mb-1">Rating instructions</p>
        <p className="text-gray-700">{RATING_INSTRUCTIONS}</p>
      </div>
      <div className="flex flex-col md:flex-row gap-4">
        <CategoryColumn
          title="Materials (if applicable)"
          labels={MATERIALS_RATING_LABELS}
          ratings={ratingMaterials}
          onChange={onMaterialsChange}
          disabled={disabled}
        />
        <CategoryColumn
          title="Services (if applicable)"
          labels={SERVICES_RATING_LABELS}
          ratings={ratingServices}
          onChange={onServicesChange}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
