import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

// Base configuration for dark theme
const darkThemeConfig = {
  background: '#17181c',
  color: '#f8fafc',
  confirmButtonColor: '#10b981',
  cancelButtonColor: '#ef4444',
  customClass: {
    popup: 'custom-swal-popup',
    title: 'custom-swal-title',
    htmlContainer: 'custom-swal-content',
    confirmButton: 'custom-swal-confirm-btn',
  },
};

/**
 * Shows a loading spinner and locks the UI.
 * @param title Title of the loading dialog
 * @param text Optional text description
 */
export const showLoading = (title: string = 'Loading...', text: string = 'Please wait') => {
  MySwal.fire({
    ...darkThemeConfig,
    title,
    text,
    allowOutsideClick: false,
    allowEscapeKey: false,
    showConfirmButton: false,
    didOpen: () => {
      MySwal.showLoading();
    }
  });
};

/**
 * Shows a standard success toast (top right, non-blocking)
 * @param title Success message
 */
export const showToastSuccess = (title: string) => {
  MySwal.fire({
    ...darkThemeConfig,
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    icon: 'success',
    title,
    background: '#1e293b', // slightly different background for toasts
  });
};

/**
 * Shows a standard error toast (top right, non-blocking)
 * @param title Error message
 */
export const showToastError = (title: string) => {
  MySwal.fire({
    ...darkThemeConfig,
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 4000,
    timerProgressBar: true,
    icon: 'error',
    title,
    background: '#1e293b',
  });
};

/**
 * Shows a full modal success message
 */
export const showModalSuccess = (title: string, text?: string) => {
  return MySwal.fire({
    ...darkThemeConfig,
    icon: 'success',
    title,
    text,
  });
};

/**
 * Shows a full modal error message
 */
export const showModalError = (title: string, text?: string) => {
  return MySwal.fire({
    ...darkThemeConfig,
    icon: 'error',
    title,
    text,
  });
};

/**
 * Programmatically closes the currently open SweetAlert (e.g., dismissing a loading state)
 */
export const closeAlert = () => {
  MySwal.close();
};

/**
 * Shows a confirmation dialog, returning a promise resolving to true if confirmed.
 */
export const confirmAction = async (title: string, text?: string, confirmText: string = 'Yes') => {
  const result = await MySwal.fire({
    ...darkThemeConfig,
    title,
    text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: 'Cancel'
  });
  return result.isConfirmed;
};
