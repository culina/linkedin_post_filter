# LinkedIn Post Filter

A Chrome extension that automatically hides LinkedIn posts containing specified keywords, including promoted content.

## Features

- **Keyword-based filtering**: Hide posts containing specific words or phrases
- **Case-insensitive matching**: Works regardless of capitalization (configurable)
- **Promoted post filtering**: Automatically filters out promoted/sponsored content
- **Comprehensive content matching**: Analyzes all text content including hashtags, captions, and accessibility labels
- **Easy management**: Simple popup interface for adding/removing keywords
- **Real-time filtering**: Works as you scroll through your LinkedIn feed
- **Privacy-focused**: All filtering happens locally - no data sent to external servers

## Default Keywords

The extension comes with no default.

You can add, remove, or modify your own keywords through the popup interface.

## Installation

### From Source (Developer Mode)

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the `linkedin_filter` folder
5. The extension icon should appear in your Chrome toolbar

### Usage

1. **Automatic filtering**: The extension automatically starts filtering LinkedIn posts with default keywords
2. **Manage keywords**: Click the extension icon to open the popup interface
3. **Add keywords**: Type a keyword and click "Add" or press Enter
4. **Remove keywords**: Click "Remove" next to any keyword in the list
5. **Case sensitivity**: Toggle case-sensitive matching if needed
6. **Save settings**: Click "Save Settings" to apply changes

## How It Works

### Content Detection

The extension uses LinkedIn's structural elements to identify posts:

1. **Primary method**: Detects content between `<h2 class="feed-skip-link__container">` elements
2. **Fallback method**: Uses traditional post selectors for compatibility
3. **Comprehensive coverage**: Captures regular posts, promoted content, articles, and videos

### Text Extraction

The extension analyzes all text content within each post:

- Main post text and descriptions
- Hashtags and user mentions
- Article titles and summaries
- Image captions and alt text
- Accessibility labels (aria-label, title attributes)
- Promotional indicators

### Matching Algorithm

- **Substring matching**: Keywords match anywhere within the content
- **Case handling**: Configurable case-sensitive or case-insensitive matching
- **Real-time processing**: Posts are filtered as they load in your feed

## File Structure

```
linkedin_filter/
├── manifest.json          # Extension configuration
├── content.js            # Main filtering logic
├── popup.html           # Extension popup interface
├── popup.js             # Popup functionality
├── styles.css           # CSS for hidden posts
├── test_popup.html      # Standalone testing interface
├── README.md           # This file
└── LICENSE.txt         # MIT license
```

## Technical Details

### Manifest V3 Compliance

- Uses Manifest V3 for Chrome extension compatibility
- Implements proper Content Security Policy
- Separates JavaScript from HTML for security

### Permissions

- `storage`: Save keyword preferences across browser sessions
- `activeTab`: Communicate with LinkedIn tabs for real-time updates

### Browser Compatibility

- Chrome (Manifest V3)
- Other Chromium-based browsers (Edge, Brave, etc.) not tested

## Privacy

- **Local processing**: All filtering happens in your browser
- **No external servers**: Keywords and settings stored locally
- **Chrome Sync**: Settings can sync across your devices via Chrome's built-in sync
- **No tracking**: The extension doesn't collect or transmit any personal data

## Development

### Testing

1. Open Chrome DevTools on LinkedIn to monitor filtering behavior
2. Check the Console tab for any errors or debugging information

### Customization

You can modify the default keywords in both:
- `content.js` (line ~26): `const defaultKeywords = [...]`
- `popup.js` (line ~31 and ~46): `const defaultKeywords = [...]`

## Troubleshooting

### Extension not working
- Reload the extension in `chrome://extensions/`
- Refresh LinkedIn page
- Check that you're on linkedin.com (extension only works on LinkedIn)

### Keywords not saving
- Make sure you clicked "Save Settings"
- Check Chrome's sync settings if using multiple devices
- Try reloading the extension

### Posts not being filtered
- Verify keywords are spelled correctly
- Check case sensitivity setting
- LinkedIn's structure may have changed - see the Issues section on GitHub

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly on LinkedIn
5. Submit a pull request

## Version History

- **v1.0**: Initial release with keyword filtering
- Added promoted post detection and comprehensive content matching

## License

MIT License - see LICENSE.txt for details.

## Disclaimer

This extension is not affiliated with LinkedIn. It's designed to enhance user experience by providing content filtering capabilities. LinkedIn's terms of service apply to your use of their platform.
