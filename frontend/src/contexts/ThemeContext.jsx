import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState(() => {
        // Check localStorage first, then system preference
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) return savedTheme;

        // Check system preference
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    });

    useEffect(() => {
        const root = document.documentElement;

        // Remove both classes first
        root.classList.remove('light', 'dark');

        // Add current theme class
        root.classList.add(theme);

        // Save to localStorage
        localStorage.setItem('theme', theme);

        // Debug log
        if (import.meta.env.DEV) {
            console.log('🎨 Theme System Debug:');
            console.log(`  Current theme: ${theme}`);
            console.log(`  HTML element classes:`, root.className);
            console.log(`  Has dark class:`, root.classList.contains('dark'));

            // Test if dark mode CSS is working
            const testDiv = document.createElement('div');
            testDiv.className = 'bg-gray-50 dark:bg-gray-900';
            document.body.appendChild(testDiv);
            const bgColor = window.getComputedStyle(testDiv).backgroundColor;
            console.log(`  Test background color: ${bgColor}`);
            document.body.removeChild(testDiv);
        }
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
    };

    const value = {
        theme,
        toggleTheme,
        isDark: theme === 'dark'
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}

export default ThemeContext;
