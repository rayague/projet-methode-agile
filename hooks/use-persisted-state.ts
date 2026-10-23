"use client";

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

export function useBootReady() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}
