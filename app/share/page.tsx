import { Metadata } from "next";

const MINIAPP_URL = process.env.NEXT_PUBLIC_MINIAPP_URL || "/";

export async function generateMetadata({ searchParams }: { searchParams: { img?: string; score?: string } }): Promise<Metadata> {
  const img = searchParams.img || "/images/feed.jpg";
  const score = searchParams.score || "a great score";
  return {
    title: `I scored ${score} in Games & Art!`,
    description: "Can you beat my score? Play now!",
    openGraph: {
      title: `I scored ${score} in Games & Art!`,
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

export default function SharePage({ searchParams }: { searchParams: { img?: string; score?: string } }) {
  // Redirect to the miniapp URL instantly, but keep OG tags for social previews
  return (
    <html>
      <head>
        <meta httpEquiv="refresh" content={`0; url=${MINIAPP_URL}`} />
      </head>
      <body>
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-white">
          <p>Redirecting to the game...</p>
        </div>
      </body>
    </html>
  );
} 