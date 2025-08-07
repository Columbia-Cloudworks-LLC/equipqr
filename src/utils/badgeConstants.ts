// Priority color mappings for consistent badge styling
export const PRIORITY_COLORS = {
  high: 'bg-red-100 text-red-800 border-red-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  low: 'bg-green-100 text-green-800 border-green-200',
  default: 'bg-gray-100 text-gray-800 border-gray-200'
} as const;

// Status color mappings for consistent badge styling
export const STATUS_COLORS = {
  completed: 'bg-green-100 text-green-800 border-green-200',
  in_progress: 'bg-blue-100 text-blue-800 border-blue-200',
  assigned: 'bg-purple-100 text-purple-800 border-purple-200',
  submitted: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  accepted: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  on_hold: 'bg-orange-100 text-orange-800 border-orange-200',
  cancelled: 'bg-gray-100 text-gray-800 border-gray-200',
  default: 'bg-gray-100 text-gray-800 border-gray-200'
} as const;

// Equipment status colors
export const EQUIPMENT_STATUS_COLORS = {
  active: 'bg-green-100 text-green-800 border-green-200',
  maintenance: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  inactive: 'bg-gray-100 text-gray-800 border-gray-200',
  default: 'bg-gray-100 text-gray-800 border-gray-200'
} as const;