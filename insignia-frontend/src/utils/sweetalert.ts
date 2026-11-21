import Swal, { SweetAlertOptions } from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

const isTestEnv =
  typeof process !== 'undefined' &&
  (process.env.NODE_ENV === 'test' || Boolean(process.env.VITEST));

/**
 * Standardized SweetAlert2 utility for Insignia Wallet
 * All submit forms use this for consistent UX and design language.
 */

export const showSuccessAlert = async (
  title: string,
  text?: string,
  options?: SweetAlertOptions
) => {
  if (isTestEnv) {
    return { isConfirmed: true, isDenied: false, isDismissed: false, value: true } as any;
  }
  return Swal.fire({
    icon: 'success',
    title,
    text,
    confirmButtonColor: '#4f46e5',
    timer: 2500,
    timerProgressBar: true,
    ...options,
  });
};

export const showErrorAlert = async (
  title: string,
  text?: string,
  options?: SweetAlertOptions
) => {
  if (isTestEnv) {
    return { isConfirmed: true, isDenied: false, isDismissed: false, value: true } as any;
  }
  return Swal.fire({
    icon: 'error',
    title,
    text,
    confirmButtonColor: '#4f46e5',
    ...options,
  });
};

export const showConfirmAlert = async (
  title: string,
  text?: string,
  options?: SweetAlertOptions
) => {
  if (isTestEnv) {
    return { isConfirmed: true, isDenied: false, isDismissed: false, value: true } as any;
  }
  return Swal.fire({
    title,
    text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#4f46e5',
    cancelButtonColor: '#94a3b8',
    confirmButtonText: 'Yes, proceed',
    cancelButtonText: 'Cancel',
    ...options,
  });
};

export default Swal;
