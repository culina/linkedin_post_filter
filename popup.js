let keywords = [];
let caseSensitive = false;
let hiddenCount = 0;

// Load settings when popup opens
document.addEventListener("DOMContentLoaded", loadSettings);

// Add event listeners
document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("addKeyword").addEventListener("click", addKeyword);
  document
    .getElementById("keywordInput")
    .addEventListener("keypress", function (e) {
      if (e.key === "Enter") addKeyword();
    });
  document
    .getElementById("saveSettings")
    .addEventListener("click", saveSettings);

  document
    .getElementById("caseSensitive")
    .addEventListener("change", function () {
      caseSensitive = this.checked;
    });
});

function loadSettings() {
  // Check if chrome.storage is available
  if (typeof chrome === "undefined" || !chrome.storage) {
    // Fallback for testing or if storage API is not available
    const defaultKeywords = ["formueskatt", "Promotert av", "Promoted by"];
    keywords = defaultKeywords;
    caseSensitive = false;
    hiddenCount = 0;

    document.getElementById("caseSensitive").checked = caseSensitive;
    updateKeywordList();
    updateStats();
    return;
  }

  chrome.storage.sync.get(
    ["keywords", "caseSensitive", "hiddenCount"],
    function (result) {
      // Set default keywords if none exist
      const defaultKeywords = ["formueskatt", "Promotert av", "Promoted by"];
      keywords = result.keywords || defaultKeywords;
      caseSensitive = result.caseSensitive || false;
      hiddenCount = result.hiddenCount || 0;

      // Save default keywords if this is the first run
      if (!result.keywords) {
        chrome.storage.sync.set({ keywords: keywords });
      }

      document.getElementById("caseSensitive").checked = caseSensitive;
      updateKeywordList();
      updateStats();
    },
  );
}

function addKeyword() {
  const input = document.getElementById("keywordInput");
  const keyword = input.value.trim();

  if (keyword && !keywords.includes(keyword)) {
    keywords.push(keyword);
    input.value = "";
    updateKeywordList();
    updateStats();
  }
}

function removeKeyword(keyword) {
  keywords = keywords.filter((k) => k !== keyword);
  updateKeywordList();
  updateStats();
}

function updateKeywordList() {
  const listEl = document.getElementById("keywordList");

  if (keywords.length === 0) {
    listEl.innerHTML =
      '<div style="color: #666; font-style: italic;">No keywords added yet</div>';
    return;
  }

  listEl.innerHTML = keywords
    .map(
      (keyword) => `
        <div class="keyword-item">
            <span>${keyword}</span>
            <button class="remove-btn" data-keyword="${keyword}">Remove</button>
        </div>
    `,
    )
    .join("");

  // Add event listeners to remove buttons
  listEl.querySelectorAll(".remove-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const keyword = this.getAttribute("data-keyword");
      removeKeyword(keyword);
    });
  });
}

function saveSettings() {
  // Show confirmation even if storage fails
  const btn = document.getElementById("saveSettings");
  const originalText = btn.textContent;

  if (typeof chrome === "undefined" || !chrome.storage) {
    // Fallback behavior when storage API is not available
    btn.textContent = "Storage not available!";
    btn.style.backgroundColor = "#dc3545";
    setTimeout(() => {
      btn.textContent = originalText;
      btn.style.backgroundColor = "#28a745";
    }, 2000);
    return;
  }

  chrome.storage.sync.set(
    {
      keywords: keywords,
      caseSensitive: caseSensitive,
    },
    function () {
      // Notify content script to update
      if (chrome.tabs) {
        chrome.tabs.query(
          { active: true, currentWindow: true },
          function (tabs) {
            if (tabs && tabs[0]) {
              chrome.tabs.sendMessage(
                tabs[0].id,
                {
                  action: "updateSettings",
                  keywords: keywords,
                  caseSensitive: caseSensitive,
                },
                function (response) {
                  // Handle any potential errors silently
                  if (chrome.runtime.lastError) {
                    // Content script not available (not on LinkedIn or script not loaded)
                    // This is expected behavior, no action needed
                  }
                },
              );
            }
          },
        );
      }

      // Show brief confirmation
      btn.textContent = "Saved!";
      btn.style.backgroundColor = "#218838";
      setTimeout(() => {
        btn.textContent = originalText;
        btn.style.backgroundColor = "#28a745";
      }, 1000);
    },
  );
}

function updateStats() {
  const statsText = `${keywords.length} keywords | ${hiddenCount} posts hidden`;
  document.getElementById("stats").textContent = statsText;
}
