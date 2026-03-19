import { PERMISSION_IDS } from '../../constants/permissions.constants'

export type MenuItemType = {
  key: string
  label: string
  isTitle?: boolean
  icon?: string
  url?: string
  badge?: {
    variant: string
    text: string
  }
  parentKey?: string
  isDisabled?: boolean
  collapsed?: boolean
  children?: MenuItemType[]
  requiredPermissions?: string[]
  permissionOperator?: 'AND' | 'OR'
}

export type SubMenus = {
  item: MenuItemType
  linkClassName?: string
  subMenuClassName?: string
  activeMenuItems?: Array<string>
  toggleMenu?: (item: MenuItemType, status: boolean) => void
  className?: string
}

export const MENU_ITEMS: MenuItemType[] = [
  {
    key: 'RESUME',
    label: 'RESUME',
    isTitle: true,
  },
  {
    key: 'DASHBOARD',
    label: 'DASHBOARD',
    icon: 'ti-dashboard',
    url: '/dashboard',
    requiredPermissions: [PERMISSION_IDS.DASHBOARD_VIEW],
  },
  {
    key: 'SYSTEM_MANAGEMENT',
    label: 'SYSTEM_MANAGEMENT',
    isTitle: true,
    requiredPermissions: [
      PERMISSION_IDS.USERS,
      PERMISSION_IDS.ROLES,
      PERMISSION_IDS.BRANCHES,
      PERMISSION_IDS.COMPANIES,
    ],
    permissionOperator: 'OR',
  },
  {
    key: 'USERS',
    label: 'USERS',
    icon: 'ti-user',
    url: '/users-management/users',
    requiredPermissions: [PERMISSION_IDS.USERS],
  },
  {
    key: 'PATIENTS',
    label: 'PATIENTS',
    icon: 'ti-user-heart',
    url: '/patients',
    requiredPermissions: [PERMISSION_IDS.PATIENTS],
  },
  {
    key: 'FEEDBACK_USER',
    label: 'FEEDBACK_USER',
    icon: 'ti-message-report',
    url: '/feedback',
    requiredPermissions: [PERMISSION_IDS.FEEDBACK],
  },
  {
    key: 'NOTIFICATIONS',
    label: 'NOTIFICATIONS',
    icon: 'ti-bell-ringing',
    url: '/notifications',
    requiredPermissions: [PERMISSION_IDS.WHATSAPP_MODULE],
  },
  {
    key: 'FEEDBACK_ADMIN',
    label: 'FEEDBACK_ADMIN',
    icon: 'ti-message-2-cog',
    url: '/system-management/feedback',
  },
  {
    key: 'ROLES_AND_PERMISSIONS',
    label: 'ROLES_AND_PERMISSIONS',
    icon: 'ti-user-shield',
    url: '/system-management/roles-and-permissions',
    requiredPermissions: [PERMISSION_IDS.ROLES],
  },
  {
    key: 'BRANCHES',
    label: 'BRANCHES',
    icon: 'ti-building',
    url: '/branches',
    requiredPermissions: [PERMISSION_IDS.BRANCHES],
  },
  {
    key: 'COMPANIES',
    label: 'COMPANIES',
    icon: 'ti-building-community',
    url: '/companies',
    requiredPermissions: [PERMISSION_IDS.COMPANIES],
  },
  {
    key: 'INVENTORY_MANAGEMENT',
    label: 'INVENTORY_MANAGEMENT',
    isTitle: true,
    requiredPermissions: [
      PERMISSION_IDS.CATEGORIES,
      PERMISSION_IDS.SUPPLIERS,
      PERMISSION_IDS.INVENTORY,
    ],
    permissionOperator: 'OR',
  },
  {
    key: 'CATEGORIES',
    label: 'CATEGORIES',
    icon: 'ti-category',
    url: '/categories',
    requiredPermissions: [PERMISSION_IDS.CATEGORIES],
  },
  {
    key: 'SUPPLIERS',
    label: 'SUPPLIERS',
    icon: 'ti-building-store',
    url: '/suppliers',
    requiredPermissions: [PERMISSION_IDS.SUPPLIERS],
  },
  {
    key: 'INVENTORY',
    label: 'INVENTORY',
    icon: 'ti-package',
    url: '/inventory',
    requiredPermissions: [PERMISSION_IDS.INVENTORY],
  },
  {
    key: 'SHIFT_MANAGEMENT_SECTION',
    label: 'SHIFT_MANAGEMENT_SECTION',
    isTitle: true,
    requiredPermissions: [
      PERMISSION_IDS.SHIFT_MANAGEMENT,
      PERMISSION_IDS.CALENDAR,
    ],
    permissionOperator: 'OR',
  },
  {
    key: 'SHIFT_MANAGEMENT',
    label: 'SHIFT_MANAGEMENT',
    icon: 'ti-calendar',
    url: '/shift-management',
    requiredPermissions: [PERMISSION_IDS.SHIFT_MANAGEMENT],
  },
  {
    key: 'CALENDAR',
    label: 'CALENDAR',
    icon: 'ti-calendar',
    url: '/calendar',
    requiredPermissions: [PERMISSION_IDS.CALENDAR],
  },
  {
    key: 'CLINICAL_MANAGEMENT',
    label: 'CLINICAL_MANAGEMENT',
    isTitle: true,
    requiredPermissions: [
      PERMISSION_IDS.MEDICAL_HISTORY,
      PERMISSION_IDS.MEDICAL_HISTORY_CONFIGURATION,
    ],
    permissionOperator: 'OR',
  },
  {
    key: 'MEDICAL_HISTORY',
    label: 'MEDICAL_HISTORY',
    icon: 'ti-file-text',
    url: '/medical-history',
    requiredPermissions: [PERMISSION_IDS.MEDICAL_HISTORY],
  },
  {
    key: 'MEDICAL_HISTORY_CONFIGURATION',
    label: 'MEDICAL_HISTORY_CONFIGURATION',
    icon: 'fa ti-settings',
    url: '/medical-history-configuration',
    requiredPermissions: [PERMISSION_IDS.MEDICAL_HISTORY_CONFIGURATION],
  },
  {
    key: 'LABORATORY_SECTION',
    label: 'LABORATORY_SECTION',
    isTitle: true,
    requiredPermissions: [PERMISSION_IDS.LABORATORY_ORDERS],
  },
  {
    key: 'LABORATORY_ORDERS',
    label: 'LABORATORY_ORDERS',
    icon: 'ti-test-pipe',
    url: '/laboratory-orders',
    requiredPermissions: [PERMISSION_IDS.LABORATORY_ORDERS],
  },
]

export const HORIZONTAL_MENU_ITEM: MenuItemType[] = [
  {
    key: 'dashboards',
    label: 'Dashboards',
    icon: 'ti-dashboard',
    children: [
      {
        key: 'sales',
        label: 'Sales',
        url: '/dashboards/sales',
        parentKey: 'dashboards',
      },
      {
        key: 'clinic',
        label: 'Clinic',
        url: '/dashboards/clinic',
        parentKey: 'dashboards',
      },
      {
        key: 'wallet',
        label: 'eWallet',
        url: '/dashboards/wallet',
        parentKey: 'dashboards',
      },
    ],
  },
]
