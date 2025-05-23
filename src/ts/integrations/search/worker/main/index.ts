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
 * FITNESS FOR A RTICULAR PURPOSE AND NON-INFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 */

import { lunr } from "../../shared"

//import "~/polyfills"

import { Search } from "../../_"
import { SearchConfig } from "../../config"
import {
  SearchMessage,
  SearchMessageType
} from "../message"
  /* Import required language support */
//import 'lunr/lunr.stemmer.support'
//import 'lunr/lunr.multi'
//import 'lunr/lunr.ja'  // Japanese support
//import 'lunr/lunr.hi'  // Hindi support
//import 'lunr/lunr.th'  // Thai support

console.log("[WORKER] Search worker script loaded and executing...");

// /* ----------------------------------------------------------------------------
//  * Types
//  * ------------------------------------------------------------------------- */

// /**
//  * Add support for `iframe-worker` shim
//  *
//  * While `importScripts` is synchronous when executed inside of a web worker,
//  * it's not possible to provide a synchronous shim implementation. The cool
//  * thing is that awaiting a non-Promise will convert it into a Promise, so
//  * extending the type definition to return a `Promise` shouldn't break anything.
//  *
//  * @see https://bit.ly/2PjDnXi - GitHub comment
//  *
//  * @param urls - Scripts to load
//  *
//  * @returns Promise resolving with no result
//  */
// declare global {
//   function importScripts(...urls: string[]): Promise<void> | void
// }

/* ----------------------------------------------------------------------------
 * Data
 * ------------------------------------------------------------------------- */

/**
 * Search index
 */
let index: Search

/* ----------------------------------------------------------------------------
 * Helper functions
 * ------------------------------------------------------------------------- */

/**
 * Fetch (= import) multi-language support through `lunr-languages`
 *
 * This function automatically imports the stemmers necessary to process the
 * languages which are defined as part of the search configuration.
 *
 * If the worker runs inside of an `iframe` (when using `iframe-worker` as
 * a shim), the base URL for the stemmers to be loaded must be determined by
 * searching for the first `script` element with a `src` attribute, which will
 * contain the contents of this script.
 *
 * @param config - Search configuration
 *
 * @returns Promise resolving with no result
 */
async function setupSearchLanguages(
  config: SearchConfig
): Promise<void> {
  /* Add language support based on config */
  const languages: string[] = []
  for (const lang of config.lang) {
    switch (lang) {
      case "ja":
      case "hi":
      case "th":
        languages.push(lang)
        break
    }

    /* Add language support */
    if (lang !== "en")
      languages.push(lang)
  }

  /* Add multi-language support */
  if (config.lang.length > 1) {
    // Multi-language support is already imported above
    // No additional runtime configuration needed
    console.log("[WORKER] Multi-language support already imported");
  }
}

/* ----------------------------------------------------------------------------
 * Functions
 * ------------------------------------------------------------------------- */

/**
 * Message handler
 *
 * @param message - Source message
 *
 * @returns Target message
 */
async function handler(
  message: SearchMessage
): Promise<SearchMessage> {
  console.log("[WORKER] Received message:", message);
  switch (message.type) {

    /* Search setup message */
    case SearchMessageType.SETUP:
      await setupSearchLanguages(message.data.config)
      index = new Search(message.data)
      return {
        type: SearchMessageType.READY
      }

    /* Search query message */
    case SearchMessageType.QUERY: {
      const query = message.data
      try {
        const result = index.search(query)
        console.log("[WORKER] Search query result:", result)
        return {
          type: SearchMessageType.RESULT,
          data: result
        }

      /* Return empty result in case of error */
      } catch (err) {
        console.warn(`Invalid query: ${query} – see https://bit.ly/2s3ChXG`)
        console.warn(err)
        return {
          type: SearchMessageType.RESULT,
          data: { items: [] }
        }
      }
    }
    /* All other messages */
    default:
      throw new TypeError("Invalid message type")
  }
}

/* ----------------------------------------------------------------------------
 * Worker
 * ------------------------------------------------------------------------- */

/* Expose Lunr.js in global scope, or stemmers won't work */
self.lunr = lunr

/* Monkey-patch Lunr.js to mitigate https://t.ly/68TLq */
lunr.utils.warn = console.warn

/* Handle messages */
addEventListener("message", async ev => {
  postMessage(await handler(ev.data))
})
