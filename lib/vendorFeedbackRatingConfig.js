/**
 * Rating parameters for vendor feedback (Materials and Services).
 * Each has 10 items; item 10 is "overall" (user can set directly or it's computed from 1-9).
 */

export const MATERIALS_RATING_LABELS = [
  'Design documents timely submittal',
  'Quality of design documents and compliance to standards',
  'ITP and timely inspections and tests',
  'Quality of materials',
  'Response to queries',
  'Timely updates on design, fabrication, testing and deliveries',
  'Packing and shipping quality incl. documentation',
  'Post supply responsiveness & warranty support',
  'Invoices and AP related responsiveness',
  'Overall rating for materials supply',
];

export const SERVICES_RATING_LABELS = [
  'Timely submission of documents',
  'Timely mobilization of resources',
  'Quality of equipment mobilized',
  'Quality of manpower mobilized',
  'PPE and other safety compliance',
  'Environmental compliance',
  'Quality of design and other deliverables',
  'Planning and organizing',
  'Quality documents and site quality resources',
  'Overall rating for services',
];

/** Keys 1-10 (overall is index 9 / key 10) */
export const RATING_OVERALL_INDEX = 10;

/**
 * Compute overall rating for one category: use item 10 if set, else average of 1-9 (excluding null).
 * @param {Record<number, number|null>} ratings - object with keys 1..10
 * @returns {number|null} overall 1-5 or null
 */
export function computeCategoryOverall(ratings) {
  if (!ratings || typeof ratings !== 'object') return null;
  const overall = ratings[10];
  if (overall != null && overall >= 1 && overall <= 5) return Number(overall);
  const values = [];
  for (let i = 1; i <= 9; i++) {
    const v = ratings[i];
    if (v != null && v >= 1 && v <= 5) values.push(Number(v));
  }
  if (values.length === 0) return null;
  const sum = values.reduce((a, b) => a + b, 0);
  return Math.round((sum / values.length) * 10) / 10;
}

/**
 * Compute single overall rating from materials and services overalls.
 * @param {number|null} materialsOverall
 * @param {number|null} servicesOverall
 * @returns {number|null}
 */
export function computeFeedbackOverall(materialsOverall, servicesOverall) {
  const hasM = materialsOverall != null && materialsOverall >= 1 && materialsOverall <= 5;
  const hasS = servicesOverall != null && servicesOverall >= 1 && servicesOverall <= 5;
  if (hasM && hasS) return Math.round(((materialsOverall + servicesOverall) / 2) * 10) / 10;
  if (hasM) return materialsOverall;
  if (hasS) return servicesOverall;
  return null;
}
