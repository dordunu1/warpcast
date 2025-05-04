import { Metadata } from "next";
import App from "@/components/pages/app";
import { APP_URL } from "@/lib/constants";

const frame = {
  version: "next",
  imageUrl: `${APP_URL}/images/feed.jpg`,
  button: {
    title: "Games and Art",
    action: {
      type: "launch_frame",
      name: "Games and Art",
      url: APP_URL,
      splashImageUrl: `${APP_URL}/images/splash.jpeg`,
      splashBackgroundColor: "#f7f7f7",
    },
  },
};

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Games and Art",
    description: "Play memory games and create art, then mint as NFTs on Monad testnet.",
    openGraph: {
      title: "Games and Art Mini App",
      description: "A two-in-one experience: memory games and art creation, with NFT minting.",
      images: [
        {
          url: `${APP_URL}/images/feed.jpg`,
          width: 1200,
          height: 630,
          alt: "Games and Art Mini App",
        },
      ],
    },
    other: {
      "fc:frame": JSON.stringify(frame),
      subtitle: "A fun games and art mini app on Monad",
      tagline: "Games + Art = Fun",
      heroImageUrl: `${APP_URL}/images/feed.jpg`,
      ogTitle: "Games and Art Mini App",
      ogDescription: "A two-in-one experience: memory games and art creation, with NFT minting.",
      ogImageUrl: `${APP_URL}/images/feed.jpg`,
    },
  };
}

export default function Home() {
  return <App />;
}
