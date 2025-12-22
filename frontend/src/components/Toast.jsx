import { useEffect, useState } from 'react';

// Toast Context for managing toasts globally
let toastQueue = [];
let listeners = [];

export const toast = {
    success: (message, duration = 3000) => {
        addToast({ type: 'success', message, duration });
    },
    error: (message, duration = 4000) => {
        addToast({ type: 'error', message, duration });
    },
    info: (message, duration = 3000) => {
        addToast({ type: 'info', message, duration });
    },
    warning: (message, duration = 3500) => {
        addToast({ type: 'warning', message, duration });
    },
};

const addToast = (toast) => {
    const id = Date.now();
    toastQueue = [...toastQueue, { ...toast, id }];
    notifyListeners();

    setTimeout(() => {
        removeToast(id);
    }, toast.duration);
};

const removeToast = (id) => {
    toastQueue = toastQueue.filter(t => t.id !== id);
    notifyListeners();
};

const notifyListeners = () => {
    listeners.forEach(listener => listener(toastQueue));
};

const subscribe = (listener) => {
    listeners.push(listener);
    return () => {
        listeners = listeners.filter(l => l !== listener);
    };
};

// Toast Container Component
export const ToastContainer = () => {
    const [toasts, setToasts] = useState([]);

    useEffect(() => {
        const unsubscribe = subscribe(setToasts);
        return unsubscribe;
    }, []);

    return (
        <div className="fixed top-4 right-4 z-[9999] space-y-2 pointer-events-none">
            {toasts.map((toast) => (
                <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
            ))}
        </div>
    );
};

// Individual Toast Item
const ToastItem = ({ toast, onClose }) => {
    const [isExiting, setIsExiting] = useState(false);

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(onClose, 300);
    };

    const styles = {
        success: {
            bg: 'bg-green-500 dark:bg-green-600',
            icon: (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
            ),
        },
        error: {
            bg: 'bg-red-500 dark:bg-red-600',
            icon: (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
            ),
        },
        info: {
            bg: 'bg-blue-500 dark:bg-blue-600',
            icon: (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
            ),
        },
        warning: {
            bg: 'bg-yellow-500 dark:bg-yellow-600',
            icon: (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
            ),
        },
    };

    const style = styles[toast.type] || styles.info;

    return (
        <div
            className={`
        pointer-events-auto
        flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg
        ${style.bg} text-white
        transform transition-all duration-300 ease-out
        ${isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}
        min-w-[300px] max-w-md
      `}
        >
            <div className="flex-shrink-0">{style.icon}</div>
            <p className="flex-1 text-sm font-medium">{toast.message}</p>
            <button
                onClick={handleClose}
                className="flex-shrink-0 ml-2 hover:bg-white/20 rounded p-1 transition-colors"
            >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
            </button>
        </div>
    );
};

export default ToastContainer;
