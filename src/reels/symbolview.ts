import { Container, Graphics, Text } from "pixi.js";

export class SymbolView extends Container {
  private index: number;
  private readonly size: number;
  private highlight?: Graphics;

  constructor(value: number, size: number) {
    super();
    this.size = size;
    this.index = value;
    this.render();
  }

  get id(): number {
    return this.index;
  }

  getValue(): number {
    return this.index + 1;
  }

  setId(index: number): void {
    this.index = index;
    this.render();
  }

  setHighlight(enabled: boolean): void {
    if (enabled && !this.highlight) {
      this.highlight = new Graphics()
        .rect(0, 0, this.size, this.size)
        .setStrokeStyle({
          width: 6,
          color: "#000000",
          alpha: 0.5,
          alignment: 1,
        })
        .stroke();
      this.addChild(this.highlight);
    }

    if (!enabled && this.highlight) {
      this.highlight.destroy();
      this.highlight = undefined;
    }
  }

  private render(): void {
    this.removeChildren();

    const bg = new Graphics()
      .rect(0, 0, this.size, this.size)
      .fill(this.getColor(this.id));

    const label = new Text({
      text: String(this.getValue()),
      style: { fill: "#ffffff", fontSize: 32, fontWeight: "bold" },
    });
    label.anchor.set(0.5);
    label.position.set(this.size / 2, this.size / 2);

    this.addChild(bg, label);

    if (this.highlight) {
      this.addChild(this.highlight);
    }
  }

  private getColor(value: number): string {
    const colors = ["#e74c3c", "#f1c40f", "#2ecc71", "#3498db", "#9b59b6"];
    return colors[value % colors.length];
  }
}
