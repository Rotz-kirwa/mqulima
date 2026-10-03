const { spawn } = require("child_process");
const http = require("http");
const fs = require("fs");
const WebSocket = require("/home/user/NYOTA-Clients/mkulima-hub-c7714688/node_modules/ws");

async function main() {
  console.log("Testing standalone payment tiles in Chrome...");
  const chrome = spawn("google-chrome", [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    "--remote-debugging-port=9222",
    "--window-size=1280,950",
    "http://localhost:8080/shop"
  ]);

  await new Promise((r) => setTimeout(r, 2000));

  const pageTarget = await new Promise((resolve, reject) => {
    http.get("http://localhost:9222/json", (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        const targets = JSON.parse(data);
        const page = targets.find((t) => t.type === "page");
        if (page) resolve(page);
        else reject(new Error("No page found"));
      });
    }).on("error", reject);
  });

  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  let idCounter = 1;
  const pending = new Map();

  ws.on("message", (msg) => {
    const res = JSON.parse(msg.toString());
    if (res.id && pending.has(res.id)) {
      const cb = pending.get(res.id);
      pending.delete(res.id);
      cb(res);
    }
  });

  await new Promise((r) => ws.on("open", r));

  function send(method, params = {}) {
    return new Promise((resolve) => {
      const id = idCounter++;
      pending.set(id, resolve);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await send("Page.enable");
  await send("Runtime.enable");

  // Wait for initial page hydration
  await new Promise((r) => setTimeout(r, 2500));

  // Seed localStorage and reload
  await send("Runtime.evaluate", {
    expression: `(() => {
      localStorage.setItem("mqulima_cart", JSON.stringify([{
        product: {
          id: "p-seed-duma43",
          name: "Duma 43 Certified Hybrid Maize (2kg)",
          price: 650,
          brand: "Kenya Seed Co",
          image: "/assets/products/p1.webp"
        },
        quantity: 2
      }]));
      location.reload();
    })()`
  });

  // Wait for reload
  await new Promise((r) => setTimeout(r, 3000));

  // Click cart button
  await send("Runtime.evaluate", {
    expression: `document.querySelector('button[aria-label="Cart"]')?.click()`
  });
  await new Promise((r) => setTimeout(r, 1200));

  // Click Proceed to Checkout
  await send("Runtime.evaluate", {
    expression: `document.getElementById("proceed-to-checkout-btn")?.click()`
  });
  await new Promise((r) => setTimeout(r, 1200));

  // Scroll down drawer
  await send("Runtime.evaluate", {
    expression: `(() => {
      const scrollContainers = document.querySelectorAll(".overflow-y-auto");
      scrollContainers.forEach(el => { el.scrollTop = el.scrollHeight; });
    })()`
  });
  await new Promise((r) => setTimeout(r, 800));

  const artifactDir = "/home/user/.gemini/antigravity-ide/brain/a3f80d90-fbc4-4de7-95f1-5088cb380d55";

  // 1. Capture M-Pesa state
  const snapMpesa = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(
    `${artifactDir}/standalone_tiles_mpesa.png`,
    Buffer.from(snapMpesa.result.data, "base64")
  );
  console.log("Saved standalone_tiles_mpesa.png");

  // 2. Click Airtel Money
  await send("Runtime.evaluate", {
    expression: `document.getElementById("payment-method-airtel")?.click()`
  });
  await new Promise((r) => setTimeout(r, 500));
  const snapAirtel = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(
    `${artifactDir}/standalone_tiles_airtel.png`,
    Buffer.from(snapAirtel.result.data, "base64")
  );
  console.log("Saved standalone_tiles_airtel.png");

  // 3. Click Visa
  await send("Runtime.evaluate", {
    expression: `document.getElementById("payment-method-visa")?.click()`
  });
  await new Promise((r) => setTimeout(r, 500));
  const snapVisa = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(
    `${artifactDir}/standalone_tiles_visa.png`,
    Buffer.from(snapVisa.result.data, "base64")
  );
  console.log("Saved standalone_tiles_visa.png");

  // 4. Click Mastercard
  await send("Runtime.evaluate", {
    expression: `document.getElementById("payment-method-mastercard")?.click()`
  });
  await new Promise((r) => setTimeout(r, 500));
  const snapMastercard = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(
    `${artifactDir}/standalone_tiles_mastercard.png`,
    Buffer.from(snapMastercard.result.data, "base64")
  );
  console.log("Saved standalone_tiles_mastercard.png");

  // 5. Click NCBA Bank
  await send("Runtime.evaluate", {
    expression: `document.getElementById("payment-method-ncba")?.click()`
  });
  await new Promise((r) => setTimeout(r, 500));
  const snapNCBA = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(
    `${artifactDir}/standalone_tiles_ncba.png`,
    Buffer.from(snapNCBA.result.data, "base64")
  );
  console.log("Saved standalone_tiles_ncba.png");

  // 6. Click PesaLink
  await send("Runtime.evaluate", {
    expression: `document.getElementById("payment-method-pesalink")?.click()`
  });
  await new Promise((r) => setTimeout(r, 500));
  const snapPesaLink = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(
    `${artifactDir}/standalone_tiles_pesalink.png`,
    Buffer.from(snapPesaLink.result.data, "base64")
  );
  console.log("Saved standalone_tiles_pesalink.png");

  ws.close();
  chrome.kill();
  console.log("Captured all 6 standalone tiles successfully!");
}

main().catch((err) => {
  console.error("Error in test script:", err);
  process.exit(1);
});
