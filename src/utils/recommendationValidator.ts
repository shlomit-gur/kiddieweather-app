import { RecommendationResult, RecommendationStatus } from '../types/clothing';
import { getCatalogItemById, isCatalogItemAvailable, ALL_CATALOG_ITEM_IDS } from './clothingCatalog';

export class RecommendationValidationError extends Error {
  public errors: string[];
  constructor(message: string, errors: string[] = []) {
    super(message);
    this.name = 'RecommendationValidationError';
    this.errors = errors;
  }
}

export interface ValidationCheckResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validates a RecommendationResult structure at runtime according to the strict contract:
 * 1. status is 'success' | 'partial' | 'no_valid_outfit'
 * 2. summary is a non-empty string
 * 3. on contains valid catalog items enabled by parent (quantity >= 1)
 * 4. with contains valid catalog items enabled by parent
 * 5. changes contain actionable transitions with valid ISO 8601 datetimes
 * 6. windowAssessments cover scheduled activity/forecast windows with valid suitability and properties
 * 7. warnings contain valid stable codes, severities, and non-empty messages
 * 8. Status consistency is strictly preserved
 */
export function validateRecommendationResult(
  result: unknown,
  availableClothingIds?: string[]
): ValidationCheckResult {
  const errors: string[] = [];

  if (!result || typeof result !== 'object') {
    return { isValid: false, errors: ['Recommendation result must be a non-null object.'] };
  }

  const rec = result as Partial<RecommendationResult>;

  // 1. Status
  const validStatuses: RecommendationStatus[] = ['success', 'partial', 'no_valid_outfit'];
  if (!rec.status || !validStatuses.includes(rec.status)) {
    errors.push(`Invalid status: expected one of ${validStatuses.join(', ')}, got "${rec.status}"`);
  }

  // 2. Summary
  if (typeof rec.summary !== 'string' || rec.summary.trim() === '') {
    errors.push('Summary must be a non-empty string.');
  }

  // 3. ON items
  if (!Array.isArray(rec.on)) {
    errors.push('"on" must be an array of RecommendedItem.');
  } else {
    rec.on.forEach((item, idx) => {
      if (!item || typeof item !== 'object') {
        errors.push(`on[${idx}] is not an object.`);
        return;
      }
      if (!item.clothingItemId || typeof item.clothingItemId !== 'string') {
        errors.push(`on[${idx}].clothingItemId must be a non-empty string.`);
      } else {
        const catalogItem = getCatalogItemById(item.clothingItemId);
        if (!catalogItem) {
          errors.push(`on[${idx}].clothingItemId "${item.clothingItemId}" is not a valid catalog item ID.`);
        } else if (availableClothingIds && !isCatalogItemAvailable(availableClothingIds, item.clothingItemId)) {
          errors.push(`on[${idx}].clothingItemId "${item.clothingItemId}" is disabled by the parent.`);
        }
      }
      if (typeof item.quantity !== 'number' || item.quantity < 1) {
        errors.push(`on[${idx}].quantity must be a positive integer.`);
      }
      if (!Array.isArray(item.reasons) || item.reasons.length === 0) {
        errors.push(`on[${idx}].reasons must be a non-empty array of strings.`);
      }
      if (!Array.isArray(item.relevantWindowIds)) {
        errors.push(`on[${idx}].relevantWindowIds must be an array.`);
      }
    });
  }

  // 4. WITH items
  if (!Array.isArray(rec.with)) {
    errors.push('"with" must be an array of RecommendedItem.');
  } else {
    const onIds = new Set((rec.on || []).map((i) => i.clothingItemId));
    rec.with.forEach((item, idx) => {
      if (!item || typeof item !== 'object') {
        errors.push(`with[${idx}] is not an object.`);
        return;
      }
      if (!item.clothingItemId || typeof item.clothingItemId !== 'string') {
        errors.push(`with[${idx}].clothingItemId must be a non-empty string.`);
      } else {
        const catalogItem = getCatalogItemById(item.clothingItemId);
        if (!catalogItem) {
          errors.push(`with[${idx}].clothingItemId "${item.clothingItemId}" is not a valid catalog item ID.`);
        } else if (availableClothingIds && !isCatalogItemAvailable(availableClothingIds, item.clothingItemId)) {
          errors.push(`with[${idx}].clothingItemId "${item.clothingItemId}" is disabled by the parent.`);
        }
        // Requirement 2: An item may appear in both only when multiple quantities are genuinely needed
        if (onIds.has(item.clothingItemId) && item.quantity <= 1 && (!item.reasons || !item.reasons.some(r => r.toLowerCase().includes('spare') || r.toLowerCase().includes('change') || r.toLowerCase().includes('extra')))) {
          errors.push(`with[${idx}].clothingItemId "${item.clothingItemId}" is already worn in "on" without a multiple-quantity justification.`);
        }
      }
      if (typeof item.quantity !== 'number' || item.quantity < 1) {
        errors.push(`with[${idx}].quantity must be a positive integer.`);
      }
      if (!Array.isArray(item.reasons) || item.reasons.length === 0) {
        errors.push(`with[${idx}].reasons must be a non-empty array of strings.`);
      }
      if (!Array.isArray(item.relevantWindowIds)) {
        errors.push(`with[${idx}].relevantWindowIds must be an array.`);
      }
    });
  }

  // 5. CHANGES
  if (!Array.isArray(rec.changes)) {
    errors.push('"changes" must be an array of OutfitChange.');
  } else {
    rec.changes.forEach((change, idx) => {
      if (!change || typeof change !== 'object') {
        errors.push(`changes[${idx}] is not an object.`);
        return;
      }
      if (!change.id || typeof change.id !== 'string') {
        errors.push(`changes[${idx}].id must be a string.`);
      }
      // ISO 8601 datetime with timezone check
      if (!change.time || typeof change.time !== 'string' || isNaN(Date.parse(change.time))) {
        errors.push(`changes[${idx}].time "${change.time}" is not a valid ISO 8601 datetime.`);
      }
      const validActions = ['put_on', 'remove', 'replace'];
      if (!validActions.includes(change.action)) {
        errors.push(`changes[${idx}].action "${change.action}" is invalid. Expected put_on, remove, or replace.`);
      }
      if (!change.clothingItemId || !getCatalogItemById(change.clothingItemId)) {
        errors.push(`changes[${idx}].clothingItemId "${change.clothingItemId}" is not a valid catalog item ID.`);
      } else if (availableClothingIds && !isCatalogItemAvailable(availableClothingIds, change.clothingItemId)) {
        errors.push(`changes[${idx}].clothingItemId "${change.clothingItemId}" is disabled by parent.`);
      }
      if (change.action === 'replace') {
        if (!change.replacesClothingItemId || !getCatalogItemById(change.replacesClothingItemId)) {
          errors.push(`changes[${idx}].replacesClothingItemId must be a valid catalog item ID when action is "replace".`);
        }
      }
      if (!change.reason || typeof change.reason !== 'string') {
        errors.push(`changes[${idx}].reason must be a string.`);
      }
      if (!change.activityWindowId || typeof change.activityWindowId !== 'string') {
        errors.push(`changes[${idx}].activityWindowId must be a string.`);
      }
    });
  }

  // 6. WINDOW ASSESSMENTS
  if (!Array.isArray(rec.windowAssessments)) {
    errors.push('"windowAssessments" must be an array of WindowAssessment.');
  } else {
    rec.windowAssessments.forEach((assessment, idx) => {
      if (!assessment || typeof assessment !== 'object') {
        errors.push(`windowAssessments[${idx}] is not an object.`);
        return;
      }
      if (!assessment.activityWindowId || typeof assessment.activityWindowId !== 'string') {
        errors.push(`windowAssessments[${idx}].activityWindowId must be a string.`);
      }
      const validSuitabilities = ['suitable', 'compromised', 'unsuitable'];
      if (!validSuitabilities.includes(assessment.suitability)) {
        errors.push(`windowAssessments[${idx}].suitability "${assessment.suitability}" is invalid.`);
      }
      if (!assessment.requiredProperties || typeof assessment.requiredProperties !== 'object') {
        errors.push(`windowAssessments[${idx}].requiredProperties must be an object.`);
      }
      if (!Array.isArray(assessment.reasons)) {
        errors.push(`windowAssessments[${idx}].reasons must be an array.`);
      }
    });
  }

  // 7. WARNINGS
  if (!Array.isArray(rec.warnings)) {
    errors.push('"warnings" must be an array of RecommendationWarning.');
  } else {
    rec.warnings.forEach((warning, idx) => {
      if (!warning || typeof warning !== 'object') {
        errors.push(`warnings[${idx}] is not an object.`);
        return;
      }
      if (!warning.code || typeof warning.code !== 'string') {
        errors.push(`warnings[${idx}].code must be a non-empty string.`);
      }
      const validSeverities = ['info', 'warning', 'critical'];
      if (!validSeverities.includes(warning.severity)) {
        errors.push(`warnings[${idx}].severity "${warning.severity}" is invalid.`);
      }
      if (!warning.message || typeof warning.message !== 'string') {
        errors.push(`warnings[${idx}].message must be a non-empty string.`);
      }
    });
  }

  // 8. STATUS CONSISTENCY INVARIANTS
  const hasCriticalWarning = (rec.warnings || []).some((w) => w.severity === 'critical');
  const hasWarning = (rec.warnings || []).some((w) => w.severity === 'warning');
  const hasCompromisedWindow = (rec.windowAssessments || []).some(
    (w) => w.suitability === 'compromised' || w.suitability === 'unsuitable'
  );

  if (hasCriticalWarning && rec.status !== 'no_valid_outfit') {
    errors.push(`Status invariant violated: critical warning present but status is "${rec.status}" instead of "no_valid_outfit".`);
  }

  if (rec.status === 'success' && (hasWarning || hasCompromisedWindow)) {
    errors.push(`Status invariant violated: warnings or compromised windows exist, so status cannot be "success".`);
  }

  if (rec.status === 'no_valid_outfit' && (rec.on || []).length > 0 && !hasCriticalWarning) {
    // If there is an outfit and no critical warnings, no_valid_outfit is inconsistent
    errors.push(`Status invariant violated: "no_valid_outfit" reported but safe wear-now outfit was produced without critical blockers.`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function assertValidRecommendationResult(
  result: unknown,
  availableClothingIds?: string[]
): asserts result is RecommendationResult {
  const { isValid, errors } = validateRecommendationResult(result, availableClothingIds);
  if (!isValid) {
    throw new RecommendationValidationError(
      `RecommendationResult validation failed: ${errors.join('; ')}`,
      errors
    );
  }
}
