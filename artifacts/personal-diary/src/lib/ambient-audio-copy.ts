import type { AppLanguage } from '@/lib/i18n';

export type AmbientSoundId =
  | 'rain'
  | 'storm'
  | 'forest'
  | 'forest-night'
  | 'cafe'
  | 'white-noise'
  | 'ocean'
  | 'fireplace'
  | 'night-city'
  | 'lofi-piano'
  | 'library'
  | 'train'
  | 'rain-tent'
  | 'space-rumble'
  | 'waterfall'
  | 'lofi-beats'
  | 'night-wind';

export type AmbientNoiseColor = 'white' | 'pink' | 'brown';

type AmbientAudioCopy = {
  title: string;
  focusAutoPlay: string;
  focusAutoPlayHint: string;
  primaryPlaying: string;
  primaryPaused: string;
  primarySound: string;
  mixLayer: string;
  mixOptional: string;
  mixOff: string;
  mixSound: string;
  noiseType: string;
  noiseColor: string;
  volume: string;
  primaryVolume: string;
  mixVolume: string;
  source: string;
  license: string;
  playingPrefix: string;
  start: string;
  pause: string;
  active: string;
  generatedInBrowser: string;
  crossfadeHint: string;
  noiseColors: Record<AmbientNoiseColor, string>;
  soundNames: Record<AmbientSoundId, string>;
  errors: {
    save: string;
    blocked: string;
    stream: string;
    load: string;
  };
};

const COPY: Record<AppLanguage, AmbientAudioCopy> = {
  uz: {
    title: 'Ovozli makon',
    focusAutoPlay: 'Diqqat paytida avtomatik ijro',
    focusAutoPlayHint: 'Diqqat taymeri ishlaganda boshlanadi, tanaffus yoki pauzada to‘xtaydi.',
    primaryPlaying: 'Asosiy tovush ijroda',
    primaryPaused: 'Asosiy tovush pauzada',
    primarySound: 'Asosiy tovush',
    mixLayer: 'Ikkinchi qatlam',
    mixOptional: 'ixtiyoriy',
    mixOff: 'O‘chirilgan',
    mixSound: 'Aralashtirish uchun tovush',
    noiseType: 'Shovqin turi',
    noiseColor: 'Shovqin rangi',
    volume: 'Ovoz balandligi',
    primaryVolume: 'Asosiy ovoz balandligi',
    mixVolume: 'Ikkinchi qatlam ovozi',
    source: 'Manba',
    license: 'litsenziya',
    playingPrefix: 'Ijroda',
    start: 'Boshlash',
    pause: 'To‘xtatish',
    active: 'Faol',
    generatedInBrowser: 'Shovqin brauzerda yaratiladi.',
    crossfadeHint: 'Qayta ijroda tovushlar bir-biriga yumshoq o‘tadi.',
    noiseColors: { white: 'Oq', pink: 'Pushti', brown: 'Jigarrang' },
    soundNames: {
      rain: 'Mayin yomg‘ir',
      storm: 'Momaqaldiroq',
      forest: 'O‘rmon qushlari',
      'forest-night': 'Tungi tabiat',
      cafe: 'Kafe',
      'white-noise': 'Oq shovqin',
      ocean: 'Dengiz to‘lqinlari',
      fireplace: 'Gulxan',
      'night-city': 'Tungi shahar',
      'lofi-piano': 'Sokin pianino',
      library: 'Kutubxona',
      train: 'Poyezd yo‘li',
      'rain-tent': 'Chodirdagi yomg‘ir',
      'space-rumble': 'Fazo gumburi',
      waterfall: 'Sharshara',
      'lofi-beats': 'Mayin lo-fi ritmlar',
      'night-wind': 'Tungi shamol',
    },
    errors: {
      save: 'Ovoz sozlamasini saqlab bo‘lmadi.',
      blocked: 'Bu brauzer fon tovushini ishga tushira olmadi.',
      stream: 'Ovoz oqimi uzildi. Internet aloqasini tekshirib qayta boshlang.',
      load: 'Tovush yuklanmadi. Internet aloqasini tekshiring.',
    },
  },
  en: {
    title: 'Sound space',
    focusAutoPlay: 'Play automatically during focus',
    focusAutoPlayHint: 'Starts with a focus timer and pauses for breaks or when the timer pauses.',
    primaryPlaying: 'Main sound playing',
    primaryPaused: 'Main sound paused',
    primarySound: 'Main sound',
    mixLayer: 'Second layer',
    mixOptional: 'optional',
    mixOff: 'Off',
    mixSound: 'Sound to mix',
    noiseType: 'Noise type',
    noiseColor: 'Noise color',
    volume: 'Volume',
    primaryVolume: 'Main volume',
    mixVolume: 'Second-layer volume',
    source: 'Source',
    license: 'license',
    playingPrefix: 'Playing',
    start: 'Play',
    pause: 'Pause',
    active: 'Active',
    generatedInBrowser: 'Noise is generated in your browser.',
    crossfadeHint: 'Tracks blend smoothly when they loop.',
    noiseColors: { white: 'White', pink: 'Pink', brown: 'Brown' },
    soundNames: {
      rain: 'Gentle rain',
      storm: 'Thunderstorm',
      forest: 'Forest birds',
      'forest-night': 'Night forest',
      cafe: 'Café ambience',
      'white-noise': 'White noise',
      ocean: 'Ocean waves',
      fireplace: 'Fireplace',
      'night-city': 'Night city',
      'lofi-piano': 'Soft piano',
      library: 'Library ambience',
      train: 'Train journey',
      'rain-tent': 'Rain on a tent',
      'space-rumble': 'Space rumble',
      waterfall: 'Waterfall',
      'lofi-beats': 'Soft lo-fi beats',
      'night-wind': 'Night wind',
    },
    errors: {
      save: 'Could not save sound settings.',
      blocked: 'This browser could not start background audio.',
      stream: 'The audio stream stopped. Check your connection and try again.',
      load: 'The sound could not be loaded. Check your connection.',
    },
  },
  ru: {
    title: 'Звуковое пространство',
    focusAutoPlay: 'Автовоспроизведение во время фокуса',
    focusAutoPlayHint: 'Запускается с таймером фокуса и ставится на паузу во время перерыва или паузы таймера.',
    primaryPlaying: 'Основной звук воспроизводится',
    primaryPaused: 'Основной звук на паузе',
    primarySound: 'Основной звук',
    mixLayer: 'Второй слой',
    mixOptional: 'необязательно',
    mixOff: 'Выключено',
    mixSound: 'Звук для смешивания',
    noiseType: 'Тип шума',
    noiseColor: 'Цвет шума',
    volume: 'Громкость',
    primaryVolume: 'Основная громкость',
    mixVolume: 'Громкость второго слоя',
    source: 'Источник',
    license: 'лицензия',
    playingPrefix: 'Играет',
    start: 'Воспроизвести',
    pause: 'Пауза',
    active: 'Активно',
    generatedInBrowser: 'Шум создаётся в браузере.',
    crossfadeHint: 'При повторе звуки плавно переходят друг в друга.',
    noiseColors: { white: 'Белый', pink: 'Розовый', brown: 'Коричневый' },
    soundNames: {
      rain: 'Тихий дождь',
      storm: 'Гроза',
      forest: 'Птицы в лесу',
      'forest-night': 'Ночной лес',
      cafe: 'Атмосфера кафе',
      'white-noise': 'Белый шум',
      ocean: 'Морские волны',
      fireplace: 'Камин',
      'night-city': 'Ночной город',
      'lofi-piano': 'Спокойное пианино',
      library: 'Атмосфера библиотеки',
      train: 'Поездка на поезде',
      'rain-tent': 'Дождь по палатке',
      'space-rumble': 'Космический гул',
      waterfall: 'Водопад',
      'lofi-beats': 'Спокойные lo-fi ритмы',
      'night-wind': 'Ночной ветер',
    },
    errors: {
      save: 'Не удалось сохранить настройки звука.',
      blocked: 'Браузер не смог запустить фоновый звук.',
      stream: 'Аудиопоток прервался. Проверьте подключение и попробуйте снова.',
      load: 'Не удалось загрузить звук. Проверьте подключение.',
    },
  },
  ko: {
    title: '사운드 공간',
    focusAutoPlay: '집중 중 자동 재생',
    focusAutoPlayHint: '집중 타이머와 함께 시작하고 휴식 시간이나 타이머 일시정지 시 멈춥니다.',
    primaryPlaying: '기본 사운드 재생 중',
    primaryPaused: '기본 사운드 일시정지',
    primarySound: '기본 사운드',
    mixLayer: '두 번째 레이어',
    mixOptional: '선택 사항',
    mixOff: '끔',
    mixSound: '함께 재생할 사운드',
    noiseType: '노이즈 종류',
    noiseColor: '노이즈 색상',
    volume: '볼륨',
    primaryVolume: '기본 볼륨',
    mixVolume: '두 번째 레이어 볼륨',
    source: '출처',
    license: '라이선스',
    playingPrefix: '재생 중',
    start: '재생',
    pause: '일시정지',
    active: '활성',
    generatedInBrowser: '노이즈는 브라우저에서 생성됩니다.',
    crossfadeHint: '반복 재생 시 사운드가 부드럽게 이어집니다.',
    noiseColors: { white: '화이트', pink: '핑크', brown: '브라운' },
    soundNames: {
      rain: '잔잔한 빗소리',
      storm: '천둥번개',
      forest: '숲속의 새소리',
      'forest-night': '밤의 숲',
      cafe: '카페 분위기',
      'white-noise': '화이트 노이즈',
      ocean: '파도 소리',
      fireplace: '벽난로',
      'night-city': '밤의 도시',
      'lofi-piano': '잔잔한 피아노',
      library: '도서관 분위기',
      train: '기차 여행',
      'rain-tent': '텐트 위 빗소리',
      'space-rumble': '우주 저음',
      waterfall: '폭포',
      'lofi-beats': '잔잔한 로파이 비트',
      'night-wind': '밤바람',
    },
    errors: {
      save: '사운드 설정을 저장하지 못했습니다.',
      blocked: '이 브라우저에서 배경 오디오를 시작하지 못했습니다.',
      stream: '오디오 스트림이 중단되었습니다. 연결을 확인하고 다시 시도하세요.',
      load: '사운드를 불러오지 못했습니다. 연결을 확인하세요.',
    },
  },
};

export function getAmbientAudioCopy(language: AppLanguage) {
  return COPY[language];
}

export function getAmbientSoundName(sound: AmbientSoundId, language: AppLanguage) {
  return COPY[language].soundNames[sound];
}