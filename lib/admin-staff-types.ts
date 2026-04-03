import { AdminPermissions } from "./store/slices/authSlice";

export interface AdminStaff {
  id: number;
  admin_unique_id: string;
  first_name: string;
  last_name: string;
  email: string;
  admin_role: "super_admin" | "admin_staff";
  title: string | null;
  active: boolean;
  permissions: AdminPermissions;
  last_sign_in_at: string | null;
  created_at: string;
}

export const ADMIN_PERMISSION_PRESETS = {
  full_access: {
    name: "Full Access",
    description: "Complete access to all sections and actions",
    permissions: {
      accounts: { view: true, suspend: true, activate: true },
      businesses: { view: true, verify: true, suspend: true, activate: true, set_commission: true },
      support_tickets: { view: true, reply: true, assign: true, update_status: true },
      finance: { view: true, manage_payouts: true },
      configurations: { view: true, edit: true },
      staff: { view: true, invite: true, edit: true, deactivate: true },
      activities: { view: true },
    } as AdminPermissions,
  },
  support_agent: {
    name: "Support Agent",
    description: "Handle support tickets and view accounts/businesses",
    permissions: {
      support_tickets: { view: true, reply: true, assign: true, update_status: true },
      accounts: { view: true },
      businesses: { view: true },
    } as AdminPermissions,
  },
  moderator: {
    name: "Moderator",
    description: "Manage businesses and accounts",
    permissions: {
      businesses: { view: true, verify: true, suspend: true, activate: true, set_commission: true },
      accounts: { view: true, suspend: true, activate: true },
    } as AdminPermissions,
  },
  finance: {
    name: "Finance",
    description: "Manage financial operations",
    permissions: {
      finance: { view: true, manage_payouts: true },
      businesses: { view: true },
      accounts: { view: true },
    } as AdminPermissions,
  },
  viewer: {
    name: "Viewer",
    description: "Read-only access to all sections",
    permissions: {
      accounts: { view: true },
      businesses: { view: true },
      support_tickets: { view: true },
      finance: { view: true },
      configurations: { view: true },
      staff: { view: true },
      activities: { view: true },
    } as AdminPermissions,
  },
  custom: {
    name: "Custom",
    description: "Configure permissions manually",
    permissions: {} as AdminPermissions,
  },
} as const;

export const ADMIN_PERMISSION_LABELS = {
  accounts: {
    title: "Accounts",
    actions: {
      view: "View Accounts",
      suspend: "Suspend Accounts",
      activate: "Activate Accounts",
    },
  },
  businesses: {
    title: "Businesses",
    actions: {
      view: "View Businesses",
      verify: "Verify / Reject / Ban / Unban Bank Accounts",
      suspend: "Suspend Businesses",
      activate: "Activate Businesses",
      set_commission: "Set Commission Rate",
    },
  },
  support_tickets: {
    title: "Support Tickets",
    actions: {
      view: "View Tickets",
      reply: "Reply to Tickets",
      assign: "Assign Tickets",
      update_status: "Update Status",
    },
  },
  finance: {
    title: "Finance",
    actions: {
      view: "View Finance",
      manage_payouts: "Manage Payouts",
    },
  },
  configurations: {
    title: "Configurations",
    actions: {
      view: "View Configurations",
      edit: "Edit Configurations",
    },
  },
  staff: {
    title: "Staff",
    actions: {
      view: "View Staff",
      invite: "Invite Staff",
      edit: "Edit Staff",
      deactivate: "Deactivate Staff",
    },
  },
  activities: {
    title: "Activities",
    actions: {
      view: "View Activity Logs",
    },
  },
} as const;
