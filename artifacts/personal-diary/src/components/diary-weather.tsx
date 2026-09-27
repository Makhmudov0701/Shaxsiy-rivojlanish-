import { useEffect, useRef, useState } from 'react';
import type { WeatherCondition } from '@workspace/api-client-react';
import { weatherConditionFromCode } from '@/lib/weather-utils';

export { weatherConditionFromCode } from '@/lib/weather-utils';

type WeatherValue = {
  weatherCondition: WeatherCondition | null;
  temperatureC: number | null;
};

const weatherOptions: Array<{ value: WeatherCondition; label: string; emoji: string }> = [
  { value: 'sunny', label: 'Quyoshli', emoji: '☀️' },
  { value: 'cloudy', label: 'Bulutli', emoji: '⛅' },
  { value: 'rainy', label: 'Yomg‘irli', emoji: '🌧️' },
  { value: 'snowy', label: 'Qorli', emoji: '❄️' },
];

function locationErrorMessage(error: unknown): string {
  const code = typeof error === 'object' && error !== null && 'code' in error
    ? (error as { code?: unknown }).code
    : null;
  if (code === 1) return 'Joylashuvga ruxsat berilmadi. Ob-havoni qo‘lda tanlang.';
  return 'Joylashuvni aniqlab bo‘lmadi. Qayta urinib ko‘ring.';
}

export function DiaryWeatherFields({
  value,
  onChange,
  disabled,
}: {
  value: WeatherValue;
  onChange: (value: WeatherValue) => void;
  disabled: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [temperatureDraft, setTemperatureDraft] = useState(value.temperatureC?.toString() ?? '');
  const lastPublishedTemperatureRef = useRef(value.temperatureC);
  const abortControllerRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      abortControllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (value.temperatureC !== lastPublishedTemperatureRef.current) {
      lastPublishedTemperatureRef.current = value.temperatureC;
      setTemperatureDraft(value.temperatureC?.toString() ?? '');
    }
  }, [value.temperatureC]);

  const cancelLookupForManualEdit = () => {
    setError('');
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setLoading(false);
    }
  };

  const detectWeather = async () => {
    setError('');
    if (!navigator.geolocation) {
      setError('Bu qurilmada joylashuvni aniqlab bo‘lmaydi. Ob-havoni qo‘lda tanlang.');
      return;
    }

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setLoading(true);

    let waitingForLocation = true;
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          maximumAge: 60_000,
          timeout: 15_000,
        });
      });
      waitingForLocation = false;
      if (!mountedRef.current || controller.signal.aborted) return;

      const url = new URL('https://api.open-meteo.com/v1/forecast');
      url.search = new URLSearchParams({
        latitude: String(position.coords.latitude),
        longitude: String(position.coords.longitude),
        current: 'temperature_2m,weather_code',
        temperature_unit: 'celsius',
        timezone: 'auto',
      }).toString();
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) throw new Error('weather-request-failed');

      const payload = await response.json() as {
        current?: { temperature_2m?: unknown; weather_code?: unknown };
      };
      const temperature = payload.current?.temperature_2m;
      const weatherCode = payload.current?.weather_code;
      if (typeof temperature !== 'number' || !Number.isFinite(temperature) || typeof weatherCode !== 'number') {
        throw new Error('weather-data-missing');
      }
      const weatherCondition = weatherConditionFromCode(weatherCode);
      if (!weatherCondition) throw new Error('weather-code-unknown');
      if (!mountedRef.current) return;

      const temperatureC = Math.round(temperature * 10) / 10;
      lastPublishedTemperatureRef.current = temperatureC;
      setTemperatureDraft(String(temperatureC));
      onChange({
        weatherCondition,
        temperatureC,
      });
    } catch (cause) {
      if (!mountedRef.current || controller.signal.aborted) return;
      setError(waitingForLocation
        ? locationErrorMessage(cause)
        : 'Ob-havo ma’lumotini olib bo‘lmadi. Qayta urinib ko‘ring.');
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
        if (mountedRef.current) setLoading(false);
      }
    }
  };

  const selectedOption = weatherOptions.find((option) => option.value === value.weatherCondition);
  const hasWeather = value.weatherCondition !== null || value.temperatureC !== null;

  return (
    <section
      className="mt-5 rounded-2xl border border-card-border bg-card p-4 sm:p-5"
      aria-labelledby="diary-weather-title"
      aria-busy={loading}
      data-testid="diary-weather-fields"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 id="diary-weather-title" className="text-[14px] font-semibold">Ob-havo</h2>
          <p className="mt-1 text-[11px] text-muted-foreground">Joylashuvingiz bo‘yicha hozirgi ob-havoni oling yoki qo‘lda tanlang.</p>
        </div>
        <button
          type="button"
          onClick={detectWeather}
          disabled={disabled || loading}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#cdbd8e] bg-background px-4 text-[12px] font-semibold transition-colors hover:border-[#b89c5c] hover:bg-[#f8e9bf] disabled:cursor-wait disabled:opacity-60"
          data-testid="button-detect-weather"
        >
          {loading ? 'Aniqlanmoqda…' : 'Ob-havoni aniqlash'}
        </button>
      </div>

      <div className="mt-4">
        <p className="text-[12px] font-medium">Ob-havo holati</p>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4" role="group" aria-label="Ob-havo holati">
          {weatherOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={value.weatherCondition === option.value}
              aria-label={`${option.emoji} ${option.label}`}
              onClick={() => {
                cancelLookupForManualEdit();
                onChange({ ...value, weatherCondition: option.value });
              }}
              disabled={disabled}
              className={`flex min-h-11 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-[12px] font-medium transition-colors disabled:opacity-60 ${
                value.weatherCondition === option.value
                  ? 'border-[#b89c5c] bg-[#faf3df] text-foreground ring-1 ring-[#b89c5c]'
                  : 'border-border bg-background text-muted-foreground hover:border-[#b89c5c] hover:text-foreground'
              }`}
              data-testid={`button-weather-${option.value}`}
            >
              <span aria-hidden="true">{option.emoji}</span>
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <div className="w-full max-w-[220px]">
          <label htmlFor="diary-weather-temperature" className="text-[12px] font-medium">Harorat (°C)</label>
          <input
            id="diary-weather-temperature"
            type="number"
            step="0.1"
            value={temperatureDraft}
            onChange={(event) => {
              cancelLookupForManualEdit();
              const rawValue = event.target.value;
              setTemperatureDraft(rawValue);
              const temperatureC = rawValue === '' ? null : Number(rawValue);
              if (temperatureC === null || Number.isFinite(temperatureC)) {
                lastPublishedTemperatureRef.current = temperatureC;
                onChange({ ...value, temperatureC });
              }
            }}
            onBlur={() => {
              if (temperatureDraft !== '' && !Number.isFinite(Number(temperatureDraft))) {
                setTemperatureDraft(value.temperatureC?.toString() ?? '');
              }
            }}
            disabled={disabled}
            className="mt-2 min-h-11 w-full rounded-xl border border-border bg-background px-3 text-[13px] outline-none focus:border-[#b89c5c] disabled:opacity-60"
            data-testid="input-weather-temperature"
          />
        </div>
        {hasWeather && (
          <button
            type="button"
            onClick={() => {
              cancelLookupForManualEdit();
              lastPublishedTemperatureRef.current = null;
              setTemperatureDraft('');
              onChange({ weatherCondition: null, temperatureC: null });
            }}
            disabled={disabled}
            className="min-h-10 rounded-lg px-2 text-[11px] font-semibold text-muted-foreground underline underline-offset-2 hover:text-foreground disabled:opacity-50"
            data-testid="button-clear-weather"
          >
            Ob-havoni o‘chirish
          </button>
        )}
      </div>

      <p className="mt-3 text-[10px] leading-relaxed text-muted-foreground">
        Joylashuv faqat ob-havoni aniqlash uchun ishlatiladi. Koordinatalar saqlanmaydi. Ma’lumot manbai: Open-Meteo.
      </p>
      {error && <p className="mt-3 text-[11px] text-destructive" role="alert" data-testid="status-weather-error">{error}</p>}
      {selectedOption && value.temperatureC !== null && (
        <p className="sr-only" aria-live="polite">{selectedOption.label}, {value.temperatureC}°C.</p>
      )}
    </section>
  );
}

export function DiaryWeatherBadge({ weatherCondition, temperatureC }: WeatherValue) {
  if (weatherCondition === null && temperatureC === null) return null;
  const option = weatherOptions.find((item) => item.value === weatherCondition);
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border border-[#e4dcc5] bg-[#faf6e9] px-2 py-1 text-[10px] text-[#756d5e] dark:border-[#5e5037] dark:bg-[#302a20]"
      aria-label={`Ob-havo: ${option?.label ?? ''}${temperatureC === null ? '' : `${option ? ', ' : ''}${temperatureC}°C`}`}
      data-testid="diary-weather-badge"
    >
      {option && <><span aria-hidden="true">{option.emoji}</span><span>{option.label}</span></>}
      {option && temperatureC !== null && <span aria-hidden="true">·</span>}
      {temperatureC !== null && <span>{temperatureC}°C</span>}
    </span>
  );
}