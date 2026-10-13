import {chromium} from 'playwright';
import {startPreview} from './preview-server.mjs';
import {writeFile} from 'node:fs/promises';
const server=await startPreview();
let browser;
const evidence=[];
try {
  browser=await chromium.launch({headless:true});
  for (const width of [1366, 390]) {
  const page=await browser.newPage({viewport:{width,height:6000}});
  await page.addInitScript(()=>{
    window.realPlayers=[];
    let ready;
    Object.defineProperty(window,'onYouTubeIframeAPIReady',{configurable:true,
      get:()=>ready,set:callback=>{ready=()=>{
        const Original=window.YT.Player;
        window.YT.Player=function(iframe,options){
          const record={title:iframe.title,states:[],errors:[],ready:false};
          const events=options.events;
          const player=new Original(iframe,{...options,events:{...events,
            onReady:e=>{record.ready=true;events.onReady(e);},
            onStateChange:e=>{record.states.push(e.data);events.onStateChange(e);},
            onError:e=>{record.errors.push(e.data);events.onError(e);},
          }});
          record.player=player;window.realPlayers.push(record);return player;
        };
        callback();
      };}});
  });

  await page.goto(server.url);
  for(let index=0;index<2;index++) {
    try {
      await page.waitForFunction(i=>(window.realPlayers[i]?.ready && window.realPlayers[i].player.getDuration() > 0) || window.realPlayers[i]?.errors.length,index,{timeout:20000});
      const initial=await page.evaluate(i=>{const p=window.realPlayers[i];return {title:p.title,ready:p.ready,states:p.states,errors:p.errors,duration:p.player.getDuration()};},index);
      evidence.push({width, ...initial});
      if(initial.errors.length || !initial.duration) continue;
      const gallery=page.locator('.regulus-showcase .game-gallery, .video-project .game-gallery').nth(index);
      await gallery.getByRole('button',{name:'Pause slideshow',exact:true}).click();
      await gallery.locator('.gallery-video-current.ready').waitFor({timeout:12000});
      await page.evaluate(i => window.realPlayers[i].player.pauseVideo(), index);
      await page.waitForFunction(i => window.realPlayers[i].player.getPlayerState() === 2, index, {timeout:10000});
      await gallery.frameLocator('iframe').locator('.ytp-play-button').click();
      await page.waitForFunction(i => window.realPlayers[i].player.getPlayerState() === 1, index, {timeout:10000});
      evidence.push({width,index,nativePlay:true,fullscreenControl:await gallery.frameLocator('iframe').locator('.ytp-fullscreen-button').count() === 1});
      await page.mouse.move(0,0);await page.evaluate(()=>document.activeElement?.blur());
      await page.evaluate(i=>{const p=window.realPlayers[i].player;p.mute();p.seekTo(Math.max(0,p.getDuration()-2),true);p.playVideo();},index);
      await page.waitForFunction(i=>window.realPlayers[i].states.includes(0),index,{timeout:20000});
      evidence.push({width,index,completed:true,selected:await gallery.locator('.gallery-thumbnail').first().getAttribute('aria-pressed')});
      await page.evaluate(i=>{const p=window.realPlayers[i].player;p.seekTo(0,true);p.playVideo();},index);
      await page.waitForFunction(i=>window.realPlayers[i].player.getPlayerState()===1,index,{timeout:10000});
      await gallery.getByRole('button',{name:'Resume slideshow',exact:true}).click();
      await page.mouse.move(0,0);await page.evaluate(()=>document.activeElement?.blur());
      await page.waitForTimeout(1000);
      evidence.push({width,index,replayed:true,selected:await gallery.locator('.gallery-thumbnail').first().getAttribute('aria-pressed')});
      await page.evaluate(i=>{const p=window.realPlayers[i].player;p.seekTo(Math.max(0,p.getDuration()-2),true);p.playVideo();},index);
      await gallery.locator('.gallery-thumbnail').nth(1).waitFor();
      await page.waitForFunction(i=>document.querySelectorAll('.regulus-showcase .game-gallery, .video-project .game-gallery')[i].querySelectorAll('.gallery-thumbnail')[1].getAttribute('aria-pressed')==='true',index,{timeout:20000});
      evidence.push({width,index,eligibleCompletionAdvanced:true});
    }catch(error){evidence.push({width,index,limitation:error.message});}
  }
  await page.close();
  }
  console.log(JSON.stringify(evidence,null,2));
  await writeFile('.scratch/real-video-evidence.json',JSON.stringify(evidence,null,2));
  if (evidence.filter(record => record.nativePlay).length !== 4 ||
      evidence.filter(record => record.eligibleCompletionAdvanced).length !== 4 ||
      evidence.filter(record => record.replayed && record.selected === 'true').length !== 4 ||
      evidence.filter(record => record.completed && record.selected === 'true').length !== 4) process.exitCode = 1;
}finally{await browser?.close();server.kill();}
