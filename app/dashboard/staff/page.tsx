"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  useGetAdminStaffQuery,
  useInviteAdminStaffMutation,
  useUpdateAdminStaffMutation,
  useDeactivateAdminStaffMutation,
} from "@/lib/store/services/api";
import {
  ADMIN_PERMISSION_PRESETS,
  ADMIN_PERMISSION_LABELS,
  AdminStaff,
} from "@/lib/admin-staff-types";
import type { AdminPermissions } from "@/lib/store/slices/authSlice";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

type PresetKey = keyof typeof ADMIN_PERMISSION_PRESETS;

const EMPTY_INVITE = {
  first_name: "",
  last_name: "",
  email: "",
  admin_role: "admin_staff" as "super_admin" | "admin_staff",
  title: "",
};

function buildPermissionsFromPreset(preset: PresetKey): AdminPermissions {
  if (preset === "custom") return {};
  return { ...ADMIN_PERMISSION_PRESETS[preset].permissions } as AdminPermissions;
}

function detectPreset(permissions: AdminPermissions): PresetKey {
  for (const key of Object.keys(ADMIN_PERMISSION_PRESETS) as PresetKey[]) {
    if (key === "custom") continue;
    const p = ADMIN_PERMISSION_PRESETS[key].permissions as AdminPermissions;
    if (JSON.stringify(p) === JSON.stringify(permissions)) return key;
  }
  return "custom";
}

// ── Permission toggles UI ─────────────────────────────────────────────────────
function PermissionToggles({
  permissions,
  onChange,
}: {
  permissions: AdminPermissions;
  onChange: (p: AdminPermissions) => void;
}) {
  return (
    <div className="space-y-4">
      {(Object.keys(ADMIN_PERMISSION_LABELS) as (keyof typeof ADMIN_PERMISSION_LABELS)[]).map((section) => {
        const sectionLabel = ADMIN_PERMISSION_LABELS[section];
        const sectionPerms = (permissions as Record<string, Record<string, boolean>>)[section] ?? {};
        return (
          <div key={section}>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              {sectionLabel.title}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(sectionLabel.actions) as string[]).map((action) => {
                const label = (sectionLabel.actions as Record<string, string>)[action];
                const checked = sectionPerms[action] === true;
                return (
                  <label key={action} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        const updated = {
                          ...(permissions as Record<string, Record<string, boolean>>),
                          [section]: { ...sectionPerms, [action]: e.target.checked },
                        };
                        onChange(updated as AdminPermissions);
                      }}
                      className="rounded"
                    />
                    <span className="text-sm">{label}</span>
                  </label>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Preset selector UI ────────────────────────────────────────────────────────
function PresetSelector({
  preset,
  permissions,
  onPresetChange,
  onPermissionsChange,
}: {
  preset: PresetKey;
  permissions: AdminPermissions;
  onPresetChange: (p: PresetKey) => void;
  onPermissionsChange: (p: AdminPermissions) => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <label className="label">Permission Preset</label>
        <select
          className="input"
          value={preset}
          onChange={(e) => {
            const p = e.target.value as PresetKey;
            onPresetChange(p);
            if (p !== "custom") onPermissionsChange(buildPermissionsFromPreset(p));
          }}
        >
          {(Object.keys(ADMIN_PERMISSION_PRESETS) as PresetKey[]).map((k) => (
            <option key={k} value={k}>
              {ADMIN_PERMISSION_PRESETS[k].name}
            </option>
          ))}
        </select>
      </div>
      {preset !== "custom" ? (
        <p className="text-sm text-muted-foreground">
          {ADMIN_PERMISSION_PRESETS[preset].description}
        </p>
      ) : (
        <PermissionToggles permissions={permissions} onChange={onPermissionsChange} />
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function StaffManagementPage() {
  const { admin } = useAuth();

  // List state
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Actions menu
  const [openActionsMenu, setOpenActionsMenu] = useState<number | null>(null);

  // Invite modal
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({ ...EMPTY_INVITE });
  const [invitePreset, setInvitePreset] = useState<PresetKey>("viewer");
  const [invitePermissions, setInvitePermissions] = useState<AdminPermissions>(
    buildPermissionsFromPreset("viewer")
  );
  const [inviteError, setInviteError] = useState<string | null>(null);

  // Edit modal
  const [editingStaff, setEditingStaff] = useState<AdminStaff | null>(null);
  const [editForm, setEditForm] = useState<{
    admin_role: "super_admin" | "admin_staff";
    title: string;
  }>({ admin_role: "admin_staff", title: "" });
  const [editPreset, setEditPreset] = useState<PresetKey>("custom");
  const [editPermissions, setEditPermissions] = useState<AdminPermissions>({});
  const [editError, setEditError] = useState<string | null>(null);

  // Deactivate dialog
  const [deactivatingStaff, setDeactivatingStaff] = useState<AdminStaff | null>(null);
  const [deactivateError, setDeactivateError] = useState<string | null>(null);

  const [inviteAdminStaff, { isLoading: isInviting }] = useInviteAdminStaffMutation();
  const [updateAdminStaff, { isLoading: isUpdating }] = useUpdateAdminStaffMutation();
  const [deactivateAdminStaff, { isLoading: isDeactivating }] = useDeactivateAdminStaffMutation();

  // Access guard — no API calls for non-super-admins
  if (admin?.admin_role !== "super_admin") {
    return (
      <div className="p-8">
        <div className="glass p-12 rounded-3xl text-center">
          <svg className="w-16 h-16 mx-auto text-muted-foreground/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <h2 className="text-2xl font-bold mt-4">Access Denied</h2>
          <p className="text-muted-foreground mt-2">Only super admins can manage staff.</p>
        </div>
      </div>
    );
  }

  return <StaffPageContent
    admin={admin}
    page={page} setPage={setPage}
    searchQuery={searchQuery} setSearchQuery={setSearchQuery}
    debouncedSearch={debouncedSearch} setDebouncedSearch={setDebouncedSearch}
    roleFilter={roleFilter} setRoleFilter={setRoleFilter}
    debounceRef={debounceRef}
    openActionsMenu={openActionsMenu} setOpenActionsMenu={setOpenActionsMenu}
    showInviteModal={showInviteModal} setShowInviteModal={setShowInviteModal}
    inviteForm={inviteForm} setInviteForm={setInviteForm}
    invitePreset={invitePreset} setInvitePreset={setInvitePreset}
    invitePermissions={invitePermissions} setInvitePermissions={setInvitePermissions}
    inviteError={inviteError} setInviteError={setInviteError}
    editingStaff={editingStaff} setEditingStaff={setEditingStaff}
    editForm={editForm} setEditForm={setEditForm}
    editPreset={editPreset} setEditPreset={setEditPreset}
    editPermissions={editPermissions} setEditPermissions={setEditPermissions}
    editError={editError} setEditError={setEditError}
    deactivatingStaff={deactivatingStaff} setDeactivatingStaff={setDeactivatingStaff}
    deactivateError={deactivateError} setDeactivateError={setDeactivateError}
    inviteAdminStaff={inviteAdminStaff} isInviting={isInviting}
    updateAdminStaff={updateAdminStaff} isUpdating={isUpdating}
    deactivateAdminStaff={deactivateAdminStaff} isDeactivating={isDeactivating}
  />;
}

// ── Inner content (hooks called unconditionally) ──────────────────────────────
function StaffPageContent({
  admin,
  page, setPage,
  searchQuery, setSearchQuery,
  debouncedSearch, setDebouncedSearch,
  roleFilter, setRoleFilter,
  debounceRef,
  openActionsMenu, setOpenActionsMenu,
  showInviteModal, setShowInviteModal,
  inviteForm, setInviteForm,
  invitePreset, setInvitePreset,
  invitePermissions, setInvitePermissions,
  inviteError, setInviteError,
  editingStaff, setEditingStaff,
  editForm, setEditForm,
  editPreset, setEditPreset,
  editPermissions, setEditPermissions,
  editError, setEditError,
  deactivatingStaff, setDeactivatingStaff,
  deactivateError, setDeactivateError,
  inviteAdminStaff, isInviting,
  updateAdminStaff, isUpdating,
  deactivateAdminStaff, isDeactivating,
}: {
  admin: NonNullable<ReturnType<typeof useAuth>["admin"]>;
  page: number; setPage: (p: number) => void;
  searchQuery: string; setSearchQuery: (s: string) => void;
  debouncedSearch: string; setDebouncedSearch: (s: string) => void;
  roleFilter: string; setRoleFilter: (r: string) => void;
  debounceRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>;
  openActionsMenu: number | null; setOpenActionsMenu: (n: number | null) => void;
  showInviteModal: boolean; setShowInviteModal: (b: boolean) => void;
  inviteForm: typeof EMPTY_INVITE; setInviteForm: (f: typeof EMPTY_INVITE) => void;
  invitePreset: PresetKey; setInvitePreset: (p: PresetKey) => void;
  invitePermissions: AdminPermissions; setInvitePermissions: (p: AdminPermissions) => void;
  inviteError: string | null; setInviteError: (e: string | null) => void;
  editingStaff: AdminStaff | null; setEditingStaff: (s: AdminStaff | null) => void;
  editForm: { admin_role: "super_admin" | "admin_staff"; title: string };
  setEditForm: (f: { admin_role: "super_admin" | "admin_staff"; title: string }) => void;
  editPreset: PresetKey; setEditPreset: (p: PresetKey) => void;
  editPermissions: AdminPermissions; setEditPermissions: (p: AdminPermissions) => void;
  editError: string | null; setEditError: (e: string | null) => void;
  deactivatingStaff: AdminStaff | null; setDeactivatingStaff: (s: AdminStaff | null) => void;
  deactivateError: string | null; setDeactivateError: (e: string | null) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  inviteAdminStaff: (req: any) => { unwrap: () => Promise<any> }; isInviting: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateAdminStaff: (req: any) => { unwrap: () => Promise<any> }; isUpdating: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  deactivateAdminStaff: (id: any) => { unwrap: () => Promise<any> }; isDeactivating: boolean;
}) {
  const { data, isLoading, isError, isFetching } = useGetAdminStaffQuery({
    page,
    search: debouncedSearch || undefined,
    role: roleFilter !== "all" ? roleFilter : undefined,
  });

  const staffList = data?.staff ?? [];
  const meta = data?.meta;

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    setPage(1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(value), 400);
  }, [setSearchQuery, setPage, setDebouncedSearch, debounceRef]);

  // Close actions menu on outside click
  useEffect(() => {
    const handler = () => setOpenActionsMenu(null);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [setOpenActionsMenu]);

  function openEdit(staff: AdminStaff) {
    setEditingStaff(staff);
    setEditForm({ admin_role: staff.admin_role, title: staff.title ?? "" });
    const preset = detectPreset(staff.permissions);
    setEditPreset(preset);
    setEditPermissions(staff.permissions);
    setEditError(null);
  }

  async function handleInviteSubmit(e: React.FormEvent) {
    e.preventDefault();
    setInviteError(null);
    try {
      await inviteAdminStaff({
        admin: {
          ...inviteForm,
          permissions: invitePermissions as Record<string, Record<string, boolean>>,
        },
      }).unwrap();
      toast.success("Staff member invited successfully");
      setShowInviteModal(false);
      setInviteForm({ ...EMPTY_INVITE });
      setInvitePreset("viewer");
      setInvitePermissions(buildPermissionsFromPreset("viewer"));
    } catch (err: unknown) {
      const e = err as { status?: number; data?: { error?: string } };
      if (e?.status === 422) {
        setInviteError(e?.data?.error ?? "Validation failed");
      } else {
        toast.error("Failed to invite staff member");
      }
    }
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingStaff) return;
    setEditError(null);
    try {
      await updateAdminStaff({
        id: editingStaff.id,
        admin: {
          ...editForm,
          title: editForm.title || null,
          permissions: editPermissions as Record<string, Record<string, boolean>>,
        },
      }).unwrap();
      toast.success("Staff member updated");
      setEditingStaff(null);
    } catch (err: unknown) {
      const e = err as { status?: number; data?: { error?: string } };
      if (e?.status === 422) {
        setEditError(e?.data?.error ?? "Validation failed");
      } else {
        toast.error("Failed to update staff member");
      }
    }
  }

  async function handleDeactivate() {
    if (!deactivatingStaff) return;
    setDeactivateError(null);
    try {
      await deactivateAdminStaff(deactivatingStaff.id).unwrap();
      toast.success(`${deactivatingStaff.first_name} has been deactivated`);
      setDeactivatingStaff(null);
    } catch (err: unknown) {
      const e = err as { status?: number; data?: { error?: string } };
      if (e?.status === 422) {
        setDeactivateError(e?.data?.error ?? "Cannot deactivate");
      } else {
        toast.error("Failed to deactivate staff member");
      }
    }
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Staff Management</h1>
          <p className="text-muted-foreground mt-1">Manage admin staff and their permissions</p>
        </div>
        <button
          onClick={() => { setShowInviteModal(true); setInviteError(null); }}
          className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:bg-primary/90 transition-colors"
        >
          Invite Staff
        </button>
      </div>

      {/* Filters */}
      <div className="glass p-6 rounded-3xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="label">Search</label>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search by name or email..."
                className="input pl-10"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="label">Role</label>
            <select className="input" value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}>
              <option value="all">All Roles</option>
              <option value="super_admin">Super Admin</option>
              <option value="admin_staff">Admin Staff</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="glass p-6 rounded-3xl overflow-x-auto">
        {isError && (
          <div className="text-center py-12 text-red-500">Failed to load staff. Please try again.</div>
        )}
        {(isLoading || isFetching) && !isError && (
          <div className="text-center py-12">
            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
            <p className="text-sm text-muted-foreground mt-4">Loading staff...</p>
          </div>
        )}
        {!isLoading && !isFetching && !isError && (
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-muted-foreground border-b border-border">
                <th className="pb-4 font-medium">Name</th>
                <th className="pb-4 font-medium">Email</th>
                <th className="pb-4 font-medium">Role</th>
                <th className="pb-4 font-medium">Status</th>
                <th className="pb-4 font-medium">Last Sign-in</th>
                <th className="pb-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {staffList.map((member) => (
                <tr key={member.id} className="group hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center font-bold">
                        {member.first_name[0]}{member.last_name[0]}
                      </div>
                      <div>
                        <p className="font-semibold">{member.first_name} {member.last_name}</p>
                        {member.title && <p className="text-xs text-muted-foreground">{member.title}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 text-sm">{member.email}</td>
                  <td className="py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      member.admin_role === "super_admin"
                        ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                    }`}>
                      {member.admin_role === "super_admin" ? "Super Admin" : "Admin Staff"}
                    </span>
                  </td>
                  <td className="py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      member.active
                        ? "bg-green-100 text-green-600"
                        : "bg-red-100 text-red-600"
                    }`}>
                      {member.active ? "Active" : "Deactivated"}
                    </span>
                  </td>
                  <td className="py-4 text-sm text-muted-foreground">
                    {member.last_sign_in_at ? formatDate(member.last_sign_in_at) : "Never"}
                  </td>
                  <td className="py-4 text-right">
                    <div className="relative inline-block">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenActionsMenu(openActionsMenu === member.id ? null : member.id);
                        }}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 5a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm0 7a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm0 7a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" />
                        </svg>
                      </button>
                      {openActionsMenu === member.id && (
                        <div
                          className="absolute right-0 mt-1 w-40 glass rounded-xl shadow-lg z-10 py-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => { openEdit(member); setOpenActionsMenu(null); }}
                            className="w-full text-left px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                          >
                            Edit
                          </button>
                          {member.id !== admin.id && (
                            <button
                              onClick={() => { setDeactivatingStaff(member); setDeactivateError(null); setOpenActionsMenu(null); }}
                              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            >
                              Deactivate
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!isLoading && !isFetching && !isError && staffList.length === 0 && (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-muted-foreground/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-muted-foreground mt-4">No staff members found</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {meta && meta.total_pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {meta.current_page} of {meta.total_pages} ({meta.total_count} total)
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={meta.current_page === 1}
              className="px-4 py-2 rounded-xl border border-border text-sm font-medium disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(Math.min(meta.total_pages, page + 1))}
              disabled={meta.current_page === meta.total_pages}
              className="px-4 py-2 rounded-xl border border-border text-sm font-medium disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* ── Invite Modal ─────────────────────────────────────────────────── */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="glass rounded-3xl p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Invite Staff Member</h2>
              <button onClick={() => setShowInviteModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleInviteSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">First Name</label>
                  <input required className="input" value={inviteForm.first_name}
                    onChange={(e) => setInviteForm({ ...inviteForm, first_name: e.target.value })} />
                </div>
                <div>
                  <label className="label">Last Name</label>
                  <input required className="input" value={inviteForm.last_name}
                    onChange={(e) => setInviteForm({ ...inviteForm, last_name: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="label">Email</label>
                <input required type="email" className="input" value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })} />
              </div>
              <div>
                <label className="label">Role</label>
                <select className="input" value={inviteForm.admin_role}
                  onChange={(e) => setInviteForm({ ...inviteForm, admin_role: e.target.value as "super_admin" | "admin_staff" })}>
                  <option value="admin_staff">Admin Staff</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
              {inviteForm.admin_role === "admin_staff" && (
                <div>
                  <label className="label">Title <span className="text-red-500">*</span></label>
                  <input required className="input" placeholder="e.g. Support Agent" value={inviteForm.title}
                    onChange={(e) => setInviteForm({ ...inviteForm, title: e.target.value })} />
                </div>
              )}
              <PresetSelector
                preset={invitePreset}
                permissions={invitePermissions}
                onPresetChange={setInvitePreset}
                onPermissionsChange={setInvitePermissions}
              />
              {inviteError && (
                <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded-xl">{inviteError}</p>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowInviteModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={isInviting}
                  className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors">
                  {isInviting ? "Inviting..." : "Send Invite"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Modal ───────────────────────────────────────────────────── */}
      {editingStaff && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="glass rounded-3xl p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Edit {editingStaff.first_name} {editingStaff.last_name}</h2>
              <button onClick={() => setEditingStaff(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="label">Role</label>
                <select className="input" value={editForm.admin_role}
                  onChange={(e) => setEditForm({ ...editForm, admin_role: e.target.value as "super_admin" | "admin_staff" })}>
                  <option value="admin_staff">Admin Staff</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
              {editForm.admin_role === "admin_staff" && (
                <div>
                  <label className="label">Title <span className="text-red-500">*</span></label>
                  <input required className="input" value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
                </div>
              )}
              <PresetSelector
                preset={editPreset}
                permissions={editPermissions}
                onPresetChange={setEditPreset}
                onPermissionsChange={setEditPermissions}
              />
              {editError && (
                <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded-xl">{editError}</p>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditingStaff(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={isUpdating}
                  className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors">
                  {isUpdating ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Deactivate Confirm ───────────────────────────────────────────── */}
      {deactivatingStaff && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="glass rounded-3xl p-8 w-full max-w-md">
            <h2 className="text-xl font-bold mb-2">Deactivate Staff Member</h2>
            <p className="text-muted-foreground mb-6">
              Are you sure you want to deactivate{" "}
              <span className="font-semibold text-foreground">
                {deactivatingStaff.first_name} {deactivatingStaff.last_name}
              </span>?
              They will lose access immediately.
            </p>
            {deactivateError && (
              <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded-xl mb-4">{deactivateError}</p>
            )}
            <div className="flex gap-3">
              <button onClick={() => setDeactivatingStaff(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors">
                Cancel
              </button>
              <button onClick={handleDeactivate} disabled={isDeactivating}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors">
                {isDeactivating ? "Deactivating..." : "Deactivate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
