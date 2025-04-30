# DoppelGamble

A birthday paradox betting game built with MiniKit for Farcaster. Test the birthday paradox with real Farcaster birthdays!

## How It Works

1. **Join a Game**: Enter a game with up to 23 Farcaster users
2. **Place Your Bet**: Bet on whether anyone will share your Farcaster birthday
3. **Wait for Results**: Once the game is full, the results are calculated
4. **Collect Winnings**: Winners split the pot!

## The Birthday Paradox

The birthday paradox states that in a group of just 23 randomly chosen people, there's a 50% chance that at least two people share the same birthday. This counterintuitive probability demonstrates how quickly collision probabilities grow in small sample sizes.

In DoppelGamble, we use Farcaster registration dates ("Farcaster birthdays") to test this mathematical phenomenon with real data.

## Beta Testing Mode

During the beta testing period, all games are free to play! Set the `NEXT_PUBLIC_BET_AMOUNT` environment variable to "0" to enable beta mode. In production, you can set this to your desired bet amount (e.g., "0.5" for 0.5 USDC).

## Tech Stack

- [Next.js](https://nextjs.org) - React framework
- [MiniKit](https://docs.base.org/builderkits/minikit/overview) - Farcaster mini-apps framework
- [OnchainKit](https://www.base.org/builders/onchainkit) - Web3 components
- [Tailwind CSS](https://tailwindcss.com) - CSS framework
- [TursoDB](https://turso.tech) - SQLite database
- [Farcaster API](https://docs.farcaster.xyz/) - User data and notifications

## Getting Started

1. Clone the repository

```bash
git clone https://github.com/yourusername/doppelgamble.git
cd doppelgamble
```

2. Install dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

3. Set up the environment variables

Copy the `.env.example` file to `.env.local` and fill in the required values.

```bash
cp .env.example .env.local
```

Required environment variables:

- MiniKit configuration variables
- TursoDB credentials
- Farcaster Frame configuration
- Game settings (including `NEXT_PUBLIC_BET_AMOUNT` for beta mode)
- Security keys

4. Start the development server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

5. Visit `http://localhost:3000` to see the application

## Setting up TursoDB

1. Create a Turso account at [turso.tech](https://turso.tech)
2. Create a new database

```bash
turso db create doppelgamble
```

3. Get the database URL and auth token

```bash
turso db show doppelgamble --url
turso auth token
```

4. Add these to your `.env.local` file

## Deployment

This application is designed to be deployed to a platform like Vercel or Netlify.

1. Push your code to GitHub
2. Connect your repository to Vercel or Netlify
3. Configure the environment variables in the deployment platform
4. Deploy!

## Setting Up Cron Jobs

For the game resolution to work automatically, you need to set up a cron job that calls the `/api/cron` endpoint periodically.

1. On Vercel, you can use Vercel Cron:

```json
{
  "crons": [
    {
      "path": "/api/cron?key=your-cron-secret-key",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

2. On other platforms, you can use services like GitHub Actions, Netlify Functions, or dedicated cron job services.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

[MIT](LICENSE)