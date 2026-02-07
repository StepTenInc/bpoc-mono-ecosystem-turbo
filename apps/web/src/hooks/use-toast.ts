// Simplified toast hook for client-side notifications
// Based on shadcn/ui toast pattern

import { useState, useCallback } from 'react';

interface ToastOptions {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
  duration?: number;
}

interface Toast extends ToastOptions {
  id: string;
}

// State management for toasts (shared across all components)
let toastListeners: Array<(toasts: Toast[]) => void> = [];
let toasts: Toast[] = [];

function notifyListeners() {
  toastListeners.forEach(listener => listener([...toasts]));
}

// Standalone toast function for direct imports
export function toast(options: ToastOptions) {
  const id = Math.random().toString(36).substr(2, 9);
  const newToast: Toast = { ...options, id };
  
  toasts = [...toasts, newToast];
  notifyListeners();

  // Auto-dismiss after duration (default 3s)
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    notifyListeners();
  }, options.duration || 3000);

  return { id, dismiss: () => {
    toasts = toasts.filter((t) => t.id !== id);
    notifyListeners();
  }};
}

// Hook for components that need to track toast state
export function useToast() {
  const [localToasts, setLocalToasts] = useState<Toast[]>(toasts);

  // Subscribe to toast updates
  useState(() => {
    const listener = (newToasts: Toast[]) => setLocalToasts(newToasts);
    toastListeners.push(listener);
    return () => {
      toastListeners = toastListeners.filter(l => l !== listener);
    };
  });

  const dismiss = useCallback((toastId?: string) => {
    if (toastId) {
      toasts = toasts.filter((t) => t.id !== toastId);
    } else {
      toasts = [];
    }
    notifyListeners();
  }, []);

  return { toast, toasts: localToasts, dismiss };
}

export type { Toast, ToastOptions };
