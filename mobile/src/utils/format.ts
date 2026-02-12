/**
 * Shared formatting and parsing utilities
 * Eliminates duplicate implementations across screens
 */

/**
 * Parse a timestamp value (seconds, milliseconds, string, Date) into a Date object.
 */
export const parseTimestamp = (timestamp: string | number | null | undefined): Date | null => {
  if (!timestamp) return null;

  let numValue: number;
  if (typeof timestamp === 'string') {
    numValue = Number(timestamp);
    if (isNaN(numValue)) {
      const date = new Date(timestamp);
      return isNaN(date.getTime()) ? null : date;
    }
  } else {
    numValue = timestamp;
  }

  // If timestamp is in seconds (less than year 2001 in ms), convert to ms
  if (numValue < 100000000000) {
    return new Date(numValue * 1000);
  }
  return new Date(numValue);
};

/**
 * Format a price as Vietnamese currency string.
 */
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(price);
};

/**
 * Map job/application status codes to Vietnamese labels.
 */
export const getStatusLabel = (status: string): string => {
  const statusMap: Record<string, string> = {
    'CHUA_LAM': 'Đang nhận đơn',
    'DANG_BAN_GIAO': 'Đang bàn giao',
    'DA_XONG': 'Đã hoàn thành',
    'OPEN': 'Mở',
    'IN_PROGRESS': 'Đang thực hiện',
    'COMPLETED': 'Đã hoàn thành',
    'CANCELLED': 'Đã hủy',
    'APPLIED': 'Đã ứng tuyển',
    'ACCEPTED': 'Được chấp nhận',
    'REJECTED': 'Bị từ chối',
    'PENDING': 'Chờ xử lý',
  };
  return statusMap[status] || status;
};

/**
 * Map status codes to display colors.
 */
export const getStatusColor = (status: string, colors: { success: Record<number, string>; warning: Record<number, string>; primary: Record<number, string>; error: Record<number, string>; neutral: Record<number, string> }): string => {
  const colorMap: Record<string, string> = {
    'CHUA_LAM': colors.success[500],
    'DANG_BAN_GIAO': colors.warning[500],
    'DA_XONG': colors.primary[500],
    'OPEN': colors.success[500],
    'IN_PROGRESS': colors.warning[500],
    'COMPLETED': colors.primary[500],
    'CANCELLED': colors.error[500],
    'APPLIED': colors.primary[500],
    'ACCEPTED': colors.success[500],
    'REJECTED': colors.error[500],
    'PENDING': colors.warning[500],
  };
  return colorMap[status] || colors.neutral[500];
};
