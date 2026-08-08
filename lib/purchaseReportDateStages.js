/**
 * Shared Mongo aggregation helpers for purchase report APIs.
 * Handles po-date stored as Date, ISO string, or empty/invalid values.
 */

/** Match docs that have a usable po-date (excludes null/empty string). */
export const poDateExistsMatch = {
  "po-date": { $exists: true, $nin: [null, ""] },
};

/**
 * Normalize po-date to a Date (or null when invalid).
 * Use after matching poDateExistsMatch, then $match on poDateNorm != null.
 */
export const poDateNormAddFields = {
  $addFields: {
    poDateNorm: {
      $cond: {
        if: { $eq: [{ $type: "$po-date" }, "date"] },
        then: "$po-date",
        else: {
          $convert: {
            input: "$po-date",
            to: "date",
            onError: null,
            onNull: null,
          },
        },
      },
    },
  },
};

/**
 * Extract year from po-date safely (null when unparseable).
 */
export const poYearAddFields = {
  $addFields: {
    year: {
      $let: {
        vars: {
          raw: "$po-date",
          asStr: {
            $trim: {
              input: { $toString: { $ifNull: ["$po-date", ""] } },
            },
          },
        },
        in: {
          $cond: {
            if: { $eq: [{ $type: "$$raw" }, "date"] },
            then: { $year: "$$raw" },
            else: {
              $cond: {
                if: {
                  $and: [
                    { $gte: [{ $strLenCP: "$$asStr" }, 4] },
                    {
                      $regexMatch: {
                        input: "$$asStr",
                        regex: "^[0-9]{4}",
                      },
                    },
                  ],
                },
                then: {
                  $convert: {
                    input: { $substrCP: ["$$asStr", 0, 4] },
                    to: "int",
                    onError: null,
                    onNull: null,
                  },
                },
                else: null,
              },
            },
          },
        },
      },
    },
  },
};

/**
 * Stages to filter purchaseorders to a calendar year via safe date conversion.
 */
export function yearDateFilterStages(yearNum) {
  const startOfYear = new Date(yearNum, 0, 1, 0, 0, 0, 0);
  const endOfYear = new Date(yearNum, 11, 31, 23, 59, 59, 999);
  return [
    { $match: poDateExistsMatch },
    poDateNormAddFields,
    {
      $match: {
        poDateNorm: { $ne: null, $gte: startOfYear, $lte: endOfYear },
      },
    },
  ];
}
