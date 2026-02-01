import { Application } from "pixi.js";
import { Game } from "./core/game";

async function bootstrap(): Promise<void> {
  const app = new Application();

  await app.init({
    background: "#1b1b1b",
    antialias: true,
    resizeTo: window,
  });

  document.body.style.margin = "0";
  document.body.appendChild(app.canvas);

  new Game(app);
}

bootstrap();
