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
  Observable,
  animationFrameScheduler,
  auditTime,
  fromEvent,
  map,
  merge,
  startWith
} from "rxjs"

import { ElementOffset } from "../_"

/* ----------------------------------------------------------------------------
 * Functions
 * ------------------------------------------------------------------------- */

/**
 * Retrieve element content offset (= scroll offset)
 *
 * @param el - Element
 *
 * @returns Element content offset
 */
export function getElementContentOffset(
  el: HTMLElement
): ElementOffset {
  return {
    x: el.scrollLeft,
    y: el.scrollTop
  }
}

/* ------------------------------------------------------------------------- */

/**
 * Watch element content offset
 *
 * @param el - Element
 *
 * @returns Element content offset observable
 */
export function watchElementContentOffset(
  el: HTMLElement
): Observable<ElementOffset> {
  return merge(
    fromEvent(el, "scroll"),
    fromEvent(window, "scroll"),
    fromEvent(window, "resize")
  )
    .pipe(
      auditTime(0, animationFrameScheduler),
      map(() => getElementContentOffset(el)),
      startWith(getElementContentOffset(el))
    )
}
