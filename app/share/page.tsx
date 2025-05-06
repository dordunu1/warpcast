import { Metadata } from "next";
import { redirect } from "next/navigation";

const MINIAPP_URL = process.env.NEXT_PUBLIC_MINIAPP_URL || "/";

export async function generateMetadata({ searchParams }: { searchParams: { img?: string; score?: string } }): Promise<Metadata> {
  const img = searchParams.img || "/images/feed.png";
  const score = searchParams.score || "a great score";
  return {
    title: `I scored ${score} in Fun & Fund!`,
    description: "Can you beat my score? Play now!",
    openGraph: {
      title: `I scored ${score} in Fun & Fund!`,
      description: "Can you beat my score? Play now!",
      images: [
        {
          url: img,
          width: 1200,
          height: 630,
          alt: "Game Score Screenshot",
        },
      ],
    },
  };
}

export default function SharePage() {
  redirect(MINIAPP_URL);
  return null;
} 