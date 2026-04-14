import sha256 from '../tiny-sha256.js';
import { configRead } from '../config.js';
import { showToast } from '../ui/ytUI.js';
import { t } from 'i18next';

const barTypes = {
  sponsor: { color: '#00d400', name: 'Sponsor' },
  intro: { color: '#00ffff', name: 'Intro' },
  outro: { color: '#0202ed', name: 'Outro' },
  interaction: { color: '#cc00ff', name: 'Interaction' },
  selfpromo: { color: '#ffff00', name: 'Self-Promo' },
  preview: { color: '#008fd6', name: 'Preview' },
  filler: { color: '#7300FF', name: 'Filler' },
  music_offtopic: { color: '#ff9900', name: 'Music' },
  poi_highlight: { color: '#9b044c', name: 'Highlight' }
};

const API = 'https://sponsor.ajay.app/api';

class SponsorBlockHandler {
  constructor(videoID) {
    this.videoID = videoID;
    this.segments = [];
    this.skippedSegments = new Map();
  }

  async init() {
    if (!configRead('enableSponsorBlock')) return;
    
    const hash = sha256(this.videoID).substring(0, 4);
    const categories = ['sponsor', 'intro', 'outro', 'interaction', 'selfpromo', 'preview', 'filler', 'music_offtopic', 'poi_highlight'];
    
    try {
      const resp = await fetch(`${API}/skipSegments/${hash}?categories=${encodeURIComponent(JSON.stringify(categories))}`);
      const results = await resp.json();
      const result = results.find(v => v.videoID === this.videoID);
      
      if (!result?.segments?.length) return;
      
      this.segments = result.segments;
      this.initAutoSkip();
    } catch (e) {
      console.warn('SponsorBlock init failed:', e);
    }
  }

  initAutoSkip() {
    const video = document.querySelector('video');
    if (!video) {
      setTimeout(() => this.initAutoSkip(), 250);
      return;
    }

    const skipCategories = this.getSkipCategories();
    if (skipCategories.length === 0) return;

    const doSkip = () => {
      if (!this.segments.length) return;
      
      const ct = video.currentTime;
      const seg = this.segments.find(s => 
        s.category === 'poi_highlight' && 
        s.segment[0] <= ct && ct < s.segment[1]
      );
      
      if (seg && !this.skippedSegments.has(seg.UUID)) {
        const alreadySkipped = this.getSkipCategories();
        if (alreadySkipped.includes(seg.category) || seg.category === 'poi_highlight') {
          this.skippedSegments.set(seg.UUID, Date.now());
          
          if (configRead('enableSponsorBlockToasts')) {
            showToast('SponsorBlock', `Skipped ${barTypes[seg.category]?.name || seg.category}`);
          }
          
          const skipTo = seg.segment[1] - 0.1;
          video.currentTime = Math.min(skipTo, video.duration - 0.5);
        }
      }
    };

    video.addEventListener('timeupdate', doSkip);
    video.addEventListener('seeked', doSkip);
  }

  getSkipCategories() {
    const cats = [];
    const cfg = configRead;
    if (cfg('enableSponsorBlockSponsor')) cats.push('sponsor');
    if (cfg('enableSponsorBlockIntro')) cats.push('intro');
    if (cfg('enableSponsorBlockOutro')) cats.push('outro');
    if (cfg('enableSponsorBlockInteraction')) cats.push('interaction');
    if (cfg('enableSponsorBlockSelfPromo')) cats.push('selfpromo');
    if (cfg('enableSponsorBlockPreview')) cats.push('preview');
    if (cfg('enableSponsorBlockFiller')) cats.push('filler');
    if (cfg('enableSponsorBlockMusicOfftopic')) cats.push('music_offtopic');
    return cats;
  }

  hasCategory(cat) {
    return this.getSkipCategories().includes(cat);
  }
}

window.sponsorblock = null;

window.addEventListener('hashchange', () => {
  const hash = location.hash.substring(1);
  if (!hash.startsWith('/watch')) return;
  
  const url = new URL(hash, location.href);
  const videoID = url.search.get('v');
  if (!videoID || videoID === window.sponsorblock?.videoID) return;
  
  if (window.sponsorblock) {
    window.sponsorblock = null;
  }
  
  window.sponsorblock = new SponsorBlockHandler(videoID);
  window.sponsorblock.init();
}, false);

if (location.hash.startsWith('#/watch')) {
  const url = new URL(location.hash, location.href);
  const videoID = url.search.get('v');
  if (videoID) {
    window.sponsorblock = new SponsorBlockHandler(videoID);
    window.sponsorblock.init();
  }
}