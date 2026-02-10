/**
 * Normalize skill value - maps skill values to standardized ones
 * If skill doesn't match any known skill, returns 'OTHER'
 */
function normalizeSkill(skill) {
    if (!skill) return null;

    const upperSkill = skill.toUpperCase().trim();

    // Valid skill values (must match frontend constants)
    const validSkills = [
        'PLUMBING',
        'ELECTRICAL',
        'CARPENTRY',
        'PAINTING',
        'CLEANING',
        'AC_REPAIR',
        'APPLIANCE_REPAIR',
        'MASONRY',
        'GARDENING',
        'OTHER'
    ];

    // Check if it's already a valid skill
    if (validSkills.includes(upperSkill)) {
        return upperSkill;
    }

    // Map old/common variations to new standardized values
    const skillMap = {
        'PLUMBING': 'PLUMBING',
        'ELECTRICAL': 'ELECTRICAL',
        'CARPENTRY': 'CARPENTRY',
        'PAINTING': 'PAINTING',
        'CLEANING': 'CLEANING',
        'AC REPAIR': 'AC_REPAIR',
        'AC_REPAIR': 'AC_REPAIR',
        'APPLIANCE REPAIR': 'APPLIANCE_REPAIR',
        'APPLIANCE_REPAIR': 'APPLIANCE_REPAIR',
        'MASONRY': 'MASONRY',
        'GARDENING': 'GARDENING',
        'OTHER': 'OTHER'
    };

    // Check if it's a known variation
    if (skillMap[upperSkill]) {
        return skillMap[upperSkill];
    }

    // If not found, return OTHER
    return 'OTHER';
}

module.exports = {
    normalizeSkill
};
