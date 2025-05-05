"use client";
import React, { useEffect, useState } from "react";
import { useAccount, useSendTransaction, useSwitchChain, useConnect, useBalance } from "wagmi";
import { parseEther, encodeFunctionData, parseGwei } from "viem";
import { monadTestnet } from "viem/chains";
import { useMiniAppContext } from "@/hooks/use-miniapp-context";
import html2canvas from "html2canvas";

const CARD_IMAGES = Array.from({ length: 8 }, (_, i) => `/images/${i + 1}.jpeg`);
const TOTAL_PAIRS = 8;
const GRID_SIZE = 4;

// Real contract address and ABI
const NFT_CONTRACT_ADDRESS = "0x1b948Fd7BF177446Ac258227f008E10231A365Af";
const NFT_ABI = [
  {"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[{"internalType":"address","name":"sender","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"},{"internalType":"address","name":"owner","type":"address"}],"name":"ERC721IncorrectOwner","type":"error"},{"inputs":[{"internalType":"address","name":"operator","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"ERC721InsufficientApproval","type":"error"},{"inputs":[{"internalType":"address","name":"approver","type":"address"}],"name":"ERC721InvalidApprover","type":"error"},{"inputs":[{"internalType":"address","name":"operator","type":"address"}],"name":"ERC721InvalidOperator","type":"error"},{"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"ERC721InvalidOwner","type":"error"},{"inputs":[{"internalType":"address","name":"receiver","type":"address"}],"name":"ERC721InvalidReceiver","type":"error"},{"inputs":[{"internalType":"address","name":"sender","type":"address"}],"name":"ERC721InvalidSender","type":"error"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"ERC721NonexistentToken","type":"error"},{"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"OwnableInvalidOwner","type":"error"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"OwnableUnauthorizedAccount","type":"error"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"approved","type":"address"},{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"operator","type":"address"},{"indexed":false,"internalType":"bool","name":"approved","type":"bool"}],"name":"ApprovalForAll","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"_fromTokenId","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"_toTokenId","type":"uint256"}],"name":"BatchMetadataUpdate","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"_tokenId","type":"uint256"}],"name":"MetadataUpdate","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"Transfer","type":"event"},{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"approve","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"getApproved","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"getScore","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"getTraits","outputs":[{"internalType":"string[]","name":"","type":"string[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"operator","type":"address"}],"name":"isApprovedForAll","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"score","type":"uint256"},{"internalType":"string","name":"metadataUri","type":"string"},{"internalType":"string[]","name":"traits","type":"string[]"}],"name":"mintScoreNFT","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"nextTokenId","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"ownerOf","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"safeTransferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"},{"internalType":"bytes","name":"data","type":"bytes"}],"name":"safeTransferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"operator","type":"address"},{"internalType":"bool","name":"approved","type":"bool"}],"name":"setApprovalForAll","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes4","name":"interfaceId","type":"bytes4"}],"name":"supportsInterface","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"tokenScore","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"uint256","name":"","type":"uint256"}],"name":"tokenTraits","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"tokenURI","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"transferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"}];

function shuffle(array: any[]) {
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
}

function getInitialCards() {
  const cards = CARD_IMAGES.flatMap((img, idx) => [
    { id: idx * 2, img, matched: false },
    { id: idx * 2 + 1, img, matched: false },
  ]);
  return shuffle(cards);
}

export default function MemoryGame() {
  const [cards, setCards] = useState(getInitialCards());
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [score, setScore] = useState(0);
  const [timer, setTimer] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [message, setMessage] = useState("");
  const [mintStatus, setMintStatus] = useState<"idle"|"loading"|"success"|"error">("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [mintMsg, setMintMsg] = useState("");
  const [ipfsHash, setIpfsHash] = useState<string>("");
  const [metadataHash, setMetadataHash] = useState<string>("");
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareMessage, setShareMessage] = useState("");
  const [shareLoading, setShareLoading] = useState(false);
  const [shareLinkLoading, setShareLinkLoading] = useState(false);

  const { isConnected, address, chainId } = useAccount();
  const { data, isSuccess, isError, sendTransaction } = useSendTransaction();
  const { switchChain, error: switchError } = useSwitchChain();
  const { connect, connectors, error: connectError } = useConnect();
  const { isEthProviderAvailable } = useMiniAppContext();
  const { data: balanceData } = useBalance({ address, chainId: monadTestnet.id });

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive) {
      interval = setInterval(() => setTimer((t) => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isActive]);

  useEffect(() => {
    if (flipped.length === 2) {
      setTimeout(() => {
        const [first, second] = flipped;
        if (cards[first].img === cards[second].img) {
          setMatched((prev) => [...prev, cards[first].id, cards[second].id]);
          setScore((s) => s + 10);
          setMessage("Great match! Keep going!");
        } else {
          setMessage("");
        }
        setFlipped([]);
        setMoves((m) => m + 1);
      }, 800);
    }
  }, [flipped, cards]);

  useEffect(() => {
    if (matched.length === cards.length && cards.length > 0) {
      setIsActive(false);
      setMessage("Congratulations! You won!");
    }
  }, [matched, cards]);

  useEffect(() => {
    if (isSuccess && data) {
      setTxHash(data);
      setMintStatus("success");
      setMessage("Minted! View on Monad Explorer.");
    } else if (isError) {
      setMintStatus("error");
      setMessage("Mint failed. Try again.");
    }
  }, [isSuccess, isError, data]);

  // Auto-connect if wallet is available but not connected
  React.useEffect(() => {
    if (isEthProviderAvailable && !isConnected && connectors.length > 0) {
      connect({ connector: connectors[0] });
    }
  }, [isEthProviderAvailable, isConnected, connectors, connect]);

  const handleFlip = (idx: number) => {
    if (flipped.length < 2 && !flipped.includes(idx) && !matched.includes(cards[idx].id)) {
      setFlipped((prev) => [...prev, idx]);
    }
  };

  const handleRestart = () => {
    setCards(getInitialCards());
    setFlipped([]);
    setMatched([]);
    setMoves(0);
    setScore(0);
    setTimer(0);
    setIsActive(true);
    setMessage("");
  };

  const formatTime = (t: number) => {
    const min = String(Math.floor(t / 60)).padStart(2, "0");
    const sec = String(t % 60).padStart(2, "0");
    return `${min}:${sec}`;
  };

  const handleMint = async () => {
    if (!isConnected) {
      setMessage("Please connect your wallet in Warpcast.");
      return;
    }
    if (chainId !== monadTestnet.id) {
      setMessage("Please manually switch your wallet to Monad Testnet (chain ID 10143) in Warpcast.");
      return;
    }
    setMintStatus("loading");
    setMintMsg("Capturing screenshot and uploading to IPFS...");
    try {
      // 1. Capture screenshot
      const gameNode = document.getElementById("memory-game-screenshot");
      if (!gameNode) throw new Error("Game area not found");
      const canvas = await html2canvas(gameNode);
      // Add padding and random background color
      const PADDING = 25;
      const BG_COLORS = [
        "#fffbe6", // light yellow
        "#e0e7ff", // light blue
        "#ffe4fa", // light pink
        "#e0ffe4", // light green
        "#f3e8ff"  // light purple
      ];
      const bgColor = BG_COLORS[Math.floor(Math.random() * BG_COLORS.length)];
      const paddedCanvas = document.createElement("canvas");
      paddedCanvas.width = canvas.width + PADDING * 2;
      paddedCanvas.height = canvas.height + PADDING * 2;
      const ctx = paddedCanvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, paddedCanvas.width, paddedCanvas.height);
        ctx.drawImage(canvas, PADDING, PADDING);
      }
      const dataUrl = paddedCanvas.toDataURL("image/png");
      const blob = await fetch(dataUrl).then(r => r.blob());
      // 2. Upload image to IPFS
      const formData = new FormData();
      formData.append("file", blob, "game.jpg");
      const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_PINATA_JWT}`,
        },
        body: formData,
      });
      if (!response.ok) throw new Error("IPFS upload failed");
      const { IpfsHash: imageHash } = await response.json();
      setIpfsHash(imageHash);
      const imageIpfsUri = `ipfs://${imageHash}`;
      // 3. Build metadata JSON
      const traitsArr = [
        `Score:${score}`,
        `Moves:${moves}`,
        `Time:${timer}`
      ];
      const metadata = {
        name: `Memory Game Score: ${score}`,
        description: "Memory Game NFT minted from Farcaster Mini App",
        image: imageIpfsUri,
        attributes: traitsArr.map((trait) => ({
          trait_type: trait.split(":")[0],
          value: trait.split(":")[1]
        }))
      };
      const metadataBlob = new Blob([JSON.stringify(metadata)], { type: "application/json" });
      const metadataFormData = new FormData();
      metadataFormData.append("file", metadataBlob, "metadata.json");
      const metadataResponse = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
        method: "POST",
        headers: { "Authorization": `Bearer ${process.env.NEXT_PUBLIC_PINATA_JWT}` },
        body: metadataFormData,
      });
      if (!metadataResponse.ok) throw new Error("Metadata IPFS upload failed");
      const { IpfsHash: metadataHashVal } = await metadataResponse.json();
      setMetadataHash(metadataHashVal);
      const metadataIpfsUri = `ipfs://${metadataHashVal}`;
      // 4. Mint NFT with metadata URI
      setMintMsg("Minting your NFT on Monad Testnet...");
      const data = encodeFunctionData({
        abi: NFT_ABI,
        functionName: "mintScoreNFT",
        args: [score, metadataIpfsUri, traitsArr],
      });
      sendTransaction({
        to: NFT_CONTRACT_ADDRESS,
        value: parseEther("0"),
        data,
        gas: BigInt(500_000),
        gasPrice: parseGwei("0.1"),
      });
    } catch (e: any) {
      setMintStatus("error");
      setMintMsg("Mint failed: " + (e?.message || "Try again."));
    }
  };

  const handleShareToFarcaster = async () => {
    setShareLoading(true);
    try {
      const gameNode = document.getElementById("memory-game-screenshot");
      if (!gameNode) throw new Error("Game area not found");
      const canvas = await html2canvas(gameNode);
      // Add padding and random background color (reuse mint logic)
      const PADDING = 25;
      const BG_COLORS = [
        "#fffbe6", // light yellow
        "#e0e7ff", // light blue
        "#ffe4fa", // light pink
        "#e0ffe4", // light green
        "#f3e8ff"  // light purple
      ];
      const bgColor = BG_COLORS[Math.floor(Math.random() * BG_COLORS.length)];
      const paddedCanvas = document.createElement("canvas");
      paddedCanvas.width = canvas.width + PADDING * 2;
      paddedCanvas.height = canvas.height + PADDING * 2;
      const ctx = paddedCanvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, paddedCanvas.width, paddedCanvas.height);
        ctx.drawImage(canvas, PADDING, PADDING);
      }
      const dataUrl = paddedCanvas.toDataURL("image/png");
      const imgurClientId = process.env.NEXT_PUBLIC_IMGUR_CLIENT_ID || "0c42b41cbbb1203";
      const formData = new FormData();
      formData.append("image", dataUrl.split(",")[1]); // base64 data only

      const res = await fetch("https://api.imgur.com/3/image", {
        method: "POST",
        headers: {
          Authorization: `Client-ID ${imgurClientId}`,
          // DO NOT set Content-Type! Let the browser set it for FormData.
        },
        body: formData,
      });
      const data = await res.json();
      if (!data.success) throw new Error("Imgur upload failed: " + (data.data?.error || ""));
      const imageUrl = data.data.link;
      // Open Warpcast share intent
      const url = `https://warpcast.com/~/compose?text=${encodeURIComponent(shareMessage)}&embeds[]=${encodeURIComponent(imageUrl)}`;
      window.open(url, "_blank");
      setShowShareModal(false);
      setShareMessage("");
    } catch (e) {
      alert("Failed to share image: " + ((e as any)?.message || "Unknown error"));
    } finally {
      setShareLoading(false);
    }
  };

  const handleShareScoreLink = async () => {
    setShareLinkLoading(true);
    try {
      const gameNode = document.getElementById("memory-game-screenshot");
      if (!gameNode) throw new Error("Game area not found");
      const canvas = await html2canvas(gameNode);
      // Add padding and random background color (reuse mint logic)
      const PADDING = 25;
      const BG_COLORS = [
        "#fffbe6", // light yellow
        "#e0e7ff", // light blue
        "#ffe4fa", // light pink
        "#e0ffe4", // light green
        "#f3e8ff"  // light purple
      ];
      const bgColor = BG_COLORS[Math.floor(Math.random() * BG_COLORS.length)];
      const paddedCanvas = document.createElement("canvas");
      paddedCanvas.width = canvas.width + PADDING * 2;
      paddedCanvas.height = canvas.height + PADDING * 2;
      const ctx = paddedCanvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, paddedCanvas.width, paddedCanvas.height);
        ctx.drawImage(canvas, PADDING, PADDING);
      }
      const dataUrl = paddedCanvas.toDataURL("image/png");
      const imgurClientId = process.env.NEXT_PUBLIC_IMGUR_CLIENT_ID || "0c42b41cbbb1203";
      const formData = new FormData();
      formData.append("image", dataUrl.split(",")[1]); // base64 data only
      const res = await fetch("https://api.imgur.com/3/image", {
        method: "POST",
        headers: {
          Authorization: `Client-ID ${imgurClientId}`,
        },
        body: formData,
      });
      const data = await res.json();
      if (!data.success) throw new Error("Imgur upload failed: " + (data.data?.error || ""));
      const imageUrl = data.data.link;
      // Build the share link to the /share page
      const shareUrl = `${window.location.origin}/share?img=${encodeURIComponent(imageUrl)}&score=${encodeURIComponent(score)}`;
      const text = `🎮 Just scored ${score} in Games & Art! 🎯 Think you can beat my score? Challenge accepted! 🏆 Play now and show me what you've got! 🚀`;
      const url = `https://warpcast.com/~/compose?text=${encodeURIComponent(text)}&embeds[]=${encodeURIComponent(shareUrl)}`;
      window.open(url, "_blank");
    } catch (e) {
      alert("Failed to share score link: " + ((e as any)?.message || "Unknown error"));
    } finally {
      setShareLinkLoading(false);
    }
  };

  return (
    <div id="memory-game-root" className="flex flex-col items-center justify-center w-full max-w-md mx-auto p-4 bg-black rounded-lg shadow-lg">
      <div className="text-xl font-extrabold text-pink-400 mb-4 text-center">
        Are you too smart to beat time? Challenge yourself!
      </div>
      {!isEthProviderAvailable && (
        <div className="text-red-400 font-bold mb-4 text-center">
          Wallet not available. Please open this app inside the real Warpcast app.
        </div>
      )}
      {isEthProviderAvailable && !isConnected && (
        <div className="w-full flex flex-col items-center mb-4">
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg text-lg mb-2 disabled:opacity-50"
            onClick={() => connect({ connector: connectors[0] })}
          >
            Connect Wallet
          </button>
          {connectError && <div className="text-xs text-red-400">{connectError.message}</div>}
        </div>
      )}
      {isConnected && chainId !== monadTestnet.id && (
        <div className="w-full flex flex-col items-center mb-4">
          <button
            className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 px-6 rounded-lg text-lg mb-2"
            onClick={() => switchChain({ chainId: monadTestnet.id })}
          >
            Switch to Monad Testnet
          </button>
          {switchError && (
            <div className="text-xs text-red-400">
              Could not switch chain automatically. Please switch your wallet to Monad Testnet (chain ID 10143) in Warpcast.
            </div>
          )}
        </div>
      )}
      <div className="text-xs text-gray-400 mb-2 text-center">
        {isConnected ? (
          <>Chain ID: {chainId} | MON Balance: {balanceData ? balanceData.formatted : "..."}</>
        ) : null}
      </div>
      <div id="memory-game-screenshot">
        <div className="flex justify-between w-full mb-4">
          <div className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-center">
            MOVES
            <div className="text-2xl">{moves}</div>
          </div>
          <div className="bg-purple-500 text-white px-4 py-2 rounded-lg font-bold text-center">
            SCORE
            <div className="text-2xl">{score}</div>
          </div>
          <div className="bg-green-500 text-white px-4 py-2 rounded-lg font-bold text-center">
            <div>⏱</div>
            <div className="text-xl font-mono">{formatTime(timer)}</div>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-3 mb-6">
          {cards.map((card, idx) => {
            const isFlipped = flipped.includes(idx) || matched.includes(card.id);
            return (
              <button
                key={card.id}
                className={`w-20 h-20 flex items-center justify-center border-2 rounded-lg text-3xl font-bold bg-gray-800 ${isFlipped ? "border-green-400" : "border-gray-600"}`}
                onClick={() => handleFlip(idx)}
                disabled={isFlipped || flipped.length === 2 || !isActive}
                style={{ transition: "border 0.2s" }}
              >
                {isFlipped ? (
                  <img src={card.img} alt="card" className="w-16 h-16 object-contain" />
                ) : (
                  <span className="text-4xl text-white">?</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
      {message && <div className="text-yellow-300 font-semibold mb-2 text-center">{message}</div>}
      <button
        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-lg text-lg transition"
        onClick={handleRestart}
      >
        Restart
      </button>
      {(!isActive && matched.length === cards.length) && (
        <div className="w-full flex flex-col items-center mb-4">
          <div className="text-lg font-bold text-yellow-300 mb-2">Beat your current score!</div>
          <div className="grid grid-cols-2 gap-3 w-full mb-2">
            {isConnected && chainId === monadTestnet.id && (
              <button
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg text-lg disabled:opacity-50"
                onClick={handleMint}
                disabled={mintStatus === "loading"}
              >
                {mintStatus === "loading" ? "Minting..." : "Mint Score as NFT"}
              </button>
            )}
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg text-lg"
              onClick={handleRestart}
            >
              Play Again
            </button>
            <button
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-lg text-lg"
              onClick={() => setShowShareModal(true)}
            >
              Share Score Card
            </button>
            <button
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg text-lg"
              onClick={handleShareScoreLink}
              disabled={shareLinkLoading}
            >
              {shareLinkLoading ? "Sharing..." : "Share to Farcaster"}
            </button>
          </div>
          {showShareModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
              <div className="bg-white rounded-xl shadow-2xl p-4 w-[320px] flex flex-col items-center relative border border-purple-200">
                <button
                  className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full bg-white/80 hover:bg-pink-100 border border-pink-200 text-pink-500 text-lg font-bold shadow-sm transition"
                  onClick={() => setShowShareModal(false)}
                  aria-label="Close"
                >
                  ×
                </button>
                <div className="text-base font-bold mb-2 text-purple-700 text-center">Share your moment on Farcaster</div>
                <textarea
                  className="w-full h-16 p-2 border border-purple-200 rounded mb-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-300"
                  placeholder="Add a custom message..."
                  value={shareMessage}
                  onChange={e => setShareMessage(e.target.value)}
                  maxLength={200}
                  style={{ minHeight: 40, maxHeight: 64 }}
                />
                <button
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg text-sm w-full disabled:opacity-50 transition"
                  onClick={handleShareToFarcaster}
                  disabled={shareLoading}
                >
                  {shareLoading ? "Sharing..." : "Share to Farcaster"}
                </button>
              </div>
            </div>
          )}
          {mintStatus === "success" && txHash && metadataHash && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
              <div className="bg-white rounded-2xl shadow-xl p-6 w-[380px] flex flex-col items-center relative">
                <button
                  className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-white/80 hover:bg-green-100 border border-green-200 text-green-500 text-xl font-bold shadow-sm transition"
                  onClick={() => {
                    setMintStatus("idle");
                    setMintMsg("");
                    setTxHash(null);
                    setMetadataHash("");
                  }}
                  aria-label="Close"
                >
                  ×
                </button>
                <div className="text-2xl text-green-500">✓</div>
                <div className="text-base text-green-600 font-semibold mb-2">Successfully Minted!</div>
                <a href={`https://testnet.monadexplorer.com/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="block text-center text-blue-700 underline hover:text-blue-900">View Transaction</a>
                <a href={`https://ipfs.io/ipfs/${metadataHash}`} target="_blank" rel="noopener noreferrer" className="block text-center text-blue-700 underline hover:text-blue-900">View Metadata</a>
              </div>
            </div>
          )}
          {mintStatus === "error" && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
              <div className="bg-white rounded-2xl shadow-xl p-6 w-[380px] flex flex-col items-center relative">
                <button
                  className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-white/80 hover:bg-pink-100 border border-pink-200 text-pink-500 text-xl font-bold shadow-sm transition"
                  onClick={() => {
                    setMintStatus("idle");
                    setMintMsg("");
                  }}
                  aria-label="Close"
                >
                  ×
                </button>
                <div className="text-2xl text-red-500">✗</div>
                <div className="text-base text-red-600 font-semibold mb-2">{mintMsg}</div>
              </div>
            </div>
          )}
        </div>
      )}
      {mintStatus === "loading" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-[380px] flex flex-col items-center">
            <div className="text-lg font-bold mb-2">Minting Memory Game NFT</div>
            <div className="text-sm text-gray-700 mb-4 text-center">{mintMsg}</div>
            {ipfsHash && (
              <a href={`https://ipfs.io/ipfs/${ipfsHash}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">View Screenshot</a>
            )}
          </div>
        </div>
      )}
      <div className="flex flex-col items-center mt-4">
        <img src="/images/profile.png" alt="Chris Wilder" className="w-12 h-12 rounded-full mb-2 border-2 border-gray-400" />
        <a href="https://x.com/chriswilder" target="_blank" rel="noopener noreferrer" className="text-xs text-gray-400 hover:underline text-center">
          Built by Chris Wilder
        </a>
      </div>
    </div>
  );
} 