import { spawn } from "node:child_process";
import http from "node:http";
import WebSocket from "ws";

const BASE_URL = "http://localhost:8086";
const ROUTES = ["/", "/shop", "/blog", "/community", "/tools", "/services", "/academy"];

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

async function diagnoseRoute(route) {
  const wsUrl = await createTarget();
  const cdp = new CdpClient(wsUrl);

  await cdp.send("Page.enable");
  await cdp.send("Network.enable");
  await cdp.send("Runtime.enable");

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

  // Cold cache
  await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
  await cdp.send("Network.clearBrowserCache");

  // Inject performance observer before navigation
  await cdp.send("Page.addScriptToEvaluateOnNewDocument", {
    source: `
      window.__lcpEntries = [];
      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          window.__lcpEntries.push({
            startTime: entry.startTime,
            size: entry.size,
            tagName: entry.element ? entry.element.tagName : '',
            id: entry.id || (entry.element ? entry.element.id : ''),
            className: entry.element ? (entry.element.className || '') : '',
            url: entry.url || '',
            loadTime: entry.loadTime,
            renderTime: entry.renderTime
          });
        }
      }).observe({ type: 'largest-contentful-paint', buffered: true });
    `
  });

  await cdp.send("Page.navigate", { url: `${BASE_URL}${route}` });

  await new Promise((resolve) => {
    let timer = setTimeout(resolve, 8000);
    cdp.on("Page.loadEventFired", () => {
      setTimeout(resolve, 2000);
    });
  });

  const evalRes = await cdp.send("Runtime.evaluate", {
    expression: `
      (() => {
        const nav = performance.getEntriesByType('navigation')[0];
        const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0];
        const heavyResources = performance.getEntriesByType('resource')
          .filter(r => (r.responseEnd - r.startTime) > 500 || (r.transferSize || 0) > 30000)
          .map(r => ({
            name: r.name.split('/').pop().slice(0, 40),
            duration: Math.round(r.duration),
            sizeKB: Math.round((r.transferSize || r.encodedBodySize || 0) / 1024)
          }));

        return {
          fcp: fcpEntry ? Math.round(fcpEntry.startTime) : 0,
          domContentLoaded: nav ? Math.round(nav.domContentLoadedEventEnd) : 0,
          lcpEntries: window.__lcpEntries || [],
          heavyResources
        };
      })()
    `,
    returnByValue: true
  });

  cdp.close();
  return evalRes.result?.value;
}

async function main() {
  const chromeProc = spawn("/usr/bin/google-chrome", [
    "--headless=new",
    "--remote-debugging-port=9222",
    "--no-sandbox",
    "--disable-gpu",
    "--disable-dev-shm-usage"
  ]);

  await new Promise((r) => setTimeout(r, 2000));

  for (const route of ROUTES) {
    console.log(`\n=== ROUTE: ${route} ===`);
    const diag = await diagnoseRoute(route);
    console.log(`FCP: ${diag.fcp}ms, DCL: ${diag.domContentLoaded}ms`);
    console.log("LCP Entries:", JSON.stringify(diag.lcpEntries, null, 2));
    console.log("Heavy Resources (>30KB or >500ms):", JSON.stringify(diag.heavyResources, null, 2));
  }

  chromeProc.kill("SIGTERM");
}

main().catch(console.error);
