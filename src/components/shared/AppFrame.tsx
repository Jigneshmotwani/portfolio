import { Component, Suspense, useMemo, type ReactNode } from 'react'
import { apps } from '../../apps/registry'
import { AppContext, type AppContextValue } from '../../apps/types'
import './AppFrame.css'

class ErrorBoundary extends Component<{ name: string; children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }
  static getDerivedStateFromError(error: Error) {
    return { error }
  }
  componentDidCatch(error: Error) {
    console.error(`[${this.props.name}] crashed`, error)
  }
  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="app-frame__error" role="alert">
        <strong>{this.props.name} quit unexpectedly.</strong>
        <span>{this.state.error.message}</span>
        <button className="btn" onClick={() => this.setState({ error: null })}>
          Reopen
        </button>
      </div>
    )
  }
}

export function AppLoading() {
  return (
    <div className="app-frame__loading" aria-label="Loading">
      <div className="spinner" />
    </div>
  )
}

/** Renders an app with its context, a Suspense fallback and an error boundary. Used by both shells. */
export function AppFrame(props: AppContextValue) {
  const { appId, instanceId, platform, active, params, setTitle, close } = props
  const value = useMemo(
    () => ({ appId, instanceId, platform, active, params, setTitle, close }),
    [appId, instanceId, platform, active, params, setTitle, close],
  )
  const def = apps[appId]
  const App = def.component
  return (
    <AppContext.Provider value={value}>
      <ErrorBoundary name={def.name}>
        <Suspense fallback={<AppLoading />}>
          <App />
        </Suspense>
      </ErrorBoundary>
    </AppContext.Provider>
  )
}
