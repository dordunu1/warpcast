import { NextResponse } from "next/server";
import { APP_URL } from "../../../lib/constants";

export async function GET() {
  const farcasterConfig = {
    subtitle: "Games, Art, and Giving on Monad",
    description: "Play memory games, create art, and support causes with donations. All in one joyful mini app on Monad.",
    ogTitle: "Fun & Fund",
    ogDescription: "A joyful experience: play games, create art, and make a difference with donations.",
    ogImageUrl: `${APP_URL}/images/feed.jpg`,
    tagline: "Play. Create. Give.",
    heroImageUrl: `${APP_URL}/images/feed.jpg`,
    accountAssociation: {
      header: "eyJmaWQiOjI2NTAwOCwidHlwZSI6ImN1c3RvZHkiLCJrZXkiOiIweGUwOGRkODY5MzU1ZDUyMjE0NDg5M2RiNkFkQ2Y2ZDU3NzdFZTQ2OTgifQ",
      payload: "eyJkb21haW4iOiJ0cmFkaXRpb25hbC1sZWdlbmRzLWh1bmdhcnktbGV4bWFyay50cnljbG91ZGZsYXJlLmNvbSJ9",
      signature: "MHgzZTY4ZTJkNmJkZDJiMTg5ZWRkYmM3ZGI3NzZlNzNmYzFiZTE1NDcwOGZlMjFlMzJmMmQxNDJhM2Q2ZGZiMjdmNjQ3NzRjZGRkNDZhNDY4YzljMTc5MTE5MTkyZDZkZjI1NTM5NzVlZDY1MTYxNmQyOGU0YTY5YjEwNTdjZmEwYjFj"
    },
    frame: {
      version: "1",
      name: "Fun & Fund",
      iconUrl: `${APP_URL}/images/icon.jpeg`,
      homeUrl: `${APP_URL}`,
      imageUrl: `${APP_URL}/images/feed.jpg`,
      screenshotUrls: [],
      tags: ["monad", "farcaster", "miniapp", "games", "art"],
      primaryCategory: "games",
      buttonTitle: "Fun & Fund",
      splashImageUrl: `${APP_URL}/images/splash.jpeg`,
      splashBackgroundColor: "#ffffff",
      webhookUrl: `${APP_URL}/api/webhook`,
    },
  };

  return NextResponse.json(farcasterConfig);
}
