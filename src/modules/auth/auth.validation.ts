export const validateRegister = (data: {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
}): string | null => {
  if (!data.firstName || data.firstName.trim().length < 2)
    return 'First name must be at least 2 characters';
  if (!data.lastName || data.lastName.trim().length < 2)
    return 'Last name must be at least 2 characters';
  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
    return 'Invalid email address';
  if (!data.password || data.password.length < 6)
    return 'Password must be at least 6 characters';
  return null;
};

export const validateLogin = (data: { email?: string; password?: string }): string | null => {
  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
    return 'Invalid email address';
  if (!data.password) return 'Password is required';
  return null;
};
