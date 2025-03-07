/* Compute base path once to integrate with instant loading */
const __jc_scope = new URL(location.href)

console.log("__jc_scope", __jc_scope)


/**
 * Fetch the value for a key from the given storage
 *
 * This function is defined in `partials/javascripts/base.html`, so it can be
 * used from the templates, as well as from the application bundle.
 *
 * @template T - Data type
 *
 * @param key - Key
 * @param storage - Storage (default: local storage)
 * @param base - Base URL (default: current base)
 *
 * @return Value or nothing
 */
export function __jc_get<T>(
    key: string, storage: Storage = localStorage, scope: URL = __jc_scope
  ): T | null
{
  const result = storage.getItem(scope.pathname + "." + key)
  if (result !== null)
      return JSON.parse(result)
  else
    return null
}

/**
 * Persist a key-value pair in the given storage
 *
 * This function is defined in `partials/javascripts/base.html`, so it can be
 * used from the templates, as well as from the application bundle.
 *
 * @template T - Data type
 *
 * @param key - Key
 * @param value - Value
 * @param storage - Storage (default: local storage)
 * @param base - Base URL (default: current base)
 */
export function __jc_set<T>(
key: string, value: T, storage: Storage = localStorage, scope: URL = __jc_scope
): void
{
  try {
    storage.setItem(scope.pathname + "." + key, JSON.stringify(value))
  } catch {
    /* Uncritical, just swallow */
  }  
}
