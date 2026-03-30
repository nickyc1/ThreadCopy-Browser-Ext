# Thread Copier - Chrome Extension

A simple Chrome extension that lets you copy entire threads from **X (Twitter)**, **LinkedIn**, and **Reddit** with one click.

## Features

- **One-click copy** - Floating button appears on thread/post pages
- **Plain text format** - Ready to paste into LLMs, notes, or documents
- **Includes metadata** - Author names, handles, timestamps, and image links
- **Smart detection** - Button only shows on actual thread/post pages
- **Works with SPAs** - Handles dynamic navigation on all platforms

## Supported Platforms

| Platform | What's Copied |
|----------|---------------|
| X (Twitter) | Full thread with all replies, author info, timestamps, images |
| LinkedIn | Posts with comments, author details, timestamps |
| Reddit | Original post + all comments, usernames, timestamps |

## Installation

### Method 1: Load Unpacked (Developer Mode)

1. **Download the extension folder** - Get the `/extension` folder from this repository

2. **Open Chrome Extensions**
   - Go to `chrome://extensions/` in your browser
   - Or: Menu → More Tools → Extensions

3. **Enable Developer Mode**
   - Toggle the "Developer mode" switch in the top-right corner

4. **Load the extension**
   - Click "Load unpacked"
   - Select the `extension` folder
   - The extension icon should appear in your toolbar

5. **Pin the extension** (optional)
   - Click the puzzle piece icon in Chrome toolbar
   - Click the pin icon next to "Thread Copier"

## How to Use

1. **Navigate to a thread** on X, LinkedIn, or Reddit
2. **Look for the floating button** in the bottom-right corner
3. **Click "Copy Thread"**
4. **Paste anywhere** - The content is now in your clipboard!

### Example Output

```
=== Thread from X (Twitter) ===
URL: https://x.com/user/status/123456789
Copied on: 1/15/2024, 3:45:00 PM
========================================

[ORIGINAL POST]
Author: John Doe (@johndoe)
Time: 1/15/2024, 2:30:00 PM
---
This is the start of an amazing thread about AI...

Images:
  1. https://pbs.twimg.com/media/...

────────────────────────────────────────

[Reply 1]
Author: Jane Smith (@janesmith)
Time: 1/15/2024, 2:45:00 PM
---
Great thread! Here's my take...

────────────────────────────────────────
```

## Permissions

The extension requires minimal permissions:

- **activeTab** - Access the current tab to read thread content
- **clipboardWrite** - Write copied content to clipboard

No data is sent anywhere - everything happens locally in your browser.

## Troubleshooting

### Button not appearing?
- Make sure you're on an actual thread/post page (not a feed or homepage)
- Try refreshing the page
- Check if the extension is enabled in `chrome://extensions/`

### Copy not working?
- Try clicking the button again
- Some dynamic content may need the page to fully load first
- For very long threads, scroll down to load all content first

### LinkedIn issues?
- LinkedIn frequently changes their DOM structure
- If copying fails, try refreshing the page

## Development

### File Structure

```
extension/
├── manifest.json      # Extension configuration
├── content.js         # Main script (runs on target sites)
├── styles.css         # Button and toast styles
├── popup.html         # Extension popup UI
└── icons/             # Extension icons
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

### Testing Locally

1. Make changes to the code
2. Go to `chrome://extensions/`
3. Click the refresh icon on the Thread Copier card
4. Navigate to a test page and verify changes

## License

MIT License - feel free to modify and distribute.

---

**Enjoy copying threads!** 🧵
