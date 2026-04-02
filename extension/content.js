// ThreadCopy - Content Script
// Supports X (Twitter), LinkedIn, and Reddit

(function() {
  'use strict';

  // Detect current platform
  function detectPlatform() {
    const hostname = window.location.hostname;
    if (hostname.includes('twitter.com') || hostname.includes('x.com')) {
      return 'twitter';
    } else if (hostname.includes('linkedin.com')) {
      return 'linkedin';
    } else if (hostname.includes('reddit.com')) {
      return 'reddit';
    }
    return null;
  }

  // Check if we're on a thread/post page
  function isThreadPage() {
    const platform = detectPlatform();
    const path = window.location.pathname;

    switch (platform) {
      case 'twitter':
        // Twitter/X thread: /username/status/id
        return /^\/[^/]+\/status\/\d+/.test(path);
      
      case 'linkedin':
        // LinkedIn post: /feed/update/ or /posts/ or /activity/
        return path.includes('/feed/update/') ||
               path.includes('/posts/') ||
               path.includes('/pulse/') ||
               path.includes('/activity/');
      
      case 'reddit':
        // Reddit thread: /r/subreddit/comments/
        return path.includes('/comments/');
      
      default:
        return false;
    }
  }

  // Check if current X page is an article (not a regular tweet/thread)
  function isTwitterArticle() {
    return !!document.querySelector('[data-testid="TextColumn"], article [role="article"], [data-testid="article"]') ||
           document.title.toLowerCase().includes('article');
  }

  // Auto-scroll to load all lazy-loaded content (Twitter threads only)
  async function scrollToLoadAll(platform) {
    if (platform !== 'twitter') return;

    // Don't auto-scroll for articles or single tweets
    if (isTwitterArticle()) return;

    const getCount = () => document.querySelectorAll('article[data-testid="tweet"]').length;
    const initialCount = getCount();

    // Only scroll if this looks like a multi-tweet thread (more than 1 tweet visible)
    if (initialCount <= 1) return;

    let prevCount = initialCount;
    let stableRounds = 0;
    const maxScrolls = 30;

    for (let i = 0; i < maxScrolls; i++) {
      window.scrollTo(0, document.body.scrollHeight);
      await new Promise(r => setTimeout(r, 800));

      const newCount = getCount();
      if (newCount === prevCount) {
        stableRounds++;
        if (stableRounds >= 2) break;
      } else {
        stableRounds = 0;
      }
      prevCount = newCount;
    }

    // Scroll back to top
    window.scrollTo(0, 0);
    await new Promise(r => setTimeout(r, 300));
  }

  // Auto-expand truncated content before extraction
  async function expandAllContent(platform) {
    let buttons = [];

    if (platform === 'twitter') {
      // Only click the "Show more" links inside tweet text areas
      buttons = document.querySelectorAll('[data-testid="tweet-text-show-more-link"]');
      // Also find "Show more" text inside tweet text containers only
      document.querySelectorAll('[data-testid="tweetText"] + div [role="button"], [data-testid="tweetText"] [role="link"]').forEach(btn => {
        const text = btn.textContent.trim().toLowerCase();
        if (text === 'show more') {
          buttons = [...buttons, btn];
        }
      });
    } else if (platform === 'linkedin') {
      // Only click "see more" toggles within post/comment text areas
      buttons = document.querySelectorAll(
        'button.feed-shared-inline-show-more-text, ' +
        '.see-more-less-toggle, ' +
        '.feed-shared-text-view__see-more-less-toggle'
      );
      // Find by text content but only inside text containers, not reaction/engagement areas
      document.querySelectorAll('.feed-shared-update-v2__description button, .feed-shared-text-view button, .comments-comment-item button').forEach(btn => {
        const text = btn.textContent.trim().toLowerCase();
        if (text === '…see more' || text === '…more' || text === 'see more') {
          buttons = [...buttons, btn];
        }
      });
    }

    if (buttons.length > 0) {
      buttons.forEach(btn => {
        try { btn.click(); } catch(e) {}
      });
      // Wait for content to expand
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  // Extract thread content from Twitter/X
  function extractTwitterThread() {
    const tweets = [];
    const tweetElements = document.querySelectorAll('article[data-testid="tweet"]');

    tweetElements.forEach((tweet, index) => {
      try {
        // Get author info
        const userNameEl = tweet.querySelector('[data-testid="User-Name"]');
        let authorName = '';
        let authorHandle = '';
        
        if (userNameEl) {
          const nameSpan = userNameEl.querySelector('span');
          const handleLink = userNameEl.querySelector('a[href^="/"]');
          authorName = nameSpan ? nameSpan.textContent.trim() : '';
          authorHandle = handleLink ? handleLink.textContent.trim() : '';
        }

        // Get timestamp
        const timeEl = tweet.querySelector('time');
        const timestamp = timeEl ? timeEl.getAttribute('datetime') : '';
        const formattedTime = timestamp ? new Date(timestamp).toLocaleString() : '';

        // Get tweet text
        const textEl = tweet.querySelector('[data-testid="tweetText"]');
        const text = textEl ? textEl.textContent.trim() : '';

        // Get images
        const images = [];
        const imgElements = tweet.querySelectorAll('[data-testid="tweetPhoto"] img');
        imgElements.forEach(img => {
          if (img.src && !img.src.includes('emoji')) {
            images.push(img.src);
          }
        });

        // Get video thumbnails
        const videoElements = tweet.querySelectorAll('[data-testid="videoPlayer"] video');
        videoElements.forEach(video => {
          if (video.poster) {
            images.push('[Video] ' + video.poster);
          }
        });

        if (text || images.length > 0) {
          tweets.push({
            index: index + 1,
            authorName,
            authorHandle,
            timestamp: formattedTime,
            text,
            images
          });
        }
      } catch (e) {
        console.error('Error extracting tweet:', e);
      }
    });

    return tweets;
  }

  // Extract article content from Twitter/X
  function extractTwitterArticle() {
    const posts = [];

    // Get author info from the tweet that contains the article
    const tweetEl = document.querySelector('article[data-testid="tweet"]');
    let authorName = '';
    let authorHandle = '';
    let formattedTime = '';

    if (tweetEl) {
      const userNameEl = tweetEl.querySelector('[data-testid="User-Name"]');
      if (userNameEl) {
        const nameSpan = userNameEl.querySelector('span');
        const handleLink = userNameEl.querySelector('a[href^="/"]');
        authorName = nameSpan ? nameSpan.textContent.trim() : '';
        authorHandle = handleLink ? handleLink.textContent.trim() : '';
      }
      const timeEl = tweetEl.querySelector('time');
      const timestamp = timeEl ? timeEl.getAttribute('datetime') : '';
      formattedTime = timestamp ? new Date(timestamp).toLocaleString() : '';
    }

    // Extract article body text - try multiple selectors
    let articleText = '';
    const articleSelectors = [
      '[data-testid="TextColumn"]',
      'article [role="article"]',
      '[data-testid="article"]',
      'article .css-175oi2r [lang]',
    ];

    for (const sel of articleSelectors) {
      const el = document.querySelector(sel);
      if (el && el.textContent.trim().length > 100) {
        articleText = el.textContent.trim();
        break;
      }
    }

    // Fallback: grab all paragraph-like elements inside the main tweet area
    if (!articleText) {
      const paragraphs = [];
      // Look for the article content area (usually has long text blocks)
      document.querySelectorAll('article [data-testid="tweetText"], article [lang] span, article p').forEach(el => {
        const text = el.textContent.trim();
        if (text.length > 50 && !paragraphs.includes(text)) {
          paragraphs.push(text);
        }
      });
      articleText = paragraphs.join('\n\n');
    }

    // Get article title if present
    const titleEl = document.querySelector('article h1, article h2, [data-testid="TextColumn"] h1');
    const title = titleEl ? titleEl.textContent.trim() : '';

    // Get images
    const images = [];
    document.querySelectorAll('article img').forEach(img => {
      if (img.src && !img.src.includes('emoji') && !img.src.includes('profile') &&
          !img.src.includes('avatar') && img.naturalWidth > 100) {
        images.push(img.src);
      }
    });

    const fullText = title ? title + '\n\n' + articleText : articleText;

    if (fullText) {
      posts.push({
        index: 1,
        authorName,
        authorHandle,
        timestamp: formattedTime,
        text: fullText,
        images,
        isMainPost: true
      });
    }

    return posts;
  }

  // Extract thread content from LinkedIn
  function extractLinkedInThread() {
    const posts = [];

    // Helper: find first matching element from multiple selectors
    function q(selectors, parent = document) {
      for (const sel of selectors) {
        const el = parent.querySelector(sel);
        if (el) return el;
      }
      return null;
    }

    // Main post - try multiple selector patterns (LinkedIn changes these frequently)
    const mainPostSelectors = [
      '.feed-shared-update-v2__description',
      '.feed-shared-update-v2__commentary',
      '.feed-shared-text-view',
      '.feed-shared-inline-show-more-text',
      '.update-components-text',
      '[data-ad-preview="message"]',
      '.break-words',
    ];

    const authorSelectors = [
      '.update-components-actor__name',
      '.feed-shared-actor__name',
      'a.app-aware-link span[aria-hidden="true"]',
      '.update-components-actor__title',
    ];

    const handleSelectors = [
      '.update-components-actor__supplementary-actor-info',
      '.update-components-actor__description',
      '.feed-shared-actor__description',
      '.update-components-actor__subtitle',
    ];

    const timeSelectors = [
      '.update-components-actor__sub-description',
      '.feed-shared-actor__sub-description',
      'time',
      'span.update-components-actor__sub-description-link',
    ];

    const mainPost = q(mainPostSelectors);
    const mainAuthor = q(authorSelectors);
    const mainHandle = q(handleSelectors);
    const mainTime = q(timeSelectors);

    if (mainPost) {
      const images = [];
      const imgElements = document.querySelectorAll(
        '.feed-shared-image__image, ' +
        '.update-components-image img, ' +
        '.feed-shared-update-v2__content img, ' +
        '.update-components-linkedin-video__container video'
      );
      imgElements.forEach(img => {
        if (img.src && !img.src.includes('avatar') && !img.src.includes('profile')) {
          images.push(img.src || img.poster);
        }
      });

      posts.push({
        index: 1,
        authorName: mainAuthor ? mainAuthor.textContent.trim().split('\n')[0].trim() : '',
        authorHandle: mainHandle ? mainHandle.textContent.trim() : '',
        timestamp: mainTime ? mainTime.textContent.trim() : '',
        text: mainPost.textContent.trim(),
        images,
        isMainPost: true
      });
    }

    // Fallback: if no main post found, try grabbing all visible text from the post container
    if (posts.length === 0) {
      const postContainer = q([
        '.scaffold-finite-scroll__content',
        '.detail-page',
        'main .feed-shared-update-v2',
        'main [data-urn]',
        'main article',
      ]);

      if (postContainer) {
        // Get the largest text block as the post content
        const allText = postContainer.querySelectorAll('span.break-words, span[dir="ltr"], div[dir="ltr"]');
        let longestText = '';
        allText.forEach(el => {
          const text = el.textContent.trim();
          if (text.length > longestText.length) {
            longestText = text;
          }
        });

        if (longestText) {
          posts.push({
            index: 1,
            authorName: '',
            authorHandle: '',
            timestamp: '',
            text: longestText,
            images: [],
            isMainPost: true
          });
        }
      }
    }

    // Comments - try multiple selector patterns
    const commentSelectors = [
      '.comments-comment-item',
      '.comments-comment-entity',
      'article.comments-comment-item',
      '[data-id][class*="comment"]',
    ];

    let comments = [];
    for (const sel of commentSelectors) {
      comments = document.querySelectorAll(sel);
      if (comments.length > 0) break;
    }

    comments.forEach((comment, index) => {
      try {
        const authorEl = q([
          '.comments-post-meta__name-text',
          '.comments-comment-item__post-meta .hoverable-link-text',
          'a[data-tracking-control-name*="comment"] span[aria-hidden="true"]',
          '.comment-entity-header__name',
        ], comment);

        const textEl = q([
          '.comments-comment-item__main-content',
          '.comments-comment-texteditor',
          '.update-components-text',
          'span.break-words',
          'span[dir="ltr"]',
        ], comment);

        const timeEl = q([
          '.comments-comment-item__timestamp',
          'time',
          '.comment-entity-header__timestamp',
        ], comment);

        if (textEl) {
          posts.push({
            index: index + 2,
            authorName: authorEl ? authorEl.textContent.trim().split('\n')[0].trim() : '',
            authorHandle: '',
            timestamp: timeEl ? timeEl.textContent.trim() : '',
            text: textEl.textContent.trim(),
            images: []
          });
        }
      } catch (e) {
        console.error('Error extracting LinkedIn comment:', e);
      }
    });

    return posts;
  }

  // Extract thread content from Reddit
  function extractRedditThread() {
    const posts = [];
    
    // Try new Reddit first
    let mainPost = document.querySelector('[data-test-id="post-content"]') || 
                   document.querySelector('.Post') ||
                   document.querySelector('[data-testid="post-container"]') ||
                   document.querySelector('shreddit-post');

    // Get main post
    const titleEl = document.querySelector('[data-testid="post-title"]') ||
                    document.querySelector('h1') ||
                    document.querySelector('.Post h1');
    
    const postTextEl = document.querySelector('[data-testid="post-text-content"]') ||
                       document.querySelector('.RichTextJSON-root') ||
                       document.querySelector('[slot="text-body"]') ||
                       document.querySelector('.Post .md');

    const authorEl = document.querySelector('[data-testid="post_author_link"]') ||
                     document.querySelector('.Post a[href^="/user/"]') ||
                     document.querySelector('a[href*="/user/"]');

    const timestampEl = document.querySelector('[data-testid="post_timestamp"]') ||
                        document.querySelector('time') ||
                        document.querySelector('.Post time');

    const title = titleEl ? titleEl.textContent.trim() : '';
    const postText = postTextEl ? postTextEl.textContent.trim() : '';
    const author = authorEl ? authorEl.textContent.trim() : '';
    const timestamp = timestampEl ? timestampEl.textContent.trim() : '';

    // Get post images
    const postImages = [];
    const postImgElements = document.querySelectorAll('[data-testid="post-media"] img, .Post img:not([alt=""])');
    postImgElements.forEach(img => {
      if (img.src && !img.src.includes('icon') && !img.src.includes('avatar')) {
        postImages.push(img.src);
      }
    });

    if (title || postText) {
      posts.push({
        index: 1,
        authorName: author,
        authorHandle: author ? `u/${author.replace('u/', '')}` : '',
        timestamp,
        text: title + (postText ? '\n\n' + postText : ''),
        images: postImages,
        isMainPost: true
      });
    }

    // Get comments - new Reddit
    const commentElements = document.querySelectorAll('[data-testid="comment"], shreddit-comment, .Comment');
    
    commentElements.forEach((comment, index) => {
      try {
        // New Reddit structure
        let commentAuthor = comment.querySelector('[data-testid="comment_author_link"]') ||
                           comment.querySelector('a[href^="/user/"]');
        let commentText = comment.querySelector('[data-testid="comment"] p') ||
                         comment.querySelector('.RichTextJSON-root') ||
                         comment.querySelector('.md');
        let commentTime = comment.querySelector('time') ||
                         comment.querySelector('[data-testid="comment_timestamp"]');

        // Shreddit structure
        if (!commentText && comment.tagName === 'SHREDDIT-COMMENT') {
          commentAuthor = comment.getAttribute('author');
          commentText = comment.querySelector('[slot="comment"]');
          commentTime = comment.querySelector('time');
        }

        const authorText = typeof commentAuthor === 'string' ? commentAuthor : 
                          (commentAuthor ? commentAuthor.textContent.trim() : '');
        const textContent = commentText ? commentText.textContent.trim() : '';
        const timeText = commentTime ? commentTime.textContent.trim() : '';

        if (textContent) {
          posts.push({
            index: index + 2,
            authorName: authorText,
            authorHandle: authorText ? `u/${authorText.replace('u/', '')}` : '',
            timestamp: timeText,
            text: textContent,
            images: []
          });
        }
      } catch (e) {
        console.error('Error extracting Reddit comment:', e);
      }
    });

    // Fallback: Old Reddit
    if (posts.length <= 1) {
      const oldRedditComments = document.querySelectorAll('.comment');
      oldRedditComments.forEach((comment, index) => {
        try {
          const authorEl = comment.querySelector('.author');
          const textEl = comment.querySelector('.md');
          const timeEl = comment.querySelector('time');

          if (textEl) {
            posts.push({
              index: posts.length + 1,
              authorName: authorEl ? authorEl.textContent.trim() : '',
              authorHandle: authorEl ? `u/${authorEl.textContent.trim()}` : '',
              timestamp: timeEl ? timeEl.textContent.trim() : '',
              text: textEl.textContent.trim(),
              images: []
            });
          }
        } catch (e) {
          console.error('Error extracting old Reddit comment:', e);
        }
      });
    }

    return posts;
  }

  // Format posts to plain text
  function formatToPlainText(posts, platform) {
    if (posts.length === 0) {
      return null;
    }

    const platformName = {
      'twitter': 'X (Twitter)',
      'linkedin': 'LinkedIn',
      'reddit': 'Reddit'
    }[platform] || platform;

    let output = `=== Thread from ${platformName} ===\n`;
    output += `URL: ${window.location.href}\n`;
    output += `Copied on: ${new Date().toLocaleString()}\n`;
    output += `${'='.repeat(40)}\n\n`;

    posts.forEach((post, idx) => {
      // Header with author info
      let header = '';
      if (post.authorName || post.authorHandle) {
        header = post.authorName || '';
        if (post.authorHandle && post.authorHandle !== post.authorName) {
          header += header ? ` (${post.authorHandle})` : post.authorHandle;
        }
      }
      
      if (post.isMainPost) {
        output += `[ORIGINAL POST]\n`;
      } else if (idx > 0) {
        output += `[Reply ${idx}]\n`;
      }
      
      if (header) {
        output += `Author: ${header}\n`;
      }
      
      if (post.timestamp) {
        output += `Time: ${post.timestamp}\n`;
      }
      
      output += `---\n`;
      output += `${post.text}\n`;

      // Add images
      if (post.images && post.images.length > 0) {
        output += `\nImages:\n`;
        post.images.forEach((img, i) => {
          output += `  ${i + 1}. ${img}\n`;
        });
      }

      output += `\n${'─'.repeat(40)}\n\n`;
    });

    return output;
  }

  // Copy to clipboard
  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        document.body.removeChild(textArea);
        return true;
      } catch (e) {
        document.body.removeChild(textArea);
        return false;
      }
    }
  }

  // Show toast notification
  function showToast(message, isError = false) {
    let toast = document.getElementById('threadcopy-toast');
    
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'threadcopy-toast';
      document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.className = isError ? 'error' : '';
    
    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Hide after 3 seconds
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }

  // Create the floating copy button
  function createCopyButton() {
    // Remove existing button if any
    const existingBtn = document.getElementById('threadcopy-btn');
    if (existingBtn) {
      existingBtn.remove();
    }

    const existingToast = document.getElementById('threadcopy-toast');
    if (existingToast) {
      existingToast.remove();
    }

    // Only create button on thread pages
    if (!isThreadPage()) {
      return;
    }

    const button = document.createElement('button');
    button.id = 'threadcopy-btn';
    button.innerHTML = `
      <span class="icon">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
      </span>
      <span class="text">ThreadCopy</span>
    `;

    button.addEventListener('click', async () => {
      const platform = detectPlatform();
      let posts = [];

      // Scroll to load all lazy-loaded tweets, then expand truncated content
      await scrollToLoadAll(platform);
      await expandAllContent(platform);

      switch (platform) {
        case 'twitter':
          posts = isTwitterArticle() ? extractTwitterArticle() : extractTwitterThread();
          break;
        case 'linkedin':
          posts = extractLinkedInThread();
          break;
        case 'reddit':
          posts = extractRedditThread();
          break;
      }

      const formattedText = formatToPlainText(posts, platform);

      if (!formattedText) {
        showToast('No content found to copy', true);
        return;
      }

      const success = await copyToClipboard(formattedText);

      if (success) {
        button.classList.add('copied');
        button.querySelector('.text').textContent = 'Copied!';
        showToast(`Copied ${posts.length} post${posts.length > 1 ? 's' : ''} to clipboard`);
        
        setTimeout(() => {
          button.classList.remove('copied');
          button.querySelector('.text').textContent = 'ThreadCopy';
        }, 2000);
      } else {
        showToast('Failed to copy to clipboard', true);
      }
    });

    // --- Draggable behavior ---
    let isDragging = false;
    let dragStartY = 0;
    let btnStartY = 0;
    let hasMoved = false;

    // Restore saved position
    const savedY = localStorage.getItem('threadcopy-btn-y');
    if (savedY !== null) {
      button.style.top = savedY + 'px';
      button.style.transform = 'none';
    }

    button.addEventListener('mousedown', (e) => {
      isDragging = true;
      hasMoved = false;
      dragStartY = e.clientY;
      const rect = button.getBoundingClientRect();
      btnStartY = rect.top;
      button.style.transition = 'background 0.15s';
      e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const deltaY = e.clientY - dragStartY;
      if (Math.abs(deltaY) > 4) hasMoved = true;
      if (!hasMoved) return;

      let newY = btnStartY + deltaY;
      // Clamp within viewport
      newY = Math.max(8, Math.min(window.innerHeight - 52, newY));
      button.style.top = newY + 'px';
      button.style.transform = 'none';
    });

    document.addEventListener('mouseup', () => {
      if (!isDragging) return;
      isDragging = false;
      button.style.transition = 'all 0.2s ease';

      if (hasMoved) {
        // Save position
        const rect = button.getBoundingClientRect();
        localStorage.setItem('threadcopy-btn-y', Math.round(rect.top));
      }
    });

    // Override click to ignore if it was a drag
    const origClick = button.onclick;
    button.addEventListener('click', (e) => {
      if (hasMoved) {
        e.stopImmediatePropagation();
        e.preventDefault();
      }
    }, true);

    // Update toast position to follow button
    const updateToastPos = () => {
      const toast = document.getElementById('threadcopy-toast');
      if (toast) {
        const rect = button.getBoundingClientRect();
        toast.style.top = (rect.top - 44) + 'px';
      }
    };
    const observer2 = new MutationObserver(updateToastPos);
    observer2.observe(button, { attributes: true, attributeFilter: ['style'] });

    document.body.appendChild(button);
  }

  // Watch for URL changes (SPA navigation)
  let lastUrl = location.href;
  function checkUrlChange() {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      // Delay to allow page to load
      setTimeout(createCopyButton, 1000);
    }
  }

  // Initialize
  function init() {
    // Create button on initial load
    setTimeout(createCopyButton, 1500);

    // Watch for SPA navigation
    setInterval(checkUrlChange, 500);

    // Also observe DOM changes for dynamic content
    const observer = new MutationObserver((mutations) => {
      // Only re-check if major DOM changes occurred
      const shouldRecheck = mutations.some(m => 
        m.addedNodes.length > 5 || 
        (m.target.tagName === 'MAIN') ||
        (m.target.id && m.target.id.includes('content'))
      );
      
      if (shouldRecheck && isThreadPage() && !document.getElementById('threadcopy-btn')) {
        createCopyButton();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
