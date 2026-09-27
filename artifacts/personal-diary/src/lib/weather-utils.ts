import type { WeatherCondition } from '@workspace/api-client-react';

export function weatherConditionFromCode(code: number): WeatherCondition | null {
  if (code === 0) return 'sunny';
  if ([1, 2, 3, 45, 48].includes(code)) return 'cloudy';
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].includes(code)) return 'rainy';
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'snowy';
  return null;
}