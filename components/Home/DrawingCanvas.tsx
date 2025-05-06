import React, { useRef, useState } from "react";
import { useAccount, useSendTransaction, useSwitchChain, useConnect, useContractRead } from "wagmi";
import { parseEther, encodeFunctionData, parseGwei } from "viem";
import { monadTestnet } from "viem/chains";
import { useMiniAppContext } from "@/hooks/use-miniapp-context";

// NFT contract address and ABI
const NFT_CONTRACT_ADDRESS = "0x1b948Fd7BF177446Ac258227f008E10231A365Af";
const NFT_ABI = [{"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[{"internalType":"address","name":"sender","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"},{"internalType":"address","name":"owner","type":"address"}],"name":"ERC721IncorrectOwner","type":"error"},{"inputs":[{"internalType":"address","name":"operator","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"ERC721InsufficientApproval","type":"error"},{"inputs":[{"internalType":"address","name":"approver","type":"address"}],"name":"ERC721InvalidApprover","type":"error"},{"inputs":[{"internalType":"address","name":"operator","type":"address"}],"name":"ERC721InvalidOperator","type":"error"},{"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"ERC721InvalidOwner","type":"error"},{"inputs":[{"internalType":"address","name":"receiver","type":"address"}],"name":"ERC721InvalidReceiver","type":"error"},{"inputs":[{"internalType":"address","name":"sender","type":"address"}],"name":"ERC721InvalidSender","type":"error"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"ERC721NonexistentToken","type":"error"},{"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"OwnableInvalidOwner","type":"error"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"OwnableUnauthorizedAccount","type":"error"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"approved","type":"address"},{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"operator","type":"address"},{"indexed":false,"internalType":"bool","name":"approved","type":"bool"}],"name":"ApprovalForAll","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"_fromTokenId","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"_toTokenId","type":"uint256"}],"name":"BatchMetadataUpdate","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"_tokenId","type":"uint256"}],"name":"MetadataUpdate","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"},{"indexed":false,"internalType":"string","name":"uri","type":"string"}],"name":"NFTMinted","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"Transfer","type":"event"},{"inputs":[],"name":"MINT_PRICE","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"approve","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"getApproved","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getMintPrice","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"pure","type":"function"},{"inputs":[],"name":"getTotalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"getTraits","outputs":[{"internalType":"string[]","name":"","type":"string[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"operator","type":"address"}],"name":"isApprovedForAll","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"string","name":"uri","type":"string"},{"internalType":"string[]","name":"traits","type":"string[]"}],"name":"mint","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"payable","type":"function"},{"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"ownerOf","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"safeTransferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"},{"internalType":"bytes","name":"data","type":"bytes"}],"name":"safeTransferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"operator","type":"address"},{"internalType":"bool","name":"approved","type":"bool"}],"name":"setApprovalForAll","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes4","name":"interfaceId","type":"bytes4"}],"name":"supportsInterface","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"tokenURI","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"transferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"withdraw","outputs":[],"stateMutability":"nonpayable","type":"function"}];

const CANVAS_WIDTH = 340;
const CANVAS_HEIGHT = 340;

const ToolIcon = ({ type, active, ...props }: { type: string; active?: boolean; [key: string]: any }) => {
  switch (type) {
    case "brush":
      return (
        <svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
          <rect x="10" y="2" width="4" height="14" rx="2" fill={active ? "#2563eb" : "#a3a3a3"} />
          <ellipse cx="12" cy="18" rx="4" ry="2" fill={active ? "#2563eb" : "#a3a3a3"} />
        </svg>
      );
    case "eraser":
      return (
        <svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
          <rect x="6" y="4" width="12" height="12" rx="3" fill={active ? "#f59e42" : "#a3a3a3"} />
        </svg>
      );
    case "undo":
      return (
        <svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
          <path d="M12 5v2a7 7 0 1 1-7 7" stroke="#f43f5e" strokeWidth={2.5} fill="none" />
          <polyline points="5 8 5 14 11 14" stroke="#f43f5e" strokeWidth={2.5} fill="none" />
        </svg>
      );
    default:
      return null;
  }
};

function useResponsiveCanvasSize() {
  // For mobile, shrink canvas to fit screen
  const [size, setSize] = useState(CANVAS_WIDTH);
  React.useEffect(() => {
    const update = () => {
      setSize(Math.min(window.innerWidth - 32, CANVAS_WIDTH));
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return size;
}

function drawGrid(ctx: CanvasRenderingContext2D, size: number) {
  ctx.save();
  ctx.strokeStyle = "#fce4ec";
  ctx.lineWidth = 1;
  for (let x = 0; x < size; x += 20) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, size);
    ctx.stroke();
  }
  for (let y = 0; y < size; y += 20) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y);
    ctx.stroke();
  }
  ctx.restore();
}

export default function DrawingCanvas({ onExport, onBack }: { onExport?: (dataUrl: string) => void, onBack?: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState("#e57373");
  const [bgColor, setBgColor] = useState("#fdf6fa");
  const [brushSize, setBrushSize] = useState(5);
  const [mode, setMode] = useState<"brush" | "eraser">("brush");
  const [history, setHistory] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [mintStep, setMintStep] = useState<"idle"|"traits"|"ipfs"|"mint"|"success"|"error">("idle");
  const [mintMsg, setMintMsg] = useState("");
  const [selectedTraits, setSelectedTraits] = useState<string[]>([]);
  const [ipfsHash, setIpfsHash] = useState<string>("");
  const [txHash, setTxHash] = useState<string>("");
  const size = useResponsiveCanvasSize();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [artworkName, setArtworkName] = useState("");
  const [traits, setTraits] = useState([{ type: "", value: "" }]);

  const { isConnected, address, chainId } = useAccount();
  const { data, isSuccess, isError, sendTransaction } = useSendTransaction({
    mutation: {
      onSuccess: (txHash: string) => {
        setTxHash(txHash);
        setMintStep("success");
        setMintMsg("Minted! View your NFT on Monad Explorer.");
      },
      onError: () => {
        setMintStep("error");
        setMintMsg("Mint failed. Please try again.");
      },
    },
  });
  const { switchChain, error: switchError } = useSwitchChain();
  const { connect, connectors, error: connectError } = useConnect();
  const { isEthProviderAvailable } = useMiniAppContext();

  // Fetch mint price from contract (fallback to 0.0001 MON if not available)
  const { data: mintPriceData } = useContractRead({
    address: NFT_CONTRACT_ADDRESS,
    abi: NFT_ABI,
    functionName: "getMintPrice",
  });
  const mintPrice = mintPriceData ? BigInt(mintPriceData.toString()) : parseEther("0.0001");

  React.useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      drawGrid(ctx, CANVAS_WIDTH);
    }
  }, [bgColor]);

  // Mouse and touch events
  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    if ("touches" in e) {
      const t = e.touches[0];
      return { x: t.clientX - rect.left, y: t.clientY - rect.top };
    } else {
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }
  };
  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setDrawing(true);
    draw(e);
  };
  const endDrawing = () => {
    setDrawing(false);
    if (canvasRef.current) {
      setHistory((h) => [...h, canvasRef.current!.toDataURL()]);
    }
  };
  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.arc(x, y, brushSize / 2, 0, 2 * Math.PI);
    ctx.fillStyle = mode === "brush" ? brushColor : bgColor;
    ctx.fill();
  };
  const handleUndo = () => {
    if (history.length === 0 || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    const img = new window.Image();
    img.onload = () => {
      ctx?.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx?.drawImage(img, 0, 0);
      drawGrid(ctx!, CANVAS_WIDTH);
    };
    img.src = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
  };
  const handleAddTrait = () => {
    setTraits([...traits, { type: "", value: "" }]);
  };
  const handleRemoveTrait = (idx: number) => {
    setTraits(traits.filter((_, i) => i !== idx));
  };
  const handleTraitChange = (idx: number, field: "type" | "value", val: string) => {
    setTraits(traits.map((t, i) => (i === idx ? { ...t, [field]: val } : t)));
  };

  const handleMint = async () => {
    if (!isConnected) {
      setMintMsg("Please connect your wallet in Warpcast.");
      setMintStep("error");
      return;
    }
    if (chainId !== monadTestnet.id) {
      setMintMsg("Please manually switch your wallet to Monad Testnet (chain ID 10143) in Warpcast.");
      setMintStep("error");
      return;
    }
    setShowModal(true);
    setMintStep("traits");
    setMintMsg("");
  };

  const handleTraitsSubmit = async () => {
    if (!artworkName.trim()) {
      setMintMsg("Please enter an artwork name.");
      return;
    }
    setMintStep("ipfs");
    setMintMsg("Uploading your 1/1 to IPFS...");
    try {
      // 1. Upload image to IPFS
      const canvas = canvasRef.current;
      if (!canvas) throw new Error("Canvas not found");
      const dataUrl = canvas.toDataURL("image/png");
      const blob = await fetch(dataUrl).then(r => r.blob());
      const formData = new FormData();
      formData.append("file", blob, "artwork.png");
      const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_PINATA_JWT}`,
        },
        body: formData,
      });
      if (!response.ok) throw new Error("IPFS upload failed");
      const { IpfsHash: imageHash } = await response.json();
      const imageIpfsUri = `ipfs://${imageHash}`;
      setIpfsHash(imageHash);

      // 2. Build metadata JSON
      const filteredTraits = traits.filter(t => t.type && t.value);
      const metadata = {
        name: artworkName,
        description: "Drawn in the Fun & Fund Mini App",
        image: imageIpfsUri,
        attributes: filteredTraits.map(t => ({ trait_type: t.type, value: t.value })),
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
      const { IpfsHash: metadataHash } = await metadataResponse.json();
      const metadataIpfsUri = `ipfs://${metadataHash}`;

      // 3. Mint NFT with metadata URI
      setMintStep("mint");
      setMintMsg("Minting your 1/1 collection...");
      const data = encodeFunctionData({
        abi: NFT_ABI,
        functionName: "mint",
        args: [metadataIpfsUri, filteredTraits.map(t => `${t.type}:${t.value}`)],
      });
      await sendTransaction({
        to: NFT_CONTRACT_ADDRESS,
        value: mintPrice,
        data,
        gas: BigInt(500_000),
        gasPrice: parseGwei("0.1"),
      });
    } catch (e: any) {
      setMintStep("error");
      setMintMsg("Mint failed: " + (e?.message || "Try again."));
    }
  };

  // Add image logic
  const handleAddImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    const img = new window.Image();
    img.onload = () => {
      // Scale image to fit canvas
      const scale = Math.min(CANVAS_WIDTH / img.width, CANVAS_HEIGHT / img.height, 1);
      const w = img.width * scale;
      const h = img.height * scale;
      const x = (CANVAS_WIDTH - w) / 2;
      const y = (CANVAS_HEIGHT - h) / 2;
      ctx?.drawImage(img, x, y, w, h);
    };
    img.src = URL.createObjectURL(file);
    // Reset file input
    e.target.value = "";
  };
  return (
    <div className="flex flex-col items-center w-full relative">
      {onBack && (
        <button
          className="absolute top-0 left-0 z-10 flex items-center gap-1 px-3 py-1 bg-white/80 text-gray-700 rounded-full text-sm font-medium hover:bg-white transition -translate-y-1"
          onClick={onBack}
          style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
        >
          <span className="text-lg">←</span> Back
        </button>
      )}
      <div className="pt-12 w-full flex flex-col items-center">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between w-full max-w-lg p-2 mb-2 rounded-2xl shadow bg-white/80 gap-2">
          <label className="flex items-center gap-2 px-3 py-2 rounded-full shadow-sm bg-white border border-gray-100">
            <span className="w-4 h-4 rounded-full" style={{ background: brushColor }} />
            <span className="text-xs font-semibold text-gray-700">Select Color</span>
            <input type="color" value={brushColor} onChange={e => setBrushColor(e.target.value)} className="w-6 h-6 border-none bg-transparent" />
          </label>
          <label className="flex items-center gap-2 px-3 py-2 rounded-full shadow-sm bg-white border border-gray-100">
            <span className="w-4 h-4 rounded-full" style={{ background: bgColor }} />
            <span className="text-xs font-semibold text-gray-700">Bg Color</span>
            <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} className="w-6 h-6 border-none bg-transparent" />
          </label>
          <button
            className={`flex items-center gap-2 px-3 py-2 rounded-full shadow-sm border font-semibold text-xs ${mode === "brush" ? "bg-blue-100 text-blue-700 border-blue-200" : "bg-white text-gray-700 border-gray-100"}`}
            onClick={() => setMode("brush")}
          >
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none"><rect x="10" y="2" width="4" height="14" rx="2" fill="#2563eb" /><ellipse cx="12" cy="18" rx="4" ry="2" fill="#2563eb" /></svg>
            Brush
          </button>
          <button
            className={`flex items-center gap-2 px-3 py-2 rounded-full shadow-sm border font-semibold text-xs ${mode === "eraser" ? "bg-orange-100 text-orange-700 border-orange-200" : "bg-white text-gray-700 border-gray-100"}`}
            onClick={() => setMode("eraser")}
          >
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none"><rect x="6" y="4" width="12" height="12" rx="3" fill="#f59e42" /></svg>
            Eraser
          </button>
          <button
            className="flex items-center gap-2 px-3 py-2 rounded-full shadow-sm bg-white border border-gray-100"
            onClick={() => fileInputRef.current?.click()}
          >
            <svg width={20} height={20} fill="none" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="4" stroke="#888" strokeWidth={2} fill="#f3f3f3" /><path d="M8 12h8M12 8v8" stroke="#888" strokeWidth={2} strokeLinecap="round" /></svg>
            <span className="text-xs font-semibold text-gray-700">Add Image</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAddImage}
            />
          </button>
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-pink-500 font-bold text-sm">Brush Size:</span>
            <input type="range" min={2} max={24} value={brushSize} onChange={e => setBrushSize(Number(e.target.value))} className="accent-pink-400" />
            <span className="text-green-500 font-bold text-sm">{brushSize}px</span>
          </div>
        </div>
        {/* Canvas with grid bg */}
        <div className="mt-8">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            style={{ background: bgColor, borderRadius: 18, width: CANVAS_WIDTH, height: CANVAS_HEIGHT, touchAction: "none" }}
            onMouseDown={startDrawing}
            onMouseUp={endDrawing}
            onMouseOut={endDrawing}
            onMouseMove={draw}
            onTouchStart={startDrawing}
            onTouchEnd={endDrawing}
            onTouchCancel={endDrawing}
            onTouchMove={draw}
          />
        </div>
        {/* Undo and Mint buttons */}
        <div className="flex w-full max-w-lg mt-3 gap-2">
          <button
            className="flex-1 py-2 rounded-full bg-pink-500 text-white font-bold shadow hover:bg-pink-600 transition"
            onClick={handleUndo}
          >
            Undo
          </button>
          <button
            className="flex-1 py-2 rounded-full bg-green-500 text-white font-bold shadow hover:bg-green-600 transition"
            onClick={handleMint}
          >
            Mint
          </button>
        </div>
        {/* Minting modal with traits */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
            <div className="bg-white rounded-2xl shadow-xl p-6 w-[380px] flex flex-col items-center relative" style={{background: 'linear-gradient(135deg, #fff0f6 0%, #fdf6fa 100%)'}}>
              {/* X Close Button */}
              <button
                className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-white/80 hover:bg-pink-100 border border-pink-200 text-pink-500 text-xl font-bold shadow-sm transition"
                onClick={() => {
                  setShowModal(false);
                  setMintStep("idle");
                  setMintMsg("");
                  setArtworkName("");
                  setTraits([{ type: "", value: "" }]);
                }}
                aria-label="Close"
              >
                ×
              </button>
              <div className="text-2xl font-extrabold mb-1 bg-gradient-to-r from-pink-500 to-pink-400 bg-clip-text text-transparent">Mint Your 1/1 NFT</div>
              <div className="text-sm text-gray-700 mb-4 text-center">You&apos;re about to mint your artwork as a unique 1/1 NFT. Each piece is one-of-a-kind and will be permanently stored on the blockchain.</div>
              {mintStep === "traits" && (
                <>
                  <div className="w-full bg-white/70 rounded-xl p-4 mb-4">
                    <div className="font-semibold text-gray-800 mb-2">Artwork Details</div>
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-semibold text-gray-500">Name</label>
                      <input
                        className="w-full px-3 py-2 rounded-lg border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-300 bg-white text-gray-900 font-semibold"
                        placeholder="My Artwork"
                        value={artworkName}
                        onChange={e => setArtworkName(e.target.value)}
                        maxLength={32}
                        required
                      />
                      <div className="flex gap-4 mt-2 text-xs text-gray-600">
                        <div>Edition: <span className="font-bold">1 of 1</span></div>
                        <div>Mint Price: <span className="font-bold">0.0001 MON</span></div>
                      </div>
                    </div>
                  </div>
                  <div className="w-full mb-2">
                    <div className="font-semibold text-gray-800 mb-1">Add Custom Traits <span className="text-xs text-gray-400">(Optional)</span></div>
                    <div className="text-xs text-gray-500 mb-2">Traits help describe your artwork and make it more discoverable.</div>
                    <div className="flex flex-col gap-1">
                      {traits.map((trait, idx) => (
                        <div key={idx} className="flex gap-2 items-center w-full">
                          <input
                            className="flex-1 min-w-0 px-2 py-1 rounded-lg border border-pink-100 bg-white text-gray-900 text-sm"
                            placeholder="Trait Type"
                            value={trait.type}
                            onChange={e => handleTraitChange(idx, "type", e.target.value)}
                            maxLength={16}
                          />
                          <input
                            className="flex-1 min-w-0 px-2 py-1 rounded-lg border border-pink-100 bg-white text-gray-900 text-sm"
                            placeholder="Value"
                            value={trait.value}
                            onChange={e => handleTraitChange(idx, "value", e.target.value)}
                            maxLength={24}
                          />
                          {traits.length > 1 && (
                            <button
                              className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-pink-50 hover:bg-pink-100 text-pink-500 text-base ml-1 border border-pink-100"
                              onClick={() => handleRemoveTrait(idx)}
                              title="Remove Trait"
                              type="button"
                              tabIndex={-1}
                            >
                              &#128465;
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <button
                      className="text-pink-500 hover:text-pink-700 text-sm font-semibold mt-1"
                      onClick={handleAddTrait}
                      type="button"
                    >
                      + Add Trait
                    </button>
                  </div>
                  {mintMsg && <div className="text-xs text-red-500 mb-2">{mintMsg}</div>}
                  <div className="flex w-full justify-between mt-4">
                    <button
                      className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold"
                      onClick={() => {
                        setShowModal(false);
                        setMintStep("idle");
                        setMintMsg("");
                        setArtworkName("");
                        setTraits([{ type: "", value: "" }]);
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      className="px-4 py-2 rounded-lg bg-pink-400 hover:bg-pink-500 text-white font-bold disabled:opacity-50"
                      onClick={handleTraitsSubmit}
                      disabled={!artworkName.trim()}
                    >
                      Mint as 1/1 NFT
                    </button>
                  </div>
                </>
              )}
              {mintStep === "ipfs" && (
                <div className="w-full space-y-4">
                  <div className="animate-pulse flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-pink-400 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <div className="text-sm text-center">Uploading to IPFS...</div>
                </div>
              )}
              {mintStep === "mint" && (
                <div className="w-full space-y-4">
                  <div className="animate-pulse flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-pink-400 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <div className="text-sm text-center">Minting your NFT... Waiting for confirmation.</div>
                </div>
              )}
              {mintStep === "success" && ipfsHash && txHash && (
                <div className="w-full flex flex-col items-center space-y-4">
                  <div className="text-2xl text-green-500">✓</div>
                  <div className="text-base text-green-600 font-semibold">Successfully Minted!</div>
                  <a
                    href={`https://testnet.monadexplorer.com/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-center text-blue-700 underline hover:text-blue-900"
                  >
                    View Transaction
                  </a>
                  <a
                    href={`https://ipfs.io/ipfs/${ipfsHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-center text-blue-700 underline hover:text-blue-900"
                  >
                    View IPFS
                  </a>
                </div>
              )}
              {isError && mintStep === "mint" && (
                <div className="w-full space-y-4">
                  <div className="flex items-center justify-center text-red-500">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <div className="text-sm text-center text-red-500">Mint failed. Please try again.</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 