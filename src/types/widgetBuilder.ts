import { VirtualPinId } from '../types';

export type WidgetType =
  | 'switch'
  | 'slider'
  | 'label'
  | 'gauge'
  | 'radial_semicircle'
  | 'water_tank'
  | 'chart'
  | 'button'
  | 'rgb_picker'
  | 'led_indicator'
  | 'device_metrics'
  | 'device_count'
  | 'device_table';

export interface DashboardWidget {
  id: string;
  type: WidgetType;
  title: string;
  titleKhmer?: string;
  pin?: VirtualPinId;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  color?: string;
  widthCols?: number; // 1 to 4 cols
  heightRows?: number; // 1 to 3 rows
  showValue?: boolean;
  value?: number | string;
  customIcon?: string;
}

export interface CustomDashboardTemplate {
  id: string;
  name: string;
  nameKhmer: string;
  description: string;
  dataSource: string;
  accessMode: string;
  dateRangeDefault: '1d' | '1w' | '1mo' | '3mo' | '1y';
  widgets: DashboardWidget[];
}
