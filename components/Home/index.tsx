"use client";

import React, { useState } from "react";
import MemoryGame from "./MemoryGame";
import DrawingCanvas from "./DrawingCanvas";

export default function Home() {
  const [tab, setTab] = useState<"memory" | "art">("memory");
  return (
    <div
      className={`flex flex-col items-center justify-center min-h-screen p-4 space-y-6 w-full transition-colors duration-300 ${
        tab === "art"
          ? ""
          : "bg-black"
      }`}
      style={tab === "art" ? { background: 'linear-gradient(135deg, #fff0f6 0%, #fdf6fa 100%)' } : undefined}
    >
      <div className="flex space-x-4 mb-4">
        <button
          className={`px-6 py-2 rounded-full font-bold flex items-center gap-2 shadow transition-all duration-200 border-2 ${
            tab === "memory"
              ? "bg-gradient-to-r from-pink-500 to-green-400 text-white border-transparent scale-105"
              : "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200"
          }`}
          onClick={() => setTab("memory")}
        >
          <span role="img" aria-label="gamepad">🎮</span> Memory Game
        </button>
        <button
          className={`px-6 py-2 rounded-full font-bold flex items-center gap-2 shadow transition-all duration-200 border-2 ${
            tab === "art"
              ? "bg-gradient-to-r from-pink-500 to-green-400 text-white border-transparent scale-105"
              : "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200"
          }`}
          onClick={() => setTab("art")}
        >
          <span role="img" aria-label="artist palette">🎨</span> Artistic Scenes
        </button>
      </div>
      <div className="w-full flex flex-col items-center">
        {tab === "memory" && <MemoryGame />}
        {tab === "art" && <DrawingCanvas />}
      </div>
    </div>
  );
}
