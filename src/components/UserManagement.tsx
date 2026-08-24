import React, { useState, useEffect, useCallback } from "react";
import { User } from "../types";
import Modal from "./Modal";
import { Shield, Plus, Pencil, Trash2, X, AlertTriangle, Key, CheckCircle, Ban } from "lucide-react";

const VALID_ROLES = ["Encoder", "Administrator", "System developer"] as const;

const ROLE_PERMISSIONS: Record<string, { color: string; bgColor: string; borderColor: string; actions: string[] }> = {
  Encoder: {
    color: "text-slate-600 dark:text-slate-400",
    bgColor: "bg-slate-50 dark:bg-slate-950/60",
    borderColor: "border-slate-200 dark:border-slate-800",
    actions: [
      "View Employees",
      "View Seminars",
      "Create & Edit Seminars",
      "Import Seminars",
    ],
  },
  Administrator: {
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950/60",
    borderColor: "border-blue-200 dark:border-blue-800",
    actions: [
      "View Employees",
      "Create, Edit & Delete Employees",
      "View, Create & Edit Seminars",
      "Delete Seminars, Years & Attendees",
      "Import Seminars",
    ],
  },
  "System developer": {
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-50 dark:bg-purple-950/60",
    borderColor: "border-purple-200 dark:border-purple-800",
    actions: [
      "All Administrator permissions",
      "Import Data (XLSX)",
      "View Audit Logs",
      "Manage Users",
      "Assign Roles & Delete Users",
    ],
  },
};

interface EditableUser {
  id: number;
  username: string;
  name: string;
  role: string;
  isActive: boolean;
  createdAt: string | null;
}

function RoleSelector({ selected, onChange }: { selected: string; onChange: (role: string) => void }) {
  return (
    <div className="space-y-2">
      {VALID_ROLES.map((r) => {
        const info = ROLE_PERMISSIONS[r];
        const isSelected = selected === r;
        return (
          <button
            key={r}
            type="button"
            onClick={() => onChange(r)}
            className={`w-full text-left p-3 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
              isSelected
                ? `${info.bgColor} ${info.borderColor} shadow-sm`
                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
            }`}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                isSelected ? `${info.borderColor} bg-white dark:bg-slate-900` : "border-slate-300 dark:border-slate-700"
              }`}>
                {isSelected && <div className={`w-2 h-2 rounded-full ${
                  r === "Encoder" ? "bg-slate-500" : r === "Administrator" ? "bg-blue-500" : "bg-purple-500"
                }`} />}
              </div>
              <span className={`text-xs font-bold ${isSelected ? info.color : "text-slate-700 dark:text-slate-300"}`}>{r}</span>
            </div>
            <div className="ml-6 flex flex-wrap gap-1">
              {info.actions.map((action) => (
                <span key={action} className={`text-[9px] font-medium px-1.5 py-0.5 rounded-md ${
                  isSelected
                    ? `${info.bgColor} ${info.color}`
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                }`}>
                  {action}
                </span>
              ))}
            </div>
          </button>
        );
      })}
    </div>
  );
}

export default function UserManagement({ currentUser }: { currentUser: User }) {
  const [users, setUsers] = useState<EditableUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<EditableUser | null>(null);
  const [editUser, setEditUser] = useState<EditableUser | null>(null);

  const [newUser, setNewUser] = useState({ username: "", password: "", name: "", role: "Encoder" });
  const [editForm, setEditForm] = useState({ name: "", role: "", password: "" });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/users", {
        headers: { "x-user-id": String(currentUser.id) },
      });
      if (!res.ok) throw new Error("Failed to load users");
      const data = await res.json();
      setUsers(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [currentUser.id]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": String(currentUser.id) },
        body: JSON.stringify(newUser),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to create user");
      showToast(`User "${newUser.username}" created`);
      setCreateOpen(false);
      setNewUser({ username: "", password: "", name: "", role: "Encoder" });
      fetchUsers();
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  const openEdit = (user: EditableUser) => {
    setEditUser(user);
    setEditForm({ name: user.name, role: user.role, password: "" });
    setEditOpen(true);
  };

  const handleEdit = async () => {
    if (!editUser) return;
    try {
      const body: any = { name: editForm.name };
      if (editForm.password) body.password = editForm.password;
      if (editForm.role !== editUser.role) body.role = editForm.role;
      const res = await fetch(`/api/users/${editUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-user-id": String(currentUser.id) },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to update user");
      showToast(`User "${editUser.username}" updated`);
      await fetchUsers();
      setEditOpen(false);
      setEditUser(null);
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  const toggleActive = async (user: EditableUser) => {
    try {
      const action = user.isActive ? "disabled" : "enabled";
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-user-id": String(currentUser.id) },
        body: JSON.stringify({ isActive: !user.isActive }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to update user");
      showToast(`User "${user.username}" ${action}`);
      fetchUsers();
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  const handleDelete = async (user: EditableUser) => {
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "DELETE",
        headers: { "x-user-id": String(currentUser.id) },
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to delete user");
      showToast(`User "${user.username}" deleted`);
      setDeleteConfirm(null);
      fetchUsers();
    } catch (err: any) {
      showToast(err.message, "error");
      setDeleteConfirm(null);
    }
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 p-4 rounded-xl border shadow-xl flex items-center gap-3 animate-in slide-in-from-bottom duration-300 ${
          toast.type === "success"
            ? "bg-emerald-600 text-white border-emerald-500"
            : "bg-red-600 text-white border-red-500"
        }`}>
          <span className="text-xs font-semibold">{toast.msg}</span>
          <button onClick={() => setToast(null)} className="text-white/80 hover:text-white font-bold ml-2 cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 rounded-xl">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 font-display">User Management</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Manage user accounts, roles, and access permissions</p>
          </div>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="btn-glass bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-200/50 dark:border-purple-900/30 text-xs py-2 px-4 font-bold rounded-xl flex items-center gap-2 shadow-md cursor-pointer transition hover:scale-105 active:scale-95"
        >
          <Plus className="h-4 w-4" />
          Add User
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-200/40 dark:border-red-900/30 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
          <p className="text-xs text-red-600 dark:text-red-400 font-medium">{error}</p>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-md border border-slate-200 dark:border-slate-800 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400 font-medium">Loading users...</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400 font-medium">No users found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800">
                  <th className="text-left px-4 py-3 font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[10px]">Username</th>
                  <th className="text-left px-4 py-3 font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[10px]">Name</th>
                  <th className="text-left px-4 py-3 font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[10px]">Role</th>
                  <th className="text-left px-4 py-3 font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[10px]">Status</th>
                  <th className="text-left px-4 py-3 font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[10px]">Created</th>
                  <th className="text-right px-4 py-3 font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[10px]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-950/30 transition">
                    <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">{user.username}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{user.name}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        user.role === "System developer" ? "bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-400" :
                        user.role === "Administrator" ? "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400" :
                        "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        user.isActive
                          ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400"
                          : "bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400"
                      }`}>
                        {user.isActive ? <CheckCircle className="h-3 w-3" /> : <Ban className="h-3 w-3" />}
                        {user.isActive ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-500">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => openEdit(user)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/60 transition cursor-pointer" title="Edit user">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => toggleActive(user)} className={`p-1.5 rounded-lg transition cursor-pointer ${user.isActive ? "text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/60" : "text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/60"}`} title={user.isActive ? "Disable" : "Enable"}>
                          {user.isActive ? <Ban className="h-3.5 w-3.5" /> : <CheckCircle className="h-3.5 w-3.5" />}
                        </button>
                        <button onClick={() => setDeleteConfirm(user)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/60 transition cursor-pointer" title="Delete user">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} maxWidth="max-w-md" ariaLabel="Create User" title="Create New User" bodyClassName="space-y-5"
        footer={
          <div className="flex gap-2 justify-end">
            <button onClick={() => setCreateOpen(false)} className="btn-glass text-xs py-2 px-4 cursor-pointer font-bold rounded-xl">Cancel</button>
            <button onClick={handleCreate} className="btn-glass bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-200/50 dark:border-purple-900/30 text-xs py-2 px-4 cursor-pointer font-bold rounded-xl shadow-md">Create User</button>
          </div>
        }>
        <div className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Username *</label>
            <input value={newUser.username} onChange={(e) => setNewUser({ ...newUser, username: e.target.value })} className="block w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs text-slate-800 dark:text-white font-semibold" placeholder="Enter username" required />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Password *</label>
            <input type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} className="block w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs text-slate-800 dark:text-white font-semibold" placeholder="Enter password" required />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Full Name</label>
            <input value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} className="block w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs text-slate-800 dark:text-white font-semibold" placeholder="Display name" />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-2">Role</label>
            <RoleSelector selected={newUser.role} onChange={(role) => setNewUser({ ...newUser, role })} />
          </div>
        </div>
      </Modal>

      {/* Edit User Modal */}
      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} maxWidth="max-w-md" ariaLabel="Edit User" title={`Edit User — ${editUser?.username || ""}`} bodyClassName="space-y-5"
        footer={
          <div className="flex gap-2 justify-end">
            <button onClick={() => setEditOpen(false)} className="btn-glass text-xs py-2 px-4 cursor-pointer font-bold rounded-xl">Cancel</button>
            <button onClick={handleEdit} className="btn-glass bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/30 text-xs py-2 px-4 cursor-pointer font-bold rounded-xl shadow-md">Save Changes</button>
          </div>
        }>
        <div className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Full Name</label>
            <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="block w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-slate-800 dark:text-white font-semibold" />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-2">Role</label>
            <RoleSelector selected={editForm.role} onChange={(role) => setEditForm({ ...editForm, role })} />
          </div>
          <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
              <Key className="h-3.5 w-3.5 inline mr-1" />
              New Password <span className="font-normal text-slate-400">(leave blank to keep current)</span>
            </label>
            <input type="password" value={editForm.password} onChange={(e) => setEditForm({ ...editForm, password: e.target.value })} className="block w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-slate-800 dark:text-white font-semibold" placeholder="New password (optional)" />
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteConfirm !== null} onClose={() => setDeleteConfirm(null)} maxWidth="max-w-sm" ariaLabel="Delete User" title="Delete User?" bodyClassName="space-y-4"
        footer={
          <div className="flex gap-2 justify-end">
            <button onClick={() => setDeleteConfirm(null)} className="btn-glass text-xs py-2 px-4 cursor-pointer font-bold rounded-xl">Cancel</button>
            <button onClick={() => deleteConfirm && handleDelete(deleteConfirm)} className="btn-glass bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-200/50 dark:border-red-900/30 text-xs py-2 px-4 cursor-pointer font-bold rounded-xl shadow-md">Delete User</button>
          </div>
        }>
        {deleteConfirm && (
          <div className="flex gap-3 items-start p-3 bg-red-500/10 border border-red-200/40 dark:border-red-900/30 rounded-xl">
            <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-bold text-red-600 dark:text-red-400">Delete "{deleteConfirm.username}"?</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                This action permanently removes this user account. It cannot be undone.
                {Number(deleteConfirm.id) === Number(currentUser.id) && (
                  <span className="block mt-1 text-red-500 font-bold">You cannot delete your own account.</span>
                )}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
