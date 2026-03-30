# Thread Copier

A Chrome browser extension that lets you copy entire threads from **X (Twitter)**, **LinkedIn**, and **Reddit** with a single click. Perfect for saving discussions, feeding content to LLMs, or archiving conversations.

---

## Why This Exists

Social media threads are increasingly valuable sources of information—especially in AI, tech, and professional communities. But copying them is painful:

- **Manual copying is tedious**: Long threads require scrolling and copy-pasting dozens of posts
- **LLMs can't read links**: Most AI assistants can't access Twitter/X, LinkedIn, or Reddit URLs directly
- **Context gets lost**: Copy-pasting individual posts loses author attribution, timestamps, and thread structure

**Thread Copier solves this** by extracting the entire thread with one click, formatted as clean plain text that's ready to paste anywhere.

---

## Features

| Feature | Description |
|---------|-------------|
| **One-Click Copy** | Floating button appears on thread pages—click to copy everything |
| **Smart Detection** | Button only shows on actual threads/posts, not feeds or homepages |
| **Full Metadata** | Captures author names, handles, timestamps, and image URLs |
| **Plain Text Output** | Clean formatting that works in any text editor, notes app, or LLM |
| **SPA Support** | Works with dynamic navigation (no page refresh needed) |
| **Minimal Permissions** | Only requests `activeTab` and `clipboardWrite`—no data sent anywhere |

---

## Supported Platforms

### X (Twitter)
- Full thread extraction including all replies
- Author display names and @handles
- Timestamps (converted to local time)
- Image URLs and video thumbnail links
- **URL Pattern**: `x.com/*/status/*` or `twitter.com/*/status/*`

### LinkedIn
- Post content with author details
- All visible comments
- Timestamps and professional titles
- Image attachments
- **URL Pattern**: `linkedin.com/feed/update/*`, `linkedin.com/posts/*`, `linkedin.com/pulse/*`

### Reddit
- Original post (title + body)
- All visible comments with usernames
- Works with both new Reddit and old.reddit.com
- Image and media links
- **URL Pattern**: `reddit.com/r/*/comments/*`

---

## Installation

### Method 1: Load Unpacked (Developer Mode)

1. **Download or clone this repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/thread-copier.git
   ```

2. **Open Chrome Extensions**
   - Navigate to `chrome://extensions/`
   - Or: Menu (⋮) → More Tools → Extensions

3. **Enable Developer Mode**
   - Toggle the "Developer mode" switch in the top-right corner

4. **Load the Extension**
   - Click "Load unpacked"
   - Select the `extension` folder from this repository

5. **Pin the Extension** (Optional)
   - Click the puzzle piece icon in Chrome's toolbar
   - Click the pin icon next to "Thread Copier"

### Method 2: Chrome Web Store
*(Coming soon—pending publication)*

---

## How to Use

1. **Navigate to a thread** on X, LinkedIn, or Reddit
2. **Wait for the button** to appear in the bottom-right corner (takes ~1.5 seconds)
3. **Click "Copy Thread"**
4. **Paste anywhere**—the formatted content is now in your clipboard!

### Example Output

```
=== Thread from X (Twitter) ===
URL: https://x.com/elonmusk/status/1234567890
Copied on: 1/15/2026, 3:45:00 PM
========================================

[ORIGINAL POST]
Author: Elon Musk (@elonmusk)
Time: 1/15/2026, 2:30:00 PM
---
This is an example thread about technology and innovation...

Images:
  1. https://pbs.twimg.com/media/example.jpg

────────────────────────────────────────

[Reply 1]
Author: Tech Enthusiast (@techfan)
Time: 1/15/2026, 2:45:00 PM
---
Great insights! Here's my perspective...

────────────────────────────────────────

[Reply 2]
Author: AI Researcher (@airesearcher)
Time: 1/15/2026, 3:00:00 PM
---
Building on this thread, I'd add that...

────────────────────────────────────────
```

---

## Technical Architecture

### File Structure

```
extension/
├── manifest.json      # Chrome Manifest V3 configuration
├── content.js         # Main content script (runs on target sites)
├── styles.css         # Button and toast notification styles
├── popup.html         # Extension popup with instructions
├── README.md          # This file
└── icons/
    ├── icon16.png     # Toolbar icon
    ├── icon48.png     # Extensions page icon
    └── icon128.png    # Chrome Web Store icon
```

### How It Works

1. **Content Script Injection**: When you visit a supported site, `content.js` is injected into the page
2. **Page Detection**: The script checks if you're on a thread/post page using URL pattern matching
3. **Button Creation**: If on a thread page, a floating button is added to the DOM
4. **Content Extraction**: When clicked, platform-specific extractors parse the page DOM
5. **Clipboard Copy**: Extracted content is formatted and copied using the Clipboard API

### Platform-Specific Selectors

| Platform | Key Selectors |
|----------|---------------|
| Twitter/X | `article[data-testid="tweet"]`, `[data-testid="tweetText"]`, `[data-testid="User-Name"]` |
| LinkedIn | `.feed-shared-update-v2__description`, `.comments-comment-item`, `.update-components-actor__name` |
| Reddit | `shreddit-comment`, `[data-testid="post-content"]`, `.RichTextJSON-root`, `.comment` (old Reddit) |

### Permissions Explained

| Permission | Why It's Needed |
|------------|-----------------|
| `activeTab` | Access the current tab's content to extract thread data |
| `clipboardWrite` | Write the formatted thread to your clipboard |

**No data is collected or transmitted.** Everything happens locally in your browser.

---

## Troubleshooting

### Button not appearing?

- **Check the URL**: Make sure you're on an actual thread page, not a feed or profile
  - ✅ `x.com/user/status/123456789`
  - ❌ `x.com/home` or `x.com/user`
- **Refresh the page**: Sometimes dynamic content needs a reload
- **Check extension status**: Go to `chrome://extensions/` and ensure Thread Copier is enabled

### Copy not working?

- **Scroll to load content**: For long threads, scroll down to load all replies first
- **Try again**: Click the button a second time
- **Check browser permissions**: Some browsers block clipboard access—try allowing it

### LinkedIn showing limited content?

- LinkedIn aggressively hides comments behind "Load more" buttons
- Expand all comments before clicking Copy Thread
- LinkedIn frequently changes their DOM structure—if extraction stops working, please open an issue

### Reddit comments not capturing?

- Reddit uses multiple frontend versions (new Reddit, old Reddit, mobile web)
- The extension supports both new and old Reddit
- For best results, use the desktop site

---

## Development

### Local Development

1. Clone the repository
2. Make changes to the source files
3. Go to `chrome://extensions/`
4. Click the refresh icon on the Thread Copier card
5. Test your changes on a thread page

### Building for Production

No build step required! The extension uses vanilla JavaScript and can be loaded directly.

### Testing Checklist

- [ ] Twitter/X: Single tweet, thread with replies, tweet with images/video
- [ ] LinkedIn: Post with comments, article (Pulse), post with images
- [ ] Reddit: Text post, image post, post with many comments, old.reddit.com

---

## Roadmap

- [ ] **Keyboard shortcut** (Ctrl+Shift+C) for power users
- [ ] **Markdown format** option for richer output
- [ ] **Firefox support** via WebExtension APIs
- [ ] **Settings panel** to customize output format
- [ ] **Thread summarization** using AI (optional)
- [ ] **Export to file** (.txt, .md) instead of clipboard

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## Privacy

**Thread Copier does not collect, store, or transmit any data.**

- All processing happens locally in your browser
- No analytics or tracking
- No external API calls
- No user accounts or authentication
- Clipboard data stays on your device

---

## License

MIT License - feel free to modify and distribute.

---

## Acknowledgments

- Built with vanilla JavaScript (no frameworks or dependencies)
- Icons created with SVG
- Inspired by the need to feed social media threads to LLMs

---

**Questions or issues?** Open a GitHub issue and I'll help you out!
