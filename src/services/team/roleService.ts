// Add this function if it doesn't exist in the file
export const hasRolePermission = (
  role: string | null | undefined, 
  requiredRole: string
): boolean => {
  // Simple role hierarchy: manager > technician > viewer
  const roles = ['viewer', 'technician', 'manager'];
  
  // If no role provided, no permissions
  if (!role) return false;
  
  const userRoleIndex = roles.indexOf(role);
  const requiredRoleIndex = roles.indexOf(requiredRole);
  
  // If either role is not in our hierarchy, deny permission
  if (userRoleIndex === -1 || requiredRoleIndex === -1) {
    return false;
  }
  
  // User has permission if their role is equal to or higher than required role
  return userRoleIndex >= requiredRoleIndex;
};
