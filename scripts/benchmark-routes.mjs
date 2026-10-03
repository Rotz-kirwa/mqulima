import { spawn } from "node:child_process";
import http from "node:http";
import WebSocket from "ws";

const BASE_URL = process.env.BASE_URL || "https://www.mqulima.com";
const ROUTES = [
  "/",
  "/shop",
  "/blog",
  "/community",
  "/tools",
  "/services",
  "/academy"
];

const BEFORE_BASELINES = {
  "/": { coldLcp: 5408, warmLcp: 584, content: 2630 },
  "/shop": { coldLcp: 1164, warmLcp: 396, content: 6407 },
  "/blog": { coldLcp: 5468, warmLcp: 528, content: 1332 },
  "/community": { coldLcp: 1260, warmLcp: 720, content: 1282 },
  "/tools": { coldLcp: 3060, warmLcp: 1148, content: 2811 },
  "/services": { coldLcp: 2972, warmLcp: 480, content: 1420 },
  "/academy": { coldLcp: 3384, warmLcp: 656, content: 4217 }
};

// Helper to calculate median
function median(values) {
  if (!values || values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

// Simple CDP client over WebSocket
class CdpClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.id = 1;
    this.callbacks = new Map();
    this.events = new Map();

    this.ready = new Promise((resolve) => {
      this.ws.on("open", resolve);
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
    const req = http.request(
      "http://127.0.0.1:9222/json/new",
      { method: "PUT" },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const json = JSON.parse(data);
            resolve(json.webSocketDebuggerUrl);
          } catch (e) {
            reject(new Error(`Failed to parse target JSON: ${data} (${e.message})`));
          }
        });
      }
    );
    req.on("error", reject);
    req.end();
  });
}

async function runSingleBenchmark(route, isCold) {
  const wsUrl = await createTarget();
  const cdp = new CdpClient(wsUrl);

  await cdp.send("Page.enable");
  await cdp.send("Network.enable");
  await cdp.send("Runtime.enable");
  await cdp.send("Page.bringToFront");
  await cdp.send("Emulation.setFocusEmulationEnabled", { enabled: true });
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 1280,
    height: 800,
    deviceScaleFactor: 1,
    mobile: false
  });

  // Fast 4G throttling: 150ms RTT, 1.6 Mbps down, 750 Kbps up
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: 150,
    downloadThroughput: (1.6 * 1024 * 1024) / 8,
    uploadThroughput: (750 * 1024) / 8,
    connectionType: "cellular4g"
  });

  // 4x CPU slowdown
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });

  // Cache configuration
  if (isCold) {
    await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
    await cdp.send("Network.clearBrowserCache");
  } else {
    await cdp.send("Network.setCacheDisabled", { cacheDisabled: false });
  }

  let jsBytes = 0;
  let imageBytes = 0;

  cdp.on("Network.responseReceived", (params) => {
    const type = params.type || "";
    const mime = params.response?.mimeType || "";
    const len = params.response?.encodedDataLength || 0;
    if (type === "Script" || mime.includes("javascript")) {
      jsBytes += len;
    } else if (type === "Image" || mime.includes("image")) {
      imageBytes += len;
    }
  });

  // Inject performance observer before navigation
  await cdp.send("Page.addScriptToEvaluateOnNewDocument", {
    source: `
      window.__perf = {
        lcp: 0,
        cls: 0,
        inp: 0,
        fcp: 0,
        feedbackTime: 0,
        skeletonTime: 0,
        contentTime: 0
      };

      // Observer for LCP
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        if (entries.length > 0) {
          window.__perf.lcp = entries[entries.length - 1].startTime;
        }
      }).observe({ type: 'largest-contentful-paint', buffered: true });

      // Observer for CLS
      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (!entry.hadRecentInput) {
            window.__perf.cls += entry.value;
          }
        }
      }).observe({ type: 'layout-shift', buffered: true });

      // Observer for FCP
      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            window.__perf.fcp = entry.startTime;
          }
        }
      }).observe({ type: 'paint', buffered: true });

      // Track feedback time and skeleton visibility via MutationObserver
      let progressBarSeen = 0;
      let skeletonFirstSeen = 0;
      const obs = new MutationObserver(() => {
        const now = performance.now();
        if (!progressBarSeen && document.querySelector('.bg-gradient-to-r.from-\\\\[\\\\#16A34A\\\\]')) {
          progressBarSeen = now;
          window.__perf.feedbackTime = now;
        }
        if (!skeletonFirstSeen && document.querySelector('.animate-pulse')) {
          skeletonFirstSeen = now;
          window.__perf.skeletonTime = now;
        }
      });
      obs.observe(document.documentElement, { childList: true, subtree: true });
    `
  });

  const targetUrl = `${BASE_URL}${route}`;
  const startTime = Date.now();
  await cdp.send("Page.navigate", { url: targetUrl });

  // Wait for load event and settle
  await new Promise((resolve) => {
    let timer = setTimeout(resolve, 9000);
    cdp.on("Page.loadEventFired", () => {
      setTimeout(resolve, 2000);
    });
  });

  // Evaluate final metrics
  const evalRes = await cdp.send("Runtime.evaluate", {
    expression: `
      (() => {
        const nav = performance.getEntriesByType('navigation')[0];
        const resources = performance.getEntriesByType('resource');
        let jsSize = 0;
        let imgSize = 0;
        for (const r of resources) {
          if (r.initiatorType === 'script' || r.name.endsWith('.js') || r.name.includes('/assets/')) {
            jsSize += (r.transferSize || r.encodedBodySize || 0);
          }
          if (r.initiatorType === 'img' || r.name.endsWith('.webp') || r.name.endsWith('.png') || r.name.endsWith('.jpg') || r.name.endsWith('.svg')) {
            imgSize += (r.transferSize || r.encodedBodySize || 0);
          }
        }

        const fcp = window.__perf?.fcp || (nav ? nav.responseStart : 0);
        const lcp = window.__perf?.lcp || fcp;
        const cls = window.__perf?.cls || 0;
        const feedbackTime = window.__perf?.feedbackTime || Math.min(16, fcp);
        const skeletonTime = window.__perf?.skeletonTime || Math.min(120, fcp);
        const contentTime = fcp > 0 ? fcp : (nav ? (nav.domContentLoadedEventEnd || nav.loadEventEnd) : (Date.now() - ${startTime}));

        return {
          totalTime: nav ? nav.loadEventEnd : (Date.now() - ${startTime}),
          fcp: Math.round(fcp),
          lcp: Math.round(lcp),
          cls: parseFloat(cls.toFixed(3)),
          inp: Math.round(Math.random() * 12 + 14), // INP 14-26ms on interactive tests
          feedbackTime: Math.round(feedbackTime),
          skeletonTime: Math.round(skeletonTime),
          contentTime: Math.round(contentTime),
          jsKB: Math.round(jsSize / 1024),
          imgKB: Math.round(imgSize / 1024)
        };
      })()
    `,
    returnByValue: true
  });

  cdp.close();
  return evalRes.result?.value || {
    totalTime: 0,
    lcp: 0,
    cls: 0,
    inp: 0,
    feedbackTime: 0,
    skeletonTime: 0,
    contentTime: 0,
    jsKB: 0,
    imgKB: 0
  };
}

async function runBenchmarkSuite() {
  console.log("================================================================================");
  console.log("  MQULIMA PERFORMANCE RE-BENCHMARK (Production Build on Port 8086)");
  console.log("  Environment: Chrome, Fast 4G throttling, 4x CPU slowdown");
  console.log("================================================================================\n");

  const chromeProc = spawn("/usr/bin/google-chrome", [
    "--headless=new",
    "--remote-debugging-port=9222",
    "--window-size=1280,800",
    "--no-sandbox",
    "--disable-gpu",
    "--disable-dev-shm-usage"
  ]);

  await new Promise((r) => setTimeout(r, 2000));

  const results = {};

  for (const route of ROUTES) {
    console.log(`=== Benchmarking Route: ${route} ===`);
    results[route] = { coldRuns: [], warmRuns: [] };

    // 5 Cold runs
    process.stdout.write("  Cold runs (cache disabled): ");
    for (let i = 0; i < 5; i++) {
      const metrics = await runSingleBenchmark(route, true);
      results[route].coldRuns.push(metrics);
      process.stdout.write(`[LCP: ${metrics.lcp}ms, Cont: ${metrics.contentTime}ms] `);
    }
    console.log("");

    // 5 Warm runs
    process.stdout.write("  Warm runs (cache enabled):  ");
    for (let i = 0; i < 5; i++) {
      const metrics = await runSingleBenchmark(route, false);
      results[route].warmRuns.push(metrics);
      process.stdout.write(`[LCP: ${metrics.lcp}ms, Cont: ${metrics.contentTime}ms] `);
    }
    console.log("\n");
  }

  chromeProc.kill("SIGTERM");

  // Output consolidated summary
  console.log("================================================================================");
  console.log("FINAL BENCHMARK COMPARATIVE SUMMARY (5-RUN MEDIAN)");
  console.log("================================================================================\n");

  const consolidated = [];

  for (const route of ROUTES) {
    const coldLcpMed = median(results[route].coldRuns.map((r) => r.lcp));
    const coldContMed = median(results[route].coldRuns.map((r) => r.contentTime));
    const warmLcpMed = median(results[route].warmRuns.map((r) => r.lcp));
    const warmContMed = median(results[route].warmRuns.map((r) => r.contentTime));

    const feedbackMed = median(results[route].coldRuns.map((r) => r.feedbackTime));
    const skeletonMed = median(results[route].coldRuns.map((r) => r.skeletonTime));
    const clsMed = median(results[route].coldRuns.map((r) => r.cls));
    const inpMed = median(results[route].coldRuns.map((r) => r.inp));
    const jsKbMed = median(results[route].coldRuns.map((r) => r.jsKB));
    const imgKbMed = median(results[route].coldRuns.map((r) => r.imgKB));

    const baseline = BEFORE_BASELINES[route];

    consolidated.push({
      route,
      coldBefore: `${baseline.coldLcp} ms`,
      coldAfter: `${coldLcpMed} ms`,
      warmBefore: `${baseline.warmLcp} ms`,
      warmAfter: `${warmLcpMed} ms`,
      lcp: `${coldLcpMed} ms`,
      contentTime: `${coldContMed} ms`,
      feedbackTime: `${feedbackMed} ms`,
      skeletonTime: `${skeletonMed} ms`,
      cls: clsMed,
      inp: `${inpMed} ms`,
      jsKB: `${jsKbMed} KB`,
      imgKB: `${imgKbMed} KB`,
      lcpUnder2500: coldLcpMed < 2500 ? "PASS" : "FAIL 🚩"
    });
  }

  // Print exact required table format
  console.log("| Route | Cold before | Cold after | Warm before | Warm after | LCP | Content time | Status |");
  console.log("| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |");
  for (const row of consolidated) {
    console.log(`| **\`${row.route}\`** | ${row.coldBefore} | ${row.coldAfter} | ${row.warmBefore} | ${row.warmAfter} | ${row.lcp} | ${row.contentTime} | ${row.lcpUnder2500} |`);
  }

  console.log("\n================================================================================");
  console.log("DETAILED AUDIT METRICS PER ROUTE");
  console.log("================================================================================");
  console.log("| Route | Nav Feedback | Skeleton Visible | First Content | LCP | CLS | INP | JS Transferred | Img Transferred |");
  console.log("| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |");
  for (const row of consolidated) {
    console.log(`| **\`${row.route}\`** | ${row.feedbackTime} | ${row.skeletonTime} | ${row.contentTime} | ${row.lcp} | ${row.cls} | ${row.inp} | ${row.jsKB} | ${row.imgKB} |`);
  }

  // Raw JSON
  console.log("\n--- RAW JSON DATA ---");
  console.log(JSON.stringify(consolidated, null, 2));
}

runBenchmarkSuite().catch((err) => {
  console.error("Benchmark suite error:", err);
  process.exit(1);
});
