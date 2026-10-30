// Helper to dynamically load all images uploaded to src/components/images
// Vite import.meta.glob imports all png files eagerly
const imageModules = import.meta.glob<string>(
  [
    '../components/images/**/*.{png,jpg,jpeg,webp}',
    '../components/images/*.{png,jpg,jpeg,webp}',
  ],
  { eager: true, import: 'default' }
);

// Map of catalog item id -> image URL
const idToImageMap = new Map<string, string>();

for (const [filePath, url] of Object.entries(imageModules)) {
  const fileName = filePath.split('/').pop()?.replace(/\.[^/.]+$/, '');
  if (fileName) {
    idToImageMap.set(fileName, url);
  }
}

/**
 * Returns the image URL for a given item id, catalog id, or item name.
 */
export function getClothingImageUrl(
  idOrName?: string,
  catalogItemId?: string,
  iconName?: string
): string | undefined {
  // 1. Direct match on catalogItemId
  if (catalogItemId && idToImageMap.has(catalogItemId)) {
    return idToImageMap.get(catalogItemId);
  }

  // 2. Direct match on iconName
  if (iconName && idToImageMap.has(iconName)) {
    return idToImageMap.get(iconName);
  }

  // 3. Direct match on id
  if (idOrName && idToImageMap.has(idOrName)) {
    return idToImageMap.get(idOrName);
  }

  // 4. Strip common prefixes like 'base-', 'mid-', 'bottom-', 'outer-', 'shoe-', 'sock-', 'hat-', 'mittens-', 'pack-', 'ext-', 'gear-'
  if (idOrName) {
    const strippedId = idOrName.replace(/^(base|mid|bottom|outer|shoe|sock|hat|mittens|pack|ext|gear)-/, '');
    if (idToImageMap.has(strippedId)) {
      return idToImageMap.get(strippedId);
    }

    // Check lowercase name matching
    const lower = idOrName.toLowerCase();

    if (lower.includes('mosquito') || lower.includes('insect') || lower.includes('repellent')) {
      return idToImageMap.get('insect_repellent');
    }
    if (lower.includes('sunscreen') || lower.includes('spf')) {
      return idToImageMap.get('sunscreen');
    }
    if (lower.includes('umbrella')) {
      return idToImageMap.get('umbrella');
    }
    if (lower.includes('blanket')) {
      return idToImageMap.get('stroller_blanket');
    }
    if (lower.includes('sunglasses')) {
      return idToImageMap.get('sunglasses');
    }
    if (lower.includes('rash guard') || lower.includes('rashguard')) {
      return idToImageMap.get('uv_rash_guard');
    }
    if (lower.includes('swimsuit') || lower.includes('swimming')) {
      return idToImageMap.get('swimsuit');
    }
    if (lower.includes('rain boots') || lower.includes('wellies')) {
      return idToImageMap.get('rain_boots');
    }
    if (lower.includes('winter boots') || lower.includes('snow boots')) {
      return idToImageMap.get('insulated_winter_boots');
    }
    if (lower.includes('sandals')) {
      return idToImageMap.get('sandals');
    }
    if (lower.includes('sneakers') || lower.includes('running shoes')) {
      return idToImageMap.get('breathable_sneakers');
    }
    if (lower.includes('closed-toe') || lower.includes('everyday shoes')) {
      return idToImageMap.get('closed_toe_shoes');
    }
    if (lower.includes('sun hat') || lower.includes('wide-brim')) {
      return idToImageMap.get('wide_brim_sun_hat');
    }
    if (lower.includes('baseball cap') || lower.includes('cap')) {
      return idToImageMap.get('baseball_cap');
    }
    if (lower.includes('warm knit beanie') || lower.includes('knit beanie') || lower.includes('wool beanie')) {
      return idToImageMap.get('warm_knit_beanie');
    }
    if (lower.includes('lightweight beanie') || lower.includes('beanie')) {
      return idToImageMap.get('lightweight_beanie');
    }
    if (lower.includes('mittens')) {
      return idToImageMap.get('insulated_mittens');
    }
    if (lower.includes('gloves')) {
      return idToImageMap.get('light_gloves');
    }
    if (lower.includes('snowsuit') || lower.includes('pramsuit')) {
      return idToImageMap.get('baby_snowsuit');
    }
    if (lower.includes('rain jacket')) {
      return idToImageMap.get('light_rain_jacket');
    }
    if (lower.includes('windbreaker')) {
      return idToImageMap.get('light_windbreaker');
    }
    if (lower.includes('heavy winter coat') || lower.includes('puffer coat') || lower.includes('winter coat')) {
      return idToImageMap.get('heavy_winter_coat');
    }
    if (lower.includes('insulated jacket')) {
      return idToImageMap.get('insulated_jacket');
    }
    if (lower.includes('fleece jacket') || lower.includes('fleece')) {
      return idToImageMap.get('fleece_jacket');
    }
    if (lower.includes('hoodie')) {
      return idToImageMap.get('hoodie');
    }
    if (lower.includes('sweatshirt')) {
      return idToImageMap.get('sweatshirt');
    }
    if (lower.includes('sweater') || lower.includes('cardigan')) {
      return idToImageMap.get('light_cardigan') || idToImageMap.get('knitted_sweater');
    }
    if (lower.includes('short-sleeve') || lower.includes('t-shirt') || lower.includes('tee')) {
      return idToImageMap.get('short_sleeve_tshirt');
    }
    if (lower.includes('long-sleeve') || lower.includes('thin long')) {
      return idToImageMap.get('thin_long_sleeve_shirt');
    }
    if (lower.includes('shorts')) {
      return idToImageMap.get('shorts');
    }
    if (lower.includes('sweatpants') || lower.includes('jogger')) {
      return idToImageMap.get('sweatpants');
    }
    if (lower.includes('trouser') || lower.includes('pants')) {
      return idToImageMap.get('regular_long_trousers') || idToImageMap.get('lightweight_long_trousers');
    }
  }

  return undefined;
}

/**
 * Returns a complete map of all catalog item IDs to their image URLs.
 */
export function getAllClothingImagesMap(): Record<string, string> {
  const result: Record<string, string> = {};
  idToImageMap.forEach((url, id) => {
    result[id] = url;
  });
  return result;
}
