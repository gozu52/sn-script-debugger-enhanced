# Script Debugger Enhanced for ServiceNow

Advanced debugging and development tools for ServiceNow developers.

## 🎯 Features

- **🔍 Advanced Log Management**
  - Real-time capture of `gs.log()` and `console.log()` calls
  - Advanced filtering by level, keyword, and table
  - Export logs as JSON or CSV
  - Automatic cleanup of old logs

- **🛠️ GlideRecord Query Builder**
  - Visual query builder with drag-and-drop interface
  - Live code generation
  - Execute queries and preview results
  - Support for multiple conditions and operators

- **📝 Snippet Manager**
  - Save and organize frequently used code snippets
  - Tag-based organization and search
  - One-click copy or insert into ServiceNow editor
  - Import/Export snippet libraries

- **⚡ Performance Monitoring**
  - Real-time performance metrics for GlideRecord queries
  - API call monitoring (Fetch and XHR)
  - Slow query detection and alerts
  - Timeline visualization with charts

## 📦 Installation

### For Development

1. Clone the repository
```bash
git clone https://github.com/gozu52/sn-script-debugger-enhanced.git
cd sn-script-debugger-enhanced
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

*Coming soon on Chrome Web Store!*

## 🚀 Development

```bash
# Start development mode with hot reload
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format

# Create Chrome Web Store package
npm run zip
```

## 📁 Project Structure

```
sn-script-debugger-enhanced/
├── src/
│   ├── background/          # Background service worker
│   │   ├── storage/         # IndexedDB storage managers
│   │   ├── utils/           # Background utilities
│   │   ├── message-handler.js
│   │   └── index.js
│   ├── content/             # Content scripts
│   │   ├── interceptors/    # API interceptors
│   │   ├── monitors/        # Performance monitors
│   │   ├── helpers/         # Helper utilities
│   │   └── index.js
│   ├── popup/               # Popup UI (React)
│   │   ├── components/      # React components
│   │   ├── hooks/           # Custom hooks
│   │   ├── services/        # API services
│   │   └── App.jsx
│   ├── devtools/            # DevTools panel
│   ├── options/             # Options page
│   └── shared/              # Shared utilities
├── public/                  # Static assets
├── tests/                   # Tests
└── docs/                    # Documentation
```

## 🛠️ Technology Stack

- **Framework**: React 18
- **Build Tool**: Webpack 5
- **Database**: IndexedDB (via idb)
- **Charts**: Recharts
- **Syntax Highlighting**: react-syntax-highlighter
- **Manifest**: Chrome Extension Manifest V3

## 📋 Usage

### Log Viewer
1. Open the extension popup
2. Navigate to the "Logs" tab
3. View real-time logs from ServiceNow
4. Filter by level, keyword, or table
5. Export logs for analysis

### Query Builder
1. Navigate to the "Query Builder" tab
2. Select a table from the dropdown
3. Add conditions using the visual builder
4. View generated GlideRecord code
5. Execute query and preview results

### Snippet Manager
1. Navigate to the "Snippets" tab
2. Create new snippets with tags
3. Search and filter your snippet library
4. Copy or insert snippets with one click
5. Import/Export snippet collections

### Performance Dashboard
1. Navigate to the "Performance" tab
2. View real-time performance metrics
3. Identify slow queries and bottlenecks
4. Analyze trends with timeline charts

## ⚙️ Configuration

Access settings via:
- Extension popup → Settings tab
- Right-click extension icon → Options
- `chrome://extensions/` → Details → Extension options

Available settings:
- Enable/disable log capture
- Set performance thresholds
- Configure data masking
- Customize UI preferences
- Manage data retention

## 🔒 Security & Privacy

- All data is stored locally in your browser
- Sensitive data is automatically masked
- No data is sent to external servers
- Configurable data retention policies

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🐛 Support

- 📖 [Documentation](docs/)
- 🐛 [Report a Bug](https://github.com/gozu52/sn-script-debugger-enhanced/issues)
- 💡 [Request a Feature](https://github.com/gozu52/sn-script-debugger-enhanced/issues)

## 📅 Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history.

## 🙏 Acknowledgments

- ServiceNow Community
- Chrome Extension developers
- Open source contributors

---

Made with ❤️ for ServiceNow developers
