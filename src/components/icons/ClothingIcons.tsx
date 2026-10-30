import React from 'react';

export interface ClothingIconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  size?: number;
}

/**
 * 1. Short-sleeve shirt (T-Shirt)
 * Self-explanatory short sleeves ending midway down the biceps, crew neck, straight torso.
 */
export const TShirtIcon: React.FC<ClothingIconProps> = ({ className = 'w-5 h-5', size, ...props }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    {/* T-Shirt Body & Short Sleeves */}
    <path
      d="M9 3.5C9.6 5 14.4 5 15 3.5L20.5 6L18.8 10.5L16.5 9.5V20.5H7.5V9.5L5.2 10.5L3.5 6L9 3.5Z"
      fill="currentColor"
      fillOpacity="0.12"
    />
    {/* Crew neckline arc */}
    <path d="M9 3.5C9.6 5.2 14.4 5.2 15 3.5" />
    {/* Sleeve separation seams */}
    <path d="M6 7.5L7.5 9.5" strokeOpacity="0.6" />
    <path d="M18 7.5L16.5 9.5" strokeOpacity="0.6" />
  </svg>
);

/**
 * 2. Long-sleeve thin shirt (Long-sleeve T-shirt)
 * Self-explanatory sleeves that extend all the way down to the wrists, with visible cuffs.
 */
export const LongSleeveShirtIcon: React.FC<ClothingIconProps> = ({ className = 'w-5 h-5', size, ...props }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    {/* Long-sleeve outline with sleeves reaching wrist level */}
    <path
      d="M9 3.5C9.6 5 14.4 5 15 3.5L19.5 5.5L21.5 17.5L18.5 18L16.5 9V20.5H7.5V9L5.5 18L2.5 17.5L4.5 5.5L9 3.5Z"
      fill="currentColor"
      fillOpacity="0.12"
    />
    {/* Crew neckline arc */}
    <path d="M9 3.5C9.6 5.2 14.4 5.2 15 3.5" />
    {/* Wrist cuffs */}
    <path d="M2.5 15.5L5 16" strokeOpacity="0.7" />
    <path d="M21.5 15.5L19 16" strokeOpacity="0.7" />
  </svg>
);

/**
 * 3. Sweatshirt / Hoodie / Sweater / Fleece
 * Heavier pullover with ribbed collar, ribbed cuffs, and ribbed waistband.
 */
export const SweatshirtIcon: React.FC<ClothingIconProps> = ({ className = 'w-5 h-5', size, ...props }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    {/* Sweatshirt body */}
    <path
      d="M8.5 4C9.5 5.8 14.5 5.8 15.5 4L20 6.5L21.5 17L18.5 17.5L16.5 9.5V19H7.5V9.5L5.5 17.5L2.5 17L4 6.5L8.5 4Z"
      fill="currentColor"
      fillOpacity="0.14"
    />
    {/* Ribbed neckband with athletic V-notch */}
    <path d="M8.5 4C9.5 5.8 14.5 5.8 15.5 4" />
    <path d="M10.8 5.8L12 7.5L13.2 5.8" strokeOpacity="0.8" />
    {/* Ribbed bottom waistband */}
    <path d="M7.5 19H16.5V21H7.5Z" fill="currentColor" fillOpacity="0.2" />
    {/* Ribbed cuffs */}
    <path d="M2.8 15.2L5.4 15.6" strokeOpacity="0.7" />
    <path d="M21.2 15.2L18.6 15.6" strokeOpacity="0.7" />
  </svg>
);

/**
 * 4. Shorts
 * Cut off clearly above knees, showing waistband, two separate wide leg openings.
 */
export const ShortsIcon: React.FC<ClothingIconProps> = ({ className = 'w-5 h-5', size, ...props }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    {/* Shorts outline ending at mid-height (above knees) */}
    <path
      d="M5 5.5H19L19.8 14.5H14L12 9.5L10 14.5H4.2L5 5.5Z"
      fill="currentColor"
      fillOpacity="0.14"
    />
    {/* Waistband stitch line */}
    <path d="M4.8 8.5H19.2" strokeOpacity="0.7" />
    {/* Center drawstring knot */}
    <circle cx="12" cy="7" r="1" fill="currentColor" />
    <path d="M11 7.8L9.8 10" strokeWidth="1.5" />
    <path d="M13 7.8L14.2 10" strokeWidth="1.5" />
  </svg>
);

/**
 * 5. Long Pants / Trousers / Joggers
 * Full-length trousers reaching all the way to ankles with waistband, fly stitch, and cuffs.
 */
export const LongPantsIcon: React.FC<ClothingIconProps> = ({ className = 'w-5 h-5', size, ...props }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    {/* Full length pants going from waist at top to ankles at bottom */}
    <path
      d="M5 4.5H19L18.2 20.5H13.8L12 11.5L10.2 20.5H5.8L5 4.5Z"
      fill="currentColor"
      fillOpacity="0.14"
    />
    {/* Waistband */}
    <path d="M4.9 7.5H19.1" strokeOpacity="0.7" />
    {/* Fly stitch */}
    <path d="M12 7.5V11" strokeOpacity="0.6" strokeDasharray="1.5 1.5" />
    {/* Ankle cuffs */}
    <path d="M5.9 18.5H10.1" strokeOpacity="0.7" />
    <path d="M13.9 18.5H18.1" strokeOpacity="0.7" />
  </svg>
);

/**
 * 6. Socks
 * Classic L-shaped sock with ribbed ankle cuff, rounded heel, and toe cap.
 */
export const SocksIcon: React.FC<ClothingIconProps> = ({ className = 'w-5 h-5', size, ...props }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    {/* Sock outline */}
    <path
      d="M8 3.5H14V11.5C14 13.5 15.5 14.5 18 14.5C19.8 14.5 21 15.8 21 17.5C21 19.5 19.5 20.5 17 20.5C11 20.5 7.5 17.5 7.5 12V3.5H8Z"
      fill="currentColor"
      fillOpacity="0.14"
    />
    {/* Ribbed top cuff */}
    <path d="M7.8 6H13.8" strokeOpacity="0.7" />
    <path d="M7.8 8H13.8" strokeOpacity="0.7" />
    {/* Heel reinforcement arc */}
    <path d="M7.5 13C9 14.5 9 17 7.8 19" strokeOpacity="0.6" />
    {/* Toe seam */}
    <path d="M18 15V20" strokeOpacity="0.6" />
  </svg>
);

/**
 * 7. Shoes / Sneakers
 * Side profile of athletic trainer with sole, laces, tongue, and padded collar.
 */
export const ShoesIcon: React.FC<ClothingIconProps> = ({ className = 'w-5 h-5', size, ...props }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    {/* Sneaker body */}
    <path
      d="M2.5 16.5C2.5 14 4.5 12.5 7 12.5L9.5 12.5L12.5 9H15.5L17.5 12.5C19.5 13 21.5 14.5 21.5 16.5V19.5H2.5V16.5Z"
      fill="currentColor"
      fillOpacity="0.14"
    />
    {/* Flat rubber sole with traction */}
    <path d="M2.5 17.5H21.5V20H2.5V17.5Z" fill="currentColor" fillOpacity="0.25" />
    {/* Shoe laces */}
    <path d="M12 11.5L14 13.5" strokeWidth="1.6" />
    <path d="M13.5 10L15.5 12" strokeWidth="1.6" />
    {/* Ankle collar curve */}
    <path d="M6.5 12.5C6.5 10.5 8 9.5 9.5 9.5" />
  </svg>
);

/**
 * 8. Boots / Rain Boots / Winter Boots
 * Tall boot shaft with heel block, deep tread, and pull collar.
 */
export const BootsIcon: React.FC<ClothingIconProps> = ({ className = 'w-5 h-5', size, ...props }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    {/* Boot outline */}
    <path
      d="M7 3.5H14.5V13.5L17 14.5C19.5 15.5 21.5 16.5 21.5 18.5V20.5H16V19H12V20.5H3V17.5C3 15.5 5 14 7 13.5V3.5Z"
      fill="currentColor"
      fillOpacity="0.15"
    />
    {/* Boot top collar rim */}
    <path d="M6.5 5.5H15" strokeOpacity="0.7" />
    {/* Back pull loop */}
    <path d="M6.5 3.5C5.5 3.5 5 2.5 5 1.5C5.8 1.5 6.5 2.5 6.5 3.5" strokeWidth="1.5" />
    {/* Tread sole line */}
    <path d="M3 18.5H21.5" strokeOpacity="0.7" />
  </svg>
);

/**
 * 9. Sandals
 * Open summer footwear with contoured footbed, open toes, and secure straps.
 */
export const SandalsIcon: React.FC<ClothingIconProps> = ({ className = 'w-5 h-5', size, ...props }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    {/* Contoured footbed / sole */}
    <path
      d="M2.5 17.5C4 16.5 8 16.5 12 17C17 17.5 20.5 16.5 21.5 15.5C21.5 18.5 19 20 12 20C5 20 2.5 18.5 2.5 17.5Z"
      fill="currentColor"
      fillOpacity="0.22"
    />
    {/* Ankle back strap */}
    <path d="M5 17C5 12.5 7.5 9.5 10 9.5" />
    {/* Front instep strap */}
    <path d="M9 17L13 10L15.5 13" />
    {/* Front toe strap */}
    <path d="M16 17C16.5 14 18 13 20 16" />
    {/* Side buckle dot */}
    <circle cx="10" cy="11.5" r="1.2" fill="currentColor" />
  </svg>
);

/**
 * 10. Wide-brimmed Sun Hat
 * Rounded dome crown with a wide, sweeping, floppy protective brim.
 */
export const WideBrimSunHatIcon: React.FC<ClothingIconProps> = ({ className = 'w-5 h-5', size, ...props }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    {/* Crown dome in center */}
    <path
      d="M7.5 14C7.5 7.5 16.5 7.5 16.5 14"
      fill="currentColor"
      fillOpacity="0.18"
    />
    {/* Ribbon band around crown */}
    <path d="M7.5 13.5H16.5" strokeWidth="2.2" strokeOpacity="0.8" />
    {/* Wide circular floppy brim */}
    <path
      d="M1.5 15.5C4.5 13.5 8 13.5 12 13.5C16 13.5 19.5 13.5 22.5 15.5C20.5 18 16 19 12 19C8 19 3.5 18 1.5 15.5Z"
      fill="currentColor"
      fillOpacity="0.15"
    />
    {/* Subtle chin tie string dangling */}
    <path d="M9.5 14.5C9.5 18 11.5 20 12 21.5" strokeWidth="1.2" strokeDasharray="2 1.5" strokeOpacity="0.7" />
  </svg>
);

/**
 * 11. Warm Knit Beanie Hat
 * Snug knit winter dome with folded cuff and playful pom-pom on top.
 */
export const BeanieHatIcon: React.FC<ClothingIconProps> = ({ className = 'w-5 h-5', size, ...props }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    {/* Pom-pom on top */}
    <circle cx="12" cy="4" r="2" fill="currentColor" fillOpacity="0.35" />
    {/* Beanie dome */}
    <path
      d="M5 15C5 8.5 19 8.5 19 15H5Z"
      fill="currentColor"
      fillOpacity="0.14"
    />
    {/* Folded ribbed cuff */}
    <rect x="4.5" y="15" width="15" height="4.5" rx="1.5" fill="currentColor" fillOpacity="0.22" />
    {/* Cuff ribbing */}
    <path d="M8 15V19.5" strokeOpacity="0.5" />
    <path d="M12 15V19.5" strokeOpacity="0.5" />
    <path d="M16 15V19.5" strokeOpacity="0.5" />
  </svg>
);

/**
 * 12. Sunscreen (Sun protection lotion bottle)
 * Squeeze bottle or dispenser with prominent sun icon on label.
 */
export const SunscreenIcon: React.FC<ClothingIconProps> = ({ className = 'w-5 h-5', size, ...props }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    {/* Sunscreen bottle tube */}
    <path
      d="M7 7C7 4.5 17 4.5 17 7L16 19H8L7 7Z"
      fill="currentColor"
      fillOpacity="0.14"
    />
    {/* Flip top cap at bottom */}
    <path d="M9 19H15V22H9V19Z" fill="currentColor" fillOpacity="0.25" />
    {/* Sun emblem on front label */}
    <circle cx="12" cy="11.5" r="2.2" fill="currentColor" fillOpacity="0.8" />
    {/* Sun rays */}
    <path d="M12 7.8V8.8" strokeWidth="1.5" />
    <path d="M12 14.2V15.2" strokeWidth="1.5" />
    <path d="M8.8 11.5H9.8" strokeWidth="1.5" />
    <path d="M14.2 11.5H15.2" strokeWidth="1.5" />
    <path d="M9.7 9.2L10.4 9.9" strokeWidth="1.5" />
    <path d="M13.6 13.1L14.3 13.8" strokeWidth="1.5" />
    <path d="M9.7 13.8L10.4 13.1" strokeWidth="1.5" />
    <path d="M13.6 9.9L14.3 9.2" strokeWidth="1.5" />
    {/* SPF badge line */}
    <path d="M10 16.5H14" strokeWidth="1.4" strokeOpacity="0.7" />
  </svg>
);

/**
 * 13. Mosquito / Anti-Mosquito Protection
 * Self-explanatory side-profile mosquito icon with needle proboscis, antennae, raised wings, slender segmented abdomen, and long jointed legs.
 */
export const MosquitoIcon: React.FC<ClothingIconProps> = ({ className = 'w-5 h-5', size, ...props }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    {/* Proboscis (long sharp feeding needle pointing down and forward) */}
    <path d="M6 11L1.8 17" strokeWidth="1.7" />

    {/* Antennae curving upward and forward from head */}
    <path d="M6.5 9C6 7 4.8 5.5 3.5 4.5" strokeWidth="1.1" strokeOpacity="0.85" />
    <path d="M7 8.5C7.2 6.5 6.2 5 5 4.2" strokeWidth="0.9" strokeOpacity="0.6" />

    {/* Head & eye */}
    <circle cx="7" cy="10" r="1.3" fill="currentColor" strokeWidth="1.2" />

    {/* Hunchbacked Thorax */}
    <path
      d="M8.2 10.2C8.6 8 10.2 7.2 12.6 7.8C13.6 8.1 14.1 9.1 13.5 10.8C12.8 11.9 9.8 11.8 8.2 10.2Z"
      fill="currentColor"
      fillOpacity="0.25"
      strokeWidth="1.4"
    />

    {/* Slender segmented abdomen extending backward */}
    <path
      d="M13.2 9.2C15.5 8.6 18.5 8.3 21.5 7.8C22.1 7.7 22.5 8.2 22.1 8.8C20.6 10.7 16.8 11.6 13.2 10.6Z"
      fill="currentColor"
      fillOpacity="0.22"
      strokeWidth="1.3"
    />
    {/* Abdomen segments */}
    <path d="M15.8 8.9L15.3 11" strokeWidth="1" strokeOpacity="0.6" />
    <path d="M18.2 8.6L17.7 10.5" strokeWidth="1" strokeOpacity="0.6" />
    <path d="M20.2 8.3L19.8 9.8" strokeWidth="1" strokeOpacity="0.6" />

    {/* Raised wings in profile pointing back and up */}
    <path
      d="M11 7.6C13 4 16.8 2.8 20 3.5C20.5 3.6 20.6 4.3 20 4.8C17.6 6.8 14.2 7.8 11.8 8.2Z"
      fill="currentColor"
      fillOpacity="0.2"
      strokeWidth="1.3"
    />
    <path d="M11.5 7.4L18.8 4.3" strokeWidth="0.9" strokeOpacity="0.5" />
    {/* Secondary wing behind */}
    <path
      d="M12.2 7C14 3.8 17.2 2.6 19.5 3.2C17.5 5 14.8 6.2 13 7"
      fill="currentColor"
      fillOpacity="0.1"
      strokeWidth="1"
      strokeOpacity="0.6"
    />

    {/* Long jointed legs in profile */}
    {/* Forelegs */}
    <path d="M8.2 11.2L6.8 14.2L5 19.5" strokeWidth="1.1" strokeOpacity="0.5" />
    <path d="M8.8 11L6.2 14.8L3.5 21" strokeWidth="1.4" />

    {/* Mid leg (downwards joint) */}
    <path d="M11 11.5L10 16L9.2 21.5" strokeWidth="1.4" />

    {/* Hind leg (high arched knee above back, trailing behind) */}
    <path d="M12.8 10.5L15.2 6L17.8 5L18.8 12.5L20.8 21.5" strokeWidth="1.4" />
  </svg>
);

export const AntiMosquitoIcon = MosquitoIcon;

/**
 * 14. Jacket / Coat / Raincoat
 * Zipper down the middle with zipper slider, collar, and side pockets.
 */
export const JacketIcon: React.FC<ClothingIconProps> = ({ className = 'w-5 h-5', size, ...props }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    {/* Outer jacket silhouette */}
    <path
      d="M8.5 4L4 6.5L2 17.5L5.5 18L7.5 10V20.5H16.5V10L18.5 18L22 17.5L20 6.5L15.5 4"
      fill="currentColor"
      fillOpacity="0.14"
    />
    {/* High collar */}
    <path d="M8.5 4H15.5V6.5H8.5V4Z" fill="currentColor" fillOpacity="0.2" />
    {/* Full-length front zipper */}
    <path d="M12 6.5V20.5" strokeWidth="2" />
    {/* Zipper pull tab */}
    <circle cx="12" cy="10.5" r="1.3" fill="currentColor" />
    {/* Slanted side zip pockets */}
    <path d="M9 14.5L10.5 17" strokeOpacity="0.7" />
    <path d="M15 14.5L13.5 17" strokeOpacity="0.7" />
  </svg>
);

/**
 * 15. Baby Bodysuit / Onesie / Romper
 * Diaper snap crotch, envelope neck, short or long baby cut.
 */
export const BabyBodysuitIcon: React.FC<ClothingIconProps> = ({ className = 'w-5 h-5', size, ...props }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    {/* Bodysuit envelope neck and curved diaper leg holes */}
    <path
      d="M9 3.5C10 5 14 5 15 3.5L19.5 5.5L18 9.5L16 8.5V14.5C16 18.5 14 20.5 12 20.5C10 20.5 8 18.5 8 14.5V8.5L6 9.5L4.5 5.5L9 3.5Z"
      fill="currentColor"
      fillOpacity="0.16"
    />
    {/* Diaper bottom snap dots */}
    <circle cx="10.5" cy="18.5" r="0.9" fill="currentColor" />
    <circle cx="13.5" cy="18.5" r="0.9" fill="currentColor" />
    {/* Envelope lap shoulder folds */}
    <path d="M8 4L11 6" strokeOpacity="0.7" />
    <path d="M16 4L13 6" strokeOpacity="0.7" />
  </svg>
);

/**
 * 16. Mittens / Winter Gloves
 * Palm with distinct thumb pointing outwards and ribbed wrist cuff.
 */
export const MittensIcon: React.FC<ClothingIconProps> = ({ className = 'w-5 h-5', size, ...props }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    {/* Mitten body and thumb */}
    <path
      d="M7 16V10C7 6.5 10 4 13.5 4C17 4 18 6.5 18 10V16C18 17 17 18 15 18H10C8 18 7 17 7 16Z"
      fill="currentColor"
      fillOpacity="0.14"
    />
    {/* Thumb projecting to left */}
    <path
      d="M7 13C5.5 13 4 11.5 4 9.5C4 8.5 5 8 6 9L7 10"
      fill="currentColor"
      fillOpacity="0.14"
    />
    {/* Ribbed wrist cuff */}
    <rect x="6.5" y="18" width="12" height="3" rx="1" fill="currentColor" fillOpacity="0.22" />
    <path d="M9.5 18V21" strokeOpacity="0.5" />
    <path d="M12.5 18V21" strokeOpacity="0.5" />
    <path d="M15.5 18V21" strokeOpacity="0.5" />
  </svg>
);

/**
 * 17. Umbrella / Rain Gear
 * Open rain umbrella canopy and J-hook handle.
 */
export const RainGearIcon: React.FC<ClothingIconProps> = ({ className = 'w-5 h-5', size, ...props }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    {/* Top ferrule tip */}
    <path d="M12 2V4" strokeWidth="2" />
    {/* Umbrella dome canopy with scalloped bottom edge */}
    <path
      d="M12 4C5.5 4 3 10 3 13.5C5 12.5 7 12.5 9 13.5C11 12.5 13 12.5 15 13.5C17 12.5 19 12.5 21 13.5C21 10 18.5 4 12 4Z"
      fill="currentColor"
      fillOpacity="0.15"
    />
    {/* Canopy rib lines */}
    <path d="M9 13.5C9.5 9 10.5 4.5 12 4" strokeOpacity="0.6" />
    <path d="M15 13.5C14.5 9 13.5 4.5 12 4" strokeOpacity="0.6" />
    {/* Shaft and J-hook handle */}
    <path d="M12 13.5V19C12 20.5 10.5 21.5 9 21.5C7.5 21.5 6.5 20.5 6.5 19.5" />
  </svg>
);

/**
 * 18. Stroller Blanket / Cozy Throw
 * Folded blanket with layered folds and decorative stitching.
 */
export const BlanketIcon: React.FC<ClothingIconProps> = ({ className = 'w-5 h-5', size, ...props }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    {/* Main folded blanket */}
    <rect x="4" y="6" width="16" height="12" rx="2.5" fill="currentColor" fillOpacity="0.14" />
    {/* Layer fold line */}
    <path d="M4 11H20" strokeOpacity="0.7" />
    <path d="M4 14H20" strokeOpacity="0.5" strokeDasharray="2 2" />
    {/* Corner fold turnover */}
    <path d="M16 6L20 10H16V6Z" fill="currentColor" fillOpacity="0.25" />
  </svg>
);

/**
 * Smart Item Icon Resolver:
 * Evaluates item name, category, and context to pick the exact self-explanatory icon.
 */
export interface ClothingItemVisualProps {
  name: string;
  category?: string;
  iconName?: string;
  isBaby?: boolean;
  className?: string;
}

export const ClothingItemVisual: React.FC<ClothingItemVisualProps> = ({
  name,
  category,
  iconName,
  isBaby = false,
  className = 'w-5 h-5',
}) => {
  const lower = (name + ' ' + (iconName || '')).toLowerCase();

  // 1. Anti-Mosquito Repellent / Bug Spray
  if (
    lower.includes('mosquito') ||
    lower.includes('repellent') ||
    lower.includes('bug spray') ||
    lower.includes('insect')
  ) {
    return (
      <span className="text-amber-600 inline-flex items-center justify-center">
        <AntiMosquitoIcon className={className} />
      </span>
    );
  }

  // 2. Sunscreen
  if (
    lower.includes('sunscreen') ||
    lower.includes('sun screen') ||
    lower.includes('spf') ||
    lower.includes('sun lotion') ||
    lower.includes('sun cream')
  ) {
    return (
      <span className="text-amber-500 inline-flex items-center justify-center">
        <SunscreenIcon className={className} />
      </span>
    );
  }

  // 3. Wide-brimmed sun hat / bucket hat / sun cap
  if (
    lower.includes('wide-brim') ||
    lower.includes('sun hat') ||
    lower.includes('sunhat') ||
    lower.includes('bucket') ||
    lower.includes('sun cap')
  ) {
    return (
      <span className="text-amber-600 inline-flex items-center justify-center">
        <WideBrimSunHatIcon className={className} />
      </span>
    );
  }

  // 4. Beanie / Winter knit hat / Bonnet / Bobble hat
  if (
    lower.includes('beanie') ||
    lower.includes('knit hat') ||
    lower.includes('bobble') ||
    lower.includes('bonnet') ||
    (lower.includes('hat') && (lower.includes('winter') || lower.includes('warm') || lower.includes('fleece')))
  ) {
    return (
      <span className="text-sky-600 inline-flex items-center justify-center">
        <BeanieHatIcon className={className} />
      </span>
    );
  }

  // 5. Sandals
  if (lower.includes('sandal')) {
    return (
      <span className="text-teal-600 inline-flex items-center justify-center">
        <SandalsIcon className={className} />
      </span>
    );
  }

  // 6. Boots / Wellies / Booties / Snow boots
  if (
    lower.includes('boot') ||
    lower.includes('wellie') ||
    lower.includes('snowboot') ||
    lower.includes('bootie')
  ) {
    return (
      <span className="text-indigo-600 inline-flex items-center justify-center">
        <BootsIcon className={className} />
      </span>
    );
  }

  // 7. Shoes / Sneakers / Trainers / Moccasins / Canvas
  if (
    lower.includes('shoe') ||
    lower.includes('sneaker') ||
    lower.includes('trainer') ||
    lower.includes('moccasin') ||
    lower.includes('canvas')
  ) {
    return (
      <span className="text-emerald-600 inline-flex items-center justify-center">
        <ShoesIcon className={className} />
      </span>
    );
  }

  // 8. Socks
  if (lower.includes('sock')) {
    return (
      <span className="text-blue-500 inline-flex items-center justify-center">
        <SocksIcon className={className} />
      </span>
    );
  }

  // 9. Shorts
  if (
    lower.includes('short') &&
    !lower.includes('short-sleeve') &&
    !lower.includes('short sleeve')
  ) {
    return (
      <span className="text-cyan-600 inline-flex items-center justify-center">
        <ShortsIcon className={className} />
      </span>
    );
  }

  // 10. Long Pants / Trousers / Joggers / Leggings / Chinos / Jeans
  if (
    lower.includes('pant') ||
    lower.includes('trouser') ||
    lower.includes('jogger') ||
    lower.includes('legging') ||
    lower.includes('chino') ||
    lower.includes('jean') ||
    lower.includes('bloomer') ||
    lower.includes('bib')
  ) {
    return (
      <span className="text-indigo-700 inline-flex items-center justify-center">
        <LongPantsIcon className={className} />
      </span>
    );
  }

  // 11. Baby Bodysuit / Onesie / Romper / Sleepsuit
  if (
    lower.includes('bodysuit') ||
    lower.includes('onesie') ||
    lower.includes('romper') ||
    lower.includes('sleepsuit') ||
    lower.includes('pramsuit') ||
    (isBaby && category === 'base')
  ) {
    return (
      <span className="text-pink-600 inline-flex items-center justify-center">
        <BabyBodysuitIcon className={className} />
      </span>
    );
  }

  // 12. Long-sleeve thin shirt / long-sleeve t-shirt / long-sleeve top / undershirt
  if (
    (lower.includes('long-sleeve') || lower.includes('long sleeve')) &&
    (lower.includes('shirt') || lower.includes('tee') || lower.includes('t-shirt') || lower.includes('undershirt') || lower.includes('thermal') || lower.includes('top')) &&
    !lower.includes('sweater') &&
    !lower.includes('hoodie') &&
    !lower.includes('cardigan')
  ) {
    return (
      <span className="text-sky-700 inline-flex items-center justify-center">
        <LongSleeveShirtIcon className={className} />
      </span>
    );
  }

  // 13. Short-sleeve shirt / T-shirt / Tee / Tank top / Singlet
  if (
    lower.includes('t-shirt') ||
    lower.includes('tee') ||
    lower.includes('tank top') ||
    lower.includes('singlet') ||
    lower.includes('short-sleeve') ||
    lower.includes('short sleeve') ||
    (category === 'base' && !lower.includes('long'))
  ) {
    return (
      <span className="text-sky-600 inline-flex items-center justify-center">
        <TShirtIcon className={className} />
      </span>
    );
  }

  // 14. Sweatshirt / Hoodie / Sweater / Cardigan / Pullover / Fleece
  if (
    lower.includes('sweatshirt') ||
    lower.includes('sweater') ||
    lower.includes('hoodie') ||
    lower.includes('cardigan') ||
    lower.includes('fleece') ||
    lower.includes('pullover') ||
    category === 'mid'
  ) {
    return (
      <span className="text-violet-600 inline-flex items-center justify-center">
        <SweatshirtIcon className={className} />
      </span>
    );
  }

  // 15. Jackets / Coats / Puffer / Outerwear / Windbreaker
  if (
    lower.includes('jacket') ||
    lower.includes('coat') ||
    lower.includes('puffer') ||
    lower.includes('windbreaker') ||
    lower.includes('snowsuit') ||
    category === 'outer'
  ) {
    return (
      <span className="text-indigo-600 inline-flex items-center justify-center">
        <JacketIcon className={className} />
      </span>
    );
  }

  // 16. Mittens / Gloves
  if (lower.includes('mitten') || lower.includes('glove')) {
    return (
      <span className="text-rose-600 inline-flex items-center justify-center">
        <MittensIcon className={className} />
      </span>
    );
  }

  // 17. Rain gear / Poncho / Umbrella
  if (lower.includes('rain') || lower.includes('umbrella') || lower.includes('poncho') || lower.includes('puddle')) {
    return (
      <span className="text-cyan-600 inline-flex items-center justify-center">
        <RainGearIcon className={className} />
      </span>
    );
  }

  // 18. Blanket / Throw
  if (lower.includes('blanket') || lower.includes('footmuff') || lower.includes('cocoon')) {
    return (
      <span className="text-amber-700 inline-flex items-center justify-center">
        <BlanketIcon className={className} />
      </span>
    );
  }

  // Default fallback based on category
  if (category === 'base') {
    return (
      <span className="text-sky-600 inline-flex items-center justify-center">
        <TShirtIcon className={className} />
      </span>
    );
  }
  if (category === 'mid') {
    return (
      <span className="text-violet-600 inline-flex items-center justify-center">
        <SweatshirtIcon className={className} />
      </span>
    );
  }
  if (category === 'outer') {
    return (
      <span className="text-indigo-600 inline-flex items-center justify-center">
        <JacketIcon className={className} />
      </span>
    );
  }
  if (category === 'extremities') {
    return (
      <span className="text-emerald-600 inline-flex items-center justify-center">
        <ShoesIcon className={className} />
      </span>
    );
  }

  // General clothing fallback
  return (
    <span className="text-sky-600 inline-flex items-center justify-center">
      <TShirtIcon className={className} />
    </span>
  );
};
