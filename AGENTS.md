# TizenTube Agent Documentation

This document provides comprehensive documentation for AI agents working with the TizenTube codebase.

## Project Overview

**TizenTube** is a TizenBrew module that enhances YouTube TV viewing experience by:
- Removing ads from YouTube TV
- Adding SponsorBlock support
- Picture-in-Picture (PiP) mode
- Customizable themes
- Additional subtitle languages
- Video quality preferences
- And more

The project consists of two main components:
1. **mods/** - The browser-side JavaScript that runs in the YouTube TV app
2. **service/** - Tizen service that handles DIAL protocol for app launching

---

## Directory Structure

```
/home/akshay/TizenTube/
├── package.json              # Root package (TizenBrew module config)
├── README.md                 # Project readme
├── LICENSE                   # GPL-3.0 license
├── AGENTS.md                 # This documentation file
├── mods/                     # Main source code (runs in YouTube TV)
│   ├── config.js             # Configuration system
│   ├── userScript.js         # Entry point - imports all features
│   ├── resolveCommand.js     # Command resolution & custom actions
│   ├── rollup.config.js     # Build configuration
│   ├── package.json         # Dependencies
│   ├── tiny-sha256.js       # SHA-256 hashing utility
│   ├── domrect-polyfill.js # DOMRect polyfill
│   ├── spatial-navigation-polyfill.js # Spatial navigation polyfill
│   ├── features/            # Feature implementations
│   │   ├── adblock.js          # Ad blocking
│   │   ├── sponsorblock.js    # SponsorBlock integration
│   │   ├── pictureInPicture.js # PiP mode
│   │   ├── updater.js         # Auto-updater
│   │   ├── moreSubtitles.js   # Subtitle localization
│   │   ├── preferredVideoQuality.js # Quality preference
│   │   ├── videoQueuing.js    # Video queue
│   │   ├── autoFrameRate.js   # Auto frame rate
│   │   ├── userAgentSpoofing.js # UA spoofing
│   │   └── enableFeatures.js  # Feature toggles
│   ├── ui/                   # UI components
│   │   ├── ui.js              # Main UI handler
│   │   ├── settings.js        # Settings modal
│   │   ├── speedUI.js         # Speed controls
│   │   ├── theme.js           # Theme customization
│   │   ├── ytUI.js           # YouTube UI helpers
│   │   ├── customUI.js        # Custom player UI
│   │   ├── chapters.js        # Video chapters
│   │   ├── customGuideAction.js # Guide sidebar customization
│   │   ├── customCommandExecution.js # Command execution utilities
│   │   ├── customYTSettings.js # Settings patching
│   │   ├── disableWhosWatching.js # Who is watching menu control
│   │   └── *.css             # UI styles
│   ├── translations/         # i18n support
│   │   ├── index.js          # i18next init
│   │   ├── i18nResources.js  # Translation resources
│   │   ├── language-names.js # Language names
│   │   └── resources/        # Language JSON files
│   └── utils/                # Utilities
│       └── ASTParser.js      # AST parsing utility
├── service/                  # Tizen service (DIAL protocol)
│   ├── service.js           # Main service code
│   ├── package.json         # Dependencies
│   └── rollup.config.js    # Build config
└── dist/                     # Build output (generated)
    ├── userScript.js       # Bundled entry
    └── service.js         # Bundled service
```

---

## Configuration System

### Location
`/home/akshay/TizenTube/mods/config.js`

### Configuration Storage
- Uses `localStorage` with key: `ytaf-configuration`
- Persists as JSON string

### Default Configuration Keys

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `enableAdBlock` | boolean | true | Enable ad blocking |
| `enableSponsorBlock` | boolean | true | Enable SponsorBlock |
| `enableSponsorBlockToasts` | boolean | true | Show skip toasts |
| `sponsorBlockManualSkips` | array | `['intro', 'outro', 'filler']` | Auto-skip categories |
| `videoSpeed` | number | 1 | Playback speed |
| `preferredVideoQuality` | string | 'auto' | Preferred video quality |
| `enableDeArrow` | boolean | true | Enable DeArrow |
| `focusContainerColor` | string | '#0f0f0f' | Nav bar color |
| `routeColor` | string | '#0f0f0f' | Main content color |
| `enableFixedUI` | boolean | true | Fix UI issues |
| `enableHqThumbnails` | boolean | false | High quality thumbnails |
| `enableChapters` | boolean | true | Show chapters |
| `enableLongPress` | boolean | true | Long press menu |
| `enableShorts` | boolean | true | Show Shorts |
| `enablePatchingVideoPlayer` | boolean | true | Patch player UI |
| `speedSettingsIncrement` | number | 0.25 | Speed increment |
| `videoPreferredCodec` | string | 'any' | Preferred codec |
| `hideWatchedVideosThreshold` | number | 80 | Hide threshold % |
| `enableHideWatchedVideos` | boolean | false | Hide watched |
| `enableScreenDimming` | boolean | false | Dim screen when idle |
| `dimmingTimeout` | number | 60 | Dim timeout seconds |
| `dimmingOpacity` | number | 0.5 | Dim opacity |
| `enableUpdater` | boolean | true | Auto-update |
| `autoFrameRate` | boolean | false | Match video frame rate |
| `autoFrameRatePauseVideoFor` | number | 0 | Pause before applying frame rate |
| `sortSubscriptionsByAlphabet` | boolean | false | Alphabetical subs |
| `enableShowUserLanguage` | boolean | true | Add user's language to subtitles |
| `enableShowOtherLanguages` | boolean | true | Add all languages to subtitles |
| `disabledSidebarContents` | array | [] | Sidebar items to hide |
| `enableWhoIsWatchingMenu` | boolean | false | Enable who's watching |
| `permanentlyEnableWhoIsWatchingMenu` | boolean | false | Always enable who's watching |
| `enableSpeedControlsButton` | boolean | true | Show speed button in player |
| `enableSuperThanksButton` | boolean | true | Show Super Thanks button |
| `enablePreviousNextButtons` | boolean | true | Show prev/next buttons |

### API

```javascript
import { configRead, configWrite, configChangeEmitter } from './config.js';

// Read a config value
const value = configRead('enableAdBlock');

// Write a config value
configWrite('enableAdBlock', false);

// Listen for config changes
configChangeEmitter.addEventListener('configChange', (event) => {
    console.log(event.detail.key, event.detail.value);
});
```

### How it Works

The config system:
1. Loads configuration from localStorage on initialization
2. Merges with default values
3. Provides reactive updates via CustomEvent emitter
4. Automatically persists changes to localStorage

```javascript
// config.js internal structure (simplified)
const DEFAULT_CONFIG = {
    enableAdBlock: true,
    // ... more defaults
};

function configRead(key) {
    const stored = JSON.parse(localStorage.getItem('ytaf-configuration') || '{}');
    return stored[key] ?? DEFAULT_CONFIG[key];
}

function configWrite(key, value) {
    const config = JSON.parse(localStorage.getItem('ytaf-configuration') || '{}');
    config[key] = value;
    localStorage.setItem('ytaf-configuration', JSON.stringify(config));
    configChangeEmitter.dispatchEvent(new CustomEvent('configChange', { detail: { key, value } }));
}
```

---

## Features

### 1. Ad Blocking

**Location:** `/home/akshay/TizenTube/mods/features/adblock.js`

**How it works:**
- Patches `JSON.parse` to remove ad-related data from API responses
- Removes `adPlacements`, `playerAds`, `adSlots` from responses
- Filters ad content from home screen shelves
- Removes Shorts from browse feeds
- Applies DeArrow titles for sponsorship detection
- Adds video previews on hover
- Adds long press menu for videos

**Key functions:**
- `processShelves(shelves)` - Process shelf items for ads
- `deArrowify(items)` - Apply DeArrow titles via API
- `hqify(items)` - High quality thumbnails
- `hideVideo(items)` - Filter watched videos
- `addPreviews(items)` - Add video previews
- `addLongPress(items)` - Add long press menu

**Configuration:**
- `enableAdBlock` - Enable/disable all ad blocking
- `enablePaidPromotionOverlay` - Hide paid promotion overlay
- `enableHideEndScreenCards` - Hide end screen cards
- `enableYouThereRenderer` - Hide "You're there" messages
- `enableDeArrow` - Enable DeArrow sponsor titles
- `enableHqThumbnails` - High quality thumbnails
- `enableHideWatchedVideos` - Hide watched videos
- `hideWatchedVideosThreshold` - Threshold percentage

**DeArrow API:**
- Endpoint: `https://dearrow.ajay.app/api`
- Used to fetch crowd-sourced video titles instead of sponsor segments

**Code Pattern for JSON.parse patching:**

```javascript
const origParse = JSON.parse;
JSON.parse = function() {
    const result = origParse.apply(this, arguments);
    // Remove ad-related data
    if (result.adPlacements) delete result.adPlacements;
    if (result.playerAds) delete result.playerAds;
    if (result.adSlots) delete result.adSlots;
    // Process shelf items
    if (result.shelves) result.shelves = processShelves(result.shelves);
    return result;
};
// Also patch YouTube's copy
window._yttv[key].JSON.parse = JSON.parse;
```

---

### 2. SponsorBlock

**Location:** `/home/akshay/TizenTube/mods/features/sponsorblock.js`

**API Endpoint:**
- `https://sponsor.ajay.app/api`

**Segment Categories:**
| Category | Color | Description |
|----------|-------|-------------|
| sponsor | #00d400 | Sponsored segment |
| intro | #00ffff | Intro |
| outro | #0202ed | Outro |
| interaction | #cc00ff | Interaction reminder |
| selfpromo | #ffff00 | Self-promotion |
| preview | #008fd6 | Recap/preview |
| filler | #7300FF | Tangents |
| music_offtopic | #ff9900 | Non-music part |
| poi_highlight | #9b044c | Highlight |

**Class: SponsorBlockHandler**

```javascript
class SponsorBlockHandler {
    constructor(videoID) // Initialize with video ID
    
    async init()         // Fetch and process segments from API
    attachVideo()      // Attach to video element
    buildOverlay()     // Create progress bar overlay showing segments
    scheduleSkip()     // Schedule auto-skip based on categories
    destroy()          // Cleanup when video changes
}
```

**How it works:**
1. Fetches segments from SponsorBlock API using video ID
2. Creates a visual overlay on the video progress bar
3. Colors the overlay based on segment categories
4. Auto-skips segments in `sponsorBlockManualSkips` config
5. Shows toasts when skipping (if enabled)

**API Calls:**
```javascript
// Get segments for video
fetch(`https://sponsor.ajay.app/api/skipSegments/${videoID}?categories=["sponsor","intro"]`)

// Submit segment (user created)
fetch('https://sponsor.ajay.app/api/skipSegments', {
    method: 'POST',
    body: JSON.stringify({
        videoID,
        startTime,
        endTime,
        category,
        UUID
    })
});
```

**Configuration:**
- `enableSponsorBlock` - Enable/disable
- `enableSponsorBlockSponsor`, `enableSponsorBlockIntro`, etc. - Per-category toggles
- `sponsorBlockManualSkips` - Array of categories to auto-skip
- `enableSponsorBlockToasts` - Show toasts on skip

---

### 3. Picture-in-Picture

**Location:** `/home/akshay/TizenTube/mods/features/pictureInPicture.js`

**Functions:**
```javascript
import { enablePip, pipToFullscreen } from './features/pictureInPicture.js';

// Enter PiP mode
enablePip();

// Exit PiP to fullscreen
pipToFullscreen();
```

**How it works:**
1. Captures current video timestamp via `getCurrentTime()`
2. Exits video player using `HISTORY_BACK` signal
3. Navigates to search and finds PiP button
4. Creates PiP window positioned at bottom-right (68vw, 68vh)
5. Re-loads video at captured timestamp in PiP mode

**Key variables:**
- `window.isPipPlaying` - Current PiP state boolean
- `window.pipTimestamp` - Stored timestamp for resume

**PiP button detection:**
```javascript
// Searches for PiP button in various locations
const pipButton = document.querySelector('button[aria-label="Mini player"]') ||
                  document.querySelector('.pip-button') ||
                  // searches through search results
```

**Triggered by:**
- Custom action `ENTER_PIP` from resolveCommand
- Transport controls button in player

---

### 4. Auto-Updater

**Location:** `/home/akshay/TizenTube/mods/features/updater.js`

**API:** GitHub Releases API
- Endpoint: `https://api.github.com/repos/username/TizenTube/releases`

**How it works:**
1. Checks for updates on app launch
2. Compares current version with latest GitHub release
3. Shows update notification if new version available
4. Allows user to download or remind later

**Configuration:**
- `enableUpdater` - Enable auto-update checking
- `dontCheckUpdateUntil` - Timestamp for "remind later"

**Check function:**
```javascript
checkForUpdates(showToast); // true = show "up to date" toast

// Returns promise with { hasUpdate, latestVersion, releaseNotes, downloadUrl }
```

**Version comparison:**
```javascript
// Parses semver and compares
const current = parseVersion(configRead('version'));
const latest = parseVersion(latestRelease.tag_name);
return latest.major > current.major || 
       latest.minor > current.minor || 
       latest.patch > current.patch;
```

---

### 5. More Subtitles

**Location:** `/home/akshay/TizenTube/mods/features/moreSubtitles.js`

**Features:**
- Add user's local language to subtitle menu
- Add all missing languages to subtitle menu

**Configuration:**
- `enableShowUserLanguage` - Add user's language
- `enableShowOtherLanguages` - Add all languages

**How it works:**
1. Patches `resolveCommand` to intercept subtitle menu
2. When `CLIENT_OVERLAY_TYPE_CAPTIONS_AUTO_TRANSLATE` is triggered:
   - Gets user's country code from `window.yt.config_.GL`
   - Infers language from country using `Intl.Locale`
   - Adds user's language if not present
   - Adds all other languages from comprehensive list

**API exports:**
```javascript
import { getComprehensiveLanguageList, getCountryLanguage } from './features/moreSubtitles.js';

const languages = getComprehensiveLanguageList(); // { code: name }
// Returns: { 'en': 'English', 'de': 'German', ... }

const userLang = getCountryLanguage('US'); // { code, name }
// Returns: { code: 'en', name: 'English' }
```

**Language detection:**
```javascript
function getCountryLanguage(countryCode) {
    const region = String(countryCode).toUpperCase();
    // Special handling for Chinese regions
    const zhRegionMap = { CN: "zh-CN", TW: "zh-TW", HK: "zh-HK", SG: "zh-CN" };
    if (zhRegionMap[region]) return { code: zhRegionMap[region], name: 'Chinese' };
    
    // Use Intl.Locale for inference
    const base = new Intl.Locale("und", { region });
    const maximized = base.maximize();
    return { code: maximized.language, name: languages[maximized.language] };
}
```

---

### 6. Video Queuing

**Location:** `/home/akshay/TizenTube/mods/features/videoQueuing.js`

**Global object:**
```javascript
window.queuedVideos = {
    videos: [],           // Array of video items
    lastVideoId: null    // Last played video ID
};
```

**How it works:**
1. Adds "Add to Queue" option via long press menu
2. Listens for video end state
3. Automatically plays next video when current ends
4. Shows "Queued Videos" shelf in "Up Next" section
5. Clears queue when all videos played

**Code flow:**
```javascript
videoPlayer.addEventListener('onStateChange', () => {
    const state = videoPlayer.getPlayerStateObject();
    if (state.isEnded) {
        // Play next video in queue
        const index = window.queuedVideos.videos.findIndex(v => v.tileRenderer.contentId === videoId);
        const nextVideo = window.queuedVideos.videos[index + 1];
        if (nextVideo) {
            resolveCommand(nextVideo.tileRenderer.onSelectCommand);
        }
    }
});
```

**Menu integration:**
```javascript
// Added to longPressData menu
MenuServiceItemRenderer('Add to Queue', {
    playlistEditEndpoint: {
        customAction: {
            action: 'ADD_TO_QUEUE',
            parameters: data.item
        }
    }
})
```

---

### 7. Preferred Video Quality

**Location:** `/home/akshay/TizenTube/mods/features/preferredVideoQuality.js`

**Class: PreferredQualityHandler**

```javascript
class PreferredQualityHandler {
    constructor()
    init()
    #pollForPlayer()      // Wait for player element
    #handleStateChange()  // Listen for state changes
    #applyQuality()       // Set playback quality
    #determineQuality(preference) // Find matching quality
}
```

**How it works:**
1. Polls for `.html5-video-player` element
2. Attaches state change listener
3. When video starts playing, applies preferred quality
4. Uses `setPlaybackQualityRange(quality, quality)` to force quality

**Configuration:**
- `preferredVideoQuality` - 'auto', '2160p', '1440p', '1080p', '720p', etc.

**Quality mapping:**
```javascript
#determineQuality(preference) {
    const availableQualities = this.#player.getAvailableQualityData();
    const targetValue = parseInt(preference, 10);
    const match = availableQualities.find(q => parseInt(q.qualityLabel) === targetValue);
    return match ? match.quality : 'highres';
}
```

---

### 8. Auto Frame Rate

**Location:** `/home/akshay/TizenTube/mods/features/autoFrameRate.js`

**How it works:**
1. Attaches to `onPlaybackStartExternal` event
2. Parses "Stats for Nerds" for resolution (e.g., `1920x1080@30`)
3. Extracts FPS from resolution string
4. Calls native API to set display refresh rate

**Requirements:**
- Requires TizenTube Cobalt with `SetFrameRate` API

**Configuration:**
- `autoFrameRate` - Enable auto frame rate
- `autoFrameRatePauseVideoFor` - Pause before applying (ms)

**Code:**
```javascript
player.addEventListener('onPlaybackStartExternal', () => {
    const statsForNerds = player.getStatsForNerds();
    const resolutionMatch = statsForNerds.resolution.match(/(\d+)x(\d+)@([\d.]+)/);
    if (resolutionMatch) {
        const fps = resolutionMatch[3];
        window.h5vcc.tizentube.SetFrameRate(parseFloat(fps));
    }
});
```

---

### 9. User Agent Spoofing

**Location:** `/home/akshay/TizenTube/mods/features/userAgentSpoofing.js`

**Device profiles available:**
| Profile | Architecture | OS | Manufacturer | Model |
|---------|-------------|-----|--------------|-------|
| Sony ATV | Linux arm64-v8a | Android 10 | Sony | SOV38 (sdm845) |
| Google Chromecast | Linux armeabi-v7a | Android 14 | Google | Chromecast (sabrina) |
| TCL Smart TV Pro | Linux armeabi-v7a | Android 12 | TCL | Smart TV Pro (merak) |
| Amazon Fire TV | Linux armeabi-v7a | Android 7.1.2 | Amazon | AFTMM (mt8695) |

**Storage:** LocalStorage key `userAgent`

**How it works:**
1. Checks if running in TizenTube environment (`window.h5vcc.tizentube`)
2. Generates spoofed User Agent string
3. Stores in localStorage for persistence
4. Calls native API to set UA
5. Triggers page reload

**User Agent format:**
```
Mozilla/5.0 (Linux arm64-v8a; Android 10) Cobalt/25.lts.30.1034958-gold 
(v8/8.8.278.17-jit) gles Starboard/15, Sony_ATV_sdm845_13140765/52.1.C.0.268 
(KDDI, SOV38) com.google.android.youtube.tv/5.30.301
```

---

### 10. Enable Features

**Location:** `/home/akshay/TizenTube/mods/features/enableFeatures.js`

**Purpose:** Enables/disables various YouTube features based on configuration

**Features controlled:**
- YouTube Shorts visibility
- Chapters display
- Long press menu
- Fixed UI improvements

---

## Command System

### Location
`/home/akshay/TizenTube/mods/resolveCommand.js`

### Custom Actions

TizenTube adds custom actions that intercept YouTube commands:

| Action | Description |
|--------|-------------|
| `SETTINGS_UPDATE` | Open settings modal |
| `OPTIONS_SHOW` | Show sub-options |
| `SKIP` | Skip to timestamp |
| `TT_SETTINGS_SHOW` | TizenTube settings |
| `TT_SPEED_SETTINGS_SHOW` | Speed controls |
| `UPDATE_REMIND_LATER` | Set reminder |
| `UPDATE_DOWNLOAD` | Download update |
| `SET_PLAYER_SPEED` | Set playback rate |
| `ENTER_PIP` | Enter PiP |
| `SHOW_TOAST` | Show toast |
| `ADD_TO_QUEUE` | Add to queue |
| `CLEAR_QUEUE` | Clear queue |
| `CHECK_FOR_UPDATES` | Check updates |

### Patching resolveCommand

```javascript
import { patchResolveCommand, findFunction } from './resolveCommand.js';

// Patch YouTube's resolveCommand to intercept custom actions
patchResolveCommand();

// Find function in YouTube instances
const fn = findFunction('someFunctionName');
```

### resolveCommand Structure

```javascript
// resolveCommand.js exports:
// - patchResolveCommand: Patches YouTube's resolveCommand
// - findFunction: Finds a function by name pattern
// - customAction: Object containing all custom action handlers
// - resolveCommand: The patched function

patchResolveCommand = () => {
    // Iterates through window._yttv instances
    // Patches instance.resolveCommand to intercept custom actions
    // Uses actionName pattern matching to find handlers
};
```

---

## UI Components

### 1. Settings Modal

**Location:** `/home/akshay/TizenTube/mods/ui/settings.js`

**Main function:**
```javascript
import modernUI from './ui/settings.js';

// Open main settings modal
modernUI();

// Open with update (existing modal)
modernUI(true, parameters);
```

**How it works:**
1. Creates modal with categories and settings
2. Patches into YouTube's settings system via `customYTSettings.js`
3. Adds TizenTube settings as first category
4. Supports sub-option panels

**Sub-options:**
```javascript
import { optionShow } from './ui/settings.js';

optionShow(parameters, update);
```

---

### 2. Speed UI

**Location:** `/home/akshay/TizenTube/mods/ui/speedUI.js`

**Trigger:** KeyCode 191 (Blue button on remote) or KeyCode 406

```javascript
import { speedSettings } from './ui/speedUI.js';

speedSettings();
```

**How it works:**
1. Creates speed selection modal
2. Generates buttons from 0.25x to 5x (configurable increment)
3. Includes "Fix stuttering (1.0001x)" option
4. Uses `setClientSettingEndpoint` to persist
5. Uses custom action `SET_PLAYER_SPEED` to apply immediately

**Speed options:**
```javascript
// Available speeds: 0.25, 0.5, 0.75, 1.0, 1.25, ..., 5.0
// Special: 1.0001 (fix stuttering)
```

---

### 3. Theme

**Location:** `/home/akshay/TizenTube/mods/ui/theme.js`

**How it works:**
1. Creates a `<style>` element with CSS custom properties
2. Applies `focusContainerColor` to guide sidebar
3. Applies `routeColor` to main content area

**Update:**
```javascript
import updateStyle from './ui/theme.js';

// Apply custom colors
configWrite('focusContainerColor', '#0f0f0f');
configWrite('routeColor', '#0f0f0f');
updateStyle();
```

**CSS applied:**
```css
ytlr-guide-response yt-focus-container {
    background-color: #0f0f0f;
}

#container {
    background-color: #0f0f0f !important;
}
```

---

### 4. YouTube UI Helpers

**Location:** `/home/akshay/TizenTube/mods/ui/ytUI.js`

This is a comprehensive utility file for creating YouTube TV UI components.

**Exports:**

```javascript
import {
    showToast,
    showModal,
    Modal,
    OverlayPanelHeaderRenderer,
    buttonItem,
    overlayPanelItemListRenderer,
    overlayMessageRenderer,
    timelyAction,
    scrollPaneRenderer,
    longPressData,
    MenuServiceItemRenderer,
    MenuNavigationItemRenderer,
    SettingsCategory,
    SettingActionRenderer,
    ShelfRenderer,
    TileRenderer,
    QrCodeRenderer,
    ButtonRenderer
} from './ui/ytUI.js';
```

**Detailed API:**

#### showToast(title, subtitle, thumbnails?)
Creates a toast notification:
```javascript
showToast('Video Added', 'Added to queue');
showToast('Skipped', 'Sponsor segment', [{ url: 'thumb.jpg' }]);
```

#### showModal(header, content, id, update)
Creates a modal dialog:
```javascript
const buttons = [
    buttonItem({ title: 'Option 1' }, { icon: 'PLAY' }, [{ customAction: { action: 'DO_SOMETHING' } }])
];
showModal('Settings', overlayPanelItemListRenderer(buttons, 0), 'settings-modal');
```

#### buttonItem(title, icon, commands)
Creates a button/link item:
```javascript
buttonItem(
    { title: 'Play', subtitle: 'Resume playback' },  // title object
    { icon: 'PLAY', secondaryIcon: 'CHECK_BOX' },     // icon object
    [                                                 // commands array
        { signalAction: { signal: 'POPUP_BACK' } },
        { openPopupAction: { ... } }
    ]
);
```

#### Modal(header, content, id, update)
Returns modal command object (for programmatic use):
```javascript
const modalCmd = Modal(
    { title: 'Title', subtitle: 'Subtitle' },
    content,
    'unique-id',
    false
);
resolveCommand(modalCmd);
```

#### longPressData(data)
Creates long press menu data:
```javascript
longPressData({
    videoId: 'dQw4w9WgXcQ',
    title: 'Video Title',
    subtitle: '1M views',
    thumbnails: [{ url: 'thumb.jpg' }],
    watchEndpointData: { videoId: 'dQw4w9WgXcQ' },
    item: videoItem
});
```

#### SettingsCategory(categoryId, items, title)
Creates a settings category:
```javascript
SettingsCategory(
    'video_category',
    [SettingActionRenderer('Quality', 'quality', ...)],
    'Video Settings'
);
```

#### ShelfRenderer(title, items, selectedIndex)
Creates a shelf (horizontal row):
```javascript
ShelfRenderer(
    'Up Next',
    tiles.map(tile => TileRenderer(tile.title, tile.onSelectCommand)),
    0
);
```

#### TileRenderer(title, onSelectCommand)
Creates a tile for shelves:
```javascript
TileRenderer('Video Title', {
    clickTrackingParams: '...',
    watchEndpoint: { videoId: 'abc123' }
});
```

---

### 5. Custom Player UI

**Location:** `/home/akshay/TizenTube/mods/ui/customUI.js`

**How it works:**
1. Uses AST parser to find player button methods
2. Patches `YtlrPlayerActionsContainer` class
3. Adds/modifies transport control buttons
4. Filters out unwanted buttons

**Features added:**
- PiP button (Mini Player)
- Speed Controls button
- Previous/Next buttons

**Features hidden:**
- Super Thanks button
- Shopping button

**Code pattern:**
```javascript
// Uses AST parser to find button group names
const functions = extractAssignedFunctions(origMethod.toString());

// Finds the action group containing settings
const settingActionGroup = functions.find(func => 
    func.rhs.includes('TRANSPORT_CONTROLS_BUTTON_TYPE_PLAYBACK_SETTINGS')
).left.split('.')[1);

// Modifies the group to add PiP button
inst[settingActionGroup] = function() {
    const res = origSettingActionGroup.apply(this, arguments);
    res.find(item => item.type === 'TRANSPORT_CONTROLS_BUTTON_TYPE_PIP') || 
        res.splice(1, 0, pipCommand);
    return res;
};
```

---

### 6. Custom Guide Action

**Location:** `/home/akshay/TizenTube/mods/ui/customGuideAction.js`

**Purpose:** Controls sidebar (guide) content visibility

**How it works:**
1. Patches `JSON.parse` to filter guide sections
2. Removes items matching `disabledSidebarContents` config
3. Reloads guide when config changes

**Configuration:**
```javascript
// Array of icon types to hide
configWrite('disabledSidebarContents', ['PLAYLISTS', 'LIKES']);
```

**Supported sidebar icons:**
- `PLAYLISTS`
- `LIKES`
- `HISTORY`
- `YOUR videos`
- etc.

---

### 7. Custom Command Execution

**Location:** `/home/akshay/TizenTube/mods/ui/customCommandExecution.js`

**Purpose:** Provides access to YouTube's internal command executor

**Usage:**
```javascript
import getCommandExecutor from './customCommandExecution.js';

const executor = getCommandExecutor();
if (executor) {
    // Execute a function by name
    executor.executeFunction(new executor.commandFunction('functionName'));
}
```

**How it works:**
1. Finds the `ytlrActionRouter` instance
2. Locates the `executeFunction` method
3. Provides `commandFunction` constructor for executing internal functions

---

### 8. Custom YouTube Settings

**Location:** `/home/akshay/TizenTube/mods/ui/customYTSettings.js`

**Purpose:** Injects TizenTube settings into YouTube's settings menu

**How it works:**
```javascript
import { PatchSettings } from './customYTSettings.js';

// Creates a TizenTube settings entry
const tizentubeOpenAction = SettingActionRenderer(
    t('settings.ttSettings.title'),      // "TizenTube Settings"
    'tizentube_open_action',             // unique ID
    { customAction: { action: 'TT_SETTINGS_SHOW' } },
    t('settings.ttSettings.summary'),    // Description
    'https://...'                        // Thumbnail
);

// Adds to first position in settings
settingsObject.items.unshift(SettingsCategory('tizentube_category', [tizentubeOpenAction]));
```

---

### 9. Disable Who's Watching

**Location:** `/home/akshay/TizenTube/mods/ui/disableWhosWatching.js`

**Purpose:** Controls the "Who's watching?" account selector popup

**How it works:**
1. Modifies `yt.leanback.default::recurring_actions` localStorage
2. Sets `lastFired` timestamp to future (to disable) or past (to enable)
3. Uses recurring actions to control popup behavior

**Configuration:**
```javascript
configWrite('enableWhoIsWatchingMenu', true);  // Enable popup
configWrite('permanentlyEnableWhoIsWatchingMenu', true);  // Keep enabled permanently
```

**Affected actions:**
- `startup-screen-account-selector-with-guest`
- `whos_watching_fullscreen_zero_accounts`
- `startup-screen-signed-out-welcome-back`

---

## Translations

### Location
`/home/akshay/TizenTube/mods/translations/`

### Setup

**index.js:**
```javascript
import i18n from 'i18next';
import resources from './i18nResources.js';

i18n.init({
    lng: window?.yt?.config_?.HL || navigator.language.replace(/(\-.*)/g, ''),
    fallbackLng: 'en',
    resources
});
```

### Usage

```javascript
import { t } from 'i18next';

const translated = t('key.path', { count: 5 });
// Returns: "5 items" or translated string
```

### Available Languages

See `resources/` directory for complete list including:
- en (English)
- de (German)
- es (Spanish)
- fr (French)
- it (Italian)
- pt-BR (Portuguese - Brazil)
- ru (Russian)
- tr (Turkish)
- uk (Ukrainian)
- vi (Vietnamese)
- And many more...

---

## Service Component

### Location
`/home/akshay/TizenTube/service/service.js`

### What it does:
- Implements DIAL (Discovery and Launch) protocol
- Enables "Launch via TV" feature from phone apps
- Uses Express.js + @patrickkfkan/peer-dial

### Key variables:
```javascript
const PORT = 8085;
const apps = {
    "YouTube": {
        name: "YouTube",
        state: "stopped",
        allowStop: true,
        pid: null,
        additionalData: {},
        launch(launchData) {
            // Uses Tizen Application Control to launch YouTube
            tizen.application.launchAppControl(
                new tizen.ApplicationControl(
                    "http://tizen.org/appcontrol/operation/view",
                    null, null, null,
                    [new tizen.ApplicationControlData("module", [...])]
                ), `${tbPackageId}.TizenBrewStandalone`);
        }
    }
};
```

### DIAL Protocol

The DIAL (Discovery and Launch) protocol allows:
1. Phone apps to discover YouTube on the TV
2. Launch YouTube with specific content
3. Pass launch data (video URL, etc.)

**Endpoint:** `http://<tv-ip>:8085/dial`

---

## Utility Files

### 1. AST Parser

**Location:** `/home/akshay/TizenTube/mods/utils/ASTParser.js`

**Purpose:** Parses JavaScript code to find function assignments

**Usage:**
```javascript
import { extractAssignedFunctions } from './utils/ASTParser.js';

const code = `
    this.someButton = function() { return button; }
    this.actionGroup = function() { return actions; }
`;

const functions = extractAssignedFunctions(code);
// Returns: [{ left: 'this.someButton', rhs: 'function()...', returned: 'button' }, ...]
```

**How it works:**
1. Uses `esprima` to parse code into AST
2. Uses `estraverse` to traverse and find assignments
3. Extracts left-hand side (variable name) and right-hand side (function)
4. Returns array of function objects

---

### 2. SHA-256

**Location:** `/home/akshay/TizenTube/mods/tiny-sha256.js`

**Purpose:** Minimal SHA-256 implementation for SponsorBlock segment UUIDs

**Usage:**
```javascript
import sha256 from './tiny-sha256.js';

const hash = sha256('input string');
// Returns: hex string
```

---

### 3. DOMRect Polyfill

**Location:** `/home/akshay/TizenTube/mods/domrect-polyfill.js`

**Purpose:** Provides DOMRect constructor for older browsers

**Usage:**
```javascript
// Automatically defines window.DOMRect if not present
const rect = new DOMRect(0, 0, 100, 50);
```

---

### 4. Spatial Navigation Polyfill

**Location:** `/home/akshay/TizenTube/mods/spatial-navigation-polyfill.js`

**Purpose:** Implements W3C spatial navigation API for TV remotes

**Key APIs:**
- `window.navigate(direction)` - Navigate in direction
- `element.spatialNavigationSearch(dir, options)` - Find next focusable element
- `element.focusableAreas(options)` - Get focusable elements
- `element.getSpatialNavigationContainer()` - Get container

**How it works:**
1. Detects if native spatial navigation is available
2. If not, implements polyfill with arrow key handling
3. Uses directional logic to find best focusable candidate

---

## Key Global Variables

The following global variables are used throughout the codebase:

| Variable | Type | Description |
|----------|------|-------------|
| `window._yttv` | object | YouTube TV app instances (keyed by instance ID) |
| `window.sponsorblock` | SponsorBlockHandler | Current segment handler |
| `window.isPipPlaying` | boolean | PiP mode state |
| `window.queuedVideos` | object | Video queue { videos: [], lastVideoId: null } |
| `window.preferredVideoQualityHandler` | PreferredQualityHandler | Quality handler instance |
| `window.h5vcc` | object | Tizen native API |
| `window.h5vcc.tizentube` | object | TizenTube native API |

### h5vcc.tizentube API

When running on TizenTube Cobalt:

```javascript
window.h5vcc.tizentube.GetVersion();       // Get app version string
window.h5vcc.tizentube.GetArchitecture(); // 'arm64-v8a' or 'armeabi-v7a'
window.h5vcc.tizentube.SetFrameRate(fps); // Set display refresh rate
window.h5vcc.tizentube.SetUserAgent(ua);  // Set custom User Agent
window.h5vcc.tizentube.InstallAppFromURL(url); // Download and install update
```

### window._yttv Structure

```javascript
// Example structure of window._yttv
{
    'instance-uuid-1': {
        instance: YouTubeInstance,  // Has resolveCommand, JSON, etc.
        getInstance: Function      // Returns the instance
    },
    'instance-uuid-2': { ... }
}
```

---

## Build System

### Mods Build

**Command:**
```bash
cd mods && npm run build
```

**Config:** `/home/akshay/TizenTube/mods/rollup.config.js`

**Output:** `dist/userScript.js`

**Plugins used:**
- `string` - Import CSS files as strings
- `nodeResolve` - Resolve node_modules
- `commonjs` - Convert CommonJS to ES modules
- `@babel/preset-env` - Transpile to Chrome 47
- `terser` - Minify output
- `replace` - Replace Unicode characters

### Service Build

**Command:**
```bash
cd service && npm run build
```

**Config:** `/home/akshay/TizenTube/service/rollup.config.js`

**Output:** `dist/service.js`

**Custom plugin:** `injectXmlContent` - Inlines DIAL XML templates

---

## Key Patterns

### 1. Finding YouTube Instance

```javascript
// Find the YouTube TV instance
for (const key in window._yttv) {
    if (window._yttv[key] && window._yttv[key].instance) {
        const instance = window._yttv[key].instance;
        // Use instance.resolveCommand, instance.JSON.parse, etc.
    }
}

// Find specific instance with method
const yttvInstance = Object.values(window._yttv).find(
    obj => obj && obj.instance && typeof obj.instance.resolveCommand === "function"
);
```

### 2. Polling for Element

```javascript
// Poll until element exists
const interval = setInterval(() => {
    const element = document.querySelector('video');
    if (element) {
        doSomething(element);
        clearInterval(interval);
    }
}, 250);

// Alternative with timeout
setTimeout(pollFunction, 250); // calls itself recursively
```

### 3. Patching JSON.parse

```javascript
// Save original
const origParse = JSON.parse;

// Override
JSON.parse = function() {
    const result = origParse.apply(this, arguments);
    // Modify result
    return result;
};

// Patch YouTube's copy too
for (const key in window._yttv) {
    if (window._yttv[key]?.instance) {
        window._yttv[key].instance.JSON.parse = JSON.parse;
    }
}
```

### 4. Creating Toast

```javascript
resolveCommand({
    openPopupAction: {
        popupType: 'TOAST',
        popup: {
            overlayToastRenderer: {
                title: { simpleText: 'Title' },
                subtitle: { simpleText: 'Subtitle' }
            }
        }
    }
});
```

### 5. Creating Modal

```javascript
resolveCommand({
    openPopupAction: {
        popupType: 'MODAL',
        popup: {
            overlaySectionRenderer: {
                overlay: {
                    overlayTwoPanelRenderer: {
                        actionPanel: {
                            overlayPanelRenderer: {
                                header: {
                                    overlayPanelHeaderRenderer: {
                                        title: { simpleText: 'Title' }
                                    }
                                },
                                content: {
                                    overlayPanelItemListRenderer: {
                                        items: [...]
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        uniqueId: 'modal-id'
    }
});
```

### 6. Listening for Config Changes

```javascript
configChangeEmitter.addEventListener('configChange', (event) => {
    const { key, value } = event.detail;
    if (key === 'someSetting') {
        applySetting(value);
    }
});
```

---

## Common Issues & Solutions

### 1. Feature not working

**Check:**
- Is feature enabled in config?
- Are `configRead()` values correct?
- Check browser console for errors

### 2. UI not showing

**Ensure:**
- Wait for DOM ready: `document.readyState === 'complete'`
- Wait for video element: `document.querySelector('video')`
- Wait for YouTube app: `window._yttv` exists

### 3. Command not executing

**Verify:**
- Use `resolveCommand(cmd)` not direct call
- Check command structure matches YouTube API
- Look for typos in `uniqueId`

### 4. Build failing

**Try:**
```bash
cd mods
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

## Testing Commands

Since TizenTube runs in YouTube TV app, testing requires:

1. **Build the module:**
```bash
cd mods && npm run build
```

2. **Deploy to Tizen device** (via TizenBrew)

3. **Check console logs** in app

4. **Hard reload** YouTube TV:
```javascript
resolveCommand({ signalAction: { signal: 'SOFT_RELOAD_PAGE' } });
```

---

## File Dependencies

Import order matters in `userScript.js`:

1. userAgentSpoofing.js (runs first, triggers reload)
2. Translations (i18next)
3. DOM rect polyfill
4. Ad blocking
5. SponsorBlock
6. UI (ui.js, speedUI.js, theme.js, settings.js)
7. More subtitles
8. Updater
9. Picture-in-Picture
10. Preferred video quality
11. Video queuing
12. Enable features
13. Custom UI
14. Guide action
15. Auto frame rate

---

## References

- [SponsorBlock API](https://sponsor.ajay.app/api)
- [DeArrow API](https://dearrow.ajay.app/)
- [YouTube TV Web](https://youtube.com/tv)
- [TizenBrew](https://github.com/reisxd/TizenBrew)
- [W3C Spatial Navigation](https://drafts.csswg.org/css-nav-1/)
- [DIAL Protocol](https://www.dial-protocol.org/)
- [i18next](https://www.i18next.com/)
- [esprima](https://esprima.org/)
- [estraverse](https://github.com/estools/estraverse)