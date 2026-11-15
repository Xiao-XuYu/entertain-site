import asyncio, json, sys
from playwright.async_api import async_playwright

URL = "http://127.0.0.1:8077/index.html"

async def main():
    errors = []
    async with async_playwright() as p:
        browser = await p.chromium.connect_over_cdp("http://localhost:8222")
        ctx = browser.contexts[0]
        page = await ctx.new_page()
        await page.goto(URL, wait_until="networkidle")
        await page.wait_for_timeout(600)
        page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
        page.on("pageerror", lambda e: errors.append(str(e)))

        # State assertions (prefer evaluate over screenshot)
        info = await page.evaluate("""() => {
          const g = window.G || {};
          const canvas = document.getElementById('game');
          return {
            hasG: !!g,
            hasItemTypes: !!(g.ITEM_TYPES && g.ITEM_TYPES.length),
            itemsCount: (g.items||[]).length,
            state: g.state,
            scoreTxt: (document.getElementById('score')||{}).textContent,
            timeTxt: (document.getElementById('time')||{}).textContent,
            canvasW: canvas && canvas.width,
            canvasH: canvas && canvas.height,
            audioCtxState: g.audio && g.audio.unlock() && g.audio._ctx
                ? g.audio._ctx.state : 'n/a'
          };
        }""")

        # Trigger a tap to unlock audio + launch sound, then wait a bit
        await page.mouse.click(10, 10)
        await page.wait_for_timeout(300)

        # After a tap, state should move OUT (shot), unless tapping on first frame changed it
        after = await page.evaluate("""() => ({
          state: window.G.state,
          hookLen: (window.G.hookLen||0).toFixed(1),
          audioCtxState: window.G.audio._ctx ? window.G.audio._ctx.state : 'no-ctx'
        })""")

        # Interaction sound: count oscillators created? just record ctx state
        await page.screenshot(path=".playwright-mcp/gold_split_smoke.png", clip={"x":0,"y":0,"width":360,"height":640})
        print(json.dumps({"info": info, "after": after, "consoleErrors": errors[:10]}, ensure_ascii=False))
        await page.close()

asyncio.run(main())