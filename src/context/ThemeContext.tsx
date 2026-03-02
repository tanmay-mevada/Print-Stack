'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

interface ThemeContextType {
    isDark: boolean;
    toggleTheme: () => void;
}

// Create the context with default values
const ThemeContext = createContext<ThemeContextType>({
    isDark: true,
    toggleTheme: () => {},
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [isDark, setIsDark] = useState(true)
    const [mounted, setMounted] = useState(false)

    // Check local storage when the app loads to see what theme they used last
    useEffect(() => {
        setMounted(true)
        const savedTheme = localStorage.getItem('printstack-theme')
        if (savedTheme === 'light') {
            setIsDark(false)
        }
    }, [])

    const toggleTheme = () => {
        setIsDark((prev) => {
            const newTheme = !prev
            // Save their choice to the browser's memory
            localStorage.setItem('printstack-theme', newTheme ? 'dark' : 'light')
            return newTheme
        })
    }

    // Prevents a hydration mismatch flash when the page first loads
    if (!mounted) {
        return (
            <ThemeContext.Provider value={{ isDark: true, toggleTheme: () => {} }}>
                {children}
            </ThemeContext.Provider>
        )
    }

    return (
        <ThemeContext.Provider value={{ isDark, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    )
}

// Custom hook to easily grab the theme anywhere in your app
export const useTheme = () => useContext(ThemeContext)