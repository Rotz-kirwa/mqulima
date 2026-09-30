/**
 * Lazy toast proxy for sonner.
 * Defers loading of the ~50 KB sonner bundle until the first toast notification is actually triggered.
 */
let sonnerPromise: Promise<typeof import("sonner")> | null = null;

function getSonner() {
  if (!sonnerPromise) {
    sonnerPromise = import("sonner");
  }
  return sonnerPromise;
}

type ToastArgs = Parameters<typeof import("sonner")["toast"]>;

export const toast = Object.assign(
  (...args: ToastArgs) => {
    getSonner().then(({ toast: sToast }) => (sToast as any)(...args));
  },
  {
    success: (...args: any[]) => {
      getSonner().then(({ toast: sToast }) => (sToast as any).success(...args));
    },
    error: (...args: any[]) => {
      getSonner().then(({ toast: sToast }) => (sToast as any).error(...args));
    },
    warning: (...args: any[]) => {
      getSonner().then(({ toast: sToast }) => (sToast as any).warning(...args));
    },
    info: (...args: any[]) => {
      getSonner().then(({ toast: sToast }) => (sToast as any).info(...args));
    },
    dismiss: (...args: any[]) => {
      getSonner().then(({ toast: sToast }) => (sToast as any).dismiss(...args));
    },
    custom: (...args: any[]) => {
      getSonner().then(({ toast: sToast }) => (sToast as any).custom(...args));
    },
    promise: <T>(promise: Promise<T>, data: any) => {
      getSonner().then(({ toast: sToast }) => (sToast as any).promise(promise, data));
      return promise;
    },
  }
);
