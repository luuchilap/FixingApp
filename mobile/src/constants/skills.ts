// Skill constants matching backend
export type SkillValue =
  | 'PLUMBING'
  | 'ELECTRICAL'
  | 'CARPENTRY'
  | 'PAINTING'
  | 'CLEANING'
  | 'AC_REPAIR'
  | 'APPLIANCE_REPAIR'
  | 'MASONRY'
  | 'GARDENING'
  | 'ENTERTAINMENT'
  | 'HOUSEWORK'
  | 'DELIVERY'
  | 'ERRANDS'
  | 'MISC_TASKS'
  | 'OTHER';

export interface SkillOption {
  value: SkillValue;
  label: string;
  icon: string;   // MaterialCommunityIcons name
  color: string;  // Tint color for the icon background
}

export const SKILLS: SkillOption[] = [
  { value: 'CLEANING', label: 'Dọn dẹp', icon: 'broom', color: '#10b981' },
  { value: 'HOUSEWORK', label: 'Việc nhà', icon: 'home-heart', color: '#f59e0b' },
  { value: 'PLUMBING', label: 'Sửa ống nước', icon: 'water-pump', color: '#3b82f6' },
  { value: 'ELECTRICAL', label: 'Thợ điện', icon: 'lightning-bolt', color: '#eab308' },
  { value: 'AC_REPAIR', label: 'Sửa điều hòa', icon: 'snowflake', color: '#06b6d4' },
  { value: 'APPLIANCE_REPAIR', label: 'Sửa thiết bị', icon: 'washing-machine', color: '#8b5cf6' },
  { value: 'CARPENTRY', label: 'Thợ mộc', icon: 'hammer-wrench', color: '#a16207' },
  { value: 'PAINTING', label: 'Thợ sơn', icon: 'format-paint', color: '#ec4899' },
  { value: 'MASONRY', label: 'Thợ xây', icon: 'wall', color: '#ef4444' },
  { value: 'GARDENING', label: 'Làm vườn', icon: 'flower-tulip', color: '#22c55e' },
  { value: 'DELIVERY', label: 'Giao hàng', icon: 'truck-delivery', color: '#f97316' },
  { value: 'ERRANDS', label: 'Việc vặt', icon: 'run-fast', color: '#0ea5e9' },
  { value: 'ENTERTAINMENT', label: 'Giải trí', icon: 'party-popper', color: '#d946ef' },
  { value: 'MISC_TASKS', label: 'Tạp vụ', icon: 'hand-heart', color: '#14b8a6' },
  { value: 'OTHER', label: 'Khác', icon: 'dots-horizontal-circle', color: '#64748b' },
];
