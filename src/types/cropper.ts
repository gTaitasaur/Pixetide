export interface AspectRatioOption {
  label: string;
  subLabel?: string;
  value: number | undefined; // undefined significa 'Libre'
  icon?: string;
}

export const ASPECT_RATIOS: AspectRatioOption[] = [
  { 
    label: 'Libre', 
    subLabel: 'A tu gusto',
    value: undefined,
    icon: 'M4 4h16v16H4z M4 4l16 16 M20 4l-16 16'
  },
  { 
    label: '1:1', 
    subLabel: 'Instagram Post',
    value: 1 / 1,
    icon: 'M5 5h14v14H5z'
  },
  { 
    label: '4:5', 
    subLabel: 'Instagram Portrait',
    value: 4 / 5,
    icon: 'M7 3h10v18H7z'
  },
  { 
    label: '2:3', 
    subLabel: 'Pinterest Pin',
    value: 2 / 3,
    icon: 'M8 2h8v20H8z'
  },
  { 
    label: '16:9', 
    subLabel: 'YouTube / TV',
    value: 16 / 9,
    icon: 'M2 8h20v8H2z'
  },
  { 
    label: '9:16', 
    subLabel: 'Stories / Reels',
    value: 9 / 16,
    icon: 'M6 1h12v22H6z'
  },
];
