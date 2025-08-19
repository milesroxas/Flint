// src/entities/style/model/style.types.ts
export interface StyleInfo {
  id: string;
  name: string;
  properties: Record<string, unknown>;
  order: number;
  isCombo: boolean;
  detectionSource?: "api" | "heuristic";
}
export interface StyleWithElement extends StyleInfo {
  elementId: string;
}
