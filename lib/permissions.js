/**
 * ANZAAR INTELLIGENCE - PERMISSION PROTOCOLS
 * Defines the access matrix for various system roles.
 */

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  MANAGER: 'manager',
  MODERATOR: 'moderator',
  VIEWER: 'viewer',
  BANNED: 'banned'
};

export const PERMISSIONS = {
  // Vault Access
  VIEW_VAULT: 'view_vault',
  ADD_PRODUCT: 'add_product',
  EDIT_PRODUCT: 'edit_product',
  DELETE_PRODUCT: 'delete_product',
  
  // Tactical Ops
  VIEW_ORDERS: 'view_orders',
  CREATE_ORDER: 'create_order',
  UPDATE_ORDER_STATUS: 'update_order_status',
  DELETE_ORDER: 'delete_order',
  
  // Intelligence
  VIEW_REPORTS: 'view_reports',
  EXPORT_DATA: 'export_data',
  
  // System Core
  MANAGE_USERS: 'manage_users',
  EDIT_SETTINGS: 'edit_settings',
  VIEW_TRASH: 'view_trash',
  PURGE_TRASH: 'purge_trash'
};

// Permission Mapping Matrix
export const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS), // Everything
  
  [ROLES.MANAGER]: [
    PERMISSIONS.VIEW_VAULT,
    PERMISSIONS.ADD_PRODUCT,
    PERMISSIONS.EDIT_PRODUCT,
    PERMISSIONS.VIEW_ORDERS,
    PERMISSIONS.CREATE_ORDER,
    PERMISSIONS.UPDATE_ORDER_STATUS,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.EXPORT_DATA,
    PERMISSIONS.VIEW_TRASH
  ],
  
  [ROLES.MODERATOR]: [
    PERMISSIONS.VIEW_VAULT,
    PERMISSIONS.VIEW_ORDERS,
    PERMISSIONS.UPDATE_ORDER_STATUS,
    PERMISSIONS.CREATE_ORDER
  ],
  
  [ROLES.VIEWER]: [
    PERMISSIONS.VIEW_VAULT,
    PERMISSIONS.VIEW_ORDERS,
    PERMISSIONS.VIEW_REPORTS
  ],
  
  [ROLES.BANNED]: [] // No access
};

/**
 * Checks if a role has a specific permission
 */
export const hasPermission = (userRole, permission) => {
  if (!userRole) return false;
  const permissions = ROLE_PERMISSIONS[userRole] || [];
  return permissions.includes(permission);
};
