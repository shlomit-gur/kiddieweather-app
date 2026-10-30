import React, { useState } from 'react';
import { getClothingImageUrl } from '../utils/clothingImages';
import { ClothingItemVisual } from './icons/ClothingIcons';

export interface ClothingImageOrIconProps {
  id?: string;
  name?: string;
  category?: string;
  iconName?: string;
  isBaby?: boolean;
  className?: string; // container styling
  iconClassName?: string;
  alt?: string;
}

export const ClothingImageOrIcon: React.FC<ClothingImageOrIconProps> = ({
  id,
  name = '',
  category,
  iconName,
  isBaby = false,
  className = 'w-10 h-10 bg-white border border-slate-200/90 shadow-2xs',
  iconClassName = 'w-5 h-5',
  alt,
}) => {
  const [hasError, setHasError] = useState(false);

  // Try finding the image URL from uploaded PNG catalog assets
  const imageUrl = !hasError
    ? getClothingImageUrl(id, undefined, iconName) || getClothingImageUrl(name, undefined, iconName)
    : undefined;

  if (imageUrl) {
    return (
      <div
        className={`relative flex items-center justify-center overflow-hidden shrink-0 rounded-xl transition-all ${className}`}
      >
        <img
          src={imageUrl}
          alt={alt || name || id || 'Clothing item'}
          className="w-full h-full object-contain p-1 rounded-lg transition-transform hover:scale-105 select-none"
          loading="lazy"
          onError={() => setHasError(true)}
        />
      </div>
    );
  }

  // Fallback to crisp self-explanatory SVG icon
  return (
    <div
      className={`relative flex items-center justify-center shrink-0 rounded-xl transition-all ${className}`}
    >
      <ClothingItemVisual
        name={name || id || ''}
        category={category}
        iconName={iconName}
        isBaby={isBaby}
        className={iconClassName}
      />
    </div>
  );
};
