import { CheckCircleIcon, ExclamationCircleIcon, ExclamationTriangleIcon, InformationCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { createContext, useCallback, useContext, useState } from 'react';

const ToastContext = createContext();

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}

const Toast = ({ id, type, message, onClose }) => {
    const icons = {
        success: <CheckCircleIcon className="w-6 h-6 text-green-500" />,
        error: <ExclamationCircleIcon className="w-6 h-6 text-red-500" />,
        warning: <ExclamationTriangleIcon className="w-6 h-6 text-yellow-500" />,
        info: <InformationCircleIcon className="w-6 h-6 text-blue-500" />
    };

    const bgColors = {
        success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
        error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
        warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
        info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
    };

    return (
        <div
            className={`flex items-start gap-3 p-4 rounded-lg border shadow-lg animate-slide-in-right ${bgColors[type]}`}
            role="alert"
        >
            <div className="flex-shrink-0 mt-0.5">
                {icons[type]}
            </div>
            <div className="flex-1 text-sm text-gray-900 dark:text-gray-100">
                {message}
            </div>
            <button
                onClick={() => onClose(id)}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                aria-label="Close"
            >
                <XMarkIcon className="w-5 h-5" />
            </button>
        </div>
    );
};

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'info', duration = 5000) => {
        const id = Date.now() + Math.random();
        setToasts(prev => [...prev, { id, message, type }]);

        if (duration > 0) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }

        return id;
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    const toast = {
        success: (message, duration) => addToast(message, 'success', duration),
        error: (message, duration) => addToast(message, 'error', duration),
        warning: (message, duration) => addToast(message, 'warning', duration),
        info: (message, duration) => addToast(message, 'info', duration),
        remove: removeToast
    };

    return (
        <ToastContext.Provider value={toast}>
            {children}

            {/* Toast Container */}
            <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md pointer-events-none">
                {toasts.map(toast => (
                    <div key={toast.id} className="pointer-events-auto">
                        <Toast {...toast} onClose={removeToast} />
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export default ToastContext;
