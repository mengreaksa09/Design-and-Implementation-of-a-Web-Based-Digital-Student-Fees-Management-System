export const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount || 0);
};

export const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatDateTime = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getStatusColor = (status) => {
  const colors = {
    paid: 'badge-success',
    completed: 'badge-success',
    active: 'badge-success',
    pending: 'badge-warning',
    partial: 'badge-warning',
    overdue: 'badge-danger',
    failed: 'badge-danger',
    inactive: 'badge-danger',
    suspended: 'badge-danger',
  };
  return colors[status] || 'badge-info';
};

export const getFeeTypeLabel = (type) => {
  const labels = {
    tuition: 'Tuition Fee',
    exam: 'Exam Fee',
    library: 'Library Fee',
    transport: 'Transport Fee',
    laboratory: 'Laboratory Fee',
    sports: 'Sports Fee',
    hostel: 'Hostel Fee',
    other: 'Other Fee',
  };
  return labels[type] || type;
};

export const getPaymentMethodLabel = (method) => {
  const labels = {
    cash: 'Cash',
    card: 'Credit/Debit Card',
    bank_transfer: 'Bank Transfer',
    mobile_payment: 'Mobile Payment',
    cheque: 'Cheque',
    online: 'Online Payment',
  };
  return labels[method] || method;
};

export const getTodayStr = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const isOverdue = (dueDate) => {
  if (!dueDate) return false;
  // Parse dueDate if it contains a timestamp, but usually it is just YYYY-MM-DD
  const dateOnly = typeof dueDate === 'string' ? dueDate.split('T')[0] : '';
  if (!dateOnly) return false;
  return dateOnly < getTodayStr();
};
