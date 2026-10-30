export interface CurrentWeather {
  temperature: number;
  apparentTemperature: number;
  relativeHumidity: number;
  precipitation: number;
  weatherCode: number;
  windSpeed: number;
  isDay: number;
  uvIndex: number;
  time: string;
}

export interface HourlyWeatherPoint {
  time: string;
  hourLabel: string;
  temperature: number;
  apparentTemperature: number;
  precipitationProbability: number;
  weatherCode: number;
  uvIndex: number;
  windSpeed: number;
  precipitation?: number;
  cloudCover?: number;
  visibility?: number;
  windGusts?: number;
  isDay?: number;
}

export interface DailyForecast {
  date: string;
  dayLabel: string;
  weatherCode: number;
  tempMax: number;
  tempMin: number;
  precipitationProbabilityMax: number;
  uvIndexMax: number;
  windSpeedMax?: number;
  windGustsMax?: number;
}

export interface WeatherData {
  current: CurrentWeather;
  hourly: HourlyWeatherPoint[];
  daily: DailyForecast[];
  locationName: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

export interface LocationSearchResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  admin1?: string;
}
