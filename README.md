# Script Debugger Enhanced for ServiceNow

Advanced debugging and development tools for ServiceNow developers.

## Features

- 🔍 **Advanced Log Management** - Real-time log capture, filtering, and export
- 🛠️ **GlideRecord Query Builder** - GUI-based query builder with live preview
- 📝 **Snippet Manager** - Save and organize code snippets with tags
- ⚡ **Performance Monitoring** - Real-time performance metrics and bottleneck detection

## Installation

### For Development

1. Clone this repository
```bash
git clone https://github.com/YOUR_USERNAME/script-debugger-enhanced.git
cd script-debugger-enhanced
```

2. Install dependencies
```bash
npm install
```

3. Build the extension
```bash
npm run build
```

4. Load in Chrome
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist/` folder

### For Users

Coming soon on Chrome Web Store!

## Development
```bash
# Start development mode with hot reload
npm run dev

# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format
```

## Project Structure
```
script-debugger-enhanced/
├── src/
│   ├── background/      # Background service worker
│   ├── content/         # Content scripts
│   ├── popup/           # Popup UI (React)
│   ├── devtools/        # DevTools panel
│   └── shared/          # Shared utilities
├── public/              # Static assets
├── tests/               # Tests
└── docs/                # Documentation
```

## Technology Stack

- **Framework**: React 18
- **Build Tool**: Webpack 5
- **Database**: IndexedDB (via idb)
- **Charts**: Recharts
- **Syntax Highlighting**: react-syntax-highlighter

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

## License

MIT License - see [LICENSE](LICENSE) file for details

## Support

- 📖 [Documentation](docs/)
- 🐛 [Report a Bug](https://github.com/YOUR_USERNAME/script-debugger-enhanced/issues)
- 💡 [Request a Feature](https://github.com/YOUR_USERNAME/script-debugger-enhanced/issues)

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history.

---

Made with ❤️ for ServiceNow developers
