import { NextResponse } from "next/server";
import { APP_URL } from "../../../lib/constants";

export async function GET() {
  const farcasterConfig = {
    subtitle: "A fun games and art mini app on Monad",
    description: "Play memory games and create art, then mint as NFTs on Monad testnet.",
    ogTitle: "Games and Art Mini App",
    ogDescription: "A two-in-one experience: memory games and art creation, with NFT minting.",
    ogImageUrl: `${APP_URL}/images/feed.jpg`,
    tagline: "Games + Art = Fun",
    heroImageUrl: `${APP_URL}/images/feed.jpg`,
    accountAssociation: {
      header: "eyJmaWQiOjI2NTAwOCwidHlwZSI6ImN1c3RvZHkiLCJrZXkiOiIweGUwOGRkODY5MzU1ZDUyMjE0NDg5M2RiNkFkQ2Y2ZDU3NzdFZTQ2OTgifQ",
      payload: "eyJkb21haW4iOiJkZWNhZGVzLWFuYWx5c2lzLW9yZGVyaW5nLWFsbG93YW5jZS50cnljbG91ZGZsYXJlLmNvbSJ9",
      signature: "MHgwY2YyYWJkMDAxMWVhYWFlMGVhYTJiZGM5NGM3NjE4ZmVkMjA5ZTY4NDFmODY2MTg1N2JkY2FlNzQxYTRhNTM5NGY5ODYxMWJlMWM3MTA4YTI2ZGUxY2EwMWFjY2RmOWZkYTA4NTAwOTk3NWViOWU1MDJmN2Y0NDgzMDI0YzRmYjFi"
    },
    frame: {
      version: "1",
      name: "Games and Art",
      iconUrl: `${APP_URL}/images/icon.png`,
      homeUrl: `${APP_URL}`,
      imageUrl: `${APP_URL}/images/feed.jpg`,
      screenshotUrls: [],
      tags: ["monad", "farcaster", "miniapp", "games", "art"],
      primaryCategory: "games",
      buttonTitle: "Games and Art",
      splashImageUrl: `${APP_URL}/images/splash.jpg`,
      splashBackgroundColor: "#ffffff",
      webhookUrl: `${APP_URL}/api/webhook`,
    },
  };

  return NextResponse.json(farcasterConfig);
}
