"use client";

import React, { useState } from "react";
import MemoryGame from "./MemoryGame";
import DrawingCanvas from "./DrawingCanvas";
import DonationApp from "./DonationApp";
import ArtisticScenesLanding from "./ArtisticScenesLanding";

const apps = [
  {
    key: "memory",
    icon: "🎮",
    label: "Memory Game",
    desc: "Test your memory and have fun!",
  },
  {
    key: "art",
    icon: "🎨",
    label: "NFT Launchpad",
    desc: "Launch your NFT collection with ease",
  },
  {
    key: "donation",
    icon: "❤️",
    label: "Donations",
    desc: "Start or support a cause!",
  },
];

export default function Home() {
  const [selectedApp, setSelectedApp] = useState<"memory" | "art" | "donation" | null>(null);

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen w-full transition-colors duration-300"
      style={
        !selectedApp
          ? { background: 'linear-gradient(180deg, #8eb3ff 0%, #e3e6ff 30%, #fff3b0 60%, #ffb86b 80%, #ff5e2f 100%)' }
          : {}
      }
    >
      {!selectedApp && (
        <div className="relative w-full max-w-xl h-[350px] flex flex-col items-center justify-center">
          {/* Triangle icons */}
          <div className="absolute left-1/2 top-0 transform -translate-x-1/2">
            {(() => { const { key, ...rest } = apps[0]; return <AppIcon key={key} {...rest} onClick={() => setSelectedApp("memory")} /> })()}
          </div>
          <div className="absolute left-8 bottom-0">
            {(() => { const { key, ...rest } = apps[1]; return <AppIcon key={key} {...rest} onClick={() => setSelectedApp("art")} /> })()}
          </div>
          <div className="absolute right-8 bottom-0">
            {(() => { const { key, ...rest } = apps[2]; return <AppIcon key={key} {...rest} onClick={() => setSelectedApp("donation")} /> })()}
          </div>
        </div>
      )}
      {selectedApp && (
        <div className="w-full min-h-screen flex flex-col items-center justify-start">
          <div className="w-full flex flex-col items-center pt-12 md:pt-16">
            {selectedApp === "memory" && <MemoryGame onBack={() => setSelectedApp(null)} />}
            {selectedApp === "art" && <ArtisticScenesLanding onBack={() => setSelectedApp(null)} />}
            {selectedApp === "donation" && <DonationApp onBack={() => setSelectedApp(null)} />}
          </div>
        </div>
      )}
    </div>
  );
}

function AppIcon({ icon, label, desc, onClick }: any) {
  return (
    <div className="flex flex-col items-center group cursor-pointer select-none" onClick={onClick}>
      <div className="w-20 h-20 flex items-center justify-center rounded-full bg-white/30 shadow-xl ring-2 ring-pink-300 hover:ring-green-400 transition-all text-4xl mb-2">
        <span>{icon}</span>
      </div>
      <span className="text-gray-900 text-lg font-bold drop-shadow-lg mt-1 mb-1 text-center">{label}</span>
      <span className="text-gray-700 text-base text-center max-w-[120px]">{desc}</span>
    </div>
  );
}
