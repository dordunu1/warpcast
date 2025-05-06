import { Metadata } from "next";
import App from "@/components/pages/app";
import { APP_URL } from "@/lib/constants";

const frame = {
  version: "next",
  imageUrl: `${APP_URL}/images/feed.png`,
  button: {
    title: "Fun & Fund",
    action: {
      type: "launch_frame",
      name: "Fun & Fund",
      url: APP_URL,
      splashImageUrl: `${APP_URL}/images/splash.jpeg`,
      splashBackgroundColor: "#f7f7f7",
    },
  },
};

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Fun & Fund",
    description: "Play memory games, create art, and support causes with donations. All in one joyful mini app on Monad.",
    openGraph: {
      title: "Fun & Fund Mini App",
      description: "A joyful experience: play games, create art, and make a difference with donations.",
      images: [
        {
          url: `${APP_URL}/images/feed.png`,
          width: 1200,
          height: 630,
          alt: "Fun & Fund Mini App",
        },
      ],
    },
    other: {
      "fc:frame": JSON.stringify(frame),
      subtitle: "Games, Art, and Giving on Monad",
      tagline: "Games + Art = Fun",
      heroImageUrl: `${APP_URL}/images/feed.png`,
      ogTitle: "Fun & Fund",
      ogDescription: "A joyful experience: play games, create art, and make a difference with donations.",
      ogImageUrl: `${APP_URL}/images/feed.png`,
    },
  };
}

export default function Home() {
  return <App />;
}
