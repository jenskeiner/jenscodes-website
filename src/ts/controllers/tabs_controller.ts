import { Controller } from "@hotwired/stimulus";

export default class TabsController extends Controller<HTMLElement> {
  static readonly targets = ["tab", "panel"];

  // Typed targets
  declare readonly tabTargets: HTMLElement[];
  declare readonly panelTargets: HTMLElement[];

  private activeTabClasses!: string[];
  private inactiveTabClasses!: string[];

  connect(): void {
    this.activeTabClasses = (this.data.get("activeTab") || "active").split(" ");
    this.inactiveTabClasses = (this.data.get("inactiveTab") || "inactive").split(" ");

    if (this.anchor) {
      this.index = this.tabTargets.findIndex(tab => tab.id === this.anchor);
      this.showTab();
    }
  }

  change(event: Event): void {
    event.preventDefault();
    const element = event.currentTarget as HTMLElement;

    if (element.dataset.index) {
      this.index = Number(element.dataset.index);
    } else if (element.dataset.id) {
      this.index = this.tabTargets.findIndex(
        tab => tab.id == element.dataset.id
      );
    } else {
      this.index = this.tabTargets.indexOf(element);
    }

    window.dispatchEvent(new CustomEvent("tsc:tab-change"));
  }

  showTab(): void {
    this.tabTargets.forEach((tab, index) => {
      const panel = this.panelTargets[index];

      if (index === this.index) {
        panel.classList.remove("hidden");
        tab.classList.remove(...this.inactiveTabClasses);
        tab.classList.add(...this.activeTabClasses);

        if (tab.id) {
          history.replaceState({}, "", `#${tab.id}`);
        }
      } else {
        panel.classList.add("hidden");
        tab.classList.remove(...this.activeTabClasses);
        tab.classList.add(...this.inactiveTabClasses);
      }
    });
  }

  get index(): number {
    return parseInt(this.data.get("index") || "0", 10);
  }

  set index(value: number) {
    this.data.set("index", (value >= 0 ? value : 0).toString());
    this.showTab();
  }

  get anchor(): string | null {
    const parts = document.URL.split("#");
    return parts.length > 1 ? parts[1] : null;
  }
}
