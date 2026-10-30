import { WeatherData, CurrentWeather, HourlyWeatherPoint, DailyForecast, LocationSearchResult } from '../types/weather';

const OPEN_METEO_BASE = 'https://api.open-meteo.com/v1/forecast';
const GEOCODING_BASE = 'https://geocoding-api.open-meteo.com/v1/search';

export async function fetchWeather(lat: number, lon: number, locationName?: string): Promise<WeatherData> {
  const url = `${OPEN_METEO_BASE}?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,is_day,uv_index&hourly=temperature_2m,apparent_temperature,precipitation_probability,precipitation,weather_code,cloud_cover,visibility,wind_speed_10m,wind_gusts_10m,uv_index,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max,wind_speed_10m_max,wind_gusts_10m_max&timezone=auto&past_days=1&forecast_days=7`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Weather fetch failed: ${res.statusText}`);
    }
    const data = await res.json();

    const current: CurrentWeather = {
      temperature: Math.round(data.current.temperature_2m),
      apparentTemperature: Math.round(data.current.apparent_temperature),
      relativeHumidity: Math.round(data.current.relative_humidity_2m),
      precipitation: data.current.precipitation || 0,
      weatherCode: data.current.weather_code,
      windSpeed: Math.round(data.current.wind_speed_10m),
      isDay: data.current.is_day ?? 1,
      uvIndex: Math.round(data.current.uv_index ?? 0),
      time: data.current.time,
    };

    // Today's date string in local or API timezone
    const now = new Date();
    const localDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const todayLocal = (data.current?.time ? data.current.time.slice(0, 10) : '') || localDateStr;

    // Find where today begins in hourly forecast (at 00:00)
    let hourlyStartIndex = data.hourly.time.findIndex((t: string) => t.startsWith(todayLocal));
    if (hourlyStartIndex < 0) {
      hourlyStartIndex = 0;
    }

    const currentHour = new Date(now);
    currentHour.setMinutes(0, 0, 0);

    const currentHourIndex = data.hourly.time.findIndex(
      (t: string) => new Date(t).getTime() >= currentHour.getTime()
    );

    // Parse all hourly forecast points starting from today's 00:00 midnight
    const hourly: HourlyWeatherPoint[] = [];
    for (let i = hourlyStartIndex; i < data.hourly.time.length; i++) {
      const timeStr = data.hourly.time[i];
      const d = new Date(timeStr);
      const hourNum = d.getHours();
      const ampm = hourNum >= 12 ? 'PM' : 'AM';
      const displayHour = hourNum % 12 === 0 ? 12 : hourNum % 12;

      hourly.push({
        time: timeStr,
        hourLabel: i === currentHourIndex ? 'Now' : `${displayHour} ${ampm}`,
        temperature: Math.round(data.hourly.temperature_2m[i]),
        apparentTemperature: Math.round(data.hourly.apparent_temperature[i]),
        precipitationProbability: Math.round(data.hourly.precipitation_probability?.[i] || 0),
        precipitation: Number((data.hourly.precipitation?.[i] || 0).toFixed(1)),
        weatherCode: data.hourly.weather_code[i],
        cloudCover: Math.round(data.hourly.cloud_cover?.[i] || 0),
        visibility: Math.round(data.hourly.visibility?.[i] || 30000),
        uvIndex: Math.round(data.hourly.uv_index?.[i] || 0),
        windSpeed: Math.round(data.hourly.wind_speed_10m[i] || 0),
        windGusts: Math.round(data.hourly.wind_gusts_10m?.[i] || data.hourly.wind_speed_10m[i] * 1.5 || 0),
        isDay: data.hourly.is_day?.[i] ?? 1,
      });
    }

    // Parse daily forecast starting from today (skipping yesterday's buffer day from past_days=1)
    const daily: DailyForecast[] = [];
    let dailyStartIndex = data.daily.time.findIndex((t: string) => t === todayLocal || t >= todayLocal);
    if (dailyStartIndex < 0) {
      dailyStartIndex = 0;
    }

    for (let i = dailyStartIndex; i < data.daily.time.length; i++) {
      const dateStr = data.daily.time[i];
      const d = new Date(dateStr + 'T12:00:00');
      const dayOffset = i - dailyStartIndex;
      const dayLabel = dayOffset === 0 ? 'Today' : dayOffset === 1 ? 'Tomorrow' : d.toLocaleDateString(undefined, { weekday: 'short' });

      daily.push({
        date: dateStr,
        dayLabel,
        weatherCode: data.daily.weather_code[i],
        tempMax: Math.round(data.daily.temperature_2m_max[i]),
        tempMin: Math.round(data.daily.temperature_2m_min[i]),
        precipitationProbabilityMax: Math.round(data.daily.precipitation_probability_max[i] || 0),
        uvIndexMax: Math.round(data.daily.uv_index_max[i] || 0),
        windSpeedMax: Math.round(data.daily.wind_speed_10m_max?.[i] || 0),
        windGustsMax: Math.round(data.daily.wind_gusts_10m_max?.[i] || 0),
      });
    }

    let resolvedLocation = locationName;
    if (!resolvedLocation) {
      resolvedLocation = await reverseGeocode(lat, lon);
    }

    return {
      current,
      hourly,
      daily,
      locationName: resolvedLocation || 'My Current Area',
      latitude: lat,
      longitude: lon,
      timezone: data.timezone || 'UTC',
    };
  } catch (error) {
    console.warn('Falling back to default weather data due to fetch error:', error);
    return getFallbackWeatherData(locationName || 'Local Area', lat, lon);
  }
}

export async function searchLocations(query: string): Promise<LocationSearchResult[]> {
  if (!query || query.trim().length < 2) return [];
  try {
    const res = await fetch(`${GEOCODING_BASE}?name=${encodeURIComponent(query)}&count=5&language=en&format=json`);
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.results) return [];

    return data.results.map((item: any) => ({
      id: item.id,
      name: item.name,
      latitude: item.latitude,
      longitude: item.longitude,
      country: item.country,
      admin1: item.admin1,
    }));
  } catch (err) {
    console.error('Location search error:', err);
    return [];
  }
}

export async function reverseGeocode(lat: number, lon: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=10&addressdetails=1`,
      { headers: { 'Accept-Language': 'en' } }
    );
    if (!res.ok) return 'Local Area';
    const data = await res.json();
    const city =
      data.address?.city ||
      data.address?.town ||
      data.address?.village ||
      data.address?.suburb ||
      data.address?.county ||
      data.address?.state;
    const country = data.address?.country;
    if (city && country) return `${city}, ${country}`;
    if (city) return city;
    return 'Current Location';
  } catch {
    return 'Current Location';
  }
}

export function getCurrentCoordinates(): Promise<{ lat: number; lon: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  });
}

export function getFallbackWeatherData(name: string, lat = 51.5074, lon = -0.1278): WeatherData {
  return {
    locationName: name,
    latitude: lat,
    longitude: lon,
    timezone: 'auto',
    current: {
      temperature: 18,
      apparentTemperature: 17,
      relativeHumidity: 65,
      precipitation: 0,
      weatherCode: 1, // Partly cloudy
      windSpeed: 12,
      isDay: 1,
      uvIndex: 4,
      time: new Date().toISOString(),
    },
    hourly: Array.from({ length: 48 }).map((_, i) => {
      const d = new Date();
      d.setHours(0, 0, 0, 0); // Always start from today's midnight 00:00
      d.setHours(i);
      const hourNum = d.getHours();
      const ampm = hourNum >= 12 ? 'PM' : 'AM';
      const displayHour = hourNum % 12 === 0 ? 12 : hourNum % 12;
      const temp = Math.round(18 + Math.sin(i / 4) * 4);
      const yr = d.getFullYear();
      const mo = String(d.getMonth() + 1).padStart(2, '0');
      const da = String(d.getDate()).padStart(2, '0');
      const ho = String(hourNum).padStart(2, '0');
      const timeStr = `${yr}-${mo}-${da}T${ho}:00`;
      return {
        time: timeStr,
        hourLabel: hourNum === new Date().getHours() && i < 24 ? 'Now' : `${displayHour} ${ampm}`,
        temperature: temp,
        apparentTemperature: temp - 1,
        precipitationProbability: i > 8 && i < 14 ? 30 : 5,
        weatherCode: i > 8 && i < 14 ? 80 : 1,
        uvIndex: hourNum >= 10 && hourNum <= 15 ? 5 : 1,
        windSpeed: 12,
        precipitation: 0,
        cloudCover: 20,
        visibility: 30000,
        windGusts: 16,
        isDay: hourNum >= 6 && hourNum <= 18 ? 1 : 0,
      };
    }),
    daily: Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      const dayLabel = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString(undefined, { weekday: 'short' });
      return {
        date: dateStr,
        dayLabel,
        weatherCode: i === 1 ? 61 : 1,
        tempMax: 20 - i,
        tempMin: 12 - i,
        precipitationProbabilityMax: i === 1 ? 60 : 20,
        uvIndexMax: 4,
        windSpeedMax: 14 + (i % 3) * 4,
        windGustsMax: 20 + (i % 3) * 6,
      };
    }),
  };
}
