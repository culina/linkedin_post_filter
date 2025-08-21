// LinkedIn Post Filter Content Script
class LinkedInPostFilter {
  constructor() {
    this.keywords = [];
    this.caseSensitive = false;
    this.hiddenCount = 0;
    this.observer = null;
    this.processedPosts = new Set();

    this.init();
  }

  async init() {
    await this.loadSettings();
    this.startObserving();
    this.processExistingPosts();
    this.setupMessageListener();
  }

  loadSettings() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(
        ["keywords", "caseSensitive", "hiddenCount"],
        (result) => {
          // Set default keywords if none exist
          const defaultKeywords = [
            "formueskatt",
            "Promotert av",
            "Promoted by",
          ];
          this.keywords = result.keywords || defaultKeywords;
          this.caseSensitive = result.caseSensitive || false;
          this.hiddenCount = result.hiddenCount || 0;

          // Save default keywords if this is the first run
          if (!result.keywords) {
            chrome.storage.sync.set({ keywords: this.keywords });
          }

          resolve();
        },
      );
    });
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === "updateSettings") {
        this.keywords = message.keywords || [];
        this.caseSensitive = message.caseSensitive || false;
        this.processAllPosts();
      }
    });
  }

  startObserving() {
    // Create a mutation observer to watch for new posts
    this.observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            this.processNewContent(node);
          }
        });
      });
    });

    // Start observing
    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  processNewContent(element) {
    // Find posts within the new content
    const posts = this.findPosts(element);
    posts.forEach((post) => this.processPost(post));
  }

  processExistingPosts() {
    const posts = this.findAllPosts();
    posts.forEach((post) => this.processPost(post));
  }

  processAllPosts() {
    // Reset processed posts and reprocess everything
    this.processedPosts.clear();

    // First, show all previously hidden posts
    document
      .querySelectorAll('[data-linkedin-filter="hidden"]')
      .forEach((post) => {
        this.showPost(post);
      });

    // Then reprocess all posts with current settings
    this.processExistingPosts();
  }

  findAllPosts() {
    // Find posts using skip-link boundaries to capture all content including promoted posts
    const skipLinks = document.querySelectorAll("h2.feed-skip-link__container");
    const posts = [];

    for (let i = 0; i < skipLinks.length - 1; i++) {
      const currentSkipLink = skipLinks[i];
      const nextSkipLink = skipLinks[i + 1];

      // Find the container div between the skip links
      let current = currentSkipLink.nextElementSibling;
      while (current && current !== nextSkipLink) {
        if (current.tagName === "DIV") {
          posts.push(current);
          break;
        }
        current = current.nextElementSibling;
      }
    }

    // Handle the last skip link if it exists
    if (skipLinks.length > 0) {
      const lastSkipLink = skipLinks[skipLinks.length - 1];
      let current = lastSkipLink.nextElementSibling;
      while (current) {
        if (current.tagName === "DIV") {
          posts.push(current);
          break;
        }
        current = current.nextElementSibling;
      }
    }

    // Fallback to old method if no skip links found
    if (posts.length === 0) {
      const selectors = [
        '[data-urn*="urn:li:activity"]', // Main feed posts
        ".feed-shared-update-v2", // Alternative feed posts
        ".occludable-update", // Another post type
        '[data-id*="urn:li:activity"]', // Posts with data-id
      ];

      selectors.forEach((selector) => {
        document.querySelectorAll(selector).forEach((post) => {
          if (!posts.includes(post)) {
            posts.push(post);
          }
        });
      });
    }

    return posts;
  }

  findPosts(element) {
    if (element.matches && this.isPost(element)) {
      return [element];
    }

    return this.findAllPosts().filter((post) => element.contains(post));
  }

  isPost(element) {
    // Check if element is between skip links or matches traditional post selectors
    if (element.tagName === "DIV") {
      const prevSkipLink = element.previousElementSibling;
      if (
        prevSkipLink &&
        prevSkipLink.matches("h2.feed-skip-link__container")
      ) {
        return true;
      }
    }

    // Fallback to traditional selectors
    const postSelectors = [
      '[data-urn*="urn:li:activity"]',
      ".feed-shared-update-v2",
      ".occludable-update",
      '[data-id*="urn:li:activity"]',
    ];

    return postSelectors.some((selector) => element.matches(selector));
  }

  processPost(post) {
    if (!post || this.processedPosts.has(post)) {
      return;
    }

    this.processedPosts.add(post);

    const postText = this.extractPostText(post);
    if (this.shouldHidePost(postText)) {
      this.hidePost(post);
    }
  }

  extractPostText(post) {
    // Extract ALL text content from the post container
    // This captures promoted posts, regular posts, and any other content
    let fullText = post.textContent || "";

    // Also specifically check for common elements that might have additional text
    const textElements = post.querySelectorAll(
      [
        ".feed-shared-text",
        ".feed-shared-update-v2__description",
        ".feed-shared-article__description",
        ".update-components-text",
        '[data-test-id="main-feed-activity-card"] span[dir="ltr"]',
        ".feed-shared-text .break-words",
        "[aria-label]", // Elements with aria labels
        "[title]", // Elements with titles
      ].join(", "),
    );

    textElements.forEach((el) => {
      // Add aria-label and title attributes as they often contain relevant text
      if (el.getAttribute("aria-label")) {
        fullText += " " + el.getAttribute("aria-label");
      }
      if (el.getAttribute("title")) {
        fullText += " " + el.getAttribute("title");
      }
    });

    // Also check for hashtags and mentions
    const hashtagElements = post.querySelectorAll('a[href*="/hashtag/"]');
    hashtagElements.forEach((el) => {
      fullText += " " + el.textContent;
    });

    return fullText.trim();
  }

  shouldHidePost(postText) {
    if (!postText || this.keywords.length === 0) {
      return false;
    }

    const textToCheck = this.caseSensitive ? postText : postText.toLowerCase();

    return this.keywords.some((keyword) => {
      const keywordToCheck = this.caseSensitive
        ? keyword
        : keyword.toLowerCase();
      return textToCheck.includes(keywordToCheck);
    });
  }

  hidePost(post) {
    if (post.getAttribute("data-linkedin-filter") === "hidden") {
      return; // Already hidden
    }

    post.setAttribute("data-linkedin-filter", "hidden");
    post.classList.add("linkedin-filter-hidden");

    this.hiddenCount++;
    this.updateHiddenCount();

    // Add a small notice that can be clicked to show the post
    this.addToggleNotice(post);
  }

  showPost(post) {
    post.removeAttribute("data-linkedin-filter");
    post.classList.remove("linkedin-filter-hidden");

    // Remove toggle notice
    const notice = post.querySelector(".linkedin-filter-notice");
    if (notice) {
      notice.remove();
    }
  }

  addToggleNotice(post) {
    // Don't add notice if one already exists
    if (post.querySelector(".linkedin-filter-notice")) {
      return;
    }

    const notice = document.createElement("div");
    notice.className = "linkedin-filter-notice";
    notice.innerHTML = `
            <div class="linkedin-filter-notice-content">
                <span>Post hidden by LinkedIn Filter</span>
                <button class="linkedin-filter-show-btn">Show</button>
            </div>
        `;

    notice
      .querySelector(".linkedin-filter-show-btn")
      .addEventListener("click", (e) => {
        e.stopPropagation();
        this.showPost(post);
        this.hiddenCount = Math.max(0, this.hiddenCount - 1);
        this.updateHiddenCount();
      });

    post.insertBefore(notice, post.firstChild);
  }

  updateHiddenCount() {
    chrome.storage.sync.set({ hiddenCount: this.hiddenCount });
  }
}

// Initialize the filter when the page loads
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    new LinkedInPostFilter();
  });
} else {
  new LinkedInPostFilter();
}
