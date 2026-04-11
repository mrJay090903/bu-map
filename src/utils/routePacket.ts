import type { Destination, Point, RoutePacket } from "../types/navigation";
import { compactLabel } from "./formatters";

function clampPrecision(value: number) {
  return Number(value.toFixed(6));
}

export function buildRoutePacket({
  start,
  startLabel,
  destination,
}: {
  start: Point;
  startLabel: string;
  destination: Destination;
}): RoutePacket {
  return {
    v: 1,
    s: [clampPrecision(start.lat), clampPrecision(start.lon)],
    d: [clampPrecision(destination.lat), clampPrecision(destination.lon)],
    sl: startLabel,
    dl: compactLabel(destination.label),
    p: "foot",
  };
}

export function encodePacket(packet: RoutePacket) {
  const json = JSON.stringify(packet);
  const bytes = new TextEncoder().encode(json);
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export function decodePacket(value: string): RoutePacket {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const paddingLength = (4 - (normalized.length % 4)) % 4;
  const padded = normalized + "=".repeat(paddingLength);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  const json = new TextDecoder().decode(bytes);

  return JSON.parse(json) as RoutePacket;
}
