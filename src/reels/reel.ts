import { Container, Graphics } from "pixi.js";
import { SymbolView } from "./symbolview";

const SYMBOL_SIZE = 140;
const VISIBLE_SYMBOLS = 3;
const BUFFER_SYMBOLS = 2;
const TOTAL_SYMBOLS = VISIBLE_SYMBOLS + BUFFER_SYMBOLS * 2;

const MAX_SPEED = 30;
const DECELERATION = 0.92;
const STOP_EPSILON = 0.5;

export class Reel extends Container {
  private readonly symbols: SymbolView[] = [];
  private readonly symbolContainer = new Container();

  private speed = 0;
  private stopping = false;

  constructor() {
    super();
    this.addChild(this.symbolContainer);
    this.createMask();
    this.createSymbols();
  }

  startSpin(): void {
    this.speed = MAX_SPEED;
    this.stopping = false;
  }

  stopSpin(result: number[]): void {
    this.stopping = true;

    const start = BUFFER_SYMBOLS;
    for (let i = 0; i < VISIBLE_SYMBOLS; i++) {
      this.symbols[start + i].setId(result[i]);
    }

    this.symbols[0].setId(Math.floor(Math.random() * 5));
    this.symbols[start + VISIBLE_SYMBOLS].setId(Math.floor(Math.random() * 5));
  }

  update(delta: number): void {
    if (this.speed <= 0) return;

    this.symbolContainer.y += this.speed * delta;

    if (!this.stopping) {
      for (const symbol of this.symbols) {
        const y = symbol.y + this.symbolContainer.y;
        if (y >= SYMBOL_SIZE * (VISIBLE_SYMBOLS + BUFFER_SYMBOLS)) {
          symbol.y -= TOTAL_SYMBOLS * SYMBOL_SIZE;
          symbol.setId(Math.floor(Math.random() * 5));
        }
      }
      return;
    }

    this.speed *= DECELERATION;

    const target =
      Math.round(this.symbolContainer.y / SYMBOL_SIZE) * SYMBOL_SIZE;
    const distance = target - this.symbolContainer.y;

    this.symbolContainer.y += distance * 0.2;

    if (Math.abs(distance) < 0.5 && this.speed < STOP_EPSILON) {
      this.symbolContainer.y = target;
      this.speed = 0;
      this.stopping = false;
    }
  }

  isStopped(): boolean {
    return !this.stopping && this.speed === 0;
  }

  getAllVisibleSymbols(): number[] {
    return this.getVisible().map((v) => v.symbol.id);
  }

  getAllVisibleSymbolViews(): SymbolView[] {
    return this.getVisible().map((v) => v.symbol);
  }

  private getVisible(): { symbol: SymbolView; y: number }[] {
    const items = this.symbols.map((s) => ({
      symbol: s,
      y: s.y + this.symbolContainer.y,
    }));

    items.sort((a, b) => a.y - b.y);

    return items
      .filter(
        (v) => v.y + SYMBOL_SIZE > 0 && v.y < SYMBOL_SIZE * VISIBLE_SYMBOLS,
      )
      .slice(0, VISIBLE_SYMBOLS);
  }

  private createMask(): void {
    const mask = new Graphics()
      .rect(0, 0, SYMBOL_SIZE, SYMBOL_SIZE * VISIBLE_SYMBOLS)
      .fill("#ffffff");
    this.mask = mask;
    this.addChild(mask);
  }

  private createSymbols(): void {
    for (let i = 0; i < TOTAL_SYMBOLS; i++) {
      const symbol = new SymbolView(Math.floor(Math.random() * 5), SYMBOL_SIZE);
      symbol.y = i * SYMBOL_SIZE;
      this.symbols.push(symbol);
      this.symbolContainer.addChild(symbol);
    }
    this.symbolContainer.y = -BUFFER_SYMBOLS * SYMBOL_SIZE;
  }
}
