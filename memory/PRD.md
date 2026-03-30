# Thread Copier - Chrome Browser Extension PRD

## Original Problem Statement
Build a simple browser extension that can copy an entire thread on X, LinkedIn, or Reddit. When looking at threads (especially AI and cloud code discussions), users have to manually copy content across. Many LLMs can't use links to read entire threads.

## User Choices
- **Browser**: Chrome
- **Copy Format**: Plain text
- **Button Visibility**: Only on thread/post pages (not homepage/feed)
- **Metadata**: Include author names, handles, timestamps, and images as links

## Core Requirements
1. Floating "Copy Thread" button on supported sites
2. Smart page detection (only show on actual threads)
3. Extract full thread content including all replies/comments
4. Include author metadata and timestamps
5. Copy images as URL links
6. Plain text output for LLM compatibility

## Architecture
- **Manifest V3** Chrome extension
- **Content Script**: Runs on X, LinkedIn, Reddit
- **No Backend Required**: All processing happens client-side
- **Permissions**: activeTab, clipboardWrite (minimal)

## What's Been Implemented (Jan 2026)
- [x] manifest.json - Chrome Manifest V3 config
- [x] content.js - Main extraction logic for all 3 platforms
- [x] styles.css - Floating button and toast styling
- [x] popup.html - Extension popup with instructions
- [x] icons/ - Extension icons (16, 48, 128px)
- [x] README.md - Installation and usage instructions

## Platform-Specific Extractors
| Platform | Selector Strategy | Content Extracted |
|----------|-------------------|-------------------|
| X/Twitter | data-testid attributes | Tweet text, author, time, images/video |
| LinkedIn | class-based selectors | Post content, comments, author info |
| Reddit | data-testid + shreddit tags | Post title, body, comments, authors |

## Next Action Items
- P0: User testing on live sites
- P1: Add keyboard shortcut (Ctrl+Shift+C)
- P2: Add Markdown format option
- P3: Firefox support
