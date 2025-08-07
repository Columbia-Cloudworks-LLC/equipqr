// Text formatting utilities
export const formatStatus = (status: string): string => {
  return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

export const formatPriority = (priority: string): string => {
  return priority.charAt(0).toUpperCase() + priority.slice(1);
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString();
};

export const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleString();
};