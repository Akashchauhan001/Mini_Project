import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem('arid-theme')
    if (saved === 'light') setDark(false)
  }, [])

  const toggle = () => {
    setDark((d) => {
      localStorage.setItem('arid-theme', !d ? 'dark' : 'light')
      return !d
    })
  }

  return (
    <ThemeContext.Provider value={{ dark, toggle }}>
      <div className={dark ? 'dark' : ''}>
        {children}
      </div>
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
