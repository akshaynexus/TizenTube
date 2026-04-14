import { configRead } from '../config.js';
import resolveCommand from '../resolveCommand.js';
import { longPressData, MenuServiceItemRenderer, ShelfRenderer, TileRenderer } from '../ui/ytUI.js';
import { PatchSettings } from '../ui/customYTSettings.js';

const origParse = JSON.parse;
JSON.parse = function () {
  const r = origParse.apply(this, arguments);
  if (!r || typeof r !== 'object') return r;

  const adBlockEnabled = configRead('enableAdBlock');

  if (adBlockEnabled) {
    if (r.adPlacements) r.adPlacements = [];
    if (r.playerAds) r.playerAds = false;
    if (r.adSlots) r.adSlots = [];
  }

  if (r.paidContentOverlay && !configRead('enablePaidPromotionOverlay')) {
    r.paidContentOverlay = null;
  }

  try {
    if (r?.streamingData?.adaptiveFormats && configRead('videoPreferredCodec') !== 'any') {
      const preferredCodec = configRead('videoPreferredCodec');
      const formats = r.streamingData.adaptiveFormats;
      let hasPreferred = false;
      for (const f of formats) {
        if (f.mimeType && f.mimeType.includes(preferredCodec)) {
          hasPreferred = true;
          break;
        }
      }
      if (hasPreferred) {
        const filtered = [];
        for (const f of formats) {
          if (f.mimeType && f.mimeType.startsWith('audio/')) {
            filtered.push(f);
          } else if (f.mimeType && f.mimeType.includes(preferredCodec)) {
            filtered.push(f);
          }
        }
        r.streamingData.adaptiveFormats = filtered;
      }
    }
  } catch (e) { }

  if (!adBlockEnabled) return r;

  try {
    if (r?.contents?.tvBrowseRenderer?.content?.tvSurfaceContentRenderer?.content?.sectionListRenderer?.contents) {
      const contents = r.contents.tvBrowseRenderer.content.tvSurfaceContentRenderer.content.sectionListRenderer.contents;
      if (!configRead('enableSigninReminder')) {
        for (let i = contents.length - 1; i >= 0; i--) {
          if (contents[i]?.feedNudgeRenderer) contents.splice(i, 1);
        }
      }
      for (const shelf of contents) {
        if (shelf.shelfRenderer?.content?.horizontalListRenderer?.items) {
          for (let i = shelf.shelfRenderer.content.horizontalListRenderer.items.length - 1; i >= 0; i--) {
            if (shelf.shelfRenderer.content.horizontalListRenderer.items[i].adSlotRenderer) {
              shelf.shelfRenderer.content.horizontalListRenderer.items.splice(i, 1);
            }
          }
        }
      }
    }
  } catch (e) { }

  try {
    if (r?.contents?.sectionListRenderer?.contents) {
      processShelvesSimple(r.contents.sectionListRenderer.contents);
    }
  } catch (e) { }

  try {
    if (r?.continuationContents?.sectionListContinuation?.contents) {
      processShelvesSimple(r.continuationContents.sectionListContinuation.contents);
    }
  } catch (e) { }

  try {
    if (r?.continuationContents?.horizontalListContinuation?.items) {
      processItemsSimple(r.continuationContents.horizontalListContinuation.items);
    }
  } catch (e) { }

  try {
    if (r?.contents?.tvBrowseRenderer?.content?.tvSecondaryNavRenderer?.sections) {
      const sections = r.contents.tvBrowseRenderer.content.tvSecondaryNavRenderer.sections;
      if (configRead('sortSubscriptionsByAlphabet')) {
        for (const section of sections) {
          if (section.tvSecondaryNavSectionRenderer?.tabs) {
            section.tvSecondaryNavSectionRenderer.tabs.sort((a, b) => {
              const at = a.tabRenderer?.title || '';
              const bt = b.tabRenderer?.title || '';
              if (a.tabRenderer?.selected && !b.tabRenderer?.selected) return -1;
              if (!a.tabRenderer?.selected && b.tabRenderer?.selected) return 1;
              return at.localeCompare(bt);
            });
          }
        }
      }
    }
  } catch (e) { }

  try {
    if (r?.contents?.singleColumnWatchNextResults?.pivot?.sectionListRenderer?.contents) {
      processShelvesSimple(r.contents.singleColumnWatchNextResults.pivot.sectionListRenderer.contents);
      if (window.queuedVideos?.videos?.length > 0) {
        const qv = window.queuedVideos.videos.slice();
        qv.unshift(TileRenderer('Clear Queue', { customAction: { action: 'CLEAR_QUEUE' } }));
        r.contents.singleColumnWatchNextResults.pivot.sectionListRenderer.contents.unshift(ShelfRenderer('Queued Videos', qv, 0));
      }
    }
  } catch (e) { }

  if (r?.title?.runs) {
    try { PatchSettings(r); } catch (e) { }
  }

  try {
    if (r?.playerOverlays?.playerOverlayRenderer) {
      processSponsorBlockUI(r.playerOverlays.playerOverlayRenderer);
    }
  } catch (e) { }

  try {
    if (r?.transportControls?.transportControlsRenderer?.promotedActions) {
      processSponsorBlockButton(r.transportControls.transportControlsRenderer.promotedActions);
    }
  } catch (e) { }

  return r;
};

window.JSON.parse = JSON.parse;
for (const key in window._yttv) {
  if (window._yttv[key]?.JSON?.parse) {
    window._yttv[key].JSON.parse = JSON.parse;
  }
}

function processShelvesSimple(shelves) {
  if (!shelves || !Array.isArray(shelves)) return;
  for (const shelf of shelves) {
    if (shelf.shelfRenderer?.content?.horizontalListRenderer?.items) {
      processItemsSimple(shelf.shelfRenderer.content.horizontalListRenderer.items);
      if (!configRead('enableLongPress') || !configRead('enableShorts')) {
        const items = shelf.shelfRenderer.content.horizontalListRenderer.items;
        if (!configRead('enableShorts')) {
          for (let i = items.length - 1; i >= 0; i--) {
            if (items[i]?.tileRenderer?.tvhtml5ShelfRendererType === 'TVHTML5_TILE_RENDERER_TYPE_SHORTS') {
              items.splice(i, 1);
            }
          }
        }
      }
    }
  }
}

function processItemsSimple(items) {
  if (!items || !Array.isArray(items)) return;
  if (!configRead('enableLongPress')) return;
  
  for (const item of items) {
    const tile = item?.tileRenderer;
    if (!tile || tile.style !== 'TILE_STYLE_YTLR_DEFAULT') continue;
    if (tile.onLongPressCommand?.showMenuCommand) {
      tile.onLongPressCommand.showMenuCommand.menu.menuRenderer.items.push(
        MenuServiceItemRenderer('Add to Queue', {
          clickTrackingParams: null,
          playlistEditEndpoint: { customAction: { action: 'ADD_TO_QUEUE', parameters: item } }
        })
      );
      continue;
    }
    if (!tile.metadata?.tileMetadataRenderer || !tile.header?.tileHeaderRenderer?.thumbnail?.thumbnails) continue;
    const sub = tile.metadata.tileMetadataRenderer.lines?.[0]?.lineRenderer?.items?.[0]?.lineItemRenderer?.text;
    if (!sub) continue;
    const data = {
      videoId: tile.contentId,
      thumbnails: tile.header.tileHeaderRenderer.thumbnail.thumbnails,
      title: tile.metadata.tileMetadataRenderer.title.simpleText,
      subtitle: sub.runs ? sub.runs[0].text : sub.simpleText,
      watchEndpointData: tile.onSelectCommand?.watchEndpoint,
      item
    };
    tile.onLongPressCommand = longPressData(data);
  }
}

function processSponsorBlockUI(overlay) {
  const mode = configRead('sponsorBlockMode');
  if (mode === 'disabled') return;
  
  const manual = configRead('sponsorBlockManualSkips') || [];
  
  // In 'auto' mode, only show timeline buttons if manual skips are configured
  if (mode === 'auto' && manual.length === 0) {
    if (overlay.timelyActionRenderers) overlay.timelyActionRenderers = [];
    return;
  }
  
  // In 'buttons' mode, always show buttons

  const segments = window.sponsorblock?.segments;
  if (!segments) return;

  const renderers = [];
  
  for (const seg of segments) {
    if (manual.includes(seg.category) || seg.category === 'poi_highlight') {
      renderers.push({
        timelyActionRenderer: {
          actionButtons: [{
            buttonRenderer: {
              isDisabled: false,
              text: { runs: [{ text: seg.category }] },
              icon: { iconType: 'SKIP_NEXT' },
              command: {
                clickTrackingParams: null,
                customAction: { action: 'SKIP', parameters: { time: seg.segment[1] } }
              }
            }
          }],
          triggerTimeMs: seg.segment[0] * 1000,
          timeoutMs: (seg.segment[1] - seg.segment[0]) * 1000
        }
      });
    }
  }
  overlay.timelyActionRenderers = renderers;
}

function processSponsorBlockButton(promotedActions) {
  const mode = configRead('sponsorBlockMode');
  if (mode === 'disabled') return;
  
  if (!configRead('enableSponsorBlockHighlight') && mode === 'auto') return;
  
  const segments = window.sponsorblock?.segments;
  if (!segments) return;

  const highlight = segments.find(s => s.category === 'poi_highlight');
  if (highlight) {
    promotedActions.push({
      type: 'TRANSPORT_CONTROLS_BUTTON_TYPE_SPONSORBLOCK_HIGHLIGHT',
      button: {
        buttonRenderer: {
          isDisabled: false,
          text: { runs: [{ text: 'Skip Highlight' }] },
          icon: { iconType: 'SKIP_NEXT' },
          command: {
            clickTrackingParams: null,
            customAction: { action: 'SKIP', parameters: { time: highlight.segment[0] } }
          }
        }
      }
    });
  }
}