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
  { value: 'PLUMBING', label: 'Plumbing' },
  { value: 'ELECTRICAL', label: 'Electrical' },
  { value: 'CARPENTRY', label: 'Carpentry' },
  { value: 'PAINTING', label: 'Painting' },
  { value: 'CLEANING', label: 'Cleaning' },
  { value: 'AC_REPAIR', label: 'AC Repair' },
  { value: 'APPLIANCE_REPAIR', label: 'Appliance Repair' },
  { value: 'MASONRY', label: 'Masonry' },
  { value: 'GARDENING', label: 'Gardening' },
  { value: 'OTHER', label: 'Other' },
];

