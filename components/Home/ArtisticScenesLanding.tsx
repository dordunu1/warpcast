import React, { useState, useEffect } from "react";
import { FaPaintBrush, FaRocket, FaCoins, FaThList, FaHome, FaMusic, FaCamera, FaGamepad, FaGem, FaEllipsisH, FaDiscord, FaTwitter } from "react-icons/fa";
import DrawingCanvas from "./DrawingCanvas";
import LaunchpadModal from "./LaunchpadModal";
import CollectionsPage from "./CollectionsPage";
import { NFTCollection, getNFTCollections } from "../../lib/firebase";
import ProgressModal from "./ProgressModal";
import { useAccount, useConnect, useSwitchChain, usePublicClient, useContractWrite, useContractRead } from "wagmi";
import { parseEther, parseGwei } from "viem";
import { monadTestnet } from "viem/chains";

const NAV_ITEMS = [
  { key: "home", label: "Home", icon: <FaHome /> },
  { key: "canvas", label: "Canvas", icon: <FaPaintBrush /> },
  { key: "launchpad", label: "Launchpad", icon: <FaRocket /> },
  { key: "collections", label: "Collections", icon: <FaThList /> },
  { key: "history", label: "History", icon: <FaCoins className="text-gray-400" /> },
];

// Utility to truncate addresses
function truncateAddress(addr?: string) {
  if (!addr) return '';
  return addr.slice(0, 6) + '...' + addr.slice(-4);
}

// Utility to copy text
function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text);
}

// Utility to format unix timestamp to date
function formatDate(ts?: number | string) {
  if (!ts) return '--/--/----';
  const t = typeof ts === 'string' ? parseInt(ts) : ts;
  if (!t) return '--/--/----';
  const d = new Date(t * 1000);
  return d.toLocaleDateString();
}

// Category icon mapping (same as CollectionsPage)
const categoryIcons: Record<string, JSX.Element> = {
  Art: <FaPaintBrush className="text-xl text-blue-500" />,
  Music: <FaMusic className="text-xl text-pink-500" />,
  Photography: <FaCamera className="text-xl text-purple-500" />,
  Games: <FaGamepad className="text-xl text-green-500" />,
  Collectibles: <FaGem className="text-xl text-yellow-500" />,
  Other: <FaEllipsisH className="text-xl text-gray-400" />,
};

// NFT ABI (minimal for mint)
const NFT_ABI = [
  {
    "inputs": [
      { "internalType": "uint256", "name": "quantity", "type": "uint256" },
      { "internalType": "string", "name": "_tokenURI", "type": "string" }
    ],
    "name": "mint",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  }
];

// Add minimal ABI for mintedPerWallet
const NFT_READ_ABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "", "type": "address" }
    ],
    "name": "mintedPerWallet",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

export default function ArtisticScenesLanding({ onBack }: { onBack?: () => void }) {
  const [selected, setSelected] = useState("home");
  const [showLaunchpadModal, setShowLaunchpadModal] = useState(false);
  const [collections, setCollections] = useState<NFTCollection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<NFTCollection | null>(null);
  const [descExpanded, setDescExpanded] = useState(false);
  const [minting, setMinting] = useState(false);
  const [mintStep, setMintStep] = useState(0);
  const [mintError, setMintError] = useState<string | null>(null);
  const [showMintModal, setShowMintModal] = useState(false);
  const [mintSuccess, setMintSuccess] = useState(false);
  const [mintTxHash, setMintTxHash] = useState<string | null>(null);
  const { address, chainId } = useAccount();
  const { connect, connectors } = useConnect();
  const { switchChain } = useSwitchChain();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useContractWrite();
  const [copiedType, setCopiedType] = useState<null | 'creator' | 'contract'>(null);

  // Fetch mintedPerWallet for the user
  const { data: mintedCount, refetch: refetchMintedCount } = useContractRead({
    address: selectedCollection?.contractAddress as `0x${string}` | undefined,
    abi: NFT_READ_ABI,
    functionName: "mintedPerWallet",
    args: address && selectedCollection?.contractAddress ? [address] : undefined,
  });

  // Mint progress steps
  const MINT_STEPS = [
    { title: "Preparing Mint", description: "Checking wallet and network..." },
    { title: "Sending Transaction", description: "Minting your NFT(s) on Monad Testnet..." },
    { title: "Waiting for Confirmation", description: "Waiting for transaction confirmation..." },
    { title: "Success", description: "NFT(s) minted successfully!" }
  ];

  useEffect(() => {
    async function fetchCollections() {
      const data = await getNFTCollections();
      setCollections(data);
    }
    fetchCollections();
  }, []);

  // After successful mint, refetch minted count
  useEffect(() => {
    if (mintSuccess) refetchMintedCount?.();
  }, [mintSuccess, refetchMintedCount]);

  // Mint handler
  async function handleMint() {
    if (!selectedCollection) return;
    setMinting(true);
    setShowMintModal(true);
    setMintStep(0);
    setMintError(null);
    setMintSuccess(false);
    setMintTxHash(null);
    try {
      // Step 0: Check wallet
      if (!address) {
        if (connectors && connectors.length > 0) await connect({ connector: connectors[0] });
        throw new Error("Please connect your wallet.");
      }
      if (chainId !== monadTestnet.id) {
        await switchChain({ chainId: monadTestnet.id });
        throw new Error("Please switch to Monad Testnet.");
      }
      setMintStep(1);
      // Step 1: Send transaction
      const mintInput = document.getElementById("mintAmountInput") as HTMLInputElement;
      const quantity = Math.max(1, Math.min(Number(mintInput?.value || 1), Number(selectedCollection.maxPerWallet || selectedCollection.totalSupply || 1)));
      const contractAddress = selectedCollection.contractAddress;
      if (!contractAddress) throw new Error("NFT contract address not found.");
      const mintPrice = parseEther(selectedCollection.mintPrice || "0");
      const value = mintPrice * BigInt(quantity);
      // Debugging output
      console.log('Minting NFT with:');
      console.log('Contract address:', contractAddress);
      console.log('Metadata URL:', selectedCollection.metadataUrl);
      console.log('Mint price:', selectedCollection.mintPrice);
      console.log('Value (wei):', value.toString());
      console.log('Quantity:', quantity);
      setMintStep(2);
      const tx = await writeContractAsync({
        abi: NFT_ABI,
        address: contractAddress as `0x${string}`,
        functionName: "mint",
        args: [quantity, selectedCollection.metadataUrl],
        value,
        gas: BigInt(2_000_000),
        gasPrice: parseGwei("0.1"),
      });
      setMintTxHash(tx);
      // Step 2: Wait for confirmation
      if (!publicClient) throw new Error("Blockchain client not available.");
      const receipt = await publicClient.waitForTransactionReceipt({ hash: tx });
      if (receipt.status !== "success") throw new Error("Transaction failed. Please try again.");
      setMintStep(3);
      setMintSuccess(true);
    } catch (err: any) {
      setMintError(err?.message || "Mint failed");
    } finally {
      setMinting(false);
    }
  }

  // In the Mint Controls section:
  const maxPerWallet = Number(selectedCollection?.maxPerWallet || selectedCollection?.totalSupply || 1);
  const minted = Number(mintedCount || 0);
  const canMintMore = minted < maxPerWallet;
  const remaining = Math.max(0, maxPerWallet - minted);

  // Minting window logic
  const now = Math.floor(Date.now() / 1000);
  const mintEnd = Number(selectedCollection?.mintEndDate || 0);
  const infiniteMint = !selectedCollection?.mintEndDate || Number(selectedCollection?.mintEndDate) === 0;
  const mintingEnded = !infiniteMint && mintEnd > 0 && now > mintEnd;

  // Utility to copy text and show 'Copied' feedback
  function handleCopyToClipboard(text: string, type: 'creator' | 'contract') {
    copyToClipboard(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 1500);
  }

  return (
    <div className="flex flex-col min-h-screen w-full items-center bg-gradient-to-br from-[#fdf6fa] to-[#f0f4ff] relative">
      {/* Back Button */}
      {onBack && (
        <button
          className="fixed top-2 left-2 z-30 flex items-center gap-1 px-3 py-1 bg-white/90 text-gray-700 rounded-full text-sm font-medium hover:bg-white transition"
          onClick={onBack}
          style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
        >
          <span className="text-lg">←</span> Back
        </button>
      )}
      {/* Hero/Description (only on Home tab) */}
      {selected === "home" && (
        <div className="max-w-2xl w-full mb-8 mt-12 text-center px-4">
          <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-pink-500 to-blue-500 bg-clip-text text-transparent mb-4">
            Artistic Scenes NFT Launchpad
          </h1>
          <div className="flex flex-col md:flex-row gap-6 justify-center items-center">
            {/* Create Card */}
            <div className="glass-card flex-1 min-w-[220px] p-6 rounded-2xl shadow-lg border border-white/30 backdrop-blur-md bg-white/40 hover:bg-white/60 transition-all">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-2xl font-bold text-pink-500">Create</span>
                <span className="inline-flex items-center px-3 py-1 rounded-full font-bold text-xs shadow-sm border border-pink-200 bg-gradient-to-r from-pink-400 to-pink-500 text-white mr-2" style={{ letterSpacing: '0.5px' }}>ERC-721</span>
                <span className="inline-flex items-center px-3 py-1 rounded-full font-bold text-xs shadow-sm border border-blue-200 bg-gradient-to-r from-blue-400 to-blue-500 text-white" style={{ letterSpacing: '0.5px' }}>ERC-1155</span>
              </div>
              <div className="text-gray-700">Draw or upload your masterpiece using our intuitive canvas. Express yourself in any medium—static, animated, or video.</div>
            </div>
            {/* Launch Card */}
            <div className="glass-card flex-1 min-w-[220px] p-6 rounded-2xl shadow-lg border border-white/30 backdrop-blur-md bg-white/40 hover:bg-white/60 transition-all">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-2xl font-bold text-blue-500">Launch</span>
                <span className="inline-flex items-center px-3 py-1 rounded-full font-bold text-xs shadow-sm border border-pink-200 bg-gradient-to-r from-pink-400 to-pink-500 text-white mr-2" style={{ letterSpacing: '0.5px' }}>ERC-721</span>
                <span className="inline-flex items-center px-3 py-1 rounded-full font-bold text-xs shadow-sm border border-blue-200 bg-gradient-to-r from-blue-400 to-blue-500 text-white" style={{ letterSpacing: '0.5px' }}>ERC-1155</span>
              </div>
              <div className="text-gray-700">Set up your NFT collection with custom mint price, royalties, and launch date. Your art, your rules.</div>
            </div>
            {/* Mint & Collect Card */}
            <div className="glass-card flex-1 min-w-[220px] p-6 rounded-2xl shadow-lg border border-white/30 backdrop-blur-md bg-white/40 hover:bg-white/60 transition-all">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-2xl font-bold text-green-500">Mint & Collect</span>
                <span className="inline-flex items-center px-3 py-1 rounded-full font-bold text-xs shadow-sm border border-pink-200 bg-gradient-to-r from-pink-400 to-pink-500 text-white mr-2" style={{ letterSpacing: '0.5px' }}>ERC-721</span>
                <span className="inline-flex items-center px-3 py-1 rounded-full font-bold text-xs shadow-sm border border-blue-200 bg-gradient-to-r from-blue-400 to-blue-500 text-white" style={{ letterSpacing: '0.5px' }}>ERC-1155</span>
              </div>
              <div className="text-gray-700">Collectors can mint directly from your collection. All collections support ERC-721 and ERC-1155, and support images, GIFs, and videos up to 2MB.</div>
            </div>
          </div>
        </div>
      )}
      {/* Main Content Area */}
      <div className="flex-1 w-full flex flex-col items-center justify-center pb-24 px-2">
        {selected === "home" ? null : (
          selected === "collections"
            ? (
                selectedCollection ? (
                  <div className="w-full max-w-lg mx-auto bg-white/90 rounded-2xl shadow-xl p-4 mt-4">
                    <button className="mb-3 text-pink-500 font-bold hover:underline flex items-center gap-1" onClick={() => setSelectedCollection(null)}>
                      <span className="text-lg">←</span> Back to Collections
                    </button>
                    {/* NFT image, name, symbol grid */}
                    <div className="flex flex-row items-center gap-4 w-full mb-2">
                      {selectedCollection.mediaType === 'image' ? (
                        <img src={selectedCollection.mediaUrl} alt="preview" className="rounded-lg w-36 h-36 object-cover border border-pink-100 shadow" />
                      ) : (
                        <video src={selectedCollection.mediaUrl} controls className="rounded-lg w-36 h-36 object-cover border border-pink-100 shadow" />
                      )}
                      <div className="flex flex-col items-start justify-center flex-1 min-w-0">
                        <h2 className="text-lg font-extrabold bg-gradient-to-r from-pink-500 to-pink-400 bg-clip-text text-transparent mb-1 truncate w-full">{selectedCollection.name}</h2>
                        <div className="text-gray-500 font-semibold text-xs truncate w-full">Symbol: <span className="text-gray-700 text-xs">{selectedCollection.symbol}</span></div>
                        <div className="flex items-center gap-2 text-base text-gray-700 font-semibold mt-1">
                          {categoryIcons[selectedCollection.category] || categoryIcons['Other']}
                          <span className="ml-1">{selectedCollection.category}</span>
                        </div>
                        {/* Social Links moved here, under category */}
                        {(selectedCollection.discord || selectedCollection.twitter) && (
                          <div className="flex gap-4 items-center mt-1 mb-1 justify-start">
                            {selectedCollection.discord && (
                              <a href={selectedCollection.discord.startsWith('http') ? selectedCollection.discord : `https://discord.gg/${selectedCollection.discord}`} target="_blank" rel="noopener noreferrer" title="Discord" aria-label="Discord">
                                <FaDiscord className="text-2xl text-indigo-500 hover:text-indigo-700 transition" />
                              </a>
                            )}
                            {selectedCollection.twitter && (
                              <a href={selectedCollection.twitter.startsWith('http') ? selectedCollection.twitter : `https://twitter.com/${selectedCollection.twitter.replace(/^@/, '')}`} target="_blank" rel="noopener noreferrer" title="Twitter" aria-label="Twitter">
                                <FaTwitter className="text-2xl text-blue-400 hover:text-blue-600 transition" />
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Description Section in a container, with show more/less */}
                    <div className="w-full bg-pink-50 border border-pink-200 rounded-lg p-2 mb-3">
                      <div className="text-xs font-semibold text-pink-600 mb-1 ml-1">Description</div>
                      <div className="text-gray-700 text-base text-center whitespace-pre-line px-2 break-words">
                        {selectedCollection.description.length > 120 && !descExpanded
                          ? <>{selectedCollection.description.slice(0, 120)}... <button className="text-pink-500 underline text-xs font-semibold" onClick={() => setDescExpanded(true)}>Read more</button></>
                          : <>{selectedCollection.description} {selectedCollection.description.length > 120 && <button className="text-pink-500 underline text-xs font-semibold" onClick={() => setDescExpanded(false)}>Show less</button>}</>
                        }
                      </div>
                    </div>
                    {/* Traits/Attributes in always-3-column grid, wrapped in a container */}
                    {Array.isArray(selectedCollection.traits) && selectedCollection.traits.length > 0 && (
                      <div className="w-full bg-pink-50 border border-pink-200 rounded-lg p-2 mb-2">
                        <div className="text-xs font-semibold text-pink-600 mb-1 ml-1">Traits</div>
                        <div className="grid grid-cols-3 gap-2">
                          {selectedCollection.traits.map((trait: any, idx: number) => (
                            <span key={idx} className="px-2 py-1 rounded-full bg-white border border-pink-100 text-[11px] text-pink-700 font-semibold flex items-center gap-1 justify-center">
                              <span className="text-gray-500 font-normal">{trait.type}:</span> {trait.value}
                            </span>
                          ))}
                          {/* Fill empty columns for alignment if less than 3 traits */}
                          {Array.from({ length: 3 - (selectedCollection.traits.length % 3 || 3) }).map((_, i) => (
                            <span key={`empty-${i}`} className="" />
                          ))}
                        </div>
                      </div>
                    )}
                    <hr className="w-full border-t border-pink-100 my-2" />
                    {/* Mint Price */}
                    <div className="flex items-center gap-2 text-lg text-gray-900 font-extrabold mb-2 justify-center">
                      Mint Price:
                      <span className="ml-1 text-pink-500">{selectedCollection.mintPrice} MON</span>
                      <img src="/images/monad.png" alt="MON" className="w-5 h-5 ml-1 inline-block align-middle" />
                    </div>
                    {/* Mint Controls */}
                    <div className="flex flex-col items-center gap-2 mt-2 mb-2">
                      {/* Wallet connect and network switch controls, compact like DonationApp */}
                      {!address ? (
                        <button
                          className="flex items-center gap-2 bg-pink-500 hover:bg-pink-600 text-white font-bold py-1 px-3 rounded-full text-xs shadow mb-1 disabled:opacity-50"
                          onClick={() => connect({ connector: connectors[0] })}
                        >
                          Connect Wallet
                        </button>
                      ) : chainId !== monadTestnet.id ? (
                        <button
                          className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-1 px-3 rounded-full text-xs shadow mb-1"
                          onClick={() => switchChain({ chainId: monadTestnet.id })}
                        >
                          Switch to Monad Testnet
                        </button>
                      ) : null}
                      {/* Mint input and button only if connected and on Monad */}
                      {address && chainId === monadTestnet.id && (
                        <>
                          <input
                            type="number"
                            min={1}
                            max={remaining}
                            defaultValue={1}
                            className="w-24 px-2 py-1 rounded-lg border border-pink-200 text-gray-900 text-sm text-center mb-1"
                            placeholder="Number to Mint"
                            id="mintAmountInput"
                            disabled={minting || !canMintMore || mintingEnded}
                          />
                          {mintingEnded ? (
                            <button
                              className="px-4 py-2 rounded-lg bg-gray-300 text-gray-500 font-bold text-base shadow cursor-not-allowed"
                              style={{ minWidth: '120px', maxWidth: '180px' }}
                              id="mintButton"
                              disabled
                            >
                              Mint Ended
                            </button>
                          ) : (
                            <button
                              className={`px-4 py-2 rounded-lg font-bold text-base shadow transition ${minting || chainId !== monadTestnet.id || !canMintMore ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-pink-500 text-white hover:bg-pink-600'}`}
                              style={{ minWidth: '120px', maxWidth: '180px' }}
                              id="mintButton"
                              disabled={minting || chainId !== monadTestnet.id || !canMintMore}
                              onClick={handleMint}
                            >
                              {minting ? "Minting..." : "Mint"}
                            </button>
                          )}
                        </>
                      )}
                      <div className="flex gap-4 text-xs text-gray-600 mt-1">
                        <span>Max per Wallet: <span className="font-bold">{maxPerWallet || '--'}</span></span>
                        <span>Total Supply: <span className="font-bold">{selectedCollection.totalSupply || '--'}</span></span>
                      </div>
                      <div className="text-xs text-pink-600 mt-1">
                        {!mintingEnded && (canMintMore
                          ? `You have minted ${minted} of ${maxPerWallet}. You can mint ${remaining} more.`
                          : `You have minted your maximum allocation for this collection.`)
                        }
                      </div>
                    </div>
                    {/* Mint Progress Bar */}
                    <div className="w-full mt-1">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>{minted} minted</span>
                        <span>Max: {selectedCollection.totalSupply || '--'}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div className="bg-gradient-to-r from-pink-500 to-blue-400 h-3 rounded-full" style={{ width: `${Math.min(100, (minted / maxPerWallet) * 100)}%` }} />
                      </div>
                    </div>
                    <hr className="w-full border-t border-pink-100 my-2" />
                    {/* Details Containers */}
                    <div className="w-full flex flex-col gap-2 mt-4">
                      <div className="rounded bg-white/80 shadow p-3 flex items-center gap-2 text-xs text-gray-600">
                        <span className="font-semibold">Creator:</span>
                        <span className="truncate">{truncateAddress(selectedCollection.creatorAddress)}</span>
                        <button
                          onClick={() => handleCopyToClipboard(selectedCollection.creatorAddress, 'creator')}
                          className="ml-1 px-1 py-0.5 rounded bg-gray-100 hover:bg-pink-100 text-pink-500 text-xs"
                        >
                          {copiedType === 'creator' ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                      <div className="rounded bg-white/80 shadow p-3 flex items-center gap-2 text-xs text-gray-600">
                        <span className="font-semibold">NFT Contract:</span>
                        <span className="truncate">{selectedCollection.contractAddress ? truncateAddress(selectedCollection.contractAddress) : '--'}</span>
                        {selectedCollection.contractAddress && (
                          <button
                            onClick={() => handleCopyToClipboard(selectedCollection.contractAddress!, 'contract')}
                            className="ml-1 px-1 py-0.5 rounded bg-gray-100 hover:bg-pink-100 text-pink-500 text-xs"
                          >
                            {copiedType === 'contract' ? 'Copied' : 'Copy'}
                          </button>
                        )}
                      </div>
                      <div className="rounded bg-white/80 shadow p-3 flex items-center gap-2 text-xs text-gray-600">
                        <span className="font-semibold">Mint Start:</span>
                        <span>{formatDate(selectedCollection.mintStartDate)}</span>
                        <span className="font-semibold ml-4">End:</span>
                        <span>{!selectedCollection.mintEndDate || Number(selectedCollection.mintEndDate) === 0 ? '∞' : formatDate(selectedCollection.mintEndDate)}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <CollectionsPage collections={collections} onSelectCollection={setSelectedCollection} />
                )
              )
            : (
          <div className="w-full max-w-md min-h-[300px] bg-white/70 rounded-2xl shadow-xl flex items-center justify-center text-2xl text-gray-400 font-bold">
            {selected === "canvas" && (
              <DrawingCanvas />
            )}
            {selected === "launchpad" && (
              <div className="flex flex-col items-center justify-center w-full max-w-xs mx-auto p-6 mt-4">
                <img
                  src="/images/launchpad.jpg"
                  alt="NFT Launchpad"
                  className="w-full rounded-2xl shadow mb-6 object-cover aspect-[16/9]"
                  style={{ maxWidth: '500px' }}
                />
                <div className="mb-4 text-center text-pink-600 text-lg font-semibold">
                  Ready to make history? Like <span className="font-bold">Beeple</span> and countless creators, you can bring your art to life onchain.<br />
                  <span className="text-pink-500">Launch your collection and inspire the world!</span>
                </div>
                <button
                  className="w-full py-3 px-6 rounded-full bg-pink-500 text-white font-bold shadow-md hover:bg-pink-600 transition text-lg"
                  onClick={() => setShowLaunchpadModal(true)}
                >
                  + Create Collection
                </button>
                <LaunchpadModal
                  open={showLaunchpadModal}
                  onClose={() => setShowLaunchpadModal(false)}
                  onCreate={collection => {
                    setShowLaunchpadModal(false);
                    setCollections(prev => [...prev, collection]);
                    setSelectedCollection(collection);
                    setSelected("collections");
                  }}
                />
              </div>
            )}
            {selected === "mint" && "[Mint UI for selected collection will appear here]"}
          </div>
            )
        )}
      </div>
      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 w-full bg-white/90 border-t border-gray-200 flex justify-around items-center h-16 z-20 shadow-lg">
        {NAV_ITEMS.map((item) => (
          item.key === 'history' ? (
            <button
              key={item.key}
              className="flex flex-col items-center justify-center flex-1 h-full text-gray-400 font-bold cursor-not-allowed opacity-60"
              disabled
            >
              <span className="text-xl mb-1">{item.icon}</span>
              <span className="text-xs">{item.label}</span>
            </button>
          ) : (
            <button
              key={item.key}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-all ${selected === item.key ? "text-pink-600 font-bold" : "text-gray-500"}`}
              onClick={() => setSelected(item.key)}
            >
              <span className="text-xl mb-1">{item.icon}</span>
              <span className="text-xs">{item.label}</span>
            </button>
          )
        ))}
      </nav>
      {/* Mint Progress Modal */}
      <ProgressModal
        isOpen={showMintModal}
        currentStep={mintStep}
        error={mintError || undefined}
        steps={MINT_STEPS}
        onClose={() => setShowMintModal(false)}
      />
    </div>
  );
}