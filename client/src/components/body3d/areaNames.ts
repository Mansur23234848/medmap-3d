import type { RegionSlug } from './bodyModel';

export const AREA_NAMES: Record<RegionSlug, { kk: string; en: string }> = {
  head: { kk: 'Бас', en: 'Head' },
  neck: { kk: 'Мойын', en: 'Neck' },
  chest: { kk: 'Кеуде', en: 'Chest' },
  abdomen: { kk: 'Іш', en: 'Abdomen' },
  upper_back: { kk: 'Арқаның жоғарғы бөлігі', en: 'Upper Back' },
  lower_back: { kk: 'Бел', en: 'Lower Back' },
  pelvis: { kk: 'Жамбас', en: 'Pelvis' },
  left_shoulder: { kk: 'Сол иық', en: 'Left Shoulder' },
  right_shoulder: { kk: 'Оң иық', en: 'Right Shoulder' },
  left_arm: { kk: 'Сол қол', en: 'Left Arm' },
  right_arm: { kk: 'Оң қол', en: 'Right Arm' },
  left_elbow: { kk: 'Сол шынтақ', en: 'Left Elbow' },
  right_elbow: { kk: 'Оң шынтақ', en: 'Right Elbow' },
  left_hand: { kk: 'Сол қол басы', en: 'Left Hand' },
  right_hand: { kk: 'Оң қол басы', en: 'Right Hand' },
  left_leg: { kk: 'Сол аяқ', en: 'Left Leg' },
  right_leg: { kk: 'Оң аяқ', en: 'Right Leg' },
  left_knee: { kk: 'Сол тізе', en: 'Left Knee' },
  right_knee: { kk: 'Оң тізе', en: 'Right Knee' },
  left_foot: { kk: 'Сол табан', en: 'Left Foot' },
  right_foot: { kk: 'Оң табан', en: 'Right Foot' },
};

export const isRegionSlug = (s: string | null | undefined): s is RegionSlug => !!s && s in AREA_NAMES;
