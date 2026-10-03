const { spawn } = require("child_process");
const http = require("http");
const fs = require("fs");
const WebSocket = require("/home/user/NYOTA-Clients/mkulima-hub-c7714688/node_modules/ws");

async function main() {
  console.log("Starting CDP test for real-world colored payment options...");
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

  // Inject sample item into cart & reload
  await send("Runtime.evaluate", {
    expression: `(() => {
      const sampleItem = {
        product: {
          id: "p-seed-01",
          name: "Duma 43 Certified Hybrid Maize (2kg)",
          price: 650,
          brand: "Kenya Seed Co",
          image: "/assets/products/p1.webp"
        },
        quantity: 2
      };
      localStorage.setItem("mqulima_cart", JSON.stringify([sampleItem]));
      window.location.reload();
    })()`
  });

  await new Promise((r) => setTimeout(r, 2500));

  // Open cart drawer
  await send("Runtime.evaluate", {
    expression: `(() => {
      const allButtons = Array.from(document.querySelectorAll("button, a"));
      const cartBtn = allButtons.find(b => 
        b.getAttribute("aria-label")?.includes("Cart") || 
        b.getAttribute("title")?.includes("Cart") || 
        b.innerText?.includes("Cart") ||
        b.innerHTML?.includes("ShoppingBag") ||
        b.innerHTML?.includes("lucide-shopping-bag")
      );
      if (cartBtn) cartBtn.click();
    })()`
  });

  await new Promise((r) => setTimeout(r, 1200));

  // Click "Proceed to Checkout"
  await send("Runtime.evaluate", {
    expression: `(() => {
      const proceedBtn = Array.from(document.querySelectorAll("button")).find(b => 
        b.innerText?.includes("Proceed to Checkout")
      );
      if (proceedBtn) proceedBtn.click();
    })()`
  });

  await new Promise((r) => setTimeout(r, 1200));

  // Scroll drawer body to payment section
  await send("Runtime.evaluate", {
    expression: `(() => {
      const scrollContainers = document.querySelectorAll(".overflow-y-auto");
      scrollContainers.forEach(el => { el.scrollTop = el.scrollHeight; });
    })()`
  });
  await new Promise((r) => setTimeout(r, 800));

  const artifactDir = "/home/user/.gemini/antigravity-ide/brain/a3f80d90-fbc4-4de7-95f1-5088cb380d55";

  // 1. Capture M-Pesa selected state
  const snapMpesa = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(
    `${artifactDir}/payment_options_mpesa_colored.png`,
    Buffer.from(snapMpesa.result.data, "base64")
  );
  console.log("Saved payment_options_mpesa_colored.png");

  // 2. Click Mastercard / Visa Card
  await send("Runtime.evaluate", {
    expression: `(() => {
      const cardOptions = Array.from(document.querySelectorAll("div")).filter(d => 
        d.innerText && d.innerText.includes("Mastercard / Visa Card")
      );
      if (cardOptions.length > 0) {
        cardOptions[0].click();
      }
    })()`
  });
  await new Promise((r) => setTimeout(r, 800));

  const snapCard = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(
    `${artifactDir}/payment_options_card_colored.png`,
    Buffer.from(snapCard.result.data, "base64")
  );
  console.log("Saved payment_options_card_colored.png");

  // 3. Click Bank Transfer / STK
  await send("Runtime.evaluate", {
    expression: `(() => {
      const bankOptions = Array.from(document.querySelectorAll("div")).filter(d => 
        d.innerText && d.innerText.includes("Bank Transfer / STK")
      );
      if (bankOptions.length > 0) {
        bankOptions[0].click();
      }
    })()`
  });
  await new Promise((r) => setTimeout(r, 800));

  const snapBank = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(
    `${artifactDir}/payment_options_bank_colored.png`,
    Buffer.from(snapBank.result.data, "base64")
  );
  console.log("Saved payment_options_bank_colored.png");

  ws.close();
  chrome.kill();
  console.log("All payment options tested successfully!");
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
