# ralseibot

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Discord.js](https://img.shields.io/badge/discord.js-v14-blue.svg)](https://discord.js.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![Deploy to Nest](https://github.com/BananaJeanss/ralseibot/actions/workflows/main.yml/badge.svg)](https://github.com/BananaJeanss/ralseibot/actions/workflows/main.yml)

A Discord bot for all your Ralsei-related needs, built with TypeScript and Discord.js. Features content from Reddit and Twitter, sprite generation, textbox creation, and more.

[**🔗 Invite the bot**](https://discord.com/oauth2/authorize?client_id=1388252423197561013) • [**💬 Testing/Support Server**](https://discord.gg/mNaHqRPtKq) • [**🌐 Website**](https://ralseibot.bnajns.hackclub.app)

## ✨ Features

- **Ralsei Content**: Fetches random Ralsei images from Reddit and Twitter sources
- **Multiple fun commands**: Try out commands such as /ralsei-sprite, /ralseify, and more.
- **Textbox Generator**: Create custom deltarune textboxes with different preset characters
- **Auto-Rotating Status**: Dynamic status messages that change periodically
- **Content Filtering**: Built-in profanity filter for safe content

## 🤖 Commands

| Command | Description |
|---------|-------------|
| `/ralsei` | Fetches a random Ralsei image from Reddit or Twitter |
| `/ralsei-sprite` | Get a random Ralsei sprite from chapters 1-4 |
| `/textbox` | Generate Deltarune textboxes with custom text and sprites |
| `/ping` | Check bot responsiveness |
| `/uptime` | View bot uptime statistics |
| `/about` | Information about the bot and its features |

More commands can be found via the discord command selector, or via [commands.md](commands.md)

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) 18 or higher
- [A Discord bot token](https://discord.com/developers/applications)
- [Python 3.x](https://python.org/) (for sprite extraction)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/BananaJeanss/ralseibot.git
   cd ralseibot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit .env with your Discord bot token and client ID

4. **Extract sprites** (optional)
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   pip install -r src/commands/ralsei/ralsei-sprite/sprites/requirements.txt
   npm run extract-sprites
   ```

5. **Build and deploy commands**
   ```bash
   npm run build
   npm run deploy-commands
   ```

6. **Start the bot**
   ```bash
   npm start
   ```

## Configuration

### Environment Variables

```env
# Required
DISCORD_BOT_TOKEN=your_bot_token_here
DISCORD_CLIENT_ID=your_client_id_here

# Optional
RUN_MODE=dual  # bot, site, or dual
EXPRESS_PORT=3000
```

### Run Modes

- `bot`: Discord bot only
- `site`: Express website only  
- `dual`: Both bot and web server (default)

### Content Sources

Configure content sources in [`sources.yaml`](sources.yaml):

```yaml
sources:
  reddit:
    - name: "r/ralsei"
      url: "https://www.reddit.com/r/ralsei/"
      weight: 5
  twitter:
    - name: "Bi-Hourly Ralsei"
      url: "https://x.com/bihourlyralsei"
      weight: 5
```

## Development

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm run watch` - Watch for TypeScript changes
- `npm run lint` - Run ESLint

### Project Structure

```
src/
├── commands/           # Discord slash commands
│   ├── ralsei/        # Ralsei-specific commands
│   └── utility/       # General utility commands
├── events/            # Discord.js event handlers
├── handlers/          # Content source handlers (Reddit, Twitter)
├── site/             # Express.js web interface
└── index.ts          # Main entry point
```

## Contributing

Contributions are welcome! Please feel free to:

- Report bugs by [opening an issue](https://github.com/BananaJeanss/ralseibot/issues)
- Suggest features via [feature requests](https://github.com/BananaJeanss/ralseibot/issues)
- Submit pull requests for improvements

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Credits

- **Sprites**: Extracted from Deltarune spritesheets via [Spriters Resource](https://www.spriters-resource.com/)
- **Hero Banner**: [@morxwx](https://x.com/morxwx) on Twitter
- **Quotes**: [HushBugger/hushbugger.github.io](https://github.com/HushBugger/hushbugger.github.io/tree/master/deltarune/text)
 for in-game quotes/text dump
- **Built for**: [Hack Club Converge](https://converge.hackclub.com/)