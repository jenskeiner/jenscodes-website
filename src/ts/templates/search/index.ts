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

import { configuration, feature, translation } from "~/_"
import { SearchItem } from "~/integrations/search"
import { h } from "~/utilities"

/* ----------------------------------------------------------------------------
 * Helper types
 * ------------------------------------------------------------------------- */

/**
 * Render flag
 */
const enum Flag {
  TEASER = 1,                          /* Render teaser */
  PARENT = 2                           /* Render as parent */
}

/* ----------------------------------------------------------------------------
 * Helper function
 * ------------------------------------------------------------------------- */

/**
 * Render a search document
 *
 * @param doc - Search document
 * @param flag - Render flags
 *
 * @returns Element
 */
export function renderSearchDocument(
  doc: SearchItem, flag: Flag
): HTMLElement {
  const parent = flag & Flag.PARENT
  const teaser = flag & Flag.TEASER

  /* Render missing query terms */
  const missing = Object.keys(doc.terms)
    .filter(key => !doc.terms[key])
    .reduce<(string | HTMLElement)[]>((list, key) => {
      const del = document.createElement("del")
      del.textContent = escapeHTML(key)
      return [...list, del, " "]
    }, [])
    .slice(0, -1)

  /* Assemble query string for highlighting */
  const config = configuration()
  const url = new URL(doc.location, config.base)
  if (feature("search.highlight"))
    url.searchParams.set("h", Object.entries(doc.terms)
      .filter(([, match]) => match)
      .reduce((highlight, [value]) => `${highlight} ${value}`.trim(), "")
    )

  /* Create link element */
  const link = h<HTMLAnchorElement>("a", {
    href: `${url}`,
    class: "search-result-link",
    tabIndex: -1
  })

  /* Create article element */
  const article = h<HTMLElement>("article", {
    class: "search-result-article md-typeset",
    "data-md-score": doc.score.toFixed(2)
  })

  /* Add to DOM hierarchy */
  link.appendChild(article)

  /* Render article or section, depending on flags */
  const { tags } = configuration()
  
  /* Add icon for parent */
  if (parent > 0) {
    const icon = h<HTMLDivElement>("div", { class: "search-result-icon md-icon" })
    article.appendChild(icon)
  }

  /* Add title */
  if (parent > 0) {
    const title = h<HTMLHeadingElement>("h1", {})
    title.innerHTML = doc.title
    article.appendChild(title)
  } else {
    const title = h<HTMLHeadingElement>("h2", {})
    title.textContent = doc.title
    article.appendChild(title)
  }

  /* Add teaser text if available */
  if (teaser > 0 && doc.text.length > 0) {
    const text = document.createElement("div")
    text.innerHTML = doc.text
    console.log("Adding text:", text)
    article.appendChild(text)
  }

  /* Add tags if available */
  if (doc.tags) {
    const nav = h<HTMLElement>("nav", { class: "search-result-tags" })
    
    doc.tags.forEach(tag => {
      const type = tags
        ? tag in tags
          ? `md-tag-icon md-tag--${tags[tag]}`
          : "md-tag-icon"
        : ""
      
      const span = h<HTMLSpanElement>("span", { class: `search-result-tag ${type}` })
      span.innerHTML = tag
      nav.appendChild(span)
    })
    
    article.appendChild(nav)
  }

  /* Add missing terms if available */
  if (teaser > 0 && missing.length > 0) {
    const p = h<HTMLParagraphElement>("p", { class: "md-search-result__terms" })
    p.textContent = `${translation("search.result.term.missing")}: `
    
    missing.forEach(item => {
      if (typeof item === "string") {
        p.appendChild(document.createTextNode(item))
      } else {
        p.appendChild(item)
      }
    })
    
    article.appendChild(p)
  }

  return link
}

/* ----------------------------------------------------------------------------
 * Functions
 * ------------------------------------------------------------------------- */

/**
 * Render a search result item
 *
 * @param result - Search result
 *
 * @returns Element
 */
export function renderSearchResultItem(
  result: SearchItem[]
): HTMLElement {
  const threshold = result[0].score
  const docs = [...result]

  const config = configuration()

  /* Find and extract parent article */
  const parent = docs.findIndex(doc => {
    const l = `${new URL(doc.location, config.base)}` // @todo hacky
    return !l.includes("#")
  })
  const [article] = docs.splice(parent, 1)

  /* Determine last index above threshold */
  let index = docs.findIndex(doc => doc.score < threshold)
  if (index === -1)
    index = docs.length

  /* Partition sections */
  const best = docs.slice(0, index)
  const more = docs.slice(index)

  /* Create list item element */
  const listItem = h<HTMLLIElement>("li", { class: "search-result-item" })

  /* Add parent article */
  listItem.appendChild(renderSearchDocument(article, Flag.PARENT | +(!parent && index === 0)))
  
  /* Add best matches */
  best.forEach(section => {
    listItem.appendChild(renderSearchDocument(section, Flag.TEASER))
  })

  /* Add more results if available */
  if (more.length) {
    const details = h<HTMLDetailsElement>("details", { class: "search-result-more" })
    const summary = h<HTMLElement>("summary", { tabIndex: -1 })
    const div = h<HTMLDivElement>("div", {})
    
    /* Set summary text */
    div.textContent = more.length > 0 && more.length === 1
      ? translation("search.result.more.one")
      : translation("search.result.more.other", more.length)
    
    /* Build DOM structure */
    summary.appendChild(div)
    details.appendChild(summary)
    
    /* Add all remaining sections */
    more.forEach(section => {
      details.appendChild(renderSearchDocument(section, Flag.TEASER))
    })
    
    /* Add details to list item */
    listItem.appendChild(details)
  }

  return listItem
}
