import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("C:/Users/Ajibola Adedeji/AppData/Roaming/npm/node_modules/playwright");
const b = await chromium.launch();

// 1. Header hysteresis: brandlayer hidden at 90px, still visible at 10px,
//    and stable (no oscillation) when parked at 70px.
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
const state = () =>
  p.evaluate(() => {
    const bl = document.querySelector(".brandlayer");
    return {
      scrolled: document.querySelector(".masthead")?.dataset.scrolled,
      display: getComputedStyle(bl).display,
      maxH: getComputedStyle(bl).maxHeight,
    };
  });
await p.goto("http://localhost:3000/", { waitUntil: "networkidle" });
await p.evaluate(() => window.scrollTo(0, 0));
await p.waitForTimeout(400);
console.log("at 0px:", JSON.stringify(await state()));
await p.evaluate(() => window.scrollTo(0, 90));
await p.waitForTimeout(500);
console.log("at 90px:", JSON.stringify(await state()));
// Park just past the old threshold and nudge - the state must not flip.
const states = new Set();
for (let i = 0; i < 8; i++) {
  await p.evaluate((y) => window.scrollTo(0, y), 70 + i);
  await p.waitForTimeout(120);
  const s = await state();
  states.add(s.scrolled);
}
console.log("parked 70-77px states:", JSON.stringify([...states]));
await p.evaluate(() => window.scrollTo(0, 10));
await p.waitForTimeout(500);
console.log("back at 10px:", JSON.stringify(await state()));

// 2. Detail page: no tiles painted before cascade starts blank; thumb click
//    still replays the cascade.
const d = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await d.goto("http://localhost:3000/vehicles/prado", { waitUntil: "commit" });
const early = await d.evaluate(() => document.querySelectorAll(".hero__tile img").length).catch(() => "n/a");
await d.waitForTimeout(400);
const afterLoad = await d.evaluate(() => ({
  tiles: document.querySelectorAll(".hero__tile").length,
  settled: document.querySelectorAll(".hero__settled").length,
}));
console.log("detail early imgs:", early);
await d.waitForTimeout(1300);
await d.evaluate(() => { document.querySelectorAll("button.vhero__thumb")[2].click(); });
await d.waitForTimeout(250);
const replay = await d.evaluate(() => ({
  tiles: document.querySelectorAll(".hero__tile").length,
  src: document.querySelector(".hero__tile img")?.getAttribute("src")?.slice(0, 60),
}));
console.log("replay after thumb click:", JSON.stringify(replay));
await d.waitForTimeout(1200);
console.log("replay settled:", JSON.stringify(await d.evaluate(() => ({
  tiles: document.querySelectorAll(".hero__tile").length,
  settled: document.querySelectorAll(".hero__settled").length,
}))));
await b.close();
