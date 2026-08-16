import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

// Configuration for consistent theme across all alerts
const baseConfig = {
  background: "#1e293b",
  color: "#f8fafc",
  confirmButtonColor: "#10b981",
  cancelButtonColor: "#ef4444",
  customClass: {
    popup: "rounded-xl border border-slate-700/50 shadow-2xl",
    title: "text-xl font-bold text-slate-100",
    confirmButton: "px-4 py-2 rounded-lg font-semibold transition-colors",
    cancelButton: "px-4 py-2 rounded-lg font-semibold transition-colors",
  },
};

/**
 * Shows a loading overlay that locks the UI (cannot be dismissed by user)
 * @param title The message to display while loading
 */
export const showLoading = (title: string = "Processing...") => {
  MySwal.fire({
    ...baseConfig,
    title,
    allowOutsideClick: false,
    allowEscapeKey: false,
    didOpen: () => {
      MySwal.showLoading();
    },
  });
};

/**
 * Shows a success modal
 */
export const showModalSuccess = async (title: string, text?: string) => {
  return MySwal.fire({
    ...baseConfig,
    icon: "success",
    title,
    text,
    timer: 2000,
    timerProgressBar: true,
    showConfirmButton: false,
  });
};

/**
 * Shows an error modal
 */
export const showModalError = async (title: string, text?: string) => {
  return MySwal.fire({
    ...baseConfig,
    icon: "error",
    title,
    text,
    confirmButtonText: "Okay",
  });
};

/**
 * Shows a toast-style success message in the top right
 */
export const showToastSuccess = (title: string) => {
  MySwal.fire({
    ...baseConfig,
    toast: true,
    position: "top-end",
    icon: "success",
    title,
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
  });
};

/**
 * Shows a toast-style error message in the top right
 */
export const showToastError = (title: string) => {
  MySwal.fire({
    ...baseConfig,
    toast: true,
    position: "top-end",
    icon: "error",
    title,
    showConfirmButton: false,
    timer: 4000,
    timerProgressBar: true,
  });
};

/**
 * Prompts the user for confirmation before proceeding
 */
export const showConfirmation = async (
  title: string,
  text: string,
  confirmButtonText = "Yes, proceed"
) => {
  const result = await MySwal.fire({
    ...baseConfig,
    icon: "warning",
    title,
    text,
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText: "Cancel",
    reverseButtons: true,
  });
  return result.isConfirmed;
};

/**
 * Closes any currently open alert (especially useful for dismissing loading states)
 */
export const closeAlert = () => {
  MySwal.close();
};
