/**
 * Available skills for jobs and workers
 * These are the fixed skill options that can be selected
 */

export type SkillValue =
  | "PLUMBING"
  | "ELECTRICAL"
  | "CARPENTRY"
  | "PAINTING"
  | "CLEANING"
  | "AC_REPAIR"
  | "APPLIANCE_REPAIR"
  | "MASONRY"
  | "GARDENING"
  | "OTHER";

export interface SkillOption {
  value: SkillValue;
  label: string; // Vietnamese label
  labelEn: string; // English label for reference
}

export const SKILLS: SkillOption[] = [
  { value: "PLUMBING", label: "Sửa ống nước", labelEn: "Plumbing" },
  { value: "ELECTRICAL", label: "Điện", labelEn: "Electrical" },
  { value: "CARPENTRY", label: "Mộc", labelEn: "Carpentry" },
  { value: "PAINTING", label: "Sơn", labelEn: "Painting" },
  { value: "CLEANING", label: "Dọn dẹp", labelEn: "Cleaning" },
  { value: "AC_REPAIR", label: "Sửa máy lạnh", labelEn: "AC Repair" },
  {
    value: "APPLIANCE_REPAIR",
    label: "Sửa đồ điện tử",
    labelEn: "Appliance Repair",
  },
  { value: "MASONRY", label: "Xây dựng", labelEn: "Masonry" },
  { value: "GARDENING", label: "Làm vườn", labelEn: "Gardening" },
  { value: "OTHER", label: "Khác", labelEn: "Other" },
];

/**
 * Get skill label by value
 */
export function getSkillLabel(value: string | null | undefined): string {
  if (!value) return "Bất kỳ";
  const skill = SKILLS.find((s) => s.value === value);
  return skill ? skill.label : "Khác";
}

/**
 * Normalize skill value - maps old skill values to new ones
 * Used for backward compatibility with existing data
 */
export function normalizeSkill(skill: string | null | undefined): SkillValue | null {
  if (!skill) return null;
  
  const upperSkill = skill.toUpperCase().trim();
  
  // Map old values to new ones
  const skillMap: Record<string, SkillValue> = {
    PLUMBING: "PLUMBING",
    ELECTRICAL: "ELECTRICAL",
    CARPENTRY: "CARPENTRY",
    PAINTING: "PAINTING",
    CLEANING: "CLEANING",
    "AC REPAIR": "AC_REPAIR",
    AC_REPAIR: "AC_REPAIR",
    "APPLIANCE REPAIR": "APPLIANCE_REPAIR",
    APPLIANCE_REPAIR: "APPLIANCE_REPAIR",
    MASONRY: "MASONRY",
    GARDENING: "GARDENING",
    OTHER: "OTHER",
  };
  
  // Check if it's a known skill
  if (skillMap[upperSkill]) {
    return skillMap[upperSkill];
  }
  
  // If not found, return OTHER
  return "OTHER";
}

/**
 * Check if a skill value is valid
 */
export function isValidSkill(value: string | null | undefined): boolean {
  if (!value) return false;
  return SKILLS.some((s) => s.value === value);
}

