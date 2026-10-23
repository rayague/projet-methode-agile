import { GlobeBackground } from "@/components/layout/globe-background";

export function AppBackground({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <>
      <div
        aria-hidden="true"
        className="app-background pointer-events-none absolute inset-0 z-0"
      />
      <GlobeBackground reduceMotion={reduceMotion} />
    </>
  );
}
