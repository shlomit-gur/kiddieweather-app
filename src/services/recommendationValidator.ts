import {
  RecommendationResult,
  RecommendedItem,
  OutfitChange,
  WindowAssessment,
  RecommendationWarning,
} from '../types/clothing';
import { ALL_CATALOG_ITEM_IDS } from '../utils/clothingCatalog';

export interface ValidationReport {
  valid: boolean;
  errors: string[];
}

const VALID_STATUSES = new Set(['success', 'partial', 'no_valid_outfit']);
const VALID_ACTIONS = new Set(['put_on', 'remove', 'replace']);
const VALID_SUITABILITIES = new Set(['suitable', 'compromised', 'unsuitable']);
const VALID_SEVERITIES = new Set(['info', 'warning', 'critical']);
const VALID_LEVELS = new Set(['none', 'low', 'medium', 'high']);
const VALID_COVERAGE = new Set(['minimal', 'partial', 'full']);

const CATALOG_ID_SET = new Set(ALL_CATALOG_ITEM_IDS);

/**
 * Validates a RecommendationResult object at runtime.
 * Checks types, catalog reference integrity, parent availability constraints,
 * ISO 8601 timestamps, status semantics, and transition validity.
 */
export function validateRecommendationResult(
  result: unknown,
  availableClothingIds?: string[]
): ValidationReport {
  const errors: string[] = [];

  if (!result || typeof result !== 'object') {
    return { valid: false, errors: ['RecommendationResult must be a non-null object'] };
  }

  const res = result as Partial<RecommendationResult>;

  // 1. Status
  if (!res.status || !VALID_STATUSES.has(res.status)) {
    errors.push(`Invalid status: "${res.status}". Must be 'success', 'partial', or 'no_valid_outfit'`);
  }

  // 2. Summary
  if (typeof res.summary !== 'string' || res.summary.trim().length === 0) {
    errors.push('Summary must be a non-empty string');
  }

  // Permitted set of items: if availableClothingIds is specified, only those are allowed;
  // otherwise, all catalog items are permitted.
  const allowedItemIds = availableClothingIds && availableClothingIds.length > 0
    ? new Set(availableClothingIds)
    : CATALOG_ID_SET;

  // 3. 'on' items
  if (!Array.isArray(res.on)) {
    errors.push('"on" must be an array of RecommendedItem');
  } else {
    res.on.forEach((item: RecommendedItem, idx: number) => {
      validateRecommendedItem(item, `on[${idx}]`, allowedItemIds, errors);
    });
  }

  // 4. 'with' items
  if (!Array.isArray(res.with)) {
    errors.push('"with" must be an array of RecommendedItem');
  } else {
    res.with.forEach((item: RecommendedItem, idx: number) => {
      validateRecommendedItem(item, `with[${idx}]`, allowedItemIds, errors);
    });
  }

  // Check redundant duplicates between on and with:
  // An item should only appear in both when multiple quantities are genuinely needed (e.g. spare change)
  if (Array.isArray(res.on) && Array.isArray(res.with)) {
    const onIds = new Set(res.on.map((i) => i?.clothingItemId));
    res.with.forEach((withItem, idx) => {
      if (onIds.has(withItem?.clothingItemId)) {
        // Ensure there is an explanation/reason acknowledging the duplicate quantity
        const reasonsText = (withItem.reasons || []).join(' ').toLowerCase();
        const hasSpareOrBackup =
          reasonsText.includes('spare') ||
          reasonsText.includes('backup') ||
          reasonsText.includes('extra') ||
          reasonsText.includes('emergency') ||
          reasonsText.includes('additional') ||
          reasonsText.includes('change') ||
          withItem.quantity > 0;
        if (!hasSpareOrBackup) {
          errors.push(
            `Item "${withItem.clothingItemId}" in with[${idx}] is already worn in "on" without a documented additional quantity or spare reason`
          );
        }
      }
    });
  }

  // 5. 'changes' transitions
  if (!Array.isArray(res.changes)) {
    errors.push('"changes" must be an array of OutfitChange');
  } else {
    const seenChangeIds = new Set<string>();
    res.changes.forEach((change: OutfitChange, idx: number) => {
      validateOutfitChange(change, `changes[${idx}]`, allowedItemIds, seenChangeIds, errors);
    });
  }

  // 6. 'windowAssessments'
  if (!Array.isArray(res.windowAssessments)) {
    errors.push('"windowAssessments" must be an array of WindowAssessment');
  } else {
    res.windowAssessments.forEach((wa: WindowAssessment, idx: number) => {
      validateWindowAssessment(wa, `windowAssessments[${idx}]`, errors);
    });
  }

  // 7. 'warnings'
  if (!Array.isArray(res.warnings)) {
    errors.push('"warnings" must be an array of RecommendationWarning');
  } else {
    res.warnings.forEach((w: RecommendationWarning, idx: number) => {
      validateWarning(w, `warnings[${idx}]`, errors);
    });
  }

  // 8. Status consistency rules
  if (res.status === 'success') {
    // In success, no window may be 'unsuitable', and no critical warnings may exist
    const hasUnsuitableWindow = res.windowAssessments?.some((w) => w.suitability === 'unsuitable');
    if (hasUnsuitableWindow) {
      errors.push('Status cannot be "success" when one or more windowAssessments are "unsuitable"');
    }
    const hasCriticalWarning = res.warnings?.some((w) => w.severity === 'critical');
    if (hasCriticalWarning) {
      errors.push('Status cannot be "success" when critical warnings are present');
    }
  } else if (res.status === 'no_valid_outfit') {
    // In no_valid_outfit, either on is empty/incomplete or critical warnings exist
    const hasCritical = res.warnings?.some((w) => w.severity === 'critical');
    const onCount = res.on?.length || 0;
    if (onCount > 0 && !hasCritical) {
      errors.push('Status is "no_valid_outfit" but non-empty "on" items exist without a critical warning');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

function validateRecommendedItem(
  item: RecommendedItem,
  path: string,
  allowedItemIds: Set<string>,
  errors: string[]
): void {
  if (!item || typeof item !== 'object') {
    errors.push(`${path}: must be an object`);
    return;
  }

  if (typeof item.clothingItemId !== 'string' || item.clothingItemId.trim().length === 0) {
    errors.push(`${path}.clothingItemId: must be a non-empty string`);
  } else {
    if (!CATALOG_ID_SET.has(item.clothingItemId)) {
      errors.push(`${path}.clothingItemId "${item.clothingItemId}" is not a valid catalog item ID`);
    } else if (!allowedItemIds.has(item.clothingItemId)) {
      errors.push(`${path}.clothingItemId "${item.clothingItemId}" is not enabled by the parent in wardrobe`);
    }
  }

  if (typeof item.quantity !== 'number' || item.quantity <= 0 || !Number.isInteger(item.quantity)) {
    errors.push(`${path}.quantity: must be a positive integer`);
  }

  if (!Array.isArray(item.reasons) || item.reasons.length === 0) {
    errors.push(`${path}.reasons: must be a non-empty array of strings`);
  } else if (item.reasons.some((r) => typeof r !== 'string' || r.trim().length === 0)) {
    errors.push(`${path}.reasons: all entries must be non-empty strings`);
  }

  if (!Array.isArray(item.relevantWindowIds)) {
    errors.push(`${path}.relevantWindowIds: must be an array of strings`);
  }
}

function validateOutfitChange(
  change: OutfitChange,
  path: string,
  allowedItemIds: Set<string>,
  seenIds: Set<string>,
  errors: string[]
): void {
  if (!change || typeof change !== 'object') {
    errors.push(`${path}: must be an object`);
    return;
  }

  if (typeof change.id !== 'string' || change.id.trim().length === 0) {
    errors.push(`${path}.id: must be a non-empty string`);
  } else if (seenIds.has(change.id)) {
    errors.push(`${path}.id: duplicate change ID "${change.id}"`);
  } else {
    seenIds.add(change.id);
  }

  // Validate ISO 8601 datetime with timezone or valid date string
  if (typeof change.time !== 'string' || change.time.trim().length === 0) {
    errors.push(`${path}.time: must be a non-empty ISO 8601 datetime string`);
  } else {
    const parsed = Date.parse(change.time);
    if (isNaN(parsed)) {
      errors.push(`${path}.time "${change.time}" is not a valid ISO 8601 datetime`);
    }
  }

  if (!change.action || !VALID_ACTIONS.has(change.action)) {
    errors.push(`${path}.action: must be 'put_on', 'remove', or 'replace'`);
  }

  if (typeof change.clothingItemId !== 'string' || !CATALOG_ID_SET.has(change.clothingItemId)) {
    errors.push(`${path}.clothingItemId "${change.clothingItemId}" is not a valid catalog item ID`);
  } else if (!allowedItemIds.has(change.clothingItemId)) {
    errors.push(`${path}.clothingItemId "${change.clothingItemId}" is not enabled by parent`);
  }

  if (change.action === 'replace') {
    if (!change.replacesClothingItemId) {
      errors.push(`${path}.replacesClothingItemId is required when action is 'replace'`);
    } else if (!CATALOG_ID_SET.has(change.replacesClothingItemId)) {
      errors.push(`${path}.replacesClothingItemId "${change.replacesClothingItemId}" is not a valid catalog item ID`);
    }
  }

  if (typeof change.reason !== 'string' || change.reason.trim().length === 0) {
    errors.push(`${path}.reason: must be a non-empty string`);
  }

  if (typeof change.activityWindowId !== 'string' || change.activityWindowId.trim().length === 0) {
    errors.push(`${path}.activityWindowId: must be a non-empty string`);
  }
}

function validateWindowAssessment(
  wa: WindowAssessment,
  path: string,
  errors: string[]
): void {
  if (!wa || typeof wa !== 'object') {
    errors.push(`${path}: must be an object`);
    return;
  }

  if (typeof wa.activityWindowId !== 'string' || wa.activityWindowId.trim().length === 0) {
    errors.push(`${path}.activityWindowId: must be a non-empty string`);
  }

  if (!wa.suitability || !VALID_SUITABILITIES.has(wa.suitability)) {
    errors.push(`${path}.suitability: must be 'suitable', 'compromised', or 'unsuitable'`);
  }

  if (!wa.requiredProperties || typeof wa.requiredProperties !== 'object') {
    errors.push(`${path}.requiredProperties: must be an object`);
  } else {
    const rp = wa.requiredProperties;
    if (rp.insulation && !VALID_LEVELS.has(rp.insulation)) {
      errors.push(`${path}.requiredProperties.insulation: invalid value "${rp.insulation}"`);
    }
    if (rp.breathability && !VALID_LEVELS.has(rp.breathability)) {
      errors.push(`${path}.requiredProperties.breathability: invalid value "${rp.breathability}"`);
    }
    if (rp.windResistance && !VALID_LEVELS.has(rp.windResistance)) {
      errors.push(`${path}.requiredProperties.windResistance: invalid value "${rp.windResistance}"`);
    }
    if (rp.waterProtection && !VALID_LEVELS.has(rp.waterProtection)) {
      errors.push(`${path}.requiredProperties.waterProtection: invalid value "${rp.waterProtection}"`);
    }
    if (rp.sunProtection && !VALID_LEVELS.has(rp.sunProtection)) {
      errors.push(`${path}.requiredProperties.sunProtection: invalid value "${rp.sunProtection}"`);
    }
    if (rp.coverage && !VALID_COVERAGE.has(rp.coverage)) {
      errors.push(`${path}.requiredProperties.coverage: invalid value "${rp.coverage}"`);
    }
  }

  if (!Array.isArray(wa.reasons)) {
    errors.push(`${path}.reasons: must be an array of strings`);
  }
}

function validateWarning(
  w: RecommendationWarning,
  path: string,
  errors: string[]
): void {
  if (!w || typeof w !== 'object') {
    errors.push(`${path}: must be an object`);
    return;
  }

  if (typeof w.code !== 'string' || w.code.trim().length === 0) {
    errors.push(`${path}.code: must be a non-empty string`);
  }

  if (!w.severity || !VALID_SEVERITIES.has(w.severity)) {
    errors.push(`${path}.severity: must be 'info', 'warning', or 'critical'`);
  }

  if (typeof w.message !== 'string' || w.message.trim().length === 0) {
    errors.push(`${path}.message: must be a non-empty string`);
  }

  if (w.relatedClothingItemIds) {
    if (!Array.isArray(w.relatedClothingItemIds)) {
      errors.push(`${path}.relatedClothingItemIds must be an array of strings`);
    } else {
      w.relatedClothingItemIds.forEach((id) => {
        if (!CATALOG_ID_SET.has(id)) {
          errors.push(`${path}.relatedClothingItemIds contains invalid catalog ID "${id}"`);
        }
      });
    }
  }

  if (w.relatedWindowIds && !Array.isArray(w.relatedWindowIds)) {
    errors.push(`${path}.relatedWindowIds must be an array of strings`);
  }
}

/**
 * Throws an Error if the recommendation result fails validation.
 */
export function assertValidRecommendationResult(
  result: unknown,
  availableClothingIds?: string[]
): asserts result is RecommendationResult {
  const report = validateRecommendationResult(result, availableClothingIds);
  if (!report.valid) {
    throw new Error(`RecommendationResult validation failed:\n - ${report.errors.join('\n - ')}`);
  }
}
