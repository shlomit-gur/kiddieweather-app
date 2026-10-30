export interface WeatherConditionInfo {
  code: number;
  label: string;
  iconName: 'Sun' | 'CloudSun' | 'Cloud' | 'CloudFog' | 'CloudDrizzle' | 'CloudRain' | 'CloudSnow' | 'CloudLightning';
  isPrecipitation: boolean;
  colorClass: string;
  bgGradient: string;
}

export function getWeatherConditionInfo(code: number, isDay = 1): WeatherConditionInfo {
  switch (code) {
    case 0:
      return {
        code,
        label: isDay ? 'Clear & Sunny' : 'Clear Night',
        iconName: 'Sun',
        isPrecipitation: false,
        colorClass: 'text-amber-500',
        bgGradient: 'from-amber-500/20 to-sky-500/10',
      };
    case 1:
    case 2:
      return {
        code,
        label: 'Partly Cloudy',
        iconName: 'CloudSun',
        isPrecipitation: false,
        colorClass: 'text-sky-500',
        bgGradient: 'from-sky-500/20 to-indigo-500/10',
      };
    case 3:
      return {
        code,
        label: 'Overcast',
        iconName: 'Cloud',
        isPrecipitation: false,
        colorClass: 'text-slate-500',
        bgGradient: 'from-slate-500/20 to-zinc-500/10',
      };
    case 45:
    case 48:
      return {
        code,
        label: 'Misty / Foggy',
        iconName: 'CloudFog',
        isPrecipitation: false,
        colorClass: 'text-slate-400',
        bgGradient: 'from-slate-400/20 to-sky-300/10',
      };
    case 51:
    case 53:
    case 55:
      return {
        code,
        label: 'Light Drizzle',
        iconName: 'CloudDrizzle',
        isPrecipitation: true,
        colorClass: 'text-teal-500',
        bgGradient: 'from-teal-500/20 to-cyan-500/10',
      };
    case 61:
    case 63:
    case 65:
    case 80:
    case 81:
    case 82:
      return {
        code,
        label: code >= 80 ? 'Passing Showers' : 'Rainy',
        iconName: 'CloudRain',
        isPrecipitation: true,
        colorClass: 'text-blue-500',
        bgGradient: 'from-blue-500/25 to-sky-400/10',
      };
    case 71:
    case 73:
    case 75:
    case 77:
    case 85:
    case 86:
      return {
        code,
        label: 'Snow / Flurries',
        iconName: 'CloudSnow',
        isPrecipitation: true,
        colorClass: 'text-indigo-400',
        bgGradient: 'from-indigo-400/25 to-blue-200/15',
      };
    case 95:
    case 96:
    case 99:
      return {
        code,
        label: 'Thunderstorm',
        iconName: 'CloudLightning',
        isPrecipitation: true,
        colorClass: 'text-purple-600',
        bgGradient: 'from-purple-600/25 to-amber-500/10',
      };
    default:
      return {
        code,
        label: 'Fair Conditions',
        iconName: 'Sun',
        isPrecipitation: false,
        colorClass: 'text-sky-500',
        bgGradient: 'from-sky-500/20 to-blue-500/10',
      };
  }
}
