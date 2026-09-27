import { useEffect, useRef, useState } from 'react';
import { Cloud, CloudRain, MapPin, Snowflake, Sun } from 'lucide-react';
import type { WeatherCondition } from '@workspace/api-client-react';
import { useI18n, type AppLanguage } from '@/lib/i18n';
import { weatherConditionFromCode } from '@/lib/weather-utils';

type Coordinates = {
  latitude: number;
  longitude: number;
};

type WeatherStatus = 'loading' | 'live' | 'fallback' | 'unavailable';

type WeatherSnapshot = {
  temperatureC: number | null;
  condition: WeatherCondition | null;
  city: string | null;
};

const FALLBACK_LOCATION: Coordinates = { latitude: 41.3111, longitude: 69.2797 };
const REFRESH_INTERVAL_MS = 15 * 60 * 1000;

const copy: Record<AppLanguage, {
  title: string;
  loading: string;
  live: string;
  fallback: string;
  unavailable: string;
  nearbyArea: string;
  fallbackCity: string;
  conditions: Record<WeatherCondition, string>;
}> = {
  uz: {
    title: 'Ob-havo',
    loading: 'Ob-havo olinmoqda…',
    live: 'Hozirgi ob-havo',
    fallback: 'Zaxira joylashuv',
    unavailable: 'Ob-havo mavjud emas',
    nearbyArea: 'Yaqin hudud',
    fallbackCity: 'Toshkent',
    conditions: { sunny: 'Quyoshli', cloudy: 'Bulutli', rainy: 'Yomg‘irli', snowy: 'Qorli' },
  },
  en: {
    title: 'Weather',
    loading: 'Loading weather…',
    live: 'Current conditions',
    fallback: 'Fallback location',
    unavailable: 'Weather unavailable',
    nearbyArea: 'Nearby area',
    fallbackCity: 'Tashkent',
    conditions: { sunny: 'Sunny', cloudy: 'Cloudy', rainy: 'Rainy', snowy: 'Snowy' },
  },
  ru: {
    title: 'Погода',
    loading: 'Загружаем погоду…',
    live: 'Сейчас',
    fallback: 'Резервное местоположение',
    unavailable: 'Погода недоступна',
    nearbyArea: 'Ближайший район',
    fallbackCity: 'Ташкент',
    conditions: { sunny: 'Солнечно', cloudy: 'Облачно', rainy: 'Дождь', snowy: 'Снег' },
  },
  ko: {
    title: '날씨',
    loading: '날씨를 불러오는 중…',
    live: '현재 날씨',
    fallback: '기본 위치',
    unavailable: '날씨를 불러올 수 없음',
    nearbyArea: '주변 지역',
    fallbackCity: '타슈켄트',
    conditions: { sunny: '맑음', cloudy: '흐림', rainy: '비', snowy: '눈' },
  },
};

type ReverseGeocodeResponse = {
  city?: unknown;
  locality?: unknown;
  principalSubdivision?: unknown;
  countryName?: unknown;
};

type ForecastResponse = {
  current?: {
    temperature_2m?: unknown;
    weather_code?: unknown;
  };
};

function firstPlaceName(place: ReverseGeocodeResponse | null): string | null {
  if (!place) return null;
  for (const candidate of [place.city, place.locality, place.principalSubdivision, place.countryName]) {
    if (typeof candidate === 'string' && candidate.trim()) return candidate.trim();
  }
  return null;
}

export function DashboardWeatherWidget() {
  const { language } = useI18n();
  const languageRef = useRef(language);
  const [weather, setWeather] = useState<WeatherSnapshot>({
    temperatureC: null,
    condition: null,
    city: null,
  });
  const [status, setStatus] = useState<WeatherStatus>('loading');
  const text = copy[language];

  useEffect(() => {
    languageRef.current = language;
  }, [language]);

  useEffect(() => {
    let mounted = true;
    let controller: AbortController | null = null;
    let refreshTimer: number | undefined;
    let selectedCoordinates = FALLBACK_LOCATION;
    let usingFallback = true;

    const loadWeather = async (coordinates: Coordinates, isFallback: boolean, lookupPlace: boolean) => {
      controller?.abort();
      const requestController = new AbortController();
      controller = requestController;

      const weatherUrl = new URL('https://api.open-meteo.com/v1/forecast');
      weatherUrl.search = new URLSearchParams({
        latitude: String(coordinates.latitude),
        longitude: String(coordinates.longitude),
        current: 'temperature_2m,weather_code',
        temperature_unit: 'celsius',
        timezone: 'auto',
      }).toString();

      const locationUrl = new URL('https://api.bigdatacloud.net/data/reverse-geocode-client');
      locationUrl.search = new URLSearchParams({
        latitude: String(coordinates.latitude),
        longitude: String(coordinates.longitude),
        localityLanguage: languageRef.current,
      }).toString();
      const uiLanguage = languageRef.current;
      setWeather((current) => ({
        ...current,
        city: isFallback ? copy[uiLanguage].fallbackCity : copy[uiLanguage].nearbyArea,
      }));
      const locationPromise: Promise<ReverseGeocodeResponse | null> = lookupPlace
        ? fetch(locationUrl, { signal: requestController.signal })
          .then(async (response) => response.ok ? await response.json() as ReverseGeocodeResponse : null)
          .catch(() => null)
        : Promise.resolve(null);

      try {
        const [weatherResponse, locationResult] = await Promise.all([
          fetch(weatherUrl, { signal: requestController.signal }),
          locationPromise,
        ]);
        if (!weatherResponse.ok) throw new Error('weather-request-failed');

        const payload = await weatherResponse.json() as ForecastResponse;
        const temperature = payload.current?.temperature_2m;
        const weatherCode = payload.current?.weather_code;
        if (typeof temperature !== 'number' || !Number.isFinite(temperature) || typeof weatherCode !== 'number') {
          throw new Error('weather-data-missing');
        }
        if (!mounted || requestController.signal.aborted) return;

        setWeather({
          temperatureC: temperature,
          condition: weatherConditionFromCode(weatherCode),
          city: firstPlaceName(locationResult)
            ?? (isFallback ? copy[uiLanguage].fallbackCity : copy[uiLanguage].nearbyArea),
        });
        setStatus(isFallback ? 'fallback' : 'live');
      } catch {
        if (!mounted || requestController.signal.aborted) return;
        setStatus('unavailable');
      } finally {
        if (controller === requestController) {
          controller = null;
        }
      }
    };

    const startWeatherUpdates = (coordinates: Coordinates, isFallback: boolean) => {
      if (!mounted) return;
      selectedCoordinates = coordinates;
      usingFallback = isFallback;
      void loadWeather(coordinates, isFallback, true);
      if (refreshTimer === undefined) {
        refreshTimer = window.setInterval(() => {
          void loadWeather(selectedCoordinates, usingFallback, false);
        }, REFRESH_INTERVAL_MS);
      }
    };

    if (!navigator.geolocation) {
      startWeatherUpdates(FALLBACK_LOCATION, true);
    } else {
      try {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            startWeatherUpdates({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            }, false);
          },
          () => startWeatherUpdates(FALLBACK_LOCATION, true),
          { enableHighAccuracy: false, maximumAge: 5 * 60 * 1000, timeout: 10_000 },
        );
      } catch {
        startWeatherUpdates(FALLBACK_LOCATION, true);
      }
    }

    return () => {
      mounted = false;
      if (refreshTimer !== undefined) window.clearInterval(refreshTimer);
      controller?.abort();
    };
  }, []);

  const WeatherIcon = weather.condition === 'sunny'
    ? Sun
    : weather.condition === 'rainy'
      ? CloudRain
      : weather.condition === 'snowy'
        ? Snowflake
        : Cloud;
  const iconColor = weather.condition === 'sunny'
    ? 'text-[#f3cc6e]'
    : weather.condition === 'rainy'
      ? 'text-[#9ec6ff]'
      : weather.condition === 'snowy'
        ? 'text-[#bdeaff]'
        : 'text-[#ddd2f2]';
  const statusText = status === 'loading'
    ? text.loading
    : status === 'live'
      ? text.live
      : status === 'fallback'
        ? text.fallback
        : text.unavailable;
  const conditionText = weather.condition ? text.conditions[weather.condition] : text.title;

  return (
    <aside
      className="flex min-h-[82px] w-full items-center gap-3 rounded-2xl border border-white/10 bg-[#221d2d] px-4 py-3 text-white shadow-lg shadow-[#221d2d]/10"
      aria-label={text.title}
      data-testid="dashboard-weather-widget"
    >
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/10">
        <WeatherIcon className={`size-6 ${iconColor} animate-pulse motion-reduce:animate-none`} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-white/70">
          <MapPin size={12} className="shrink-0 text-[#e4bd66]" aria-hidden="true" />
          <span className="truncate" data-testid="text-weather-city">{weather.city ?? text.loading}</span>
        </div>
        <div className="mt-0.5 flex flex-wrap items-baseline gap-x-2">
          <span className="font-serif text-[25px] leading-none tracking-tight" data-testid="text-weather-temperature">
            {weather.temperatureC === null ? '—' : Math.round(weather.temperatureC)}°C
          </span>
          <span className="text-[12px] font-medium text-white/80" data-testid="text-weather-condition">{conditionText}</span>
        </div>
        <p className="mt-1 truncate text-[9px] text-white/55" role="status" aria-live="polite" data-testid="status-dashboard-weather">
          {statusText} <span aria-hidden="true">·</span> Open-Meteo · BigDataCloud
        </p>
      </div>
    </aside>
  );
}