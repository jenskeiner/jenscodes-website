/*
 * Copyright (c) 2016-2025 Martin Donath <martin.donath@squidfunk.com>
 * Copyright (c) 2025 Jens Keiner <jens.keiner@gmail.com>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to
 * deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NON-INFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 */

import escapeHTML from "escape-html"

import { SearchConfig } from "../config"

/* ----------------------------------------------------------------------------
 * Types
 * ------------------------------------------------------------------------- */

/**
 * Search highlight function
 *
 * @param value - Value
 *
 * @returns Highlighted value
 */
export type SearchHighlightFn = (value: string) => string

/**
 * Search highlight factory function
 *
 * @param query - Query value
 *
 * @returns Search highlight function
 */
export type SearchHighlightFactoryFn = (query: string) => SearchHighlightFn

/* ----------------------------------------------------------------------------
 * Functions
 * ------------------------------------------------------------------------- */

/**
 * Create a search highlighter
 *
 * @param config - Search configuration
 *
 * @returns Search highlight factory function
 */
export function setupSearchHighlighter(
  config: SearchConfig
): SearchHighlightFactoryFn {
  // Hack: temporarily remove pure lookaheads and lookbehinds
  const regex = config.separator.split("|").map(term => {
    const temp = term.replace(/(\(\?[!=<][^)]+\))/g, "")
    return temp.length === 0 ? "�" : term
  })
    .join("|")

  const separator = new RegExp(regex, "img")
  const highlight = (_: unknown, data: string, term: string) => {
    return `${data}<mark data-md-highlight>${term}</mark>`
  }

  /* Return factory function */
  return (query: string) => {
    query = query
      .replace(/[\s*+\-:~^]+/g, " ")
      .trim()

    /* Create search term match expression */
    const match = new RegExp(`(^|${config.separator}|)(${
      query
        .replace(/[|\\{}()[\]^$+*?.-]/g, "\\$&")
        .replace(separator, "|")
    })`, "img")

    /* Highlight string value */
    return value => escapeHTML(value)
      .replace(match, highlight)
      .replace(/<\/mark>(\s+)<mark[^>]*>/img, "$1")
  }
}
