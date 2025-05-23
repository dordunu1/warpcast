"use client";
import React, { useEffect, useState } from "react";
import { useAccount, useSendTransaction, useSwitchChain, useConnect, useBalance } from "wagmi";
import { parseEther, encodeFunctionData, parseGwei } from "viem";
import { monadTestnet } from "viem/chains";
import { useMiniAppContext } from "@/hooks/use-miniapp-context";
import html2canvas from "html2canvas";
import { FaInfoCircle } from "react-icons/fa";
import { useFrame } from "../farcaster-provider";
import { db } from '../../lib/firebase-config';
import { collection, addDoc, getDocs, query, orderBy, limit, setDoc, doc, getDoc } from 'firebase/firestore';

const CARD_IMAGES = Array.from({ length: 8 }, (_, i) => `/images/${i + 1}.jpeg`);
const TOTAL_PAIRS = 8;
const GRID_SIZE = 4;

// Real contract address and ABI
const NFT_CONTRACT_ADDRESS = "0x1b948Fd7BF177446Ac258227f008E10231A365Af";
const NFT_ABI = [
  {"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[{"internalType":"address","name":"sender","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"},{"internalType":"address","name":"owner","type":"address"}],"name":"ERC721IncorrectOwner","type":"error"},{"inputs":[{"internalType":"address","name":"operator","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"ERC721InsufficientApproval","type":"error"},{"inputs":[{"internalType":"address","name":"approver","type":"address"}],"name":"ERC721InvalidApprover","type":"error"},{"inputs":[{"internalType":"address","name":"operator","type":"address"}],"name":"ERC721InvalidOperator","type":"error"},{"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"ERC721InvalidOwner","type":"error"},{"inputs":[{"internalType":"address","name":"receiver","type":"address"}],"name":"ERC721InvalidReceiver","type":"error"},{"inputs":[{"internalType":"address","name":"sender","type":"address"}],"name":"ERC721InvalidSender","type":"error"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"ERC721NonexistentToken","type":"error"},{"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"OwnableInvalidOwner","type":"error"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"OwnableUnauthorizedAccount","type":"error"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"approved","type":"address"},{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"operator","type":"address"},{"indexed":false,"internalType":"bool","name":"approved","type":"bool"}],"name":"ApprovalForAll","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"_fromTokenId","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"_toTokenId","type":"uint256"}],"name":"BatchMetadataUpdate","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"_tokenId","type":"uint256"}],"name":"MetadataUpdate","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"Transfer","type":"event"},{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"approve","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"getApproved","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"getScore","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"getTraits","outputs":[{"internalType":"string[]","name":"","type":"string[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"operator","type":"address"}],"name":"isApprovedForAll","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"score","type":"uint256"},{"internalType":"string","name":"metadataUri","type":"string"},{"internalType":"string[]","name":"traits","type":"string[]"}],"name":"mintScoreNFT","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"nextTokenId","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"ownerOf","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"safeTransferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"},{"internalType":"bytes","name":"data","type":"bytes"}],"name":"safeTransferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"operator","type":"address"},{"internalType":"bool","name":"approved","type":"bool"}],"name":"setApprovalForAll","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes4","name":"interfaceId","type":"bytes4"}],"name":"supportsInterface","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"tokenScore","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"uint256","name":"","type":"uint256"}],"name":"tokenTraits","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"tokenURI","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"transferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"}];

const MINIAPP_URL = process.env.NEXT_PUBLIC_MINIAPP_URL || "https://chrismini.netlify.app/";

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

export default function MemoryGame({ onBack }: { onBack?: () => void }) {
  const { isConnected, address, chainId } = useAccount();
  const { context } = useFrame();
  const farcasterName = context?.user?.displayName || context?.user?.username || (address ? address.slice(0, 8) : 'Anonymous');
  const farcasterPfp = context?.user?.pfpUrl || `https://api.dicebear.com/7.x/notionists/svg?seed=${farcasterName}`;

  // Leaderboard state
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [submittingScore, setSubmittingScore] = useState(false);
  // Pagination state for leaderboard
  const [lastVisibleLeaderboardDoc, setLastVisibleLeaderboardDoc] = useState<any>(null);
  const [hasMoreLeaderboard, setHasMoreLeaderboard] = useState(true);

  const { data, isSuccess, isError, sendTransaction } = useSendTransaction();
  const { switchChain, error: switchError } = useSwitchChain();
  const { connect, connectors, error: connectError } = useConnect();
  const { isEthProviderAvailable, actions } = useMiniAppContext();
  const { data: balanceData } = useBalance({ address, chainId: monadTestnet.id });

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
  const [shareScoreLoading, setShareScoreLoading] = useState(false);
  const [shareGameLoading, setShareGameLoading] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

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

      // Submit leaderboard entry (one per user, only if better)
      (async () => {
        setSubmittingScore(true);
        try {
          if (address) {
            const userDocRef = doc(db, "memoryLeaderboard", address);
            const existingDoc = await getDoc(userDocRef);
            let shouldUpdate = false;
            if (!existingDoc.exists()) {
              shouldUpdate = true;
            } else {
              const data = existingDoc.data();
              if (
                moves < data.moves ||
                (moves === data.moves && timer < data.time)
              ) {
                shouldUpdate = true;
              }
            }
            if (shouldUpdate) {
              await setDoc(userDocRef, {
                name: farcasterName,
                pfpUrl: farcasterPfp,
                moves,
                time: timer,
                address: address || '',
                createdAt: Date.now(),
              });
            }
          } else {
            // fallback for no address (anonymous)
            await addDoc(collection(db, "memoryLeaderboard"), {
              name: farcasterName,
              pfpUrl: farcasterPfp,
              moves,
              time: timer,
              address: '',
              createdAt: Date.now(),
            });
          }
        } catch (err) {
          console.error("Failed to write leaderboard entry:", err);
          setMessage("Failed to save your score. Please try again!");
        }
        setSubmittingScore(false);
        fetchLeaderboard();
      })();
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
        description: "Memory Game NFT minted from Fun & Fund Mini App",
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
    setShareScoreLoading(true);
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
      
      // Use Farcaster SDK's composeCast action instead of window.open
      if (actions) {
        await actions.composeCast({
          text: shareMessage || `🎮 Just scored ${score} in Fun & Fund! 🎯 Think you can beat my score? Challenge accepted! 🏆 Play now and show me what you've got! 🚀`,
          embeds: [imageUrl],
        });
      } else {
        // Fallback for non-Farcaster environment
        const url = `https://warpcast.com/~/compose?text=${encodeURIComponent(shareMessage)}&embeds[]=${encodeURIComponent(imageUrl)}`;
        window.open(url, "_blank");
      }
      setShowShareModal(false);
      setShareMessage("");
    } catch (e) {
      alert("Failed to share image: " + ((e as any)?.message || "Unknown error"));
    } finally {
      setShareScoreLoading(false);
    }
  };

  const handleShareScoreLink = async () => {
    setShareScoreLoading(true);
    try {
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
      // Convert to base64 (remove data:image/png;base64, prefix)
      const dataUrl = paddedCanvas.toDataURL("image/png");
      const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
      const imgurClientId = process.env.NEXT_PUBLIC_IMGUR_CLIENT_ID || "0c42b41cbbb1203";
      const formData = new FormData();
      formData.append("image", base64Data);
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
      const text = `🎮 Just scored ${score} in Fun & Fund! 🎯 Think you can beat my score? Challenge accepted! 🏆 Play now and show me what you've got! 🚀`;
      if (actions) {
        await actions.composeCast({
          text,
          embeds: [imageUrl],
        });
      } else {
        const url = `https://warpcast.com/~/compose?text=${encodeURIComponent(text)}&embeds[]=${encodeURIComponent(imageUrl)}`;
        window.open(url, "_blank");
      }
    } catch (e) {
      alert("Failed to share score link: " + ((e as any)?.message || "Unknown error"));
    } finally {
      setShareScoreLoading(false);
    }
  };

  const handleShareGameLink = async () => {
    setShareGameLoading(true);
    const text = `🎮 I just scored ${score} on Memory Game, can you beat me?? 🚀 Play Fun & Fund now!`;
    if (actions) {
      await actions.composeCast({
        text,
        embeds: [MINIAPP_URL],
      });
    } else {
      const url = `https://warpcast.com/~/compose?text=${encodeURIComponent(text)}&embeds[]=${encodeURIComponent(MINIAPP_URL)}`;
      window.open(url, "_blank");
    }
    setShareGameLoading(false);
  };

  // Fetch leaderboard entries with pagination
  async function fetchLeaderboard(loadMore = false) {
    const { collection, query, orderBy, limit, startAfter, getDocs } = await import('firebase/firestore');
    const leaderboardRef = collection(db, "memoryLeaderboard");
    let q;
    if (loadMore && lastVisibleLeaderboardDoc) {
      q = query(
        leaderboardRef,
        orderBy("moves", "asc"),
        orderBy("time", "asc"),
        startAfter(lastVisibleLeaderboardDoc),
        limit(20)
      );
    } else {
      q = query(
        leaderboardRef,
        orderBy("moves", "asc"),
        orderBy("time", "asc"),
        limit(20)
      );
    }
    const snapshot = await getDocs(q);
    const docs = snapshot.docs.map(doc => doc.data());
    if (loadMore) {
      setLeaderboard(prev => [...prev, ...docs]);
    } else {
      setLeaderboard(docs);
    }
    if (snapshot.docs.length < 20) {
      setHasMoreLeaderboard(false);
    } else {
      setHasMoreLeaderboard(true);
      setLastVisibleLeaderboardDoc(snapshot.docs[snapshot.docs.length - 1]);
    }
  }

  return (
    <div id="memory-game-root" className="fixed inset-0 z-50 min-h-screen w-full !bg-black flex flex-col items-center justify-center overflow-auto">
      {/* Leaderboard Button (top left) and Info Icon (top right) */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50">
        <button
          onClick={() => {
            setShowLeaderboard(true);
            fetchLeaderboard();
          }}
          className="text-yellow-300 hover:text-yellow-400 font-bold text-lg bg-gray-800 px-4 py-1 rounded-full border border-yellow-700 shadow transition"
        >
          Leaderboard
        </button>
      </div>
      <div className="absolute top-4 right-4 z-50">
        <button onClick={() => setShowInfo(true)} className="text-blue-400 hover:text-blue-600 text-2xl" title="How to play">
          <FaInfoCircle />
        </button>
      </div>
      {showInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-[340px] flex flex-col items-center relative">
            <button
              className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-white/80 hover:bg-blue-100 border border-blue-200 text-blue-500 text-xl font-bold shadow-sm transition"
              onClick={() => setShowInfo(false)}
              aria-label="Close"
            >
              ×
            </button>
            <div className="text-xl font-bold text-blue-600 mb-2">How to Play</div>
            <ul className="text-gray-700 text-base list-disc pl-5 space-y-2 text-left">
              <li>Flip two cards at a time to find matching pairs.</li>
              <li>If the cards match, they stay revealed. If not, they flip back.</li>
              <li>Try to match all pairs with the fewest moves and in the shortest time.</li>
              <li>Your score increases with each match. Good luck!</li>
            </ul>
          </div>
        </div>
      )}
      {/* Leaderboard Modal */}
      {showLeaderboard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
          <div className="bg-gray-900 rounded-2xl shadow-2xl p-6 w-[370px] max-h-[80vh] flex flex-col items-center relative border border-yellow-400">
            <button
              className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-gray-800 hover:bg-yellow-100 border border-yellow-200 text-yellow-400 text-xl font-bold shadow-sm transition"
              onClick={() => setShowLeaderboard(false)}
              aria-label="Close"
            >
              ×
            </button>
            <div className="text-2xl font-bold text-yellow-300 mb-2 tracking-wide">Leaderboard</div>
            <div className="w-full overflow-y-auto">
              {submittingScore && (
                <div className="text-yellow-200 text-center py-4">Submitting your score...</div>
              )}
              {leaderboard.length === 0 && !submittingScore && (
                <div className="text-gray-400 text-center py-4">No entries yet. Be the first!</div>
              )}
              <table className="w-full text-left mt-2">
                <thead>
                  <tr className="text-yellow-400 text-sm border-b border-yellow-800">
                    <th className="py-1">#</th>
                    <th className="py-1">Player</th>
                    <th className="py-1">Moves</th>
                    <th className="py-1">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry, idx) => {
                    const isCurrent = entry.address === address && entry.moves === moves && entry.time === timer;
                    return (
                      <tr key={idx} className={isCurrent ? "bg-yellow-900/40" : "hover:bg-gray-800/60 transition"}>
                        <td className="py-1 px-2 text-yellow-300 font-bold">{idx + 1}</td>
                        <td className="py-1 px-2 flex items-center gap-2">
                          <img src={entry.pfpUrl} alt="pfp" className="w-7 h-7 rounded-full border-2 border-yellow-400 bg-gray-700" />
                          <span className="text-yellow-100 font-semibold truncate max-w-[100px]">{entry.name}</span>
                        </td>
                        <td className="py-1 px-2 text-yellow-200 font-mono">{entry.moves}</td>
                        <td className="py-1 px-2 text-yellow-200 font-mono">{formatTime(entry.time)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {hasMoreLeaderboard && !submittingScore && (
                <button
                  className="mt-4 w-full bg-yellow-700 hover:bg-yellow-800 text-yellow-100 font-bold py-2 rounded-lg transition"
                  onClick={() => fetchLeaderboard(true)}
                >
                  Show More
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      {onBack && (
        <button
          className="absolute top-0 left-0 z-50 flex items-center gap-1 px-3 py-1 bg-white/80 text-gray-700 rounded-full text-sm font-medium hover:bg-white transition -translate-y-1"
          onClick={onBack}
          style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
        >
          <span className="text-lg">←</span> Back
        </button>
      )}
      <div className="text-xl font-extrabold text-pink-400 mb-4 text-center pt-16">
        Are you too smart to beat time?!
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
        className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-8 rounded-lg text-lg transition mx-auto block"
        onClick={handleRestart}
      >
        Restart
      </button>
      {(!isActive && matched.length === cards.length) && (
        <div className="w-full flex flex-col items-center mb-4">
          <div className="text-lg font-bold text-yellow-300 mb-2">Beat your current score!</div>
          <div className="grid grid-cols-2 gap-3 w-full mb-2 px-2 md:px-4 pt-2 pb-4">
            {isConnected && chainId === monadTestnet.id && (
              <button
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg text-base min-w-[120px] transition"
                onClick={handleMint}
                disabled={mintStatus === "loading"}
              >
                {mintStatus === "loading" ? "Minting..." : "Mint Score as NFT"}
              </button>
            )}
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg text-base min-w-[120px] transition"
              onClick={handleRestart}
            >
              Play Again
            </button>
            <button
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg text-base min-w-[120px] transition"
              onClick={handleShareScoreLink}
              disabled={shareScoreLoading}
            >
              {shareScoreLoading ? "Sharing..." : "Share Score Card"}
            </button>
            <button
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg text-base min-w-[120px] transition"
              onClick={handleShareGameLink}
              disabled={shareGameLoading}
            >
              {shareGameLoading ? "Sharing..." : "Share to Farcaster"}
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
                  disabled={shareScoreLoading}
                >
                  {shareScoreLoading ? "Sharing..." : "Share to Farcaster"}
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