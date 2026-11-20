"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

const EMPTY_VALUE = "__TRADE_NOVA_EMPTY__";
const volatileValues = new Map<string, string>();

function eventName(key: string) {
  return `trade-nova-storage:${key}`;
}

function subscribe(key: string, callback: () => void) {
  const localChange = () => callback();
  const storageChange = (event: StorageEvent) => {
    if (event.key === key || event.key === null) callback();
  };
  window.addEventListener(eventName(key), localChange);
  window.addEventListener("storage", storageChange);
  return () => {
    window.removeEventListener(eventName(key), localChange);
    window.removeEventListener("storage", storageChange);
  };
}

function getSnapshot(key: string): string {
  const volatileValue = volatileValues.get(key);
  if (volatileValue !== undefined) return volatileValue;
  try {
    return window.localStorage.getItem(key) ?? EMPTY_VALUE;
  } catch (error) {
    console.error(`Could not read local setting "${key}".`, error);
    return EMPTY_VALUE;
  }
}

function decodeStoredValue<T>(raw: string, key: string, isValid: (value: unknown) => value is T): { value: T } | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (isValid(parsed)) return { value: parsed };
  } catch (error) {
    if (isValid(raw)) return { value: raw };
    console.error(`Could not parse local setting "${key}".`, error);
    return null;
  }
  if (isValid(raw)) return { value: raw };
  console.error(`Saved local setting "${key}" has an invalid shape.`);
  return null;
}

export function useLocalStorageState<T>(
  key: string,
  initialValue: T,
  isValid: (value: unknown) => value is T,
): [T, (next: T | ((current: T) => T)) => boolean] {
  const subscribeToKey = useCallback((callback: () => void) => subscribe(key, callback), [key]);
  const readSnapshot = useCallback(() => getSnapshot(key), [key]);
  const raw = useSyncExternalStore(subscribeToKey, readSnapshot, () => EMPTY_VALUE);
  const value = useMemo(() => {
    if (raw === EMPTY_VALUE) return initialValue;
    return decodeStoredValue(raw, key, isValid)?.value ?? initialValue;
  }, [raw, initialValue, isValid, key]);

  const update = useCallback((next: T | ((current: T) => T)) => {
    const rawValue = getSnapshot(key);
    const currentValue = rawValue === EMPTY_VALUE
      ? initialValue
      : decodeStoredValue(rawValue, key, isValid)?.value ?? initialValue;
    const nextValue = typeof next === "function" ? (next as (current: T) => T)(currentValue) : next;
    const serialized = JSON.stringify(nextValue);
    volatileValues.set(key, serialized);
    let persisted = true;
    try {
      window.localStorage.setItem(key, serialized);
    } catch (error) {
      console.error(`Could not save local setting "${key}".`, error);
      persisted = false;
    }
    window.dispatchEvent(new Event(eventName(key)));
    return persisted;
  }, [key, initialValue, isValid]);

  return [value, update];
}
