export interface CatalogItemProperties {
  insulation?: 'none' | 'low' | 'medium' | 'high';
  breathability?: 'none' | 'low' | 'medium' | 'high';
  waterProtection?: 'none' | 'low' | 'medium' | 'high';
  windProtection?: 'none' | 'low' | 'medium' | 'high';
  sunProtection?: 'none' | 'low' | 'medium' | 'high';
  coverage?: 'minimal' | 'partial' | 'full';
}

export interface CatalogItem {
  id: string;
  label: {
    en: string;
    he: string;
  };
  layerRole?: 'base' | 'mid' | 'outer' | 'footwear' | 'accessory' | 'special_purpose';
  properties?: CatalogItemProperties;
  safetyNotes?: string[];
  purpose?: string;
  ageSpecificGuidanceRequired?: boolean;
}

export interface CatalogCategory {
  id: string;
  label: {
    en: string;
    he: string;
  };
  items: CatalogItem[];
}

export interface ClothingCatalogData {
  catalogVersion: number;
  propertyScales: {
    insulation: string[];
    breathability: string[];
    waterProtection: string[];
    windProtection: string[];
    sunProtection: string[];
    coverage: string[];
  };
  categories: CatalogCategory[];
  nonClothingProducts: CatalogItem[];
}
