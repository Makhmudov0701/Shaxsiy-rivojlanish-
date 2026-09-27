import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Cloud, CloudRain, LoaderCircle, MapPin, Search, Snowflake, Sun } from 'lucide-react';
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

type StoredCity = {
  name: string;
  admin1?: string;
  country?: string;
};

type GeocodingResult = Coordinates & {
  id?: number;
  name: string;
  admin1?: string;
  country?: string;
};

type ActiveLocation = {
  coordinates: Coordinates;
  city: string | null;
  isFallback: boolean;
};

const FALLBACK_LOCATION: Coordinates = { latitude: 41.3111, longitude: 69.2797 };
const REFRESH_INTERVAL_MS = 15 * 60 * 1000;
const SAVED_CITY_KEY = 'personal-diary-weather-city';

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
  locationPicker: string;
  searchPlaceholder: string;
  searching: string;
  noCities: string;
  searchFailed: string;
  myLocation: string;
  savedLocation: string;
  savedCityUnavailable: string;
  storageUnavailable: string;
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
    locationSource: 'Avto joylashuv: BigDataCloud · shahar qidiruvi: Open-Meteo',
    locationPicker: 'Hudud tanlash',
    searchPlaceholder: 'Shaharni kiriting...',
    searching: 'Shaharlar qidirilmoqda…',
    noCities: 'Shahar topilmadi.',
    searchFailed: 'Shaharlarni qidirib bo‘lmadi. Qayta urinib ko‘ring.',
    myLocation: 'Mening joylashuvim 📍',
    savedLocation: 'Saqlangan shahar',
    savedCityUnavailable: 'Saqlangan shaharni topib bo‘lmadi. Boshqa joy qidiring yoki joylashuvingizdan foydalaning.',
    storageUnavailable: 'Tanlovni ushbu qurilmada saqlab bo‘lmadi.',
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
    locationSource: 'Auto location: BigDataCloud · city search: Open-Meteo',
    locationPicker: 'Choose a location',
    searchPlaceholder: 'Enter a city...',
    searching: 'Searching cities…',
    noCities: 'No cities found.',
    searchFailed: 'Could not search cities. Please try again.',
    myLocation: 'My location 📍',
    savedLocation: 'Saved city',
    savedCityUnavailable: 'The saved city could not be found. Search for another place or use your location.',
    storageUnavailable: 'This choice could not be saved on this device.',
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
    locationSource: 'Автоопределение: BigDataCloud · поиск города: Open-Meteo',
    locationPicker: 'Выбрать местоположение',
    searchPlaceholder: 'Введите название города...',
    searching: 'Ищем города…',
    noCities: 'Города не найдены.',
    searchFailed: 'Не удалось найти города. Попробуйте ещё раз.',
    myLocation: 'Моё местоположение 📍',
    savedLocation: 'Сохранённый город',
    savedCityUnavailable: 'Не удалось найти сохранённый город. Найдите другое место или используйте своё местоположение.',
    storageUnavailable: 'Не удалось сохранить выбор на этом устройстве.',
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
    locationSource: '자동 위치: BigDataCloud · 도시 검색: Open-Meteo',
    locationPicker: '위치 선택',
    searchPlaceholder: '도시를 입력하세요...',
    searching: '도시 검색 중…',
    noCities: '도시를 찾을 수 없습니다.',
    searchFailed: '도시를 검색하지 못했습니다. 다시 시도해 주세요.',
    myLocation: '내 위치 📍',
    savedLocation: '저장된 도시',
    savedCityUnavailable: '저장된 도시를 찾을 수 없습니다. 다른 도시를 검색하거나 현재 위치를 사용하세요.',
    storageUnavailable: '이 기기에 선택한 위치를 저장하지 못했습니다.',
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

function isGeocodingResult(value: unknown): value is GeocodingResult {
  if (!value || typeof value !== 'object') return false;
  const result = value as Record<string, unknown>;
  return typeof result.name === 'string'
    && typeof result.latitude === 'number'
    && Number.isFinite(result.latitude)
    && typeof result.longitude === 'number'
    && Number.isFinite(result.longitude);
}

async function searchCities(query: string, signal: AbortSignal, count = 6): Promise<GeocodingResult[]> {
  const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
  url.search = new URLSearchParams({
    name: query,
    count: String(count),
    language: 'en',
    format: 'json',
  }).toString();
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error('city-search-failed');
  const payload = await response.json() as { results?: unknown };
  return Array.isArray(payload.results) ? payload.results.filter(isGeocodingResult) : [];
}

function readStoredCity(): StoredCity | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(SAVED_CITY_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as Record<string, unknown>;
    if (typeof value.name !== 'string' || !value.name.trim()) return null;
    return {
      name: value.name.trim(),
      ...(typeof value.admin1 === 'string' ? { admin1: value.admin1 } : {}),
      ...(typeof value.country === 'string' ? { country: value.country } : {}),
    };
  } catch {
    return null;
  }
}

function storedCityFor(result: GeocodingResult): StoredCity {
  return {
    name: result.name,
    ...(result.admin1 ? { admin1: result.admin1 } : {}),
    ...(result.country ? { country: result.country } : {}),
  };
}

function matchStoredCity(results: GeocodingResult[], saved: StoredCity): GeocodingResult | null {
  const normalize = (value: string | undefined) => value?.trim().toLocaleLowerCase() ?? '';
  const nameMatches = results.filter((result) => normalize(result.name) === normalize(saved.name));
  if (saved.country) {
    return nameMatches.find((result) =>
      normalize(result.country) === normalize(saved.country)
      && (!saved.admin1 || normalize(result.admin1) === normalize(saved.admin1)),
    ) ?? nameMatches.find((result) => normalize(result.country) === normalize(saved.country)) ?? null;
  }
  if (saved.admin1) return nameMatches.find((result) => normalize(result.admin1) === normalize(saved.admin1)) ?? null;
  return nameMatches[0] ?? null;
}

function geocodingDetail(result: GeocodingResult): string {
  return [result.admin1, result.country].filter(Boolean).join(' · ');
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
  const [storedCity, setStoredCity] = useState<StoredCity | null>(() => readStoredCity());
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const [cityQuery, setCityQuery] = useState('');
  const [cityResults, setCityResults] = useState<GeocodingResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [storageError, setStorageError] = useState(false);
  const [savedCityLookupFailed, setSavedCityLookupFailed] = useState(false);
  const storedCityRef = useRef(storedCity);
  const activeLocationRef = useRef<ActiveLocation | null>(null);
  const activateLocationRef = useRef<(location: ActiveLocation) => void>(() => undefined);
  const locationRequestIdRef = useRef(0);
  const weatherControllerRef = useRef<AbortController | null>(null);
  const badgeRef = useRef<HTMLButtonElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const text = copy[language];

  useEffect(() => {
    languageRef.current = language;
  }, [language]);

  useEffect(() => {
    let mounted = true;
    let startupController: AbortController | null = null;

    const loadWeather = async (location: ActiveLocation) => {
      weatherControllerRef.current?.abort();
      const requestController = new AbortController();
      weatherControllerRef.current = requestController;
      const { coordinates, city, isFallback } = location;

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
        city: city ?? (isFallback ? copy[uiLanguage].fallbackCity : copy[uiLanguage].nearbyArea),
      }));
      setStatus('loading');
      const locationPromise: Promise<ReverseGeocodeResponse | null> = city
        ? Promise.resolve(null)
        : fetch(locationUrl, { signal: requestController.signal })
          .then(async (response) => response.ok ? await response.json() as ReverseGeocodeResponse : null)
          .catch(() => null)

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
          city: city
            ?? firstPlaceName(locationResult)
            ?? (isFallback ? copy[uiLanguage].fallbackCity : copy[uiLanguage].nearbyArea),
        });
        setStatus(isFallback ? 'fallback' : 'live');
      } catch {
        if (!mounted || requestController.signal.aborted) return;
        setStatus('unavailable');
      } finally {
        if (weatherControllerRef.current === requestController) {
          weatherControllerRef.current = null;
        }
      }
    };

    const activateLocation = (location: ActiveLocation) => {
      if (!mounted) return;
      activeLocationRef.current = location;
      void loadWeather(location);
    };
    activateLocationRef.current = activateLocation;

    const initialRequestId = ++locationRequestIdRef.current;
    const saved = storedCityRef.current;
    if (saved) {
      setWeather((current) => ({ ...current, city: saved.name }));
      startupController = new AbortController();
      void searchCities(saved.name, startupController.signal, 100)
        .then((results) => {
          if (!mounted || initialRequestId !== locationRequestIdRef.current) return;
          const match = matchStoredCity(results, saved);
          if (!match) {
            setSavedCityLookupFailed(true);
            setStatus('unavailable');
            return;
          }
          activateLocation({
            coordinates: { latitude: match.latitude, longitude: match.longitude },
            city: saved.name,
            isFallback: false,
          });
        })
        .catch(() => {
          if (mounted && initialRequestId === locationRequestIdRef.current) {
            setSavedCityLookupFailed(true);
            setStatus('unavailable');
          }
        });
    } else {
      const startFallback = () => {
        if (initialRequestId !== locationRequestIdRef.current) return;
        activateLocation({ coordinates: FALLBACK_LOCATION, city: null, isFallback: true });
      };
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        startFallback();
      } else {
        try {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              if (!mounted || initialRequestId !== locationRequestIdRef.current) return;
              activateLocation({
                coordinates: {
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                },
                city: null,
                isFallback: false,
              });
            },
            startFallback,
            { enableHighAccuracy: false, maximumAge: 5 * 60 * 1000, timeout: 10_000 },
          );
        } catch {
          startFallback();
        }
      }
    }

    const refreshTimer = window.setInterval(() => {
      if (activeLocationRef.current) void loadWeather(activeLocationRef.current);
    }, REFRESH_INTERVAL_MS);

    return () => {
      mounted = false;
      locationRequestIdRef.current += 1;
      window.clearInterval(refreshTimer);
      startupController?.abort();
      weatherControllerRef.current?.abort();
      activeLocationRef.current = null;
      activateLocationRef.current = () => undefined;
    };
  }, []);

  useEffect(() => {
    const query = cityQuery.trim();
    if (!isPopoverOpen || query.length < 2) {
      setCityResults([]);
      setIsSearching(false);
      setSearchError(null);
      return undefined;
    }

    const controller = new AbortController();
    setCityResults([]);
    setIsSearching(true);
    setSearchError(null);
    const timer = window.setTimeout(() => {
      void searchCities(query, controller.signal)
        .then((results) => {
          if (!controller.signal.aborted) setCityResults(results);
        })
        .catch(() => {
          if (!controller.signal.aborted) setSearchError(copy[languageRef.current].searchFailed);
        })
        .finally(() => {
          if (!controller.signal.aborted) setIsSearching(false);
        });
    }, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [cityQuery, isPopoverOpen]);

  useEffect(() => {
    if (!isPopoverOpen) {
      setPopoverPosition(null);
      return undefined;
    }

    const updatePosition = () => {
      const badge = badgeRef.current;
      if (!badge) return;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const width = Math.max(0, Math.min(320, viewportWidth - 16));
      const rect = badge.getBoundingClientRect();
      const desiredLeft = viewportWidth <= 640
        ? (viewportWidth - width) / 2
        : rect.right - width;
      const left = Math.max(8, Math.min(desiredLeft, viewportWidth - width - 8));
      const top = Math.max(8, Math.min(rect.bottom + 8, viewportHeight - 120));
      setPopoverPosition({ top, left, width });
    };

    const closeOnOutsidePointer = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (badgeRef.current?.contains(target) || popoverRef.current?.contains(target)) return;
      setIsPopoverOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setIsPopoverOpen(false);
      badgeRef.current?.focus();
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    document.addEventListener('pointerdown', closeOnOutsidePointer, true);
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
      document.removeEventListener('pointerdown', closeOnOutsidePointer, true);
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [isPopoverOpen]);

  const chooseCity = (result: GeocodingResult) => {
    const selected = storedCityFor(result);
    storedCityRef.current = selected;
    setStoredCity(selected);
    setSavedCityLookupFailed(false);
    setStorageError(false);
    try {
      window.localStorage.setItem(SAVED_CITY_KEY, JSON.stringify(selected));
    } catch {
      setStorageError(true);
    }
    locationRequestIdRef.current += 1;
    activateLocationRef.current({
      coordinates: { latitude: result.latitude, longitude: result.longitude },
      city: selected.name,
      isFallback: false,
    });
    setCityQuery('');
    setCityResults([]);
    setIsPopoverOpen(false);
  };

  const useMyLocation = () => {
    storedCityRef.current = null;
    setStoredCity(null);
    setSavedCityLookupFailed(false);
    setStorageError(false);
    setWeather({ temperatureC: null, condition: null, city: text.nearbyArea });
    setStatus('loading');
    setCityQuery('');
    setCityResults([]);
    try {
      window.localStorage.removeItem(SAVED_CITY_KEY);
    } catch {
      setStorageError(true);
    }

    const requestId = ++locationRequestIdRef.current;
    const startFallback = () => {
      if (requestId !== locationRequestIdRef.current) return;
      activateLocationRef.current({ coordinates: FALLBACK_LOCATION, city: null, isFallback: true });
    };
    setIsPopoverOpen(false);
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      startFallback();
      return;
    }

    try {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (requestId !== locationRequestIdRef.current) return;
          activateLocationRef.current({
            coordinates: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            },
            city: null,
            isFallback: false,
          });
        },
        startFallback,
        { enableHighAccuracy: false, maximumAge: 5 * 60 * 1000, timeout: 10_000 },
      );
    } catch {
      startFallback();
    }
  };

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
  const temperatureText = weather.temperatureC === null ? '—' : `${Math.round(weather.temperatureC)}°C`;
  const currentCity = weather.city ?? text.loading;

  return (
    <div className="relative shrink-0 font-sans" data-testid="dashboard-weather-widget">
      <button
        ref={badgeRef}
        type="button"
        onClick={() => setIsPopoverOpen((open) => !open)}
        className="flex h-10 max-w-[140px] items-center gap-1 rounded-full border border-[#ddcfaa] bg-[#faf6ea] px-2 text-foreground shadow-sm transition-colors hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d9a441] dark:border-[#5d5037] dark:bg-[#2d281f] dark:text-white max-[400px]:max-w-[120px] max-[360px]:max-w-[108px] max-[340px]:max-w-[100px] sm:max-w-[150px] sm:gap-1.5 sm:px-2.5"
        aria-label={`${text.title}: ${currentCity}, ${temperatureText}, ${conditionText}`}
        aria-expanded={isPopoverOpen}
        aria-controls={isPopoverOpen ? 'dashboard-weather-popover' : undefined}
        title={`${currentCity} · ${temperatureText} · ${conditionText}`}
        data-testid="button-dashboard-weather"
      >
        <MapPin className="size-3 shrink-0 text-[#a87925] max-[340px]:hidden" aria-hidden="true" />
        <span className="min-w-0 max-w-12 flex-1 truncate text-[10px] font-medium max-[340px]:max-w-6 sm:max-w-16 sm:text-[11px]" data-testid="text-weather-city">
          {currentCity}
        </span>
        <span className="shrink-0 text-[12px] font-semibold leading-none" data-testid="text-weather-temperature">{temperatureText}</span>
        <WeatherIcon className={`size-[15px] shrink-0 ${iconColor} animate-pulse motion-reduce:animate-none`} aria-hidden="true" />
      </button>
      {isPopoverOpen && popoverPosition && typeof document !== 'undefined' && createPortal(
        <div
          ref={popoverRef}
          id="dashboard-weather-popover"
          role="dialog"
          aria-label={text.locationPicker}
          className="z-[100] overflow-y-auto rounded-2xl border border-border bg-card p-4 text-foreground shadow-2xl"
          style={{
            position: 'fixed',
            top: popoverPosition.top,
            left: popoverPosition.left,
            width: popoverPosition.width,
            maxHeight: 'calc(100dvh - 5rem)',
          }}
        >
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted">
              <WeatherIcon className={`size-5 ${iconColor}`} aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold" data-testid="text-weather-city-detail">{currentCity}</p>
              <p className="mt-1 text-[12px] text-muted-foreground" data-testid="text-weather-condition">{conditionText}</p>
            </div>
            <span className="shrink-0 font-sans text-[22px] leading-none" data-testid="text-weather-temperature-detail">{temperatureText}</span>
          </div>
          <p className="mt-3 rounded-xl bg-muted/70 px-3 py-2 text-[11px] text-muted-foreground" role="status" aria-live="polite" data-testid="status-dashboard-weather">
            {statusText}
          </p>

          <div className="mt-4 border-t border-border pt-3">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[.1em] text-muted-foreground">{text.locationPicker}</p>
            <label htmlFor="dashboard-weather-city-search" className="sr-only">{text.searchPlaceholder}</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <input
                id="dashboard-weather-city-search"
                type="search"
                value={cityQuery}
                onChange={(event) => setCityQuery(event.target.value)}
                placeholder={text.searchPlaceholder}
                className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-[12px] text-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-[#d9a441]"
                autoComplete="off"
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && cityResults[0]) {
                    event.preventDefault();
                    chooseCity(cityResults[0]);
                  }
                }}
                data-testid="input-weather-city-search"
              />
            </div>
            <div className="mt-2 space-y-1" aria-live="polite">
              {isSearching && <p className="flex items-center gap-2 px-2 py-2 text-[11px] text-muted-foreground"><LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" />{text.searching}</p>}
              {searchError && <p className="px-2 py-2 text-[11px] text-destructive" role="alert">{searchError}</p>}
              {!isSearching && !searchError && cityQuery.trim().length >= 2 && cityResults.length === 0 && <p className="px-2 py-2 text-[11px] text-muted-foreground">{text.noCities}</p>}
              {cityResults.map((result) => {
                const detail = geocodingDetail(result);
                return (
                  <button
                    key={result.id ?? `${result.name}-${result.latitude}-${result.longitude}`}
                    type="button"
                    onClick={() => chooseCity(result)}
                    className="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d9a441]"
                    data-testid="button-weather-city-result"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-[12px] font-medium">{result.name}</span>
                      {detail && <span className="mt-0.5 block truncate text-[10px] text-muted-foreground">{detail}</span>}
                    </span>
                    <span className="shrink-0 text-[10px] font-semibold text-[#8f601a]">{result.country}</span>
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={useMyLocation}
              className="mt-2 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-[12px] font-semibold transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d9a441]"
              data-testid="button-weather-my-location"
            >
              <MapPin className="size-4 text-[#a87925]" aria-hidden="true" />
              {text.myLocation}
            </button>
            {storedCity && <p className="mt-2 text-[10px] text-muted-foreground">{text.savedLocation}: {storedCity.name}</p>}
            {storageError && <p className="mt-2 text-[10px] text-destructive" role="alert">{text.storageUnavailable}</p>}
            {savedCityLookupFailed && <p className="mt-2 text-[10px] text-muted-foreground">{text.savedCityUnavailable}</p>}
          </div>

          <div className="mt-4 border-t border-border pt-3 text-[10px] leading-relaxed text-muted-foreground">
            <p className="mb-1 font-semibold uppercase tracking-[.1em]">{text.sources}</p>
            <p>{text.weatherSource}</p>
            <p>{text.locationSource}</p>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}