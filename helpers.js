const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");

const ROOT = path.resolve(__dirname, "..");
const TYPES = {
  ".js": "text/javascript",
  ".html": "text/html",
  ".png": "image/png",
  ".webmanifest": "application/manifest+json",
};

// Prosty serwer statyczny; opcja delay opóźnia odpowiedź dla index.html (symulacja wolnej sieci).
function serve(root = ROOT, port = 0) {
  const state = { delay: 0, fail: 0, root };
  const server = http.createServer((q, r) => {
    const u = q.url.split("?")[0];
    const f = path.join(state.root, u === "/" ? "index.html" : u);
    const wait = u === "/" || u === "/index.html" ? state.delay : 0;
    setTimeout(
      () =>
        fs.readFile(f, (e, d) => {
          // state.fail: kod HTTP zwracany zamiast strony głównej (symulacja awarii serwera).
          if (state.fail && (u === "/" || u === "/index.html")) return ((r.statusCode = state.fail), r.end("awaria"));
          if (e) return ((r.statusCode = 404), r.end());
          r.setHeader("content-type", TYPES[path.extname(f)] || "application/octet-stream");
          r.setHeader("content-length", d.length);
          r.setHeader("cache-control", "no-store");
          r.end(d);
        }),
      wait,
    );
  });
  return new Promise((res) =>
    server.listen(port, () => res({ server, state, url: `http://localhost:${server.address().port}/` })),
  );
}

function reporter() {
  let pass = 0,
    fail = 0;
  const t = {
    ok(name, cond, extra = "") {
      cond ? pass++ : fail++;
      console.log(`${cond ? "  ok  " : " FAIL "} ${name}${!cond && extra ? "  -> " + extra : ""}`);
    },
    section: (n) => console.log(`\n# ${n}`),
    summary() {
      console.log(`\n${pass} ok, ${fail} nie przeszło`);
      return fail === 0;
    },
  };
  return t;
}

async function newPage(browser, { width = 390, height = 800, locale = "pl-PL", ...rest } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height }, locale, ...rest });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  return { ctx, page, errors };
}

// Tworzy grę z podanych obrazów (przez "Obrazy lub ZIP z obrazami").
async function createGameWithImages(page, name, files) {
  await page.click(".game.new");
  await page.fill("dialog input", name);
  await page.click('dialog button:has-text("Utwórz")');
  await page.waitForSelector("text=/Dodaj karty/", { timeout: 10000 });
  await page.click("text=/Dodaj karty/");
  const [fc] = await Promise.all([page.waitForEvent("filechooser"), page.click("text=Obrazy lub ZIP z obrazami")]);
  await fc.setFiles(files);
  await page.waitForSelector(".tile", { timeout: 30000 });
}

module.exports = { ROOT, serve, reporter, newPage, createGameWithImages, chromium };
