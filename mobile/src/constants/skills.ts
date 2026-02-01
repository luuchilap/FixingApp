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
  | 'OTHER';

export interface SkillOption {
  value: SkillValue;
  label: string;
}

export const SKILLS: SkillOption[] = [
  { value: 'PLUMBING', label: 'Thợ sửa ống nước' },
  { value: 'ELECTRICAL', label: 'Thợ điện' },
  { value: 'CARPENTRY', label: 'Thợ mộc' },
  { value: 'PAINTING', label: 'Thợ sơn' },
  { value: 'CLEANING', label: 'Dọn dẹp' },
  { value: 'AC_REPAIR', label: 'Sửa điều hòa' },
  { value: 'APPLIANCE_REPAIR', label: 'Sửa thiết bị' },
  { value: 'MASONRY', label: 'Thợ xây' },
  { value: 'GARDENING', label: 'Làm vườn' },
  { value: 'OTHER', label: 'Khác' },
];

