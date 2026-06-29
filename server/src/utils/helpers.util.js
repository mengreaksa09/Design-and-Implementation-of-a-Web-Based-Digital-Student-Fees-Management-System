const { v4: uuidv4 } = require('uuid');

// Generate unique receipt number
const generateReceiptNumber = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  return `RCP-${year}${month}${day}-${random}`;
};

// Generate unique student ID
const generateStudentId = (prefix = 'STU') => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const random = Math.floor(Math.random() * 100000)
    .toString()
    .padStart(5, '0');
  return `${prefix}${year}${random}`;
};

// Generate unique transaction ID
const generateTransactionId = () => {
  const date = new Date();
  const timestamp = date.getTime().toString(36).toUpperCase();
  const random = uuidv4().split('-')[0].toUpperCase();
  return `TXN-${timestamp}-${random}`;
};

// Get today's local date string in YYYY-MM-DD format
const getTodayStr = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Calculate late fee
const calculateLateFee = (
  dueDate,
  amount,
  lateFeePercentage = 0,
  lateFeeAmount = 0,
  gracePeriodDays = 0
) => {
  if (!dueDate) return { isOverdue: false, daysOverdue: 0, lateFee: 0 };
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let due;
  if (typeof dueDate === 'string') {
    const [year, month, day] = dueDate.split('-').map(Number);
    due = new Date(year, month - 1, day);
  } else {
    due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
  }

  const diffTime = today - due;
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= gracePeriodDays) {
    return { isOverdue: false, daysOverdue: 0, lateFee: 0 };
  }

  const daysOverdue = diffDays - gracePeriodDays;
  let lateFee = 0;

  if (lateFeePercentage > 0) {
    lateFee = (amount * lateFeePercentage) / 100;
  } else if (lateFeeAmount > 0) {
    lateFee = lateFeeAmount;
  }

  return {
    isOverdue: true,
    daysOverdue,
    lateFee: parseFloat(lateFee.toFixed(2)),
  };
};

// Format currency
const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

// Paginate results
const paginate = (page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  return {
    limit: parseInt(limit),
    offset: parseInt(offset),
  };
};

// Build pagination response
const buildPaginationResponse = (data, count, page, limit) => {
  const totalPages = Math.ceil(count / limit);
  return {
    data,
    pagination: {
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
};

// Parse date range
const parseDateRange = (startDate, endDate) => {
  const start = startDate
    ? new Date(startDate)
    : new Date(new Date().setMonth(new Date().getMonth() - 1));
  const end = endDate ? new Date(endDate) : new Date();

  // Set time to start and end of day
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

// Get academic year
const getCurrentAcademicYear = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  // Academic year typically starts in August/September
  if (month >= 7) {
    // August onwards
    return `${year}-${year + 1}`;
  } else {
    return `${year - 1}-${year}`;
  }
};

// Sanitize search query
const sanitizeSearchQuery = (query) => {
  if (!query) return '';
  return query.replace(/[%_]/g, '').trim();
};

module.exports = {
  getTodayStr,
  generateReceiptNumber,
  generateStudentId,
  generateTransactionId,
  calculateLateFee,
  formatCurrency,
  paginate,
  buildPaginationResponse,
  parseDateRange,
  getCurrentAcademicYear,
  sanitizeSearchQuery,
};
