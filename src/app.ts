import "./css/app.css"

import { Application } from "@hotwired/stimulus"
import { TransitionController, ClickOutsideController } from "stimulus-use"
import MenuController from "./js/controllers/menu_controller"
import SelectVersionController from "./ts/controllers/select_version_controller"
import ModeSwitchController from "./js/controllers/mode_switch_controller"
import TabsController from "./ts/controllers/tabs_controller"
import ClipboardController from "./js/controllers/clipboard_controller"
import AutocolumnsController from "./js/controllers/autocolumns_controller"

// import "focus-visible"

import {
  NEVER,
  Observable,
  defer,
   delay,
   map,
   merge,
   mergeWith,
  shareReplay,
   switchMap
} from "rxjs"

import { configuration } from "./ts/_"
import {
  requestJSON,
  setToggle,
  watchDocument,
  watchKeyboard,
  watchLocation,
  watchLocationTarget,
  watchMedia,
  watchPrint,
  watchScript,
  watchViewport,
  getElement
} from "./ts/browser"

import {
  getComponentElements,
  mountSearch,
} from "./ts/components"

import {
  SearchIndex,
} from "./ts/integrations"

/**
 * Fetch search index
 *
 * @returns Search index observable
 */
function fetchSearchIndex(): Observable<SearchIndex> {
    console.log("Fetching search index")
    const searchIndexLocation = getElement<HTMLInputElement>("#__search_index").value
    const searchIndexURL = new URL(searchIndexLocation, configuration().base)
    console.log("Search index location", searchIndexLocation)
    console.log("Search index URL", searchIndexURL)
    if (location.protocol === "file:") {
      console.log("Fetching search index from file", searchIndexURL)
      return watchScript(
        `${searchIndexURL}`
      )
        .pipe(
          // @ts-expect-error - @todo fix typings
          map(() => __index),
          shareReplay(1)
        )
    } else {
      console.log("Fetching search index from URL", searchIndexURL)
      return requestJSON<SearchIndex>(
        searchIndexURL
      )
    }
  }

/* Yay, JavaScript is available */
document.documentElement.classList.remove("no-js")
document.documentElement.classList.add("js")

/* Set up navigation observables and subjects */
const document$ = watchDocument()
const location$ = watchLocation()
const target$   = watchLocationTarget(location$)
const keyboard$ = watchKeyboard()

/* Set up media observables */
const viewport$ = watchViewport()
const tablet$   = watchMedia("(min-width: 960px)")
const screen$   = watchMedia("(min-width: 1220px)")
const print$    = watchPrint()

/* Retrieve search index, if search is enabled */
const index$ = document.forms.namedItem("search")
  ? fetchSearchIndex()
  : NEVER

/* Always close drawer and search on navigation */
merge(location$, target$)
  .pipe(
    delay(125)
  )
    .subscribe(() => {
      setToggle("drawer", false)
      setToggle("search", false)
    })

/* Set up control component observables */
const control$ = merge(
  /* Search */
  ...getComponentElements("search")
    .map(el => mountSearch(el, { index$, keyboard$ })),
)

/* Set up content component observables */
const content$ = defer(() => merge(
))

/* Set up component observables */
const component$ = document$
  .pipe(
    switchMap(() => content$),
    mergeWith(control$),
    shareReplay(1)
  )

/* Subscribe to all components */
component$.subscribe((event) => console.log("Component updated:", event))

/* ----------------------------------------------------------------------------
 * Exports
 * ------------------------------------------------------------------------- */

window.document$  = document$          /* Document observable */
window.location$  = location$          /* Location subject */
window.target$    = target$            /* Location target observable */
window.keyboard$  = keyboard$          /* Keyboard observable */
window.viewport$  = viewport$          /* Viewport observable */
window.tablet$    = tablet$            /* Media tablet observable */
window.screen$    = screen$            /* Media screen observable */
window.print$     = print$             /* Media print observable */
window.component$ = component$         /* Component observable */

const application = Application.start()
application.register("clipboard", ClipboardController)
application.register("transition", TransitionController)
application.register("click-outside", ClickOutsideController)
application.register("menu", MenuController)
application.register("select-version", SelectVersionController)
application.register("select", SelectVersionController)
application.register("mode-switch", ModeSwitchController)
application.register("tabs", TabsController)
application.register("autocolumns", AutocolumnsController)
