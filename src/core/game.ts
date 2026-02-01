import { Application, Container, Graphics, Text, Ticker } from "pixi.js";
import { Reel } from "../reels/reel";

type GameState = "IDLE" | "SPINNING" | "RESULT";

const WIN_LINES: [number, number][][] = [
  [[0, 0], [1, 0], [2, 0]],
  [[0, 1], [1, 1], [2, 1]],
  [[0, 2], [1, 2], [2, 2]],
  [[0, 0], [1, 1], [2, 2]],
  [[0, 2], [1, 1], [2, 0]],
];

export class Game {
  private readonly reels: Reel[] = [];
  private readonly reelsContainer = new Container();
  private state: GameState = "IDLE";

  private readonly winMessage: Text;
  private readonly balanceText: Text;
  private readonly autoSpinText: Text;
  private readonly betText: Text;

  private autoSpin = false;

  private balance = 10000;
  private readonly betValues = [1, 5, 10, 50, 100, 500, 1000];
  private betIndex = 0;
  private betPayout = 0;

  private readonly app: Application;

  constructor(app: Application) {
    this.app = app;

    this.createReels();
    this.app.stage.addChild(this.reelsContainer);

    this.balanceText = this.createLabel(24);
    this.autoSpinText = this.createLabel(24);
    this.betText = this.createLabel(24);

    this.winMessage = new Text({
      anchor: { x: 0.5, y: 0.5 },
      style: {
        fill: "#ffff00",
        fontSize: 48,
        fontWeight: "bold",
        stroke: { color: "#000000", width: 2 },
        dropShadow: { color: "#000000", blur: 4, distance: 6 },
      },
      alpha: 0,
      position: { x: this.app.screen.width / 2, y: this.app.screen.height / 2 },
    });
    this.app.stage.addChild(this.winMessage);

    this.layout();
    window.addEventListener("resize", () => this.layout());

    this.createControls();
    this.updateHud();

    this.app.ticker.add((t) => this.update(t.deltaTime));
  }

  private createControls(): void {
    const spinButtonLabel = this.createLabel(24, "SPIN");
    this.createButton(spinButtonLabel, 0, 100, () => {
      if (this.canSpin()) {
        this.startSpin();
      }
    });

    this.createButton(this.autoSpinText, 180, 100, () => {
      this.autoSpin = !this.autoSpin;
      this.updateHud();

      if (this.canSpin() && this.autoSpin) {
        this.startSpin();
      }
    });

    this.createButton(this.betText, -180, 100, () => {
      if (this.state === "IDLE") {
        this.betIndex = (this.betIndex + 1) % this.betValues.length;
        this.updateHud();
      }
    });
  }

  private createButton(text: Text, offsetX: number, offsetY: number, onClick: () => void): void {
    const button = new Container() as Container & {
      interactive: boolean;
      buttonMode: boolean;
    };
    button.interactive = true;
    button.buttonMode = true;

    const buttonWidth = 150;
    const buttonHeight = 50;
    const bg = new Graphics()
      .roundRect(0, 0, buttonWidth, buttonHeight, 10)
      .fill("#0077ff");

    text.position.set(buttonWidth / 2, buttonHeight / 2);

    button.addChild(bg, text);
    button.position.set(
      (this.app.screen.width - buttonWidth) / 2 + offsetX,
      this.app.screen.height - offsetY,
    );

    button.on("pointerdown", onClick);
    this.app.stage.addChild(button);
  }

  private createLabel(size: number, text = ""): Text {
    const label = new Text({
      text,
      style: { fill: "#ffffff", fontSize: size, fontWeight: "bold" },
    });
    label.anchor.set(0.5);
    this.app.stage.addChild(label);
    return label;
  }

  private currentBet(): number {
    return this.betValues[this.betIndex];
  }

  private canSpin(): boolean {
    return this.state === "IDLE" && this.balance >= this.currentBet();
  }

  private updateHud(): void {
    this.balanceText.text = `Balance: $${this.balance}`;
    this.balanceText.position.set(this.app.screen.width / 2, 50);

    this.autoSpinText.text = `AUTO ${this.autoSpin ? "ON" : "OFF"}`;
    this.betText.text = `BET $${this.currentBet()}`;
    this.winMessage.text = `You Win $${this.betPayout}!`;
  }

  private createReels(): void {
    for (let i = 0; i < 3; i++) {
      const reel = new Reel();
      reel.x = i * 160;
      this.reels.push(reel);
      this.reelsContainer.addChild(reel);
    }
  }

  private startSpin(): void {
    this.state = "SPINNING";
    this.balance -= this.currentBet();
    this.betPayout = 0;
    this.updateHud();

    this.reels.forEach((r) => {
      r.getAllVisibleSymbolViews().forEach((s) => s.setHighlight(false));
      r.startSpin();
    });

    this.reels.forEach((reel, i) => {
      setTimeout(
        () => {
          reel.stopSpin(
            Array.from({ length: 3 }, () => Math.floor(Math.random() * 5)),
          );
        },
        1000 + i * 400,
      );
    });
  }

  private evaluateWin(): void {
    const grid = this.reels.map((r) => r.getAllVisibleSymbols());

    const winningLines = WIN_LINES.filter((line) => {
      const v = grid[line[0][0]][line[0][1]];
      return line.every(([c, r]) => grid[c][r] === v);
    });

    this.betPayout = 0;

    for (const line of winningLines) {
      const [c, r] = line[0];
      const value = this.reels[c].getAllVisibleSymbolViews()[r].getValue();
      this.betPayout += value * this.currentBet();
    }

    if (this.betPayout > 0) {
      this.balance += this.betPayout;
      this.winMessage.alpha = 1;

      setTimeout(() => {
        const fade = (t: Ticker) => {
          this.winMessage.alpha -= 0.05 * t.deltaTime;
          if (this.winMessage.alpha <= 0) {
            this.winMessage.alpha = 0;
            this.app.ticker.remove(fade);
          }
        };
        this.app.ticker.add(fade);
      }, 1500);
    }

    this.reels.forEach((reel, c) =>
      reel
        .getAllVisibleSymbolViews()
        .forEach((s, r) =>
          s.setHighlight(
            winningLines.some((l) =>
              l.some(([lc, lr]) => lc === c && lr === r),
            ),
          ),
        ),
    );

    this.state = "IDLE";
    this.updateHud();

    if (this.autoSpin && this.betPayout === 0 && this.canSpin()) {
      this.startSpin();
    }
  }

  private update(delta: number): void {
    this.reels.forEach((r) => r.update(delta));

    if (this.state === "SPINNING" && this.reels.every((r) => r.isStopped())) {
      this.state = "RESULT";
      this.evaluateWin();
    }
  }

  private layout(): void {
    const bounds = this.reelsContainer.getLocalBounds();
    this.reelsContainer.position.set(
      (this.app.screen.width - bounds.width) / 2,
      (this.app.screen.height - bounds.height) / 2,
    );
  }
}
