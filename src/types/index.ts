import type { Timestamp } from 'firebase/firestore';

export interface GridPosition {
  x: number; // Column index
  y: number; // Row index
  w: number; // Width in grid units
  h: number; // Height in grid units
}

export interface UrlWidgetData {
  url: string;
}

// Add other widget data types here in the future
// export interface ChecklistWidgetData { ... } 

export type WidgetData = UrlWidgetData; // | ChecklistWidgetData etc.

export interface Widget {
  id: string;
  type: 'url'; // Will expand in the future: 'checklist', 'calendar'
  name?: string;
  data: WidgetData;
  color: string; // Hex color string
  iconUrl?: string;
  gridPosition: GridPosition;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Tab {
  id: string;
  label: string;
  icon?: string; // Material Icon name or URL
  order: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  widgets?: Widget[]; // Locally populated, not a direct Firestore field this way usually
}
