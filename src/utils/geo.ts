import type { Point } from "../types/navigation";

export function calculateBearing(from: Point, to: Point) {
  const lat1 = (from.lat * Math.PI) / 180;
  const lat2 = (to.lat * Math.PI) / 180;
  const deltaLon = ((to.lon - from.lon) * Math.PI) / 180;
  const y = Math.sin(deltaLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLon);
  const theta = Math.atan2(y, x);
  return (theta * 180) / Math.PI >= 0
    ? (theta * 180) / Math.PI
    : (theta * 180) / Math.PI + 360;
}
