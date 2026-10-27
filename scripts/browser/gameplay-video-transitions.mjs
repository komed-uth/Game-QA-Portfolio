import assert from 'node:assert/strict';
import { installPausedClock, waitForPhoto } from './gameplay-slideshow.mjs';
import { installVideoFixture, playerIndex } from './fixtures/youtube-provider.mjs';
import { captureRegion } from './capture-region.mjs';

export default async function checkTransitions(page) {
  await installVideoFixture(page, { autoplay: false });
  await installPausedClock(page);
  // CSS fades continue in real rendering time while the JS clock is paused.
  // Arm sampling before each trigger so slow protocol calls cannot miss the
  // overlap or observe player cleanup at a different time from its opacity.
  await page.addInitScript(() => {
    window.armMediaOverlap = (gallery, interruptIndex) => {
      window.mediaOverlap?.cleanup();
      if (!gallery) return;
      const controller = new AbortController();
      let scheduled = false;
      let sampling = false;
      let closed = false;
      const state = { gallery, sample: null };
      const observer = new MutationObserver(sample);
      let interruptedElement;
      function task(callback, delay) {
        // Scheduler tasks use native wall time even when Playwright pauses the
        // page's timers. A task-count budget can expire between two paints on
        // a fast host; pace observations and bound their lifetime instead.
        scheduler.postTask(callback, { delay, signal: controller.signal }).catch(error => {
          if (error.name !== 'AbortError') { state.error = error.message; state.cleanup(); }
        });
      }
      function continueSampling() {
        if (closed || scheduled) return;
        scheduled = true;
        task(() => { scheduled = false; sample(true); }, 16);
      }
      function sample(fromNativeTask) {
        if (closed) return;
        if (state.sample) {
          if (!state.sample.interruptionPending) return;
          if (gallery.querySelectorAll('.gallery-thumbnail')[interruptIndex].getAttribute('aria-pressed') !== 'true') {
            continueSampling(); return;
          }
          if (!state.sample.interruptionDispatched) {
            interruptedElement.dispatchEvent(new AnimationEvent('animationend', { animationName: 'gallery-photo-in', bubbles: true }));
            state.sample.interruptionDispatched = true;
            continueSampling(); return;
          }
          // Observe after the dispatched event's React microtasks can commit.
          if (fromNativeTask !== true) return;
          state.sample.interruption = interruptedElement.isConnected && Number(getComputedStyle(interruptedElement).opacity) >= state.sample.opacity;
          state.sample.interruptionPending = false;
          state.cleanup(); return;
        }
        const e = gallery.querySelector('.gallery-photo.fading-in, .gallery-video-current.fading-in');
        if (!e) return;
        // Readiness belongs to the scenario's bounded waits. Start the native
        // observation budget only once a fading layer actually exists.
        if (!sampling) { sampling = true; task(() => state.cleanup(), 2000); }
        const s = getComputedStyle(e), opacity = Number(s.opacity), b = e.previousElementSibling;
        if (opacity > .05 && opacity < .95) {
          state.sample = { opacity, duration: s.animationDuration, easing: s.animationTimingFunction,
            transform: s.transform, backdrop: b && Number(getComputedStyle(b).opacity),
            hidden: b?.getAttribute('aria-hidden'), inert: b?.inert || b?.disabled,
            frame: e.getBoundingClientRect().toJSON(), oldFrame: b?.getBoundingClientRect().toJSON(),
            incoming: e.matches('.gallery-photo') ? '.gallery-photo' : '.gallery-video-current',
            destroyedPlayers: window.videoPlayers.map(player => player.destroyed) };
          if (interruptIndex !== undefined) {
            interruptedElement = e;
            state.sample.interruptionPending = true;
            gallery.querySelectorAll('.gallery-thumbnail')[interruptIndex].click();
            continueSampling();
          } else state.cleanup();
          return;
        }
        // Native tasks keep observing CSS while Playwright pauses JS timers.
        if (opacity < 1) continueSampling();
        else state.cleanup();
      }
      state.cleanup = () => {
        if (closed) return;
        closed = true;
        observer.disconnect();
        controller.abort();
      };
      window.mediaOverlap = state;
      observer.observe(gallery, { subtree: true, childList: true, attributes: true, attributeFilter: ['class', 'aria-pressed'] });
    };
  });

  const galleries = page.locator('.regulus-showcase .game-gallery, .video-project .game-gallery');
  const flush = () => page.waitForTimeout(60);
  async function tick(ms) { await page.clock.runFor(ms); await flush(); }
  async function choose(gallery, index) {
    await gallery.locator('.gallery-thumbnail').nth(index).evaluate(e => {
      window.armMediaOverlap(e.closest('.game-gallery'));
      e.click();
    });
    await flush();
  }
  async function event(player, name, state, interruptIndex) {
    await page.evaluate(([i, name, state, interruptIndex]) => {
      const p = window.videoPlayers[i];
      if (name === 'state' && state === 1) window.armMediaOverlap(p.iframe.closest('.game-gallery'), interruptIndex);
      if (name === 'state') p.emit(state);
      else if (name === 'ready') p.ready();
      else p.events[name]({ target: p });
    }, [player, name, state, interruptIndex]);
    await flush();
  }
  async function selected(gallery, index) { assert.equal(await gallery.locator('.gallery-thumbnail').nth(index).getAttribute('aria-pressed'), 'true'); }
  async function videoReady(gallery) {
    for (let i = 0; i < 60; i++) {
      if (await gallery.locator('.gallery-video-current.ready').count()) return;
      await tick(16);
    }
    throw new Error('Selected video did not finish its visible presentation');
  }
  async function overlap(gallery, incoming, player, motion) {
    if (motion === 'reduce') {
      assert.equal(await gallery.locator('.gallery-photo-backdrop').count(), 0);
      assert.equal(await gallery.locator(incoming).evaluate(e => getComputedStyle(e).animationName), 'none');
      return;
    }
    let sample;
    for (let i = 0; i < 30; i++) {
      sample = await gallery.evaluate(e => {
        const state = window.mediaOverlap?.gallery === e ? window.mediaOverlap : null;
        if (state?.error) throw new Error(`Overlap sampling failed: ${state.error}`);
        return state?.sample;
      });
      if (sample?.incoming === incoming && !sample.interruptionPending && sample.opacity > .05 && sample.opacity < .95) break;
      await tick(16);
    }
    assert(sample?.incoming === incoming && sample.opacity > 0 && sample.opacity < 1, 'Both media are visible during the overlap');
    assert.equal(sample.backdrop, 1, 'The opaque moving backdrop prevents a blank interval');
    assert.equal(sample.duration, '0.3s'); assert.equal(sample.easing, 'ease-in-out'); assert.equal(sample.transform, 'none');
    assert.equal(sample.hidden, 'true'); assert(sample.inert, 'Outgoing controls are unreachable');
    assert.equal(sample.frame.width, sample.oldFrame.width); assert.equal(sample.frame.height, sample.oldFrame.height);
    if (player !== undefined) assert.equal(sample.destroyedPlayers[player], false, 'Outgoing video remains alive through its visible fade');
    return sample;
  }

  for (const motion of ['no-preference', 'reduce']) {
    await page.emulateMedia({ reducedMotion: motion });
    for (let index = 0; index < 2; index++) {
      await page.setViewportSize({ width: motion === 'reduce' ? 390 : 1366, height: 6000 });
      await page.reload(); await flush();
      const gallery = galleries.nth(index);
      await choose(gallery, 1); await waitForPhoto(gallery);
      const source = await gallery.locator('.gallery-photo img').getAttribute('src');
      const frame = await gallery.locator('.gallery-viewer').boundingBox();
      await choose(gallery, 0);
      let player = await playerIndex(gallery);
      assert.equal(await gallery.getByRole('status').textContent(), 'Loading video…');
      assert.equal(await gallery.locator('.gallery-photo-backdrop img').getAttribute('src'), source);
      assert.equal(await gallery.locator('.gallery-media-pending').evaluate(e => Number(getComputedStyle(e).opacity)), 0, 'Player-ready does not reveal a playing frame');
      assert.equal(await gallery.locator('.gallery-media-pending').evaluate(e => e.inert), true);
      await event(player, 'state', 3); await tick(500);
      assert.equal(await gallery.locator('.gallery-video-current').count(), 0, 'Buffering is not playback readiness');
      await event(player, 'state', 1);
      await overlap(gallery, '.gallery-video-current', undefined, motion);
      await videoReady(gallery);
      assert.equal(await gallery.getByRole('status').count(), 0);
      assert.equal((await gallery.locator('.gallery-viewer').boundingBox()).height, frame.height);
      const identity = await gallery.locator('iframe').elementHandle();
      await choose(gallery, 0);
      assert(await identity.evaluate(e => e.isConnected), 'Active reactivation does not restart the player');
      assert.deepEqual(await page.evaluate(i => [window.videoPlayers[i].mutes, window.videoPlayers[i].plays], player), [1, 1]);

      // Decode is held after the video starts: playback continues until the photo is actually presented.
      await page.evaluate(source => {
        const original = HTMLImageElement.prototype.decode;
        window.pendingDecode = [];
        HTMLImageElement.prototype.decode = async function() {
          await original.call(this);
          if (!this.isConnected && this.src === new URL(source, location.href).href) await new Promise(resolve => window.pendingDecode.push(resolve));
        };
        window.restoreDecode = () => { HTMLImageElement.prototype.decode = original; };
      }, source);
      await choose(gallery, 1);
      await page.waitForFunction(() => window.pendingDecode.length > 0);
      assert.equal(await page.evaluate(i => window.videoPlayers[i].state, player), 1);
      assert(await gallery.locator('.gallery-photo-backdrop').evaluate(e => e.inert));
      await event(player, 'state', 0); await selected(gallery, 1);
      // Restore moving playback without allowing an obsolete completion to advance.
      await event(player, 'state', 1);
      // Slow decode preparation must not consume the fade-observation window.
      if (motion === 'no-preference' && index === 0) await page.waitForTimeout(2100);
      await page.evaluate(() => { window.restoreDecode(); window.pendingDecode.splice(0).forEach(resolve => resolve()); });
      await flush(); await overlap(gallery, '.gallery-photo', player, motion); await waitForPhoto(gallery);
      assert.equal(await page.evaluate(i => window.videoPlayers[i].destroyed, player), true);
      assert.equal(await gallery.locator('iframe').count(), 0, 'Finished outgoing player is released');
      await event(player, 'state', 0); await selected(gallery, 1);

      // Blocked playback reveals the accessible native-control boundary immediately.
      await choose(gallery, 0); player = await playerIndex(gallery);
      await event(player, 'onAutoplayBlocked'); await videoReady(gallery);
      const play = gallery.frameLocator('iframe').getByRole('button', { name: 'Play', exact: true });
      assert(await play.isVisible()); await play.click(); await flush();
      assert.equal(await page.evaluate(i => window.videoPlayers[i].state, player), 1, 'Manual native Play remains usable');
      assert.equal(await gallery.locator('.gallery-video-current').evaluate(e => e.inert), false);

      // Eight seconds starts at selection; keyboard inspection and viewport renders cannot extend it.
      await choose(gallery, 2); await waitForPhoto(gallery); await choose(gallery, 0); player = await playerIndex(gallery);
      await page.clock.fastForward(4000); await flush();
      await gallery.locator('.gallery-thumbnail').first().focus();
      await page.keyboard.press('Shift'); await flush();
      await page.setViewportSize({ width: motion === 'reduce' ? 391 : 1367, height: 6000 });
      await page.clock.fastForward(3999); await flush();
      assert.equal(await gallery.locator('.gallery-video-current').count(), 0, 'Fallback never reveals early');
      await page.clock.fastForward(1); await flush(); await videoReady(gallery);
      assert(await gallery.frameLocator('iframe').getByRole('button', { name: 'Play', exact: true }).isVisible());
      await selected(gallery, 0);

      // A missing usable player produces Retry; late ready/playing/error events cannot revive it.
      await choose(gallery, 1); await waitForPhoto(gallery);
      await page.evaluate(() => { window.videoFixture.ready = false; });
      await choose(gallery, 0); player = await playerIndex(gallery);
      await page.clock.fastForward(7999); await flush(); assert.equal(await gallery.getByRole('alert').count(), 0);
      await page.clock.fastForward(1); await flush();
      assert.match(await gallery.getByRole('alert').textContent(), /Could not load this video/);
      assert.equal(await gallery.locator('.gallery-photo-backdrop img').getAttribute('src'), source);
      assert.equal(await page.evaluate(i => window.videoPlayers[i].destroyed, player), true);
      await event(player, 'ready'); await event(player, 'state', 1); await event(player, 'onError');
      assert(await gallery.getByRole('button', { name: 'Retry', exact: true }).isVisible());
      await gallery.getByRole('button', { name: 'Retry', exact: true }).evaluate(e => e.click()); await flush();
      let replacement = await playerIndex(gallery); assert.notEqual(replacement, player);
      await page.clock.fastForward(7999); await flush(); assert.equal(await gallery.getByRole('alert').count(), 0, 'Retry owns a fresh deadline');
      // Supersede just before the new deadline and deliver obsolete readiness afterwards.
      await choose(gallery, 3); await waitForPhoto(gallery);
      await event(replacement, 'ready'); await event(replacement, 'state', 1); await tick(1000);
      await selected(gallery, 3); assert.equal(await gallery.getByRole('alert').count(), 0);
      assert.equal(await gallery.locator('iframe').count(), 0);

      // Retry can recover, and playback just before a deadline cancels it.
      await choose(gallery, 0); player = await playerIndex(gallery); await event(player, 'onError');
      await gallery.getByRole('button', { name: 'Retry', exact: true }).evaluate(e => e.click()); await flush();
      replacement = await playerIndex(gallery); await event(replacement, 'ready');
      await page.clock.fastForward(7999); await flush(); await event(replacement, 'state', 1); await videoReady(gallery);
      await tick(1000); assert.equal(await gallery.getByRole('alert').count(), 0); await selected(gallery, 0);
      assert.deepEqual(await page.evaluate(i => [window.videoPlayers[i].mutes, window.videoPlayers[i].plays], replacement), [1, 1]);
      if (motion === 'no-preference') {
        await choose(gallery, 1); await waitForPhoto(gallery);
        await choose(gallery, 0); player = await playerIndex(gallery);
        await event(player, 'ready'); await event(player, 'state', 1, 3);
        const interrupted = await overlap(gallery, '.gallery-video-current', undefined, motion);
        assert(interrupted.interruption, 'Interrupting a mixed-media fade preserves its moving backdrop without restarting');
        await event(player, 'state', 0); await event(player, 'onError');
        await waitForPhoto(gallery); await selected(gallery, 3);
        assert.equal(await gallery.getByRole('alert').count(), 0);
        assert.equal(await page.evaluate(i => window.videoPlayers[i].destroyed, player), true);
        // A later slow request must not prolong a video already covered by a
        // completed photo fade. Backdrop completion is distinct from readiness.
        await choose(gallery, 0); player = await playerIndex(gallery);
        await event(player, 'ready'); await event(player, 'state', 1); await videoReady(gallery);
        const slowSource = await gallery.locator('.gallery-thumbnail img').nth(2).getAttribute('src');
        await page.evaluate(source => {
          const original = HTMLImageElement.prototype.decode;
          window.pendingDecode = [];
          HTMLImageElement.prototype.decode = async function() {
            await original.call(this);
            if (!this.isConnected && this.src === new URL(source, location.href).href) await new Promise(resolve => window.pendingDecode.push(resolve));
          };
          window.restoreDecode = () => { HTMLImageElement.prototype.decode = original; };
        }, slowSource);
        await choose(gallery, 1); await flush(); await overlap(gallery, '.gallery-photo', player, motion);
        await choose(gallery, 2); await page.waitForFunction(() => window.pendingDecode.length > 0);
        await tick(900); await page.waitForTimeout(350); await tick(16);
        await selected(gallery, 2);
        assert.equal(await gallery.locator('.gallery-photo-backdrop').evaluate(e => Number(getComputedStyle(e).opacity)), 1);
        assert.equal(await page.evaluate(i => window.videoPlayers[i].destroyed, player), true, 'Covered video is released even when the latest decode remains pending');
        assert.equal(await gallery.locator('iframe').count(), 0);
        assert.equal(await gallery.getByRole('status').textContent(), 'Loading photo…');
        assert.equal(await gallery.locator('.evidence-image-button').count(), 0, 'Backdrop completion cannot finish the pending selection');
        await event(player, 'state', 0); await event(player, 'onError'); await selected(gallery, 2);
        await page.evaluate(() => { window.restoreDecode(); window.pendingDecode.splice(0).forEach(resolve => resolve()); });
        await waitForPhoto(gallery);
      }
      await captureRegion(page, { selectors: [await gallery.getAttribute('aria-label').then(name => `.game-gallery[aria-label="${name}"]`)], path: `.scratch/issue96-visuals/${motion}-${index}.png` });
      await selected(galleries.nth(1 - index), 0);
    }
  }
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  console.log('PASS: both mixed-media overlap directions, playback/decode readiness, native-control fallback, exact deadlines, failure/Retry, stale interruption, muted revisit, cleanup and independent galleries in desktop/mobile motion modes');
}
