// Validation utilities
export const validatePhone = (phone: string): boolean => {
  // Vietnamese phone number validation (10 digits, starts with 0)
  const phoneRegex = /^0\d{9}$/;
  return phoneRegex.test(phone);
};

export const validatePassword = (password: string): boolean => {
  // At least 6 characters
  return password.length >= 6;
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

