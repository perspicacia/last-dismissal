export const DEFAULT_LOOK_SETTINGS = Object.freeze({horizontal:.65,vertical:.325,verticalLocked:false});
export const LOOK_STORAGE_KEY = 'last-dismissal.look.v1';

export function normalizeLookSettings(value={}) {
  const gain=(v,fallback,min)=>Number.isFinite(v)?Math.max(min,Math.min(1.8,v)):fallback;
  return {horizontal:gain(value?.horizontal,DEFAULT_LOOK_SETTINGS.horizontal,.2),
    vertical:gain(value?.vertical,DEFAULT_LOOK_SETTINGS.vertical,.1),verticalLocked:value?.verticalLocked===true};
}
export function loadLookSettings(storage) {
  try {return normalizeLookSettings(JSON.parse((storage??globalThis.localStorage)?.getItem(LOOK_STORAGE_KEY)||'null'));}
  catch {return {...DEFAULT_LOOK_SETTINGS};}
}
export function saveLookSettings(settings,storage) {
  try {
    const target=storage??globalThis.localStorage;
    if(!target)return false;
    target.setItem(LOOK_STORAGE_KEY,JSON.stringify(normalizeLookSettings(settings)));return true;
  } catch {return false;}
}
