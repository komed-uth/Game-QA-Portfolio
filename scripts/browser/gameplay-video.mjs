import assert from 'node:assert/strict';
import { installPausedClock, waitForPhoto } from './gameplay-slideshow.mjs';
import { installVideoFixture, playerIndex } from './fixtures/youtube-provider.mjs';
import checkTransitions from './gameplay-video-transitions.mjs';

// Substitute only the provider boundary; selection, inspection, fades and dwell
// run through the production portfolio. This does not certify actual YouTube.
export default async function checkVideo(page) {
  await checkTransitions(page);
  await installVideoFixture(page);
  await page.setViewportSize({width:1366,height:6000});
  await installPausedClock(page);
  await page.reload();
  const galleries = page.locator('.regulus-showcase .game-gallery, .video-project .game-gallery');
  async function settle() { await page.clock.runFor(32); await page.waitForTimeout(80); }
  async function release() {
    await page.mouse.move(0,0);
    await page.evaluate(() => document.activeElement?.blur());
    await settle();
  }
  async function selected(gallery, index, message) {
    assert.equal(await gallery.locator('.gallery-thumbnail').nth(index).getAttribute('aria-pressed'), 'true', message);
  }
  async function emit(player, state) { await page.evaluate(([i,s]) => window.videoPlayers[i].emit(s), [player,state]); await settle(); }
  for (let index=0; index<2; index++) {
    await page.reload(); await release();
    const gallery = galleries.nth(index);
    let player = await playerIndex(gallery);
    const src = new URL(await gallery.locator('iframe').getAttribute('src'));
    assert.equal(src.hostname, 'www.youtube-nocookie.com');
    assert.equal(src.searchParams.get('enablejsapi'), '1');
    assert.equal(src.searchParams.get('origin'), new URL(page.url()).origin);
    assert(await gallery.locator('iframe').getAttribute('allowfullscreen') !== null);
    assert.deepEqual(await page.evaluate(i => [window.videoPlayers[i].mutes,window.videoPlayers[i].plays],player),[1,1]);
    for (const state of [-1,1,2,3,5]) {
      await emit(player,state); await page.clock.fastForward(20000);
      await selected(gallery,0,'Incomplete video is never skipped by time');
    }
    const identity = await gallery.locator('iframe').elementHandle();
    await gallery.locator('.gallery-thumbnail').first().evaluate(e => e.click());
    await gallery.locator('.gallery-thumbnails').evaluate(e => e.scrollLeft=60);
    assert(await identity.evaluate(e=>e.isConnected),'Active reselection/browsing preserves player');
    await gallery.locator('.gallery-thumbnail').first().hover();
    await emit(player,0); await emit(player,0);
    await selected(gallery,0,'Completion waits during hover');
    await emit(player,1); await release();
    await selected(gallery,0,'Replay cancels deferred completion');
    assert.equal(await page.evaluate(i=>window.videoPlayers[i].plays,player),1,'Eligibility does not restart playback');
    // State can change before its callback is delivered.
    await gallery.locator('.gallery-thumbnail').first().hover();
    await emit(player,0);
    await page.evaluate(i=>window.videoPlayers[i].state=1,player);
    await release(); await selected(gallery,0,'Resume checks actual player state before replacing a replay');
    await emit(player,0);
    await waitForPhoto(gallery); await selected(gallery,1,'Natural completion advances exactly once');
    await selected(galleries.nth(1-index),0,'Other player stays independent');
    await emit(player,0); await selected(gallery,1,'Destroyed player callbacks cannot advance');
    for (let photo=1;photo<=3;photo++) {
      await waitForPhoto(gallery); await release();
      await page.clock.fastForward(4500); await selected(gallery,photo,'Photo gets full displayed dwell');
      await page.clock.fastForward(700); await selected(gallery,photo===3?0:photo+1,'Sequence wraps through every preview');
    }
    const replacement = await playerIndex(gallery);
    assert.notEqual(replacement,player,'New video visit gets a fresh player');
    assert.deepEqual(await page.evaluate(i => [window.videoPlayers[i].mutes,window.videoPlayers[i].plays],replacement),[1,1]);
    player = replacement;
    // Explicit Pause persists across selection and does not control playback.
    await gallery.getByRole('button',{name:'Pause slideshow',exact:true}).click(); await release();
    await emit(player,0); await page.clock.fastForward(20000);
    await selected(gallery,0,'Explicit Pause defers actual completion');
    await gallery.getByRole('button',{name:'Resume slideshow',exact:true}).click(); await release();
    await waitForPhoto(gallery); await selected(gallery,1,'Explicit Resume consumes completion once');
    await gallery.getByRole('button',{name:'Pause slideshow',exact:true}).click();
    await gallery.locator('.gallery-thumbnail').nth(2).evaluate(e=>e.click());
    await waitForPhoto(gallery); await release(); await page.clock.fastForward(20000);
    await selected(gallery,2,'Explicit Pause persists through manual photo selection');
    await gallery.getByRole('button',{name:'Resume slideshow',exact:true}).click(); await release();
    await page.clock.fastForward(4500); await selected(gallery,2,'Resumed photo gets five full seconds');
    await page.clock.fastForward(700); await waitForPhoto(gallery); await selected(gallery,3,'Resumed photo advances');
    await gallery.locator('.gallery-thumbnail').first().evaluate(e=>e.click()); player=await playerIndex(gallery);
    await gallery.locator('.gallery-thumbnail').first().focus(); await page.keyboard.press('Shift'); await settle();
    await emit(player,0); await page.clock.fastForward(20000); await selected(gallery,0,'Keyboard focus defers completion');
    await release(); await waitForPhoto(gallery); await selected(gallery,1,'Focus release consumes pending completion');
    await gallery.locator('.gallery-thumbnail').first().evaluate(e=>e.click()); player=await playerIndex(gallery);
    await gallery.locator('.gallery-thumbnails').dispatchEvent('pointerdown',{pointerId:42,isPrimary:true,button:0,pointerType:'touch'});
    await release(); await emit(player,0); await selected(gallery,0,'Active drag defers video completion');
    await page.locator('body').dispatchEvent('pointercancel',{pointerId:42,isPrimary:true,button:0,pointerType:'touch'});
    await settle(); await selected(gallery,0,'Native touch cancellation keeps video suspended');
    await page.locator('body').dispatchEvent('touchend',{touches:[]}); await release();
    await waitForPhoto(gallery); await selected(gallery,1,'Actual touch release consumes completion');
    await gallery.locator('.gallery-thumbnail').first().evaluate(e=>e.click()); player=await playerIndex(gallery);
    await page.setViewportSize({width:1366,height:768});
    await gallery.evaluate(element=>{
      const bounds=element.getBoundingClientRect();
      const top=bounds.top+scrollY;
      window.scrollTo(0,top>innerHeight?top-innerHeight-20:bounds.bottom+scrollY+20);
    });
    await settle();
    assert(await gallery.evaluate(e=>{const b=e.getBoundingClientRect();return b.bottom<=0||b.top>=innerHeight;}));
    await emit(player,0); await selected(gallery,0,'Offscreen completion waits');
    await page.setViewportSize({width:1366,height:6000}); await page.evaluate(()=>window.scrollTo(0,0)); await release();
    await waitForPhoto(gallery); await selected(gallery,1,'Returning onscreen consumes deferred completion');
    await gallery.locator('.gallery-thumbnail').first().evaluate(e=>e.click()); player=await playerIndex(gallery);
    await page.evaluate(() => {Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});
    await settle(); await emit(player,0);
    await gallery.locator('.gallery-thumbnail').first().hover();
    await page.evaluate(() => {Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'));});
    await settle(); await selected(gallery,0,'Clearing visibility cannot clear hover');
    await release(); await waitForPhoto(gallery); await selected(gallery,1,'Deferred completion advances after all reasons clear');
    await page.evaluate(() => delete document.hidden);
    await gallery.locator('.gallery-thumbnail').first().evaluate(e=>e.click());
    player=await playerIndex(gallery);
    await gallery.locator('.gallery-thumbnail').first().hover(); await emit(player,0);
    await gallery.locator('.gallery-thumbnail').nth(2).evaluate(e=>e.click());
    await waitForPhoto(gallery); await release();
    await emit(player,0); await selected(gallery,2,'Manual selection cancels deferred/obsolete completion');
    await gallery.locator('.gallery-thumbnail').first().evaluate(e=>e.click());
    player=await playerIndex(gallery);
    await page.emulateMedia({reducedMotion:'reduce'}); await settle();
    await emit(player,0); await page.clock.fastForward(20000);
    await selected(gallery,0,'Reduced motion retains completed video while paused');
    await gallery.getByRole('button',{name:'Resume slideshow',exact:true}).click(); await release();
    await waitForPhoto(gallery); await selected(gallery,1,'Explicit Resume permits reduced-motion completion');
    assert.equal(await gallery.locator('.gallery-photo').evaluate(e=>getComputedStyle(e).animationName),'none');
    await page.clock.fastForward(4500); await selected(gallery,1,'Reduced-motion Resume keeps five-second dwell');
    await page.clock.fastForward(700); await waitForPhoto(gallery); await selected(gallery,2,'Reduced-motion Resume advances without fades');
    await gallery.locator('.gallery-thumbnail').first().evaluate(e=>e.click()); player=await playerIndex(gallery);
    await page.getByRole('link',{name:/^Skills$/}).first().click();
    await emit(player,0);
    await page.goBack(); await selected(gallery,0,'Navigation resets selection and cancels obsolete work');
    await page.emulateMedia({reducedMotion:'no-preference'});
  }
  await page.unroute('https://www.youtube.com/iframe_api');
  await page.route('https://www.youtube.com/iframe_api',route=>route.abort());
  await page.reload(); await release(); await page.clock.fastForward(60000);
  for (const gallery of await galleries.all()) await selected(gallery,0,'Unavailable API never introduces a fallback skip');
  assert(await galleries.first().getByRole('button', { name: 'Retry', exact: true }).isVisible(), 'API failure provides recovery');
  // A downloaded script that never calls readiness must also permit a fresh fetch.
  await page.unroute('https://www.youtube.com/iframe_api');
  await page.route('https://www.youtube.com/iframe_api', route => route.fulfill({ contentType: 'text/javascript', body: '' }));
  await page.reload(); await page.waitForTimeout(150); await page.clock.fastForward(8000); await settle();
  assert(await galleries.first().getByRole('button', { name: 'Retry', exact: true }).isVisible(), 'Hung API has a bounded error');
  await page.unroute('https://www.youtube.com/iframe_api');
  await installVideoFixture(page);
  await galleries.first().getByRole('button', { name: 'Retry', exact: true }).evaluate(e => e.click());
  await playerIndex(galleries.first()); await settle();
  assert.equal(await galleries.first().getByRole('alert').count(), 0, 'Retry refetches a hung API and restores playback');
  assert(await galleries.first().frameLocator('iframe').getByRole('button', { name: 'Play', exact: true }).isVisible());
  console.log('PASS: controlled YouTube boundary, both full cycles, deferred completion/replay, blocked/error states, cleanup, reduced motion, unavailable API and player independence');
}
