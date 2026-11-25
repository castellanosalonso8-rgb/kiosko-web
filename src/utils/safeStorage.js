/** localStorage / sessionStorage con try/catch (modo privado, bloqueado, etc.) */
const make = (getStore) => ({
  get(key, fallback = null) {
    try {
      const v = getStore().getItem(key)
      return v === null ? fallback : v
    } catch {
      return fallback
    }
  },
  set(key, value) {
    try {
      getStore().setItem(key, value)
    } catch {
      /* sin storage: seguimos igual */
    }
  },
  remove(key) {
    try {
      getStore().removeItem(key)
    } catch {
      /* noop */
    }
  },
})

export const local = make(() => window.localStorage)
export const session = make(() => window.sessionStorage)
