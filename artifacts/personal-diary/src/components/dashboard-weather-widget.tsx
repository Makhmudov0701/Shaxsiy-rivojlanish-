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
  sources: string;
  weatherSource: string;
  locationSource: string;
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
    sources: 'Manbalar',
    weatherSource: 'Ob-havo: Open-Meteo',
    locationSource: 'Joylashuv: BigDataCloud',
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
    sources: 'Sources',
    weatherSource: 'Weather: Open-Meteo',
    locationSource: 'Location: BigDataCloud',
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
    sources: 'Источники',
    weatherSource: 'Погода: Open-Meteo',
    locationSource: 'Местоположение: BigDataCloud',
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
    sources: '출처',
    weatherSource: '날씨: Open-Meteo',
    locationSource: '위치: BigDataCloud',
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
    <details className="group relative shrink-0" data-testid="dashboard-weather-widget">
      <summary
        className="flex h-10 max-w-[118px] cursor-pointer list-none items-center gap-1 rounded-full border border-[#ddcfaa] bg-[#faf6ea] px-2 text-foreground shadow-sm transition-colors hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d9a441] [&::-webkit-details-marker]:hidden dark:border-[#5d5037] dark:bg-[#2d281f] dark:text-white sm:max-w-[132px] sm:gap-1.5 sm:px-2.5"
        aria-label={`${text.title}: ${weather.city ?? text.loading}, ${weather.temperatureC === null ? '—' : `${Math.round(weather.temperatureC)}°C`}, ${conditionText}`}
        title={text.title}
        data-testid="button-dashboard-weather"
      >
        <MapPin className="size-3 shrink-0 text-[#a87925] max-[340px]:hidden" aria-hidden="true" />
        <span className="min-w-0 max-w-10 flex-1 truncate text-[10px] font-medium max-[400px]:hidden sm:max-w-14 sm:text-[11px]" data-testid="text-weather-city">
          {weather.city ?? text.loading}
        </span>
        <span className="shrink-0 text-[12px] font-semibold leading-none" data-testid="text-weather-temperature">
          {weather.temperatureC === null ? '—' : Math.round(weather.temperatureC)}°C
        </span>
        <WeatherIcon className={`size-[15px] shrink-0 ${iconColor} animate-pulse motion-reduce:animate-none`} aria-hidden="true" />
      </summary>
      <div className="absolute right-0 top-full z-50 mt-2 w-[min(18rem,calc(100vw-1rem))] rounded-2xl border border-border bg-card p-4 text-foreground shadow-xl">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted">
            <WeatherIcon className={`size-5 ${iconColor}`} aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold" data-testid="text-weather-city-detail">{weather.city ?? text.loading}</p>
            <p className="mt-1 text-[12px] text-muted-foreground" data-testid="text-weather-condition">{conditionText}</p>
          </div>
          <span className="shrink-0 font-serif text-[22px] leading-none" data-testid="text-weather-temperature-detail">
            {weather.temperatureC === null ? '—' : Math.round(weather.temperatureC)}°C
          </span>
        </div>
        <p className="mt-3 rounded-xl bg-muted/70 px-3 py-2 text-[11px] text-muted-foreground" role="status" aria-live="polite" data-testid="status-dashboard-weather">
          {statusText}
        </p>
        <div className="mt-3 border-t border-border pt-3 text-[10px] leading-relaxed text-muted-foreground">
          <p className="mb-1 font-semibold uppercase tracking-[.1em]">{text.sources}</p>
          <p>{text.weatherSource}</p>
          <p>{text.locationSource}</p>
        </div>
      </div>
    </details>
  );
}