// Only the external player boundary is substituted; the gallery stays real.
export async function installVideoFixture(page, { autoplay = true, ready = true } = {}) {
  await page.route('https://www.youtube.com/iframe_api', route => route.fulfill({ contentType: 'text/javascript', body: `
    window.videoPlayers = [];
    window.videoFixture = { autoplay: ${autoplay}, ready: ${ready} };
    window.YT = { Player: class {
      constructor(iframe, {events}) {
        this.iframe = iframe; this.events = events; this.state = -1;
        this.mutes = 0; this.plays = 0; this.destroyed = false;
        window.videoPlayers.push(this);
        if (window.videoFixture.ready) queueMicrotask(() => this.ready());
      }
      ready() { this.events.onReady({target:this}); }
      mute() { this.mutes++; }
      playVideo() { this.plays++; if (window.videoFixture.autoplay) queueMicrotask(() => this.emit(1)); }
      getPlayerState() { return this.state; }
      emit(state) { this.state = state; this.events.onStateChange({target:this,data:state}); }
      destroy() { this.destroyed = true; this.emit(0); }
    } };
    window.addEventListener('message', event => {
      if (event.data !== 'fixture-play') return;
      const player = window.videoPlayers.find(p => !p.destroyed && p.iframe.contentWindow === event.source);
      player?.emit(1);
    });
    window.onYouTubeIframeAPIReady();
  ` }));
  await page.route('https://www.youtube-nocookie.com/embed/**', route => route.fulfill({ contentType: 'text/html', body:
    '<body style="background:#285e45;color:white"><p>Controlled video</p><button onclick="parent.postMessage(\'fixture-play\',\'*\')">Play</button></body>' }));
}

export async function playerIndex(gallery) {
  const page = gallery.page();
  const title = await gallery.locator('iframe').last().getAttribute('title');
  await page.waitForFunction(t => window.videoPlayers?.some(p => !p.destroyed && p.iframe.title === t), title);
  return page.evaluate(t => window.videoPlayers.findLastIndex(p => !p.destroyed && p.iframe.title === t), title);
}
