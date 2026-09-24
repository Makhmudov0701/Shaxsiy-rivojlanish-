import type { CSSProperties } from 'react';

export const diaryCoverPresets = [
  {
    id: 'minimalist-dark',
    label: 'Minimalistik qoramtir gradient',
    description: 'Sokin va sodda',
    backgroundImage: 'linear-gradient(125deg, #171821 0%, #29283a 54%, #48445d 100%)',
    backgroundColor: '#29283a',
  },
  {
    id: 'warm-wood',
    label: 'Iliq yog‘och',
    description: 'Yumshoq yog‘och tuslari',
    backgroundImage:
      'repeating-linear-gradient(103deg, transparent 0 34px, rgba(255,224,183,.09) 36px, transparent 40px 75px), linear-gradient(125deg, #4d2e23 0%, #86573a 54%, #bd8958 100%)',
    backgroundColor: '#86573a',
  },
  {
    id: 'deep-space',
    label: 'Chuqur koinot',
    description: 'Tun va yulduzlar',
    backgroundImage:
      'radial-gradient(circle at 18% 27%, rgba(255,255,255,.9) 0 1px, transparent 1.8px), radial-gradient(circle at 74% 20%, rgba(255,255,255,.65) 0 1px, transparent 1.8px), radial-gradient(circle at 58% 72%, rgba(255,255,255,.75) 0 1px, transparent 1.8px), radial-gradient(circle at 86% 65%, rgba(255,255,255,.55) 0 1px, transparent 1.8px), linear-gradient(130deg, #091326 0%, #172b51 54%, #43386e 100%)',
    backgroundColor: '#172b51',
  },
  {
    id: 'sunset-gold',
    label: 'Oltin shafaq',
    description: 'Quyosh botishining iliq nurlari',
    backgroundImage:
      'radial-gradient(ellipse at 82% 8%, rgba(255,223,151,.44), transparent 38%), linear-gradient(128deg, #71352e 0%, #bb6039 48%, #e2a94f 100%)',
    backgroundColor: '#bb6039',
  },
] as const;

export type DiaryCoverPresetId = (typeof diaryCoverPresets)[number]['id'];
export type DiaryCoverMode = 'preset' | 'upload' | 'url';

export type DiaryCoverSettings = {
  mode: DiaryCoverMode;
  preset: DiaryCoverPresetId;
  uploadDataUrl: string;
  uploadName: string;
  imageUrl: string;
};

export const DEFAULT_DIARY_COVER_SETTINGS: DiaryCoverSettings = {
  mode: 'preset',
  preset: 'minimalist-dark',
  uploadDataUrl: '',
  uploadName: '',
  imageUrl: '',
};

const presetIds = diaryCoverPresets.map(({ id }) => id);

export function diaryCoverStorageKey(userId: string) {
  return `kundalik-muqova-v1-${userId}`;
}

export function getDiaryCoverPreset(presetId: DiaryCoverPresetId) {
  return diaryCoverPresets.find(({ id }) => id === presetId) ?? diaryCoverPresets[0];
}

export function getDiaryCoverPresetStyle(presetId: DiaryCoverPresetId): CSSProperties {
  const preset = getDiaryCoverPreset(presetId);
  return {
    backgroundColor: preset.backgroundColor,
    backgroundImage: preset.backgroundImage,
  };
}

export function getDiaryCoverImage(settings: DiaryCoverSettings) {
  if (settings.mode === 'upload') return settings.uploadDataUrl || null;
  if (settings.mode === 'url') return settings.imageUrl || null;
  return null;
}

export function isDiaryCoverSettings(value: unknown): value is DiaryCoverSettings {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const settings = value as Record<string, unknown>;
  return (
    (settings.mode === 'preset' || settings.mode === 'upload' || settings.mode === 'url') &&
    typeof settings.preset === 'string' &&
    presetIds.includes(settings.preset as DiaryCoverPresetId) &&
    typeof settings.uploadDataUrl === 'string' &&
    settings.uploadDataUrl.length <= 900_000 &&
    (!settings.uploadDataUrl || /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(settings.uploadDataUrl)) &&
    typeof settings.uploadName === 'string' &&
    settings.uploadName.length <= 180 &&
    typeof settings.imageUrl === 'string' &&
    settings.imageUrl.length <= 2048 &&
    (settings.mode !== 'url' || isSecureImageUrl(settings.imageUrl))
  );
}

export function isSecureImageUrl(value: string) {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

export function readDiaryCoverSettings(userId: string): DiaryCoverSettings {
  try {
    const raw = window.localStorage.getItem(diaryCoverStorageKey(userId));
    if (!raw) return { ...DEFAULT_DIARY_COVER_SETTINGS };
    const parsed: unknown = JSON.parse(raw);
    if (!isDiaryCoverSettings(parsed)) throw new Error('invalid-cover');
    return parsed;
  } catch {
    throw new Error('Muqova sozlamalarini o‘qib bo‘lmadi. Brauzer xotirasini tekshiring.');
  }
}

export function writeDiaryCoverSettings(userId: string, settings: DiaryCoverSettings) {
  if (!isDiaryCoverSettings(settings)) throw new Error('Muqova sozlamalari noto‘g‘ri.');
  try {
    window.localStorage.setItem(diaryCoverStorageKey(userId), JSON.stringify(settings));
  } catch {
    throw new Error('Muqova sozlamalari saqlanmadi. Brauzer xotirasida joy borligini tekshiring.');
  }
}

export async function compressDiaryCoverImage(file: File): Promise<string> {
  const supportedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!supportedTypes.includes(file.type)) {
    throw new Error('JPG, PNG yoki WEBP formatidagi rasmni tanlang.');
  }
  if (file.size > 12 * 1024 * 1024) {
    throw new Error('Rasm hajmi 12 MB dan oshmasligi kerak.');
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('Rasmni ochib bo‘lmadi. Boshqa faylni tanlang.'));
      image.src = objectUrl;
    });

    const maxWidth = 1600;
    const maxHeight = 1000;
    const scale = Math.min(1, maxWidth / image.naturalWidth, maxHeight / image.naturalHeight);
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Rasmni tayyorlab bo‘lmadi. Boshqa brauzerda urinib ko‘ring.');

    context.fillStyle = '#272536';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    for (const quality of [0.82, 0.72, 0.62, 0.52]) {
      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      if (dataUrl.length <= 880_000) return dataUrl;
    }
    throw new Error('Rasmni saqlash uchun hajmi yetarlicha kichraymadi. Boshqa rasmni tanlang.');
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}