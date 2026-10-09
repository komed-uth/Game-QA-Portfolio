import assert from "node:assert/strict";
import { build } from "vite";

// Build representative lists in memory and serve only to isolated test contexts.
// The actual portfolio, other showcase, and production media files stay intact.
export default async function checkPreviewFixtures(page) {
  const browser = page.context().browser();
  for (const fixture of ["empty", "single", "long"]) {
    const adjustment = fixture === "empty" ? "media.splice(0);" : fixture === "single" ?
      "media.splice(1);" : "media.push(...Array.from({length:12}, (_,index) => ({...media[1],label:'Fixture photo '+(index+1)})));";
    const result = await build({ logLevel: "silent", plugins: [{ name: "gameplay-list-fixture", enforce: "pre",
      transform(code, id) {
        if (!id.replaceAll('\\', '/').endsWith('/src/Components/RegulusShowcase.tsx')) return;
        return code.replace("export default function RegulusShowcase()", adjustment + "\nexport default function RegulusShowcase()");
      } }], build: { write: false } });
    const output = Array.isArray(result) ? result[0].output : result.output;
    const entry = output.find(file => file.type === "chunk" && file.isEntry);
    assert(entry, "Fixture entry produced");
    const context = await browser.newContext({ viewport: {width:390,height:845}, reducedMotion: "reduce" });
    try {
      await context.route('**/assets/index-*.js', route => route.fulfill({contentType:'text/javascript',body:entry.code}));
      const fixturePage=await context.newPage();
      await fixturePage.goto(page.url());
      await fixturePage.locator('.video-project').waitFor();
      const gallery=fixturePage.getByRole('region',{name:'Regulus the Advent media',exact:true});
      if (fixture === "empty") {
        assert.equal(await gallery.count(),0,'Empty list omits gallery');
      } else if (fixture === "single") {
        assert.equal(await gallery.locator('.gallery-thumbnail').count(),1);
        assert.equal(await gallery.locator('.gallery-controls').count(),0);
        assert.equal(await gallery.locator('iframe').count(),1);
      } else {
        const strip=gallery.locator('.gallery-thumbnails');
        const previews=gallery.locator('.gallery-thumbnail');
        const forward=gallery.getByRole('button',{name:/scroll previews forward/});
        const backward=gallery.getByRole('button',{name:/scroll previews backward/});
        assert.equal(await previews.count(),16);
        await forward.click();
        const scrolled=await strip.evaluate(e=>({left:e.scrollLeft,width:e.clientWidth,preview:e.children[0].getBoundingClientRect().width}));
        assert(scrolled.left > scrolled.width-scrolled.preview-12 && scrolled.left < scrolled.width-scrolled.preview+4,
          'Group browsing retains one preview for context');
        assert.equal(await previews.first().getAttribute('aria-pressed'),'true','Browsing away preserves selected video');
        await previews.first().focus();
        await fixturePage.keyboard.press('End');
        await fixturePage.waitForFunction(() => document.querySelector('[aria-label="Regulus the Advent media scroll previews forward"]').disabled);
        assert(await forward.isDisabled(),'Keyboard focus reaches finite end');
        assert.equal(await previews.first().getAttribute('aria-pressed'),'true');
        await fixturePage.keyboard.press('Enter');
        assert.equal(await previews.last().getAttribute('aria-pressed'),'true');
        await backward.click();
        assert.equal(await previews.last().getAttribute('aria-pressed'),'true','Browse away from selected photo');
        await fixturePage.keyboard.press('Tab');
        await fixturePage.setViewportSize({width:1366,height:768});
        assert.equal(await previews.last().getAttribute('aria-pressed'),'true');
        assert(await fixturePage.evaluate(()=>document.documentElement.scrollWidth <= innerWidth));
      }
      assert.equal(await fixturePage.locator('.video-project .gallery-thumbnail').count(),4,'Other showcase is unchanged');
    } finally { await context.close(); }
  }
  const touchContext=await browser.newContext({viewport:{width:390,height:845},hasTouch:true,isMobile:true,reducedMotion:'reduce'});
  try {
    const touchPage=await touchContext.newPage();await touchPage.goto(page.url());
    const gallery=touchPage.locator('.game-gallery').first();
    const strip=gallery.locator('.gallery-thumbnails');await strip.scrollIntoViewIfNeeded();
    const box=await strip.boundingBox();
    const session=await touchContext.newCDPSession(touchPage);
    async function swipe(x,y,dx,dy) {
      await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
      for(let i=1;i<=8;i++) {
        await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+dx*i/8,y:y+dy*i/8}]});
        await touchPage.waitForTimeout(20);
      }
      await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
      await touchPage.waitForTimeout(200);
    }
    await swipe(box.x+box.width*.8,box.y+20,-box.width*.6,0);
    assert(await strip.evaluate(e=>e.scrollLeft>0),'Native touch browses strip');
    assert.equal(await gallery.locator('.gallery-thumbnail').first().getAttribute('aria-pressed'),'true');
    const before=await touchPage.evaluate(()=>scrollY);
    await swipe(box.x+box.width*.5,box.y+20,0,-90);
    assert(await touchPage.evaluate(()=>scrollY)>before,'Vertical strip touch scrolls page');
    assert.equal(await gallery.locator('iframe').count(),1);
    assert.equal(await touchPage.locator('dialog').count(),0);
    await session.detach();
  } finally {await touchContext.close();}
  console.log('PASS: temporary empty/single/long portfolio lists, group context, hidden selection, resize, native touch strip and vertical page scrolling');
}
