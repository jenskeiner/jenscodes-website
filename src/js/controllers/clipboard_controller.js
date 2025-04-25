import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  initialize() {
    document
      .querySelectorAll("div.highlight > pre > code")
      .forEach((codeBlock) => {
        const button = document.createElement("button")
        button.className = "clipboard-button"
        button.type = "button"
        button.title = "Copy to clipboard"
        button.setAttribute("aria-label", "Copy to clipboard")
        // No innerHTML assignment! Icon is handled by CSS
        button.addEventListener("click", () => {
          navigator.clipboard
            .writeText((codeBlock.innerText || "").trim())
            .then(
              () => {
                button.blur()
                button.classList.add("is-copied")
                setTimeout(() => button.classList.remove("is-copied"), 2000)
              },
              () => {
                button.classList.remove("is-copied")
                button.setAttribute("aria-label", "Error copying")
              },
            )
        })
        const pre = codeBlock.parentNode
        pre.parentNode.insertBefore(button, pre)
      })
  }
}
