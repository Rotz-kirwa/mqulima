import { spawn } from "node:child_process";
import http from "node:http";
import fs from "node:fs";
import WebSocket from "ws";

const PORT = process.env.PORT || 8080;
const BASE_URL = `http://localhost:${PORT}`;

const TARGET_PAGES = [
  { name: "Home", path: "/" },
  { name: "AgroShop List", path: "/shop" },
  { name: "AgroShop Product", path: "/shop/product/102470-9586" },
  { name: "News", path: "/blog" },
  { name: "Forum", path: "/community" },
  { name: "Academy", path: "/academy" },
  { name: "Tools", path: "/tools" },
  { name: "Services", path: "/services" },
];

class CdpClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.id = 1;
    this.callbacks = new Map();
    this.events = new Map();

    this.ready = new Promise((resolve, reject) => {
      this.ws.on("open", resolve);
      this.ws.on("error", reject);
    });

    this.ws.on("message", (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.id && this.callbacks.has(msg.id)) {
        const { resolve, reject } = this.callbacks.get(msg.id);
        this.callbacks.delete(msg.id);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
      } else if (msg.method) {
        const handler = this.events.get(msg.method);
        if (handler) handler(msg.params);
      }
    });
  }

  async send(method, params = {}) {
    await this.ready;
    const id = this.id++;
    return new Promise((resolve, reject) => {
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  on(event, handler) {
    this.events.set(event, handler);
  }

  close() {
    this.ws.close();
  }
}

async function createTarget() {
  return new Promise((resolve, reject) => {
    const req = http.request("http://127.0.0.1:9222/json/new", { method: "PUT" }, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          resolve(json.webSocketDebuggerUrl);
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on("error", reject);
    req.end();
  });
}

async function measurePage(path, isCold = true) {
  const wsUrl = await createTarget();
  const cdp = new CdpClient(wsUrl);

  await cdp.send("Page.enable");
  await cdp.send("Network.enable");
  await cdp.send("Runtime.enable");

  // Mobile viewport: 390x844 (iPhone 12 / Android standard)
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true,
  });

  // Fast 4G network throttling: 150ms RTT, 1.6 Mbps down, 750 Kbps up
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: 150,
    downloadThroughput: (1.6 * 1024 * 1024) / 8,
    uploadThroughput: (750 * 1024) / 8,
    connectionType: "cellular4g",
  });

  // 4x CPU slowdown (emulating mid-tier mobile hardware)
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });

  if (isCold) {
    await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
    await cdp.send("Network.clearBrowserCache");
  } else {
    await cdp.send("Network.setCacheDisabled", { cacheDisabled: false });
  }

  // Track network requests and transfer sizes
  let totalRequests = 0;
  let totalBytes = 0;
  let jsBytes = 0;
  let cssBytes = 0;
  let imgBytes = 0;
  let fontBytes = 0;

  let thirdPartyRequests = 0;
  const typeById = new Map();

  cdp.on("Network.responseReceived", (params) => {
    const mime = params.response.mimeType || "";
    const url = params.response.url || "";
    if (!url.startsWith(BASE_URL) && !url.startsWith("data:")) thirdPartyRequests++;
    let t = "other";
    if (mime.includes("javascript")) t = "js";
    else if (mime.includes("css")) t = "css";
    else if (mime.includes("image")) t = "img";
    else if (mime.includes("font") || /\.woff2?($|\?)/.test(url)) t = "font";
    typeById.set(params.requestId, t);
  });

  // Body bytes are only known at loadingFinished (responseReceived only has header bytes).
  cdp.on("Network.loadingFinished", (params) => {
    totalRequests++;
    const size = params.encodedDataLength || 0;
    totalBytes += size;
    const t = typeById.get(params.requestId);
    if (t === "js") jsBytes += size;
    else if (t === "css") cssBytes += size;
    else if (t === "img") imgBytes += size;
    else if (t === "font") fontBytes += size;
  });

  // Inject Web Vitals observers (LCP and CLS)
  await cdp.send("Page.addScriptToEvaluateOnNewDocument", {
    source: `
      window.__metrics = { lcp: 0, lcpElement: '', cls: 0 };
      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          window.__metrics.lcp = Math.round(entry.startTime);
          window.__metrics.lcpElement = entry.element ? (entry.element.tagName + (entry.element.id ? '#' + entry.element.id : '') + (entry.element.className ? '.' + entry.element.className.slice(0, 30) : '')) : '';
        }
      }).observe({ type: 'largest-contentful-paint', buffered: true });

      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (!entry.hadRecentInput) {
            window.__metrics.cls += entry.value;
          }
        }
      }).observe({ type: 'layout-shift', buffered: true });
    `,
  });

  const fullUrl = `${BASE_URL}${path}`;
  await cdp.send("Page.navigate", { url: fullUrl });

  // Wait for page load event plus 3.5 seconds settle time for hydration and layout
  await new Promise((resolve) => {
    let timer = setTimeout(resolve, 10000);
    cdp.on("Page.loadEventFired", () => {
      setTimeout(resolve, 3500);
    });
  });

  const result = await cdp.send("Runtime.evaluate", {
    expression: `
      (() => {
        const nav = performance.getEntriesByType('navigation')[0];
        const fcp = performance.getEntriesByName('first-contentful-paint')[0];
        return {
          ttfb: nav ? Math.round(nav.responseStart - nav.requestStart) : 0,
          fcp: fcp ? Math.round(fcp.startTime) : 0,
          domContentLoaded: nav ? Math.round(nav.domContentLoadedEventEnd) : 0,
          loadTime: nav ? Math.round(nav.loadEventEnd) : 0,
          lcp: window.__metrics ? window.__metrics.lcp : 0,
          lcpElement: window.__metrics ? window.__metrics.lcpElement : '',
          cls: window.__metrics ? parseFloat(window.__metrics.cls.toFixed(4)) : 0
        };
      })()
    `,
    returnByValue: true,
  });

  cdp.close();

  const metrics = result.result?.value || {};
  return {
    ...metrics,
    totalRequests,
    totalBytesKB: Math.round(totalBytes / 1024),
    jsBytesKB: Math.round(jsBytes / 1024),
    cssBytesKB: Math.round(cssBytes / 1024),
    imgBytesKB: Math.round(imgBytes / 1024),
    fontBytesKB: Math.round(fontBytes / 1024),
    thirdPartyRequests,
  };
}

async function run() {
  console.log("=== STARTING FULL SITE BASELINE AUDIT (Chrome 4G + 4x CPU Throttling) ===");
  console.log(`Target: ${BASE_URL}\n`);

  let chromeProc;
  try {
    chromeProc = spawn("/usr/bin/google-chrome", [
      "--headless=new",
      "--remote-debugging-port=9222",
      "--no-sandbox",
      "--disable-gpu",
      "--disable-dev-shm-usage",
    ]);
  } catch (err) {
    console.error("Failed to spawn Chrome:", err);
    process.exit(1);
  }

  await new Promise((r) => setTimeout(r, 2000));

  const results = [];

  const filter = process.env.PAGES ? process.env.PAGES.split(",").map((s) => s.trim()) : null;
  const pages = filter ? TARGET_PAGES.filter((p) => filter.includes(p.name)) : TARGET_PAGES;
  for (const page of pages) {
    process.stdout.write(`Benchmarking ${page.name.padEnd(20)} (${page.path})... `);
    try {
      const cold = await measurePage(page.path, true);
      const warm = await measurePage(page.path, false);
      results.push({ page: page.name, path: page.path, cold, warm });
      console.log(`DONE. Cold LCP: ${cold.lcp}ms | Warm LCP: ${warm.lcp}ms | TTFB: ${cold.ttfb}ms | CLS: ${cold.cls}`);
    } catch (err) {
      console.log(`ERROR: ${err.message}`);
      results.push({ page: page.name, path: page.path, error: err.message });
    }
  }

  if (chromeProc) chromeProc.kill("SIGTERM");

  const out = process.env.OUT || "scripts/baseline-report.json";
  fs.writeFileSync(out, JSON.stringify(results, null, 2));
  console.log(`\nSaved detailed report to ${out}`);
}

run().catch(console.error);
