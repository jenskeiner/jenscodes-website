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


/* ----------------------------------------------------------------------------
 * Types
 * ------------------------------------------------------------------------- */

/**
 * Tooltip style
 */
export type TooltipStyle =
  | "inline"

/* ----------------------------------------------------------------------------
 * Functions
 * ------------------------------------------------------------------------- */

/**
 * Render a tooltip
 *
 * @param id - Tooltip identifier
 * @param style - Tooltip style
 *
 * @returns Element
 */
export function renderTooltip(
  id?: string, style?: TooltipStyle
): HTMLElement {
  const tooltip = document.createElement('div');
  tooltip.className = style === 'inline' ? 'md-tooltip md-tooltip--inline' : 'md-tooltip';
  tooltip.setAttribute('role', 'tooltip');
  if (id) {
    tooltip.id = id;
  }

  const inner = document.createElement('div');
  inner.className = 'md-tooltip__inner jc-typeset';
  
  tooltip.appendChild(inner);
  return tooltip;
}

/**
 * Render an inline tooltip with children
 *
 * @param children - Children to render inside the tooltip
 * @returns Element
 */
export function renderInlineTooltip2(
  ...children: (string | Node)[]
): HTMLElement {
  const tooltip = document.createElement('div');
  tooltip.className = 'md-tooltip2';
  tooltip.setAttribute('role', 'tooltip');

  const inner = document.createElement('div');
  inner.className = 'md-tooltip2__inner jc-typeset';
  
  // Append each child to the inner div
  for (const child of children) {
    if (typeof child === 'string') {
      inner.appendChild(document.createTextNode(child));
    } else if (child instanceof Node) {
      inner.appendChild(child);
    }
  }
  
  tooltip.appendChild(inner);
  return tooltip;
}
