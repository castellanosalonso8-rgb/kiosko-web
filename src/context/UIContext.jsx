import { createContext, useCallback, useContext, useRef, useState } from 'react'
import ConfirmDialog from '../components/admin/ConfirmDialog'

const UIContext = createContext({ confirm: async () => false })

/** confirm({title, message, confirmLabel}) → Promise<boolean>. Se usa para todo borrado. */
export function UIProvider({ children }) {
  const [dialog, setDialog] = useState(null)
  const resolver = useRef(null)

  const confirm = useCallback(
    (opts) =>
      new Promise((resolve) => {
        resolver.current = resolve
        setDialog(opts)
      }),
    []
  )

  const close = (answer) => {
    resolver.current?.(answer)
    resolver.current = null
    setDialog(null)
  }

  return (
    <UIContext.Provider value={{ confirm }}>
      {children}
      {dialog && (
        <ConfirmDialog
          title={dialog.title}
          message={dialog.message}
          confirmLabel={dialog.confirmLabel}
          onConfirm={() => close(true)}
          onCancel={() => close(false)}
        />
      )}
    </UIContext.Provider>
  )
}

export const useUI = () => useContext(UIContext)
