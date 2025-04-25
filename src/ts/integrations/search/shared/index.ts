import lunr from "lunr"

/* ----------------------------------------------------------------------------
 * Shared lunr instance
 * ------------------------------------------------------------------------- */

/**
 * Export a single shared instance of lunr to be used across all modules
 * This ensures that lunr.tokenizer.table and other shared state is properly shared
 */
export { lunr }
