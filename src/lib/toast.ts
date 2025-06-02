/**
 * Simple toast notification utility for TrustLoop
 */

// Types for toast messages
export type ToastType = 'success' | 'error' | 'info' | 'warning';

// Interface for toast options
interface ToastOptions {
  duration?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

// Create toast container if it doesn't exist
const ensureToastContainer = () => {
  let container = document.getElementById('toast-container');
  
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.style.position = 'fixed';
    container.style.top = '20px';
    container.style.right = '20px';
    container.style.zIndex = '9999';
    document.body.appendChild(container);
  }
  
  return container;
};

// Create a toast element
const createToast = (
  message: string, 
  type: ToastType, 
  options: ToastOptions = {}
) => {
  const container = ensureToastContainer();
  const toast = document.createElement('div');
  
  // Set toast styles based on type
  toast.style.padding = '12px 16px';
  toast.style.marginBottom = '10px';
  toast.style.borderRadius = '4px';
  toast.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
  toast.style.display = 'flex';
  toast.style.alignItems = 'center';
  toast.style.transition = 'all 0.3s ease';
  toast.style.opacity = '0';
  toast.style.transform = 'translateY(-10px)';
  toast.style.maxWidth = '300px';
  
  // Set type-specific styles
  switch (type) {
    case 'success':
      toast.style.backgroundColor = '#10B981';
      toast.style.color = 'white';
      break;
    case 'error':
      toast.style.backgroundColor = '#EF4444';
      toast.style.color = 'white';
      break;
    case 'info':
      toast.style.backgroundColor = '#3B82F6';
      toast.style.color = 'white';
      break;
    case 'warning':
      toast.style.backgroundColor = '#F59E0B';
      toast.style.color = 'white';
      break;
  }
  
  // Set toast content
  toast.textContent = message;
  
  // Add to container
  container.appendChild(toast);
  
  // Animate in
  setTimeout(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
  }, 10);
  
  // Remove after duration
  const duration = options.duration || 3000;
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    
    // Remove from DOM after animation
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, duration);
};

// Export toast functions
export const toast = {
  success: (message: string, options?: ToastOptions) => createToast(message, 'success', options),
  error: (message: string, options?: ToastOptions) => createToast(message, 'error', options),
  info: (message: string, options?: ToastOptions) => createToast(message, 'info', options),
  warning: (message: string, options?: ToastOptions) => createToast(message, 'warning', options),
};

export default toast;
