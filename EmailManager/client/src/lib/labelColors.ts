// Preset label colors as defined in design guidelines
export const LABEL_COLORS = [
  { name: 'Blue', value: '239 70% 60%' },
  { name: 'Green', value: '142 70% 60%' },
  { name: 'Yellow', value: '45 70% 60%' },
  { name: 'Red', value: '0 70% 60%' },
  { name: 'Purple', value: '280 70% 60%' },
  { name: 'Pink', value: '330 70% 60%' },
  { name: 'Orange', value: '25 70% 60%' },
  { name: 'Teal', value: '180 70% 60%' },
  { name: 'Indigo', value: '260 70% 60%' },
  { name: 'Cyan', value: '190 70% 60%' },
  { name: 'Lime', value: '80 70% 60%' },
  { name: 'Rose', value: '350 70% 60%' },
];

export function getLabelColor(color: string): string {
  return color;
}
