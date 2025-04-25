import { Controller } from "@hotwired/stimulus";
import { useClickOutside, useTransition } from "stimulus-use";

export default class SelectVersionController extends Controller<HTMLElement> {
  static readonly targets = ["button", "menu", "buttonTitle"];
  static readonly values = {
    originStyle: String,
    targetStyle: String
  };

  // Typed targets
  declare readonly buttonTarget: HTMLElement;
  declare readonly hasButtonTarget: boolean;
  declare readonly menuTarget: HTMLElement;
  declare readonly hasMenuTarget: boolean;
  declare readonly buttonTitleTarget: HTMLElement;
  declare readonly hasButtonTitleTarget: boolean;

  // Typed values
  declare originStyleValue: string;
  declare targetStyleValue: string;

  // Transition mixin methods
  declare enter: () => void;
  declare leave: () => void;
  declare toggleTransition: () => void;
  declare transitioned: boolean;

  connect(): void {
    useTransition(this, { element: this.menuTarget });
    useClickOutside(this);
  }

  open(): void {
    this.enter();
  }

  close(event: KeyboardEvent): void {
    if (event.keyCode && event.keyCode !== 27) {
      return;
    }
    this.leave();
  }

  select(event: Event): void {
    event.preventDefault();
    const element = event.currentTarget as HTMLElement;
    const title = element.dataset.selectTitle;
    if (!title || !this.hasButtonTitleTarget) {
      return;
    }
    this.buttonTitleTarget.textContent = title;
    this.close(event as unknown as KeyboardEvent);
  }

  toggle(): void {
    this.toggleTransition();
    if (this.transitioned) {
      // Focus on first element
    } else {
      this.buttonTarget.blur();
    }
  }
}
