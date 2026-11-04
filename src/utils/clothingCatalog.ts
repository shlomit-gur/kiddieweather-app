import catalogRaw from '../components/clothing-catalog.json';
import { ClothingCatalogData, CatalogCategory, CatalogItem } from '../types/catalog';

export const CLOTHING_CATALOG = catalogRaw as unknown as ClothingCatalogData;

// Flatten all items including non-clothing products
export const ALL_CATALOG_ITEMS: CatalogItem[] = [
  ...CLOTHING_CATALOG.categories.flatMap((cat) => cat.items),
  ...CLOTHING_CATALOG.nonClothingProducts,
];

// All item IDs
export const ALL_CATALOG_ITEM_IDS: string[] = ALL_CATALOG_ITEMS.map((item) => item.id);

// All item IDs excluding the baby_clothing category
export const NON_BABY_CATALOG_ITEM_IDS: string[] = [
  ...CLOTHING_CATALOG.categories
    .filter((cat) => cat.id !== 'baby_clothing')
    .flatMap((cat) => cat.items.map((item) => item.id)),
  ...CLOTHING_CATALOG.nonClothingProducts.map((item) => item.id),
];

// Map for quick lookup
const itemMap = new Map<string, CatalogItem>();
ALL_CATALOG_ITEMS.forEach((item) => {
  itemMap.set(item.id, item);
});

export function getCatalogItemById(id: string): CatalogItem | undefined {
  return itemMap.get(id);
}

/**
 * Returns available clothing IDs for a child profile.
 * If availableClothingIds is undefined or null on the profile,
 * all items in the catalog are considered available by default.
 */
export function getChildAvailableClothingIds(child?: { availableClothingIds?: string[] } | null): string[] {
  if (!child || !child.availableClothingIds) {
    return ALL_CATALOG_ITEM_IDS;
  }
  return child.availableClothingIds;
}

/**
 * Checks if a specific catalog item ID is available / owned by the child.
 */
export function isCatalogItemAvailable(availableIds: string[] | undefined, itemId: string): boolean {
  if (!availableIds) return true;
  return availableIds.includes(itemId);
}

/**
 * Mapping table from recommendation concepts/names to preferred and fallback catalog item IDs
 */
export const CATALOG_RECOMMENDATION_MAPPINGS: Record<string, { primary: string; fallbacks: string[] }> = {
  // Tops / Base
  short_sleeve_tshirt: {
    primary: 'short_sleeve_tshirt',
    fallbacks: ['sleeveless_top', 'thin_long_sleeve_shirt'],
  },
  sleeveless_top: {
    primary: 'sleeveless_top',
    fallbacks: ['short_sleeve_tshirt'],
  },
  thin_long_sleeve_shirt: {
    primary: 'thin_long_sleeve_shirt',
    fallbacks: ['thick_long_sleeve_top', 'short_sleeve_tshirt'],
  },
  thick_long_sleeve_top: {
    primary: 'thick_long_sleeve_top',
    fallbacks: ['thin_long_sleeve_shirt', 'sweatshirt', 'thermal_base_layer_top'],
  },
  thermal_base_layer_top: {
    primary: 'thermal_base_layer_top',
    fallbacks: ['thick_long_sleeve_top', 'thin_long_sleeve_shirt'],
  },

  // Baby bodysuits
  baby_bodysuit_sleeveless: {
    primary: 'baby_bodysuit_sleeveless',
    fallbacks: ['baby_bodysuit_short_sleeve', 'sleeveless_top'],
  },
  baby_bodysuit_short_sleeve: {
    primary: 'baby_bodysuit_short_sleeve',
    fallbacks: ['baby_bodysuit_sleeveless', 'baby_bodysuit_long_sleeve', 'short_sleeve_tshirt'],
  },
  baby_bodysuit_long_sleeve: {
    primary: 'baby_bodysuit_long_sleeve',
    fallbacks: ['baby_bodysuit_short_sleeve', 'thin_long_sleeve_shirt', 'baby_romper'],
  },
  baby_romper: {
    primary: 'baby_romper',
    fallbacks: ['baby_bodysuit_long_sleeve', 'baby_bodysuit_short_sleeve'],
  },

  // Bottoms
  shorts: {
    primary: 'shorts',
    fallbacks: ['lightweight_long_trousers', 'regular_long_trousers'],
  },
  lightweight_long_trousers: {
    primary: 'lightweight_long_trousers',
    fallbacks: ['regular_long_trousers', 'sweatpants', 'shorts'],
  },
  regular_long_trousers: {
    primary: 'regular_long_trousers',
    fallbacks: ['sweatpants', 'lightweight_long_trousers'],
  },
  sweatpants: {
    primary: 'sweatpants',
    fallbacks: ['regular_long_trousers', 'fleece_lined_trousers'],
  },
  fleece_lined_trousers: {
    primary: 'fleece_lined_trousers',
    fallbacks: ['sweatpants', 'thermal_leggings', 'regular_long_trousers'],
  },
  thermal_leggings: {
    primary: 'thermal_leggings',
    fallbacks: ['sweatpants', 'regular_long_trousers'],
  },
  waterproof_overtrousers: {
    primary: 'waterproof_overtrousers',
    fallbacks: ['regular_long_trousers', 'sweatpants'],
  },

  // Mid layers
  light_cardigan: {
    primary: 'light_cardigan',
    fallbacks: ['sweatshirt', 'hoodie', 'thin_long_sleeve_shirt'],
  },
  sweatshirt: {
    primary: 'sweatshirt',
    fallbacks: ['hoodie', 'light_cardigan', 'knitted_sweater', 'fleece_jacket'],
  },
  hoodie: {
    primary: 'hoodie',
    fallbacks: ['sweatshirt', 'fleece_jacket', 'knitted_sweater', 'light_cardigan'],
  },
  fleece_jacket: {
    primary: 'fleece_jacket',
    fallbacks: ['sweatshirt', 'hoodie', 'insulated_vest', 'knitted_sweater'],
  },
  knitted_sweater: {
    primary: 'knitted_sweater',
    fallbacks: ['sweatshirt', 'fleece_jacket', 'hoodie'],
  },
  insulated_vest: {
    primary: 'insulated_vest',
    fallbacks: ['light_windbreaker', 'fleece_jacket', 'sweatshirt'],
  },

  // Outerwear
  light_windbreaker: {
    primary: 'light_windbreaker',
    fallbacks: ['light_rain_jacket', 'sweatshirt', 'hoodie'],
  },
  light_rain_jacket: {
    primary: 'light_rain_jacket',
    fallbacks: ['waterproof_insulated_jacket', 'light_windbreaker', 'umbrella'],
  },
  insulated_jacket: {
    primary: 'insulated_jacket',
    fallbacks: ['heavy_winter_coat', 'waterproof_insulated_jacket', 'fleece_jacket'],
  },
  heavy_winter_coat: {
    primary: 'heavy_winter_coat',
    fallbacks: ['insulated_jacket', 'waterproof_insulated_jacket', 'fleece_jacket'],
  },
  waterproof_insulated_jacket: {
    primary: 'waterproof_insulated_jacket',
    fallbacks: ['insulated_jacket', 'light_rain_jacket', 'heavy_winter_coat'],
  },
  baby_snowsuit: {
    primary: 'baby_snowsuit',
    fallbacks: ['insulated_jacket', 'heavy_winter_coat'],
  },

  // Footwear
  thin_socks: {
    primary: 'thin_socks',
    fallbacks: ['thermal_socks'],
  },
  thermal_socks: {
    primary: 'thermal_socks',
    fallbacks: ['thin_socks'],
  },
  breathable_sneakers: {
    primary: 'breathable_sneakers',
    fallbacks: ['closed_toe_shoes', 'sandals'],
  },
  closed_toe_shoes: {
    primary: 'closed_toe_shoes',
    fallbacks: ['breathable_sneakers', 'rain_boots'],
  },
  sandals: {
    primary: 'sandals',
    fallbacks: ['breathable_sneakers', 'closed_toe_shoes'],
  },
  rain_boots: {
    primary: 'rain_boots',
    fallbacks: ['closed_toe_shoes', 'breathable_sneakers'],
  },
  insulated_winter_boots: {
    primary: 'insulated_winter_boots',
    fallbacks: ['closed_toe_shoes', 'rain_boots'],
  },
  water_shoes: {
    primary: 'water_shoes',
    fallbacks: ['sandals', 'breathable_sneakers'],
  },

  // Headwear
  wide_brim_sun_hat: {
    primary: 'wide_brim_sun_hat',
    fallbacks: ['baseball_cap'],
  },
  baseball_cap: {
    primary: 'baseball_cap',
    fallbacks: ['wide_brim_sun_hat'],
  },
  lightweight_beanie: {
    primary: 'lightweight_beanie',
    fallbacks: ['warm_knit_beanie', 'baseball_cap'],
  },
  warm_knit_beanie: {
    primary: 'warm_knit_beanie',
    fallbacks: ['lightweight_beanie'],
  },

  // Accessories
  light_gloves: {
    primary: 'light_gloves',
    fallbacks: ['insulated_mittens'],
  },
  insulated_mittens: {
    primary: 'insulated_mittens',
    fallbacks: ['light_gloves'],
  },
  sunglasses: {
    primary: 'sunglasses',
    fallbacks: ['wide_brim_sun_hat', 'baseball_cap'],
  },
  stroller_blanket: {
    primary: 'stroller_blanket',
    fallbacks: ['light_cardigan', 'sweatshirt'],
  },

  // Non-clothing products
  sunscreen: {
    primary: 'sunscreen',
    fallbacks: ['wide_brim_sun_hat', 'thin_long_sleeve_shirt'],
  },
  insect_repellent: {
    primary: 'insect_repellent',
    fallbacks: ['lightweight_long_trousers', 'thin_long_sleeve_shirt'],
  },
  umbrella: {
    primary: 'umbrella',
    fallbacks: ['light_rain_jacket', 'waterproof_insulated_jacket'],
  },
};

/**
 * Finds the best item to suggest from the available set of clothing items.
 * If the preferred item is available, returns it.
 * If not, checks logical fallbacks and returns the first available one.
 * If none in the fallback chain are available, returns null.
 */
export function resolveBestAvailableCatalogItem(
  preferredItemId: string,
  availableIds?: string[]
): CatalogItem | null {
  if (!availableIds) {
    return getCatalogItemById(preferredItemId) || null;
  }

  // 1. Check if preferred is available
  if (availableIds.includes(preferredItemId)) {
    return getCatalogItemById(preferredItemId) || null;
  }

  // 2. Check fallback chain
  const mapping = CATALOG_RECOMMENDATION_MAPPINGS[preferredItemId];
  if (mapping) {
    for (const fallbackId of mapping.fallbacks) {
      if (availableIds.includes(fallbackId)) {
        return getCatalogItemById(fallbackId) || null;
      }
    }
  }

  return null;
}
