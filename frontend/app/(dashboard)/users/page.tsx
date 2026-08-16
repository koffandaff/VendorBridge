"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Search,
  UserPlus,
  Pencil,
  Trash2,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  X,
  ChevronLeft,
  ChevronRight,
  KeyRound,
  Ban,
  UserCheck,
} from "lucide-react";
import styles from "./users.module.css";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import { useAuth } from "@/lib/AuthContext";
import {
  fetchUsers,
  updateUser,
  updateUserStatus,
  resetUserPassword,
  resendUserInvite,
  deleteUser,
  fetchVendors,
  USER_ROLE_LABEL,
  Vendor,
} from "@/lib/data";
import { formatDate } from "@/lib/format";
import { confirmPasswordSchema } from "@/lib/validation/password";
import type { UserListItemDto, BackendRole } from "@/lib/types";
import type { PaginationMeta } from "@/lib/api";

const ROLE_OPTIONS = Object.entries(USER_ROLE_LABEL) as [BackendRole, string][];

const editSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    phone: z.string().optional(),
    role: z.enum(["ADMIN", "PROCUREMENT_OFFICER", "APPROVER", "VENDOR"]),
    vendorId: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.role === "VENDOR" && !data.vendorId) {
      ctx.addIssue({ code: "custom", path: ["vendorId"], message: "Please select a vendor" });
    }
  });

type EditFormValues = z.infer<typeof editSchema>;
type ResetFormValues = z.infer<typeof confirmPasswordSchema>;

interface Filters {
  search: string;
  role: string;
  isActive: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
}

const DEFAULT_FILTERS: Filters = {
  search: "",
  role: "",
  isActive: "",
  sortBy: "createdAt",
  sortOrder: "desc",
};

export default function UsersPage() {
  const router = useRouter();
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState<UserListItemDto[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({ page: 1, limit: 10, totalItems: 0, totalPages: 0 });
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [editingUser, setEditingUser] = useState<UserListItemDto | null>(null);
  const [resettingUser, setResettingUser] = useState<UserListItemDto | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserListItemDto | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const result = await fetchUsers({
          search: filters.search || undefined,
          role: filters.role || undefined,
          isActive: filters.isActive || undefined,
          page,
          limit: 10,
          sortBy: filters.sortBy,
          sortOrder: filters.sortOrder,
        });
        if (cancelled) return;
        setUsers(result.items);
        setPagination(result.pagination);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load users");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [filters, page, reloadKey]);

  useEffect(() => {
    fetchVendors()
      .then(setVendors)
      .catch(() => setVendors([]));
  }, []);

  const refetch = () => {
    setLoading(true);
    setReloadKey((key) => key + 1);
  };

  const applySearch = () => {
    setLoading(true);
    setFilters((prev) => ({ ...prev, search: searchInput.trim() }));
    setPage(1);
  };

  const updateFilter = (key: keyof Filters, value: string) => {
    setLoading(true);
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const toggleSortOrder = () => {
    setLoading(true);
    setFilters((prev) => ({ ...prev, sortOrder: prev.sortOrder === "asc" ? "desc" : "asc" }));
  };

  const changePage = (nextPage: number) => {
    setLoading(true);
    setPage(nextPage);
  };

  const isSelf = (userId: string) => currentUser?.id === userId;

  const handleUpdateUser = async (data: EditFormValues) => {
    if (!editingUser) return;
    try {
      await updateUser(editingUser.id, {
        name: data.name,
        phone: data.phone && data.phone.trim() !== "" ? data.phone.trim() : null,
        role: data.role,
        vendorId: data.role === "VENDOR" ? data.vendorId ?? null : null,
      });
      toast.success("User updated");
      setEditingUser(null);
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update user");
    }
  };

  const handleToggleStatus = async (user: UserListItemDto) => {
    try {
      await updateUserStatus(user.id, !user.isActive);
      toast.success(user.isActive ? "User deactivated" : "User activated");
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update status");
    }
  };

  const handleResetPassword = async (data: ResetFormValues) => {
    if (!resettingUser) return;
    try {
      await resetUserPassword(resettingUser.id, data.newPassword);
      toast.success("Password reset");
      setResettingUser(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reset password");
    }
  };

  const handleResendInvite = async (user: UserListItemDto) => {
    try {
      await resendUserInvite(user.id);
      toast.success("Invitation email resent");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to resend invitation");
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    setDeleteBusy(true);
    try {
      await deleteUser(deletingUser.id);
      toast.success("User deleted");
      setDeletingUser(null);
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete user");
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={["Admin"]}>
      <div className={styles.container}>
        <div className={styles.headerRow}>
          <div className={styles.headerLeft}>
            <h1 className={styles.title}>User Management</h1>
            <p className={styles.subtitle}>Manage users, roles and access</p>
          </div>
          <button className={styles.addButton} onClick={() => router.push("/register")}>
            <UserPlus size={18} />
            <span>Invite User</span>
          </button>
        </div>

        <div className={styles.filterCard}>
          <div className={styles.filterRow}>
            <div className={styles.searchBar}>
              <Search className={styles.searchIcon} size={18} />
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Search by name or email..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") applySearch();
                }}
              />
            </div>
            <button className={styles.searchButton} onClick={applySearch}>
              <Search size={14} />
              Search
            </button>
            <select
              className={styles.filterSelect}
              value={filters.role}
              onChange={(e) => updateFilter("role", e.target.value)}
              aria-label="Filter by role"
            >
              <option value="">All roles</option>
              {ROLE_OPTIONS.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <select
              className={styles.filterSelect}
              value={filters.isActive}
              onChange={(e) => updateFilter("isActive", e.target.value)}
              aria-label="Filter by status"
            >
              <option value="">All statuses</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
            <select
              className={styles.filterSelect}
              value={filters.sortBy}
              onChange={(e) => updateFilter("sortBy", e.target.value)}
              aria-label="Sort by"
            >
              <option value="createdAt">Newest</option>
              <option value="name">Name</option>
              <option value="email">Email</option>
              <option value="role">Role</option>
            </select>
            <button
              className={styles.sortToggle}
              onClick={toggleSortOrder}
              title={filters.sortOrder === "asc" ? "Ascending" : "Descending"}
            >
              {filters.sortOrder === "asc" ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
            </button>
          </div>
        </div>

        <div className={styles.tableCard}>
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Last Login</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, index) => (
                    <tr key={index} className={styles.skeletonRow}>
                      {Array.from({ length: 7 }).map((__, cellIndex) => (
                        <td key={cellIndex}>
                          <div className={styles.skeletonCell} />
                        </td>
                      ))}
                      <td>
                        <div className={styles.skeletonActions}>
                          <div className={styles.skeletonIcon} />
                          <div className={styles.skeletonIcon} />
                        </div>
                      </td>
                    </tr>
                  ))
                ) : error ? (
                  <tr>
                    <td colSpan={8}>
                      <div className={styles.stateContainer}>
                        <div className={styles.stateText}>{error}</div>
                        <button
                          className={styles.retryButton}
                          onClick={refetch}
                        >
                          Retry
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
                      <div className={styles.stateContainer}>
                        <div className={styles.stateText}>No users found</div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  users.map((user) => {
                    const self = isSelf(user.id);
                    return (
                      <tr key={user.id}>
                        <td>
                          <div className={styles.userCell}>
                            <span className={styles.userName}>
                              {user.name}
                              {self && <span className={styles.userMeta}> (you)</span>}
                            </span>
                          </div>
                        </td>
                        <td>{user.email}</td>
                        <td>{USER_ROLE_LABEL[user.role] ?? user.role}</td>
                        <td className={user.phone ? "" : styles.muted}>{user.phone ?? "—"}</td>
                        <td>
                          <span className={`${styles.badge} ${user.isActive ? styles.badgeActive : styles.badgeInactive}`}>
                            <span className={`${styles.statusDot} ${user.isActive ? styles.dotActive : styles.dotInactive}`} />
                            {user.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className={styles.muted}>{formatDate(user.lastLoginAt)}</td>
                        <td className={styles.muted}>{formatDate(user.createdAt)}</td>
                        <td>
                          <div className={styles.actions}>
                            <button
                              className={styles.iconButton}
                              onClick={() => setEditingUser(user)}
                              disabled={self}
                              title={self ? "You cannot modify your own account" : "Edit"}
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              className={styles.iconButton}
                              onClick={() => handleToggleStatus(user)}
                              disabled={self}
                              title={
                                self
                                  ? "You cannot modify your own account"
                                  : user.isActive
                                    ? "Deactivate"
                                    : "Activate"
                              }
                            >
                              {user.isActive ? <Ban size={15} /> : <UserCheck size={15} />}
                            </button>
                            <button
                              className={styles.iconButton}
                              onClick={() => setResettingUser(user)}
                              title="Reset password"
                            >
                              <KeyRound size={15} />
                            </button>
                            <button
                              className={styles.iconButton}
                              onClick={() => handleResendInvite(user)}
                              disabled={!user.isActive || user.emailVerified}
                              title={
                                !user.isActive || user.emailVerified
                                  ? "Invitation already accepted or user inactive"
                                  : "Resend invite"
                              }
                            >
                              <RefreshCw size={15} />
                            </button>
                            <button
                              className={`${styles.iconButton} ${styles.danger}`}
                              onClick={() => setDeletingUser(user)}
                              disabled={self}
                              title={self ? "You cannot modify your own account" : "Delete"}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {!loading && !error && users.length > 0 && (
            <div className={styles.pagination}>
              <span className={styles.paginationInfo}>
                Page {pagination.page} of {pagination.totalPages} ({pagination.totalItems} users)
              </span>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  className={styles.pageButton}
                  onClick={() => changePage(Math.max(1, page - 1))}
                  disabled={page <= 1}
                >
                  <ChevronLeft size={15} />
                  Previous
                </button>
                <button
                  className={styles.pageButton}
                  onClick={() => changePage(Math.min(pagination.totalPages, page + 1))}
                  disabled={page >= pagination.totalPages}
                >
                  Next
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {editingUser && (
        <EditUserModal
          user={editingUser}
          vendors={vendors}
          onClose={() => setEditingUser(null)}
          onSubmit={handleUpdateUser}
        />
      )}

      {resettingUser && (
        <ResetPasswordModal
          user={resettingUser}
          onClose={() => setResettingUser(null)}
          onSubmit={handleResetPassword}
        />
      )}

      {deletingUser && (
        <div className={styles.modalOverlay} onClick={() => !deleteBusy && setDeletingUser(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Delete User</h2>
              <button className={styles.closeButton} onClick={() => setDeletingUser(null)} disabled={deleteBusy}>
                <X size={20} />
              </button>
            </div>
            <div className={styles.modalText}>
              Delete user <strong>{deletingUser.name}</strong>? This cannot be undone.
            </div>
            <div className={styles.modalActions}>
              <button className={styles.cancelButton} onClick={() => setDeletingUser(null)} disabled={deleteBusy}>
                Cancel
              </button>
              <button className={styles.deleteButton} onClick={handleDeleteUser} disabled={deleteBusy}>
                {deleteBusy ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}

function EditUserModal({
  user,
  vendors,
  onClose,
  onSubmit,
}: {
  user: UserListItemDto;
  vendors: Vendor[];
  onClose: () => void;
  onSubmit: (data: EditFormValues) => Promise<void>;
}) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
  });

  const selectedRole = watch("role");

  useEffect(() => {
    reset({
      name: user.name,
      phone: user.phone ?? "",
      role: user.role,
      vendorId: user.vendorId ?? "",
    });
  }, [user, reset]);

  return (
    <div className={styles.modalOverlay} onClick={() => !isSubmitting && onClose()}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Edit User</h2>
          <button className={styles.closeButton} onClick={onClose} disabled={isSubmitting}>
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className={styles.modalBody}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Name</label>
              <input
                type="text"
                className={`${styles.formInput} ${errors.name ? styles.error : ""}`}
                placeholder="Full name"
                {...register("name")}
              />
              {errors.name && <span className={styles.formError}>{errors.name.message}</span>}
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Phone</label>
              <input
                type="text"
                className={`${styles.formInput} ${errors.phone ? styles.error : ""}`}
                placeholder="+91 9876543210"
                {...register("phone")}
              />
              {errors.phone && <span className={styles.formError}>{errors.phone.message}</span>}
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Role</label>
              <select
                className={`${styles.formSelect} ${errors.role ? styles.error : ""}`}
                {...register("role")}
              >
                {ROLE_OPTIONS.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              {errors.role && <span className={styles.formError}>{errors.role.message}</span>}
            </div>
            {selectedRole === "VENDOR" && (
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Vendor</label>
                <select
                  className={`${styles.formSelect} ${errors.vendorId ? styles.error : ""}`}
                  {...register("vendorId")}
                >
                  <option value="">Select vendor...</option>
                  {vendors.map((vendor) => (
                    <option key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </option>
                  ))}
                </select>
                {errors.vendorId && <span className={styles.formError}>{errors.vendorId.message}</span>}
              </div>
            )}
          </div>
          <div className={styles.modalActions}>
            <button type="button" className={styles.cancelButton} onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ResetPasswordModal({
  user,
  onClose,
  onSubmit,
}: {
  user: UserListItemDto;
  onClose: () => void;
  onSubmit: (data: ResetFormValues) => Promise<void>;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetFormValues>({
    resolver: zodResolver(confirmPasswordSchema),
  });

  return (
    <div className={styles.modalOverlay} onClick={() => !isSubmitting && onClose()}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Reset Password</h2>
          <button className={styles.closeButton} onClick={onClose} disabled={isSubmitting}>
            <X size={20} />
          </button>
        </div>
        <div className={styles.modalText}>
          Set a new password for <strong>{user.name}</strong>.
        </div>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className={styles.modalBody}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>New Password</label>
              <input
                type="password"
                className={`${styles.formInput} ${errors.newPassword ? styles.error : ""}`}
                placeholder="8-72 characters, letters and numbers"
                {...register("newPassword")}
              />
              {errors.newPassword && <span className={styles.formError}>{errors.newPassword.message}</span>}
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Confirm Password</label>
              <input
                type="password"
                className={`${styles.formInput} ${errors.confirmPassword ? styles.error : ""}`}
                placeholder="Re-enter password"
                {...register("confirmPassword")}
              />
              {errors.confirmPassword && (
                <span className={styles.formError}>{errors.confirmPassword.message}</span>
              )}
            </div>
          </div>
          <div className={styles.modalActions}>
            <button type="button" className={styles.cancelButton} onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
              {isSubmitting ? "Resetting..." : "Reset Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
