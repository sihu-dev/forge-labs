'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'

type LogLevel = 'log' | 'warn' | 'error' | 'info' | 'debug'

interface ConsoleLog {
  id: string
  level: LogLevel
  message: string
  timestamp: Date
  stack?: string
}

interface DevToolsContextType {
  isOpen: boolean
  toggleOpen: () => void
  logs: ConsoleLog[]
  clearLogs: () => void
  filterLevel: LogLevel | 'all'
  setFilterLevel: (level: LogLevel | 'all') => void
}

const DevToolsContext = createContext<DevToolsContextType | null>(null)

export function useDevTools() {
  const context = useContext(DevToolsContext)
  if (!context) {
    throw new Error('useDevTools must be used within DevToolsProvider')
  }
  return context
}

export function DevToolsProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [logs, setLogs] = useState<ConsoleLog[]>([])
  const [filterLevel, setFilterLevel] = useState<LogLevel | 'all'>('all')

  useEffect(() => {
    if (typeof window === 'undefined') return

    const originalConsole = {
      log: console.log, warn: console.warn, error: console.error,
      info: console.info, debug: console.debug,
    }

    const createInterceptor = (level: LogLevel) => (...args: unknown[]) => {
      const message = args.map(arg =>
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ')

      setLogs(prev => [...prev.slice(-99), {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        level, message, timestamp: new Date(),
        stack: level === 'error' ? new Error().stack : undefined,
      }])
      originalConsole[level](...args)
    }

    console.log = createInterceptor('log')
    console.warn = createInterceptor('warn')
    console.error = createInterceptor('error')
    console.info = createInterceptor('info')
    console.debug = createInterceptor('debug')

    const handleError = (event: ErrorEvent) => {
      setLogs(prev => [...prev.slice(-99), {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        level: 'error', message: `Unhandled Error: ${event.message}`,
        timestamp: new Date(), stack: event.error?.stack,
      }])
    }

    const handleRejection = (event: PromiseRejectionEvent) => {
      setLogs(prev => [...prev.slice(-99), {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        level: 'error', message: `Unhandled Promise Rejection: ${event.reason}`,
        timestamp: new Date(), stack: event.reason?.stack,
      }])
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleRejection)

    return () => {
      Object.assign(console, originalConsole)
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleRejection)
    }
  }, [])

  const toggleOpen = useCallback(() => setIsOpen(prev => !prev), [])
  const clearLogs = useCallback(() => setLogs([]), [])

  return (
    <DevToolsContext.Provider value={{ isOpen, toggleOpen, logs, clearLogs, filterLevel, setFilterLevel }}>
      {children}
      <DevToolsPanel />
    </DevToolsContext.Provider>
  )
}

const levelColors: Record<LogLevel, string> = {
  log: 'text-gray-300', info: 'text-blue-400', warn: 'text-yellow-400',
  error: 'text-red-400', debug: 'text-purple-400',
}

const levelBgColors: Record<LogLevel, string> = {
  log: 'bg-gray-700', info: 'bg-blue-900/50', warn: 'bg-yellow-900/50',
  error: 'bg-red-900/50', debug: 'bg-purple-900/50',
}

function DevToolsPanel() {
  const { isOpen, toggleOpen, logs, clearLogs, filterLevel, setFilterLevel } = useDevTools()
  const filteredLogs = filterLevel === 'all' ? logs : logs.filter(log => log.level === filterLevel)
  const errorCount = logs.filter(log => log.level === 'error').length
  const warnCount = logs.filter(log => log.level === 'warn').length

  return (
    <>
      <button
        onClick={toggleOpen}
        className="fixed bottom-4 right-4 w-14 h-14 bg-gray-800 hover:bg-gray-700
                   text-white rounded-full flex items-center justify-center shadow-lg
                   z-[100] transition-all border border-gray-600"
      >
        <span className="text-2xl">🛠️</span>
        {errorCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full
                          text-xs flex items-center justify-center font-bold">
            {errorCount > 9 ? '9+' : errorCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed bottom-0 left-0 right-0 h-80 bg-gray-900 text-gray-100
                       font-mono text-xs z-[99] border-t-2 border-green-500 shadow-2xl flex flex-col">
          <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
            <div className="flex items-center gap-4">
              <span className="text-green-500 font-bold">⚡ DRYON DevTools</span>
              <div className="flex gap-1">
                {(['all', 'log', 'info', 'warn', 'error', 'debug'] as const).map(level => (
                  <button key={level} onClick={() => setFilterLevel(level)}
                    className={`px-2 py-0.5 rounded text-xs ${filterLevel === level
                      ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
                    {level.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={clearLogs} className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs">Clear</button>
              <button onClick={toggleOpen} className="px-3 py-1 bg-gray-700 hover:bg-red-600 rounded text-xs">✕</button>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-2 space-y-1">
            {filteredLogs.length === 0 ? (
              <div className="text-gray-500 text-center py-8">No logs to display.</div>
            ) : filteredLogs.map(log => (
              <div key={log.id} className={`px-2 py-1 rounded ${levelBgColors[log.level]}`}>
                <div className="flex items-start gap-2">
                  <span className="text-gray-500">{log.timestamp.toLocaleTimeString()}</span>
                  <span className={`font-bold w-12 ${levelColors[log.level]}`}>[{log.level.toUpperCase()}]</span>
                  <pre className={`${levelColors[log.level]} whitespace-pre-wrap break-all flex-1`}>{log.message}</pre>
                </div>
              </div>
            ))}
          </div>

          <div className="px-4 py-1 bg-gray-800 border-t border-gray-700 text-gray-500 flex justify-between">
            <span>{filteredLogs.length} logs</span>
            <span>Next.js 15 + React 19 | Port 3001</span>
          </div>
        </div>
      )}
    </>
  )
}

export default DevToolsProvider
