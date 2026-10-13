"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/Button";
import { sealActions, useSealStore } from "@/components/three/sealStore";
import { useSealTravel } from "@/components/three/useSealSection";
import { requestTiltPermission } from "@/components/three/tiltInput";

export function SealDemo() {
  const mode = useSealStore((s) => s.mode);
  const zone = useRef<HTMLDivElement>(null);
  useSealTravel(zone);

  return (
    <div className="flex flex-col gap-s4">
      <div className="flex flex-wrap items-center gap-s2">
        <Button onClick={() => sealActions.stamp()}>Stamp</Button>
        <Button variant="secondary" className="pointer-coarse:inline-flex hidden" onClick={() => requestTiltPermission()}>
          Enable tilt
        </Button>
        <p className="type-label text-mist" aria-live="polite">
          Seal state: <span className="text-bone">{mode}</span>
        </p>
      </div>
      <p className="max-w-[60ch] text-sm text-mist">
        Idle: move the pointer and the seal tilts towards it. Scroll through the zone below to drive travel. Stamp drops
        it into the page with a squash and a ring of light.
      </p>
      <div ref={zone} className="flex h-[220vh] flex-col justify-between border border-dashed border-graphite p-s3">
        <span className="type-label text-mist">Travel zone start · progress 0</span>
        <span className="type-label text-mist">Travel zone end · progress 1</span>
      </div>
    </div>
  );
}
