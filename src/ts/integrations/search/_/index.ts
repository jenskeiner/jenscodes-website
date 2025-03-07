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

import {
  SearchDocument,
  SearchIndex,
  SearchOptions,
  setupSearchDocumentMap
} from "../config"
import {
  Position,
  PositionTable,
  highlight,
  highlightAll,
  tokenize
} from "../internal"
import {
  SearchQueryTerms,
  getSearchQueryTerms,
  parseSearchQuery,
  segment,
  transformSearchQuery
} from "../query"
import { lunr } from "../shared"


/* ----------------------------------------------------------------------------
 * Types
 * ------------------------------------------------------------------------- */

/**
 * Search item
 */
export interface SearchItem
  extends SearchDocument
{
  score: number                        /* Score (relevance) */
  terms: SearchQueryTerms              /* Search query terms */
}

/**
 * Search result
 */
export interface SearchResult {
  items: SearchItem[][]                /* Search items */
  suggest?: string[]                   /* Search suggestions */
}

/* ----------------------------------------------------------------------------
 * Functions
 * ------------------------------------------------------------------------- */

/**
 * Create field extractor factory
 *
 * @param table - Position table map
 *
 * @returns Extractor factory
 */
function extractor(table: Map<string, PositionTable>) {
  return (name: keyof SearchDocument) => {
    return (doc: SearchDocument) => {
      if (typeof doc[name] === "undefined")
        return undefined

      /* Compute identifier and initialize table */
      const id = [doc.location, name].join(":")
      lunr.tokenizer.table = []
      table.set(id, lunr.tokenizer.table)

      /* Return field value */
      return doc[name]
    }
  }
}

/**
 * Compute the difference of two lists of strings
 *
 * @param a - 1st list of strings
 * @param b - 2nd list of strings
 *
 * @returns Difference
 */
function difference(a: string[], b: string[]): string[] {
  const [x, y] = [new Set(a), new Set(b)]
  return [
    ...new Set([...x].filter(value => !y.has(value)))
  ]
}

/* ----------------------------------------------------------------------------
 * Class
 * ------------------------------------------------------------------------- */

/**
 * Search index
 */
export class Search {

  /**
   * Search document map
   */
  protected map: Map<string, SearchDocument>

  /**
   * Search options
   */
  protected options: SearchOptions

  /**
   * The underlying Lunr.js search index
   */
  protected index: lunr.Index

  /**
   * Internal position table map
   */
  protected table: Map<string, PositionTable>

  /**
   * Create the search integration
   *
   * @param data - Search index
   */
  public constructor({ config, docs, options }: SearchIndex) {
    /* Initialize position table */
    this.table = new Map()
    const field = extractor(this.table)

    /* Set up document map and options */
    this.map = setupSearchDocumentMap(docs)
    this.options = options

    /* Set up document index */
    this.index = lunr(function (this: lunr.Builder) {
      this.metadataWhitelist = ["position"]
      this.b(0)

      /* Set up (multi-)language support */
      if (config.lang.length === 1 && config.lang[0] !== "en") {
        this.use(lunr[config.lang[0]])
      } else if (config.lang.length > 1) {
        this.use(lunr.multiLanguage(...config.lang))
      }

      /* Set up custom tokenizer (must be after language setup) */
      this.tokenizer = tokenize as typeof lunr.tokenizer
      lunr.tokenizer.separator = new RegExp(config.separator)

      /* Set up custom segmenter, if loaded */
      lunr.segmenter = "TinySegmenter" in lunr
        ? new lunr.TinySegmenter()
        : undefined

      /* Compute functions to be removed from the pipeline */
      const fns = difference([
        "trimmer", "stopWordFilter", "stemmer"
      ], config.pipeline)

      /* Remove functions from the pipeline for registered languages */
      for (const lang of config.lang.map(language => (
        language === "en" ? lunr : lunr[language]
      )))
        for (const fn of fns) {
          this.pipeline.remove(lang[fn])
          this.searchPipeline.remove(lang[fn])
        }

      /* Set up index reference */
      this.ref("location")

      /* Set up index fields */
      this.field("title", { boost: 1e3, extractor: field("title") })
      this.field("text",  { boost: 1e0, extractor: field("text") })
      this.field("tags",  { boost: 1e6, extractor: field("tags") })

      /* Add documents to index */
      for (const doc of docs)
        this.add(doc, { boost: doc.boost })
    })
  }

  /**
   * Search for matching documents
   *
   * @param query - Search query
   *
   * @returns Search result
   */
  public search(query: string): SearchResult {

    // Experimental Chinese segmentation
    query = query.replace(/\p{sc=Han}+/gu, value => {
      return [...segment(value, this.index.invertedIndex)]
        .join("* ")
    })

    // @todo: move segmenter (above) into transformSearchQuery
    query = transformSearchQuery(query)
    if (!query)
      return { items: [] }

    /* Parse query to extract clauses for analysis */
    const clauses = parseSearchQuery(query)
      .filter(clause => (
        clause.presence !== lunr.Query.presence.PROHIBITED
      ))

    /* Perform search and post-process results */
    const groups = this.index.search(query)

      /* Apply post-query boosts based on title and search query terms */
      .filter(({ ref }) => typeof this.map.get(ref) !== "undefined")
      .map(({ ref, score, matchData }) => {
        let doc = this.map.get(ref)!

        /* Shallow copy document */
        doc = { ...doc }
        if (doc.tags)
          doc.tags = [...doc.tags]

        console.log("Search result:", doc)

        console.log("Match data:", matchData)

        /* Compute and analyze search query terms */
        const terms = getSearchQueryTerms(
          clauses,
          Object.keys(matchData.metadata)
        )

        console.log("Search terms:", terms)

        /* Highlight matches in fields */
        for (const field of this.index.fields) {
          if (typeof doc[field as keyof SearchDocument] === "undefined")
            continue

          // Only process string or string[] fields
          if (field !== "title" && field !== "text" && field !== "tags") continue
          
          /* Collect positions from matches */
          const positions: Position[] = []
          for (const match of Object.values(matchData.metadata)) {
            if (match[field]?.position) {
              // Extract start positions from the [start, length] tuples
              //positions.push(...match[field].position.map(pos => pos[0]))
              positions.push(...match[field].position.map(pos => pos))
            }
          }

          console.log(`Positions for field "${field}":`, positions)

          /* Skip highlighting, if no positions were collected */
          if (!positions.length)
            continue

          /* Load table and determine highlighting method */
          const table = this.table.get([doc.location, field].join(":"))!
          const value = doc[field as keyof SearchDocument]
          const isArray = Array.isArray(value)

          if (isArray && field === "tags") {
            doc = {
              ...doc,
              [field]: highlightAll(value as string[], table, positions, true)
            } as SearchDocument
          } else if (field === "title" || field === "text") {
            doc = {
              ...doc,
              [field]: highlight(value as string, table, positions, field !== "text")
            } as SearchDocument
          }
        }

        /* Highlight title and text and apply post-query boosts */
        const boost = +!doc.parent +
          Object.values(terms)
            .filter(t => t).length /
          Object.keys(terms).length

        /* Return modified item */
        return {
          ...doc,
          score: score * (1 + boost ** 2),
          terms
        }
      })

      /* Sort search results again after applying boosts */
      .sort((a, b) => b.score - a.score)

      /* Group search results by article */
      .reduce((items, result) => {
        const doc = this.map.get(result.location)
        if (typeof doc !== "undefined") {
          const ref = doc.parent
            ? doc.parent.location
            : doc.location
          items.set(ref, [...items.get(ref) || [], result])
        }
        return items
      }, new Map<string, SearchItem[]>())

    /* Ensure that every item set has an article */
    for (const [ref, items] of groups)
      if (!items.find(item => item.location === ref)) {
        const doc = this.map.get(ref)!
        items.push({ ...doc, score: 0, terms: {} })
      }

    /* Generate search suggestions, if desired */
    let suggest: string[] | undefined
    if (this.options.suggest) {
      const titles = this.index.query(builder => {
        for (const clause of clauses)
          builder.term(clause.term, {
            fields: ["title"],
            presence: lunr.Query.presence.REQUIRED,
            wildcard: lunr.Query.wildcard.TRAILING
          })
      })

      /* Retrieve suggestions for best match */
      suggest = titles.length
        ? Object.keys(titles[0].matchData.metadata)
        : []
    }

    /* Return search result */
    return {
      items: [...groups.values()],
      ...typeof suggest !== "undefined" && { suggest }
    }
  }
}
