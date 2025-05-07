import React, { useState, ChangeEvent } from "react";
import { FaTimes } from 'react-icons/fa';
import { uploadFileToPinata, uploadJSONToPinata, ipfsToHttp } from '../../lib/pinata';
import { createNFTCollection, NFTCollection } from '../../lib/firebase';
import ProgressModal from './ProgressModal';
import { useAccount, useContractRead, useContractWrite, useConnect, useSwitchChain, usePublicClient } from 'wagmi';
import { parseEther, formatEther, parseGwei, parseAbiItem, getEventSelector, decodeEventLog } from 'viem';
import { monadTestnet } from 'viem/chains';
import axios from 'axios';

interface Trait {
  type: string;
  value: string;
}

interface LaunchpadModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (collection: NFTCollection) => void;
}

const categories = [
  "Art", "Music", "Photography", "Games", "Collectibles", "Other"
];

const PROGRESS_STEPS = [
  {
    title: 'Uploading Media',
    description: 'Uploading your NFT media to IPFS...'
  },
  {
    title: 'Creating Metadata',
    description: 'Generating and uploading NFT metadata...'
  },
  {
    title: 'Saving Collection',
    description: 'Saving your collection details...'
  }
];

// NFTFactory contract details
const NFT_FACTORY_ADDRESS = process.env.NEXT_PUBLIC_NFT_FACTORY_ADDRESS as `0x${string}`;
const NFT721_IMPLEMENTATION = process.env.NEXT_PUBLIC_NFT721_IMPLEMENTATION as `0x${string}`;
const NFT1155_IMPLEMENTATION = process.env.NEXT_PUBLIC_NFT1155_IMPLEMENTATION as `0x${string}`;
const NFT_FACTORY_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_nft721Implementation",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_nft1155Implementation",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "components": [
          { "internalType": "address", "name": "creator", "type": "address" },
          { "internalType": "address", "name": "collection", "type": "address" },
          { "internalType": "string", "name": "collectionType", "type": "string" },
          { "internalType": "string", "name": "name", "type": "string" },
          { "internalType": "string", "name": "symbol", "type": "string" },
          { "internalType": "uint256", "name": "maxSupply", "type": "uint256" },
          { "internalType": "uint256", "name": "mintPrice", "type": "uint256" },
          { "internalType": "uint256", "name": "maxPerWallet", "type": "uint256" },
          { "internalType": "uint256", "name": "releaseDate", "type": "uint256" },
          { "internalType": "uint256", "name": "mintEndDate", "type": "uint256" },
          { "internalType": "bool", "name": "infiniteMint", "type": "bool" }
        ],
        "indexed": false,
        "internalType": "struct CollectionData",
        "name": "data",
        "type": "tuple"
      }
    ],
    "name": "CollectionCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "collection", "type": "address" },
      { "indexed": true, "internalType": "address", "name": "paymentToken", "type": "address" },
      { "indexed": false, "internalType": "string", "name": "collectionType", "type": "string" },
      { "indexed": false, "internalType": "uint256", "name": "mintPrice", "type": "uint256" }
    ],
    "name": "PaymentTokenSet",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "previousOwner", "type": "address" },
      { "indexed": true, "internalType": "address", "name": "newOwner", "type": "address" }
    ],
    "name": "OwnershipTransferred",
    "type": "event"
  },
  {
    "inputs": [
      {
        "components": [
          { "internalType": "string", "name": "collectionType", "type": "string" },
          { "internalType": "string", "name": "name", "type": "string" },
          { "internalType": "string", "name": "symbol", "type": "string" },
          { "internalType": "string", "name": "metadataURI", "type": "string" },
          { "internalType": "uint256", "name": "maxSupply", "type": "uint256" },
          { "internalType": "uint256", "name": "mintPrice", "type": "uint256" },
          { "internalType": "uint256", "name": "maxPerWallet", "type": "uint256" },
          { "internalType": "uint256", "name": "releaseDate", "type": "uint256" },
          { "internalType": "uint256", "name": "mintEndDate", "type": "uint256" },
          { "internalType": "bool", "name": "infiniteMint", "type": "bool" },
          { "internalType": "address", "name": "paymentToken", "type": "address" },
          { "internalType": "bool", "name": "enableWhitelist", "type": "bool" },
          { "internalType": "address", "name": "royaltyReceiver", "type": "address" },
          { "internalType": "uint96", "name": "royaltyFeeNumerator", "type": "uint96" }
        ],
        "internalType": "struct CreateNFTCollectionParams",
        "name": "params",
        "type": "tuple"
      }
    ],
    "name": "createNFTCollection",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  // ... other ABI entries ...
];

// Hardcoded creation fee (in MON)
const CREATION_FEE_MON = '2';

// Utility to check if an IPFS hash is available on the gateway
async function verifyIpfsAvailability(ipfsHash: string, maxRetries = 5, delayMs = 2000): Promise<boolean> {
  const url = `https://ipfs.io/ipfs/${ipfsHash}`;
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await axios.head(url, { timeout: 5000 });
      if (res.status === 200) return true;
    } catch (e) {
      // wait and retry
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
  return false;
}

export default function LaunchpadModal({ open, onClose, onCreate }: LaunchpadModalProps) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [category, setCategory] = useState("");
  const [twitter, setTwitter] = useState("");
  const [discord, setDiscord] = useState("");
  const [media, setMedia] = useState<File | null>(null);
  const [mediaError, setMediaError] = useState("");
  const [traits, setTraits] = useState<Trait[]>([{ type: "", value: "" }]);
  const [mintPrice, setMintPrice] = useState("");
  const [royaltyAddress, setRoyaltyAddress] = useState("");
  const [royaltyPercent, setRoyaltyPercent] = useState("");
  const [maxSupply, setMaxSupply] = useState("");
  const [maxPerWallet, setMaxPerWallet] = useState("");
  const [mintDate, setMintDate] = useState("");
  const [mintEndDate, setMintEndDate] = useState("");
  const [infiniteMint, setInfiniteMint] = useState(false);
  const [whitelist, setWhitelist] = useState(false);
  const [whitelistAddresses, setWhitelistAddresses] = useState("");
  const [whitelistFile, setWhitelistFile] = useState<File | null>(null);
  const [whitelistFileError, setWhitelistFileError] = useState("");
  const [showProgress, setShowProgress] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showCongrats, setShowCongrats] = useState(false);
  const [nftType, setNftType] = useState<'erc721' | 'erc1155' | null>(null);
  const { address, chainId } = useAccount();
  const { connect, connectors, error: connectError } = useConnect();
  const { switchChain, error: switchError } = useSwitchChain();
  const isConnected = !!address;
  const isOnMonad = chainId === monadTestnet.id;
  // Contract write for collection creation
  const { writeContractAsync: createCollectionContract } = useContractWrite();
  // Use hardcoded creation fee
  const creationFee = CREATION_FEE_MON;
  const publicClient = usePublicClient();

  if (!open) return null;

  const handleMediaChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setMediaError("File size must be 2MB or less.");
      setMedia(null);
      return;
    }
    setMedia(file);
    setMediaError("");
  };

  const handleWhitelistFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.csv')) {
      setWhitelistFileError("Only CSV files are allowed.");
      setWhitelistFile(null);
      return;
    }
    setWhitelistFile(file);
    setWhitelistFileError("");
  };

  const handleAddTrait = () => setTraits([...traits, { type: "", value: "" }]);
  const handleRemoveTrait = (idx: number) => setTraits(traits.filter((_, i) => i !== idx));
  const handleTraitChange = (idx: number, field: "type" | "value", val: string) => setTraits(traits.map((t, i) => (i === idx ? { ...t, [field]: val } : t)));

  const steps = [
    // Step 0: NFT Type Selection
    <div className="w-full flex flex-col items-center gap-6 py-6" key="type">
      <h3 className="text-xl font-bold mb-2">Choose NFT Collection Type</h3>
      <div className="flex gap-6 w-full justify-center">
        <button
          type="button"
          className={`flex-1 px-6 py-4 rounded-xl border-2 ${nftType === 'erc721' ? 'border-pink-500 bg-pink-50' : 'border-gray-200 bg-white'} text-lg font-bold shadow hover:border-pink-400 transition`}
          onClick={() => setNftType('erc721')}
        >
          ERC-721<br /><span className="text-xs font-normal">Unique NFTs</span>
        </button>
        <button
          type="button"
          className={`flex-1 px-6 py-4 rounded-xl border-2 ${nftType === 'erc1155' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'} text-lg font-bold shadow hover:border-blue-400 transition`}
          onClick={() => setNftType('erc1155')}
        >
          ERC-1155<br /><span className="text-xs font-normal">Multi-edition NFTs</span>
        </button>
      </div>
      {!isConnected && (
        <button
          className="mt-4 px-6 py-2 bg-pink-500 text-white rounded-full font-bold text-base shadow hover:bg-pink-600 transition"
          onClick={() => connect({ connector: connectors[0] })}
        >
          Connect Wallet
        </button>
      )}
      {isConnected && !isOnMonad && (
        <button
          className="mt-4 px-6 py-2 bg-yellow-400 text-black rounded-full font-bold text-base shadow hover:bg-yellow-500 transition"
          onClick={() => switchChain({ chainId: monadTestnet.id })}
        >
          Switch to Monad Testnet
        </button>
      )}
      {connectError && <div className="text-xs text-red-400 mt-2">{connectError.message}</div>}
      {switchError && <div className="text-xs text-red-400 mt-2">{switchError.message}</div>}
      <div className="text-sm text-pink-600 font-semibold mb-2">
        Creation Fee: {CREATION_FEE_MON} MON
      </div>
      <div className="text-xs text-gray-500 mt-2 text-center max-w-xs">
        You will pay this fee to create your collection onchain. Fee is fetched live from the contract.
      </div>
    </div>,
    // Step 1: Collection Info
    <div className="w-full grid grid-cols-2 gap-2 mt-2 text-sm" key="info">
      <div className="p-2 border border-pink-200 rounded-lg bg-white flex flex-col">
        <label className="text-xs font-semibold text-gray-500 mb-1">Collection Name *</label>
        <input className="w-full px-3 py-2 rounded-lg border border-pink-100 bg-white text-gray-900 font-semibold text-sm" placeholder="Collection Name *" value={name} onChange={e => setName(e.target.value)} maxLength={32} required />
      </div>
      <div className="p-2 border border-pink-200 rounded-lg bg-white flex flex-col">
        <label className="text-xs font-semibold text-gray-500 mb-1">Symbol *</label>
        <input className="w-full px-3 py-2 rounded-lg border border-pink-100 bg-white text-gray-900 font-semibold text-sm" placeholder="Symbol *" value={symbol} onChange={e => setSymbol(e.target.value)} maxLength={10} required />
      </div>
      <div className="p-2 border border-pink-200 rounded-lg bg-white flex flex-col col-span-2">
        <label className="text-xs font-semibold text-gray-500 mb-1">Description</label>
        <textarea className="w-full px-3 py-2 rounded-lg border border-pink-100 bg-white text-gray-900 font-semibold min-h-[48px] text-sm" placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} />
      </div>
      <div className="p-2 border border-pink-200 rounded-lg bg-white flex flex-col">
        <label className="text-xs font-semibold text-gray-500 mb-1">Website</label>
        <input className="w-full px-3 py-2 rounded-lg border border-pink-100 bg-white text-gray-900 text-sm" placeholder="Website" value={website} onChange={e => setWebsite(e.target.value)} />
      </div>
      <div className="p-2 border border-pink-200 rounded-lg bg-white flex flex-col">
        <label className="text-xs font-semibold text-gray-500 mb-1">Category</label>
        <select className="w-full px-3 py-2 rounded-lg border border-pink-100 bg-white text-gray-900 text-sm" value={category} onChange={e => setCategory(e.target.value)}>
          <option value="">Select Category</option>
          {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
      </div>
      <div className="p-2 border border-pink-200 rounded-lg bg-white flex flex-col">
        <label className="text-xs font-semibold text-gray-500 mb-1">Twitter Username</label>
        <input className="w-full px-3 py-2 rounded-lg border border-pink-100 bg-white text-gray-900 text-sm" placeholder="Twitter Username" value={twitter} onChange={e => setTwitter(e.target.value)} />
      </div>
      <div className="p-2 border border-pink-200 rounded-lg bg-white flex flex-col">
        <label className="text-xs font-semibold text-gray-500 mb-1">Discord Server</label>
        <input className="w-full px-3 py-2 rounded-lg border border-pink-100 bg-white text-gray-900 text-sm" placeholder="Discord Server" value={discord} onChange={e => setDiscord(e.target.value)} />
      </div>
    </div>,
    // Step 2: Media Upload
    <div className="w-full flex flex-col gap-3 mt-2 text-sm" key="media">
      <label className="text-xs font-semibold text-gray-500 mb-1">Media (gif, video, jpg, png, max 2MB)</label>
      <label className="w-full flex items-center justify-center px-3 py-2 rounded-lg border border-pink-200 bg-white text-pink-500 font-semibold cursor-pointer hover:bg-pink-50 transition">
        <input type="file" accept="image/*,video/*" onChange={handleMediaChange} className="hidden" />
        <span className="text-base">{media ? 'Change File' : 'Choose File'}</span>
      </label>
      {media && media.type.startsWith('image') && (
        <img src={URL.createObjectURL(media)} alt="preview" className="mt-2 rounded-lg max-h-32 max-w-full object-contain border border-pink-100 mx-auto" />
      )}
      {media && media.type.startsWith('video') && (
        <video src={URL.createObjectURL(media)} controls className="mt-2 rounded-lg max-h-32 max-w-full object-contain border border-pink-100 mx-auto" />
      )}
      {media && <span className="text-xs text-green-600 break-all">{media.name}</span>}
      {mediaError && <span className="text-xs text-red-500">{mediaError}</span>}
    </div>,
    // Step 3: Traits/Attributes
    <div className="w-full mb-2 mt-2 text-sm" key="traits">
      <div className="font-semibold text-gray-800 mb-1">Traits/Attributes <span className="text-xs text-gray-400">(Optional)</span></div>
      <div className="flex flex-col gap-1">
        {traits.map((trait, idx) => (
          <div key={idx} className="flex gap-2 items-center w-full">
            <input className="flex-1 min-w-0 px-2 py-1 rounded-lg border border-pink-100 bg-white text-gray-900 text-sm" placeholder="Trait Type" value={trait.type} onChange={e => handleTraitChange(idx, "type", e.target.value)} maxLength={16} />
            <input className="flex-1 min-w-0 px-2 py-1 rounded-lg border border-pink-100 bg-white text-gray-900 text-sm" placeholder="Value" value={trait.value} onChange={e => handleTraitChange(idx, "value", e.target.value)} maxLength={24} />
            {traits.length > 1 && (
              <button className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-pink-50 hover:bg-pink-100 text-pink-500 text-base ml-1 border border-pink-100" onClick={() => handleRemoveTrait(idx)} title="Remove Trait" type="button" tabIndex={-1}>
                &#128465;
              </button>
            )}
          </div>
        ))}
      </div>
      <button className="text-pink-500 hover:text-pink-700 text-sm font-semibold mt-1" onClick={handleAddTrait} type="button">+ Add Trait</button>
    </div>,
    // Step 4: Mint Details
    <div className="w-full flex flex-col gap-3 mt-2 text-sm" key="mint">
      <div className="w-full grid grid-cols-2 gap-2 mt-2 text-sm">
        <div className="p-2 border border-pink-200 rounded-lg bg-white flex flex-col">
          <label className="text-xs font-semibold text-gray-500 mb-1">Mint Price (MON)</label>
          <input type="number" min="0" step="0.0001" className="w-full px-3 py-2 rounded-lg border border-pink-100 bg-white text-gray-900 text-sm" placeholder="Mint Price (MON)" value={mintPrice} onChange={e => setMintPrice(e.target.value)} />
        </div>
        <div className="p-2 border border-pink-200 rounded-lg bg-white flex flex-col">
          <label className="text-xs font-semibold text-gray-500 mb-1">Royalty %</label>
          <input type="number" min="0" max="20" step="0.1" className="w-full px-3 py-2 rounded-lg border border-pink-100 bg-white text-gray-900 text-sm" placeholder="Royalty %" value={royaltyPercent} onChange={e => setRoyaltyPercent(e.target.value)} />
        </div>
        <div className="p-2 border border-pink-200 rounded-lg bg-white flex flex-col">
          <label className="text-xs font-semibold text-gray-500 mb-1">Royalty Address</label>
          <input className="w-full px-3 py-2 rounded-lg border border-pink-100 bg-white text-gray-900 text-sm" placeholder="Royalty Address" value={royaltyAddress} onChange={e => setRoyaltyAddress(e.target.value)} maxLength={42} />
        </div>
        <div className="p-2 border border-pink-200 rounded-lg bg-white flex flex-col">
          <label className="text-xs font-semibold text-gray-500 mb-1">Max Supply</label>
          <input type="number" min="1" className="w-full px-3 py-2 rounded-lg border border-pink-100 bg-white text-gray-900 text-sm" placeholder="Max Supply" value={maxSupply} onChange={e => setMaxSupply(e.target.value)} />
        </div>
        <div className="p-2 border border-pink-200 rounded-lg bg-white flex flex-col">
          <label className="text-xs font-semibold text-gray-500 mb-1">
            Max Per Wallet <span className="text-red-500">*</span>
          </label>
          <input type="number" min="1" className="w-full px-3 py-2 rounded-lg border border-pink-100 bg-white text-gray-900 text-sm" placeholder="Max Per Wallet" value={maxPerWallet} onChange={e => setMaxPerWallet(e.target.value)} />
        </div>
        <div className="p-2 border border-pink-200 rounded-lg bg-white flex flex-col">
          <label className="text-xs font-semibold text-gray-500 mb-1">Mint Start Date</label>
          <input type="datetime-local" className="w-full px-3 py-2 rounded-lg border border-pink-100 bg-white text-gray-900 text-sm" value={mintDate} onChange={e => setMintDate(e.target.value)} />
        </div>
        <div className="p-2 border border-pink-200 rounded-lg bg-white flex flex-col">
          <label className="text-xs font-semibold text-gray-500 mb-1">Mint End Date</label>
          <input type="datetime-local" className="w-full px-3 py-2 rounded-lg border border-pink-100 bg-white text-gray-900 text-sm" value={mintEndDate} onChange={e => setMintEndDate(e.target.value)} disabled={infiniteMint} />
        </div>
        <div className="p-2 border border-pink-200 rounded-lg bg-white flex flex-col justify-center">
          <div className="flex items-center h-full">
            <input type="checkbox" checked={infiniteMint} onChange={e => setInfiniteMint(e.target.checked)} id="infiniteMint" />
            <label htmlFor="infiniteMint" className="text-xs text-gray-600 ml-2">Infinite Mint</label>
          </div>
        </div>
        <div className="p-2 border border-pink-200 rounded-lg bg-white flex flex-col col-span-2">
          <div className="flex items-center gap-4">
            <input type="checkbox" checked={whitelist} onChange={e => setWhitelist(e.target.checked)} id="whitelist" />
            <label htmlFor="whitelist" className="text-xs text-gray-600">Enable whitelist for early minting</label>
          </div>
          {whitelist && (
            <div className="w-full flex flex-col gap-2 mt-2 p-2 rounded-lg border border-pink-200 bg-pink-50">
              <label className="text-xs font-semibold text-gray-500">Whitelist Addresses (CSV or paste, one per line or comma-separated)</label>
              <input type="file" accept=".csv" onChange={handleWhitelistFileChange} className="text-xs" />
              {whitelistFile && <span className="text-xs text-green-600">{whitelistFile.name}</span>}
              {whitelistFileError && <span className="text-xs text-red-500">{whitelistFileError}</span>}
              <textarea className="w-full px-2 py-1 rounded-lg border border-pink-100 bg-white text-gray-900 text-xs mt-1" placeholder="Paste addresses here..." value={whitelistAddresses} onChange={e => setWhitelistAddresses(e.target.value)} rows={3} />
            </div>
          )}
        </div>
      </div>
    </div>,
    // Step 5: Review & Create
    <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 mt-2 text-sm border-t border-pink-100 pt-2" key="review">
      <div className="truncate"><span className="font-semibold">Name:</span> {name || 'None'}</div>
      <div className="truncate"><span className="font-semibold">Symbol:</span> {symbol || 'None'}</div>
      <div className="truncate"><span className="font-semibold">Description:</span> {description || 'None'}</div>
      <div className="truncate"><span className="font-semibold">Website:</span> {website || 'None'}</div>
      <div className="truncate"><span className="font-semibold">Category:</span> {category || 'None'}</div>
      <div className="truncate"><span className="font-semibold">Twitter:</span> {twitter || 'None'}</div>
      <div className="truncate"><span className="font-semibold">Discord:</span> {discord || 'None'}</div>
      <div className="col-span-2 flex items-center gap-2 flex-wrap"><span className="font-semibold">Media:</span> {media ? media.name : "None"} {media && media.type.startsWith('image') && (
        <img src={URL.createObjectURL(media)} alt="preview" className="inline-block ml-2 rounded-lg max-h-48 max-w-full align-middle border border-pink-100" />
      )} {media && media.type.startsWith('video') && (
        <video src={URL.createObjectURL(media)} controls className="inline-block ml-2 rounded-lg max-h-48 max-w-full align-middle border border-pink-100" />
      )}</div>
      <div className="col-span-2"><span className="font-semibold">Traits:</span> {traits.filter(t => t.type && t.value).length > 0 ? traits.filter(t => t.type && t.value).map(t => `${t.type}: ${t.value}`).join(", ") : "None"}</div>
      <div className="truncate"><span className="font-semibold">Mint Price:</span> {mintPrice || 'None'}</div>
      <div className="truncate"><span className="font-semibold">Royalty Address:</span> {royaltyAddress || 'None'}</div>
      <div className="truncate"><span className="font-semibold">Royalty %:</span> {royaltyPercent || 'None'}</div>
      <div className="truncate"><span className="font-semibold">Max Supply:</span> {maxSupply || 'None'}</div>
      <div className="truncate"><span className="font-semibold">Max Per Wallet:</span> {maxPerWallet || 'None'}</div>
      <div className="truncate"><span className="font-semibold">Mint Start:</span> {mintDate || 'None'}</div>
      <div className="truncate"><span className="font-semibold">Mint End:</span> {infiniteMint ? "Infinite" : (mintEndDate || 'None')}</div>
      <div className="truncate"><span className="font-semibold">Infinite Mint:</span> {infiniteMint ? 'Yes' : 'No'}</div>
      <div className="truncate"><span className="font-semibold">Whitelist:</span> {whitelist ? "Enabled" : "Disabled"}</div>
      {whitelist && (
        <div className="col-span-2">
          <span className="font-semibold">Whitelist Addresses:</span> {whitelistFile && whitelistFile.name ? whitelistFile.name : 'None'} {whitelistAddresses && whitelistAddresses.length > 0 && (<span className="ml-2">{whitelistAddresses.split(/[\n,]+/).filter(Boolean).length} addresses pasted</span>)}
        </div>
      )}
    </div>
  ];

  // Add validation logic for required fields and royalty
  const isRoyaltyValid = !royaltyPercent || (parseFloat(royaltyPercent) <= 5);
  const isMaxPerWalletValid = whitelist ? true : !!maxPerWallet && Number(maxPerWallet) > 0;
  const areRequiredFieldsFilled = !!name.trim() && !!symbol.trim() && !!description.trim() && !!category && !!media && !!mintPrice && isMaxPerWalletValid && isRoyaltyValid;

  // Update canProceed logic
  let canProceed = true;
  if (step === 0) {
    canProceed = nftType !== null;
  } else if (step === 1) {
    canProceed = name.trim().length > 0 && symbol.trim().length > 0;
  } else if (step === 4) {
    canProceed = areRequiredFieldsFilled;
  }

  // Update handleSubmit to call the contract
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!media || !nftType || !address) return;
    setShowProgress(true);
    setCurrentStep(0);
    setError(null);
    try {
      // Step 1: Upload image to IPFS (returns ipfs://...)
      const imageIpfsUrl = await uploadFileToPinata(media); // ipfs://Qm...
      const imageHash = imageIpfsUrl.replace('ipfs://', '');
      console.log('Image IPFS Hash:', imageHash);
      setCurrentStep(1);
      // Step 1.5: Wait for image to be available on IPFS
      const available = await verifyIpfsAvailability(imageHash);
      if (!available) {
        setError('Image not available on IPFS after several retries. Please try again.');
        setShowProgress(false);
        return;
      }
      // Step 2: Create and upload metadata (OpenSea standard only)
      const metadata = {
        name,
        description,
        image: imageIpfsUrl,
        external_url: website || '',
        attributes: traits.map(trait => ({
          trait_type: trait.type,
          value: trait.value
        })),
        background_color: '000000'
      };
      const metadataIpfsUrl = await uploadJSONToPinata(metadata); // ipfs://Qm...
      const metadataHash = metadataIpfsUrl.replace('ipfs://', '');
      console.log('Metadata IPFS Hash:', metadataHash);
      setCurrentStep(2);
      // Step 3: Onchain collection creation
      const isERC721 = nftType === 'erc721';
      const tx = await createCollectionContract({
        abi: NFT_FACTORY_ABI,
        address: NFT_FACTORY_ADDRESS,
        functionName: 'createNFTCollection',
        args: [{
          collectionType: isERC721 ? 'ERC721' : 'ERC1155',
          name,
          symbol,
          metadataURI: 'ipfs://', // Set base URI as just the protocol
          maxSupply: maxSupply ? BigInt(maxSupply) : BigInt(0),
          mintPrice: mintPrice ? parseEther(mintPrice) : BigInt(0),
          maxPerWallet: maxPerWallet ? BigInt(maxPerWallet) : BigInt(0),
          releaseDate: mintDate ? Math.floor(new Date(mintDate).getTime() / 1000) : Math.floor(Date.now() / 1000),
          mintEndDate: mintEndDate ? Math.floor(new Date(mintEndDate).getTime() / 1000) : 0,
          infiniteMint,
          paymentToken: '0x0000000000000000000000000000000000000000',
          enableWhitelist: whitelist,
          royaltyReceiver: royaltyAddress || address,
          royaltyFeeNumerator: royaltyPercent ? Math.floor(Number(royaltyPercent) * 100) : 0
        }],
        value: parseEther(CREATION_FEE_MON),
        gas: BigInt(1_000_000),
        gasPrice: parseGwei('0.1'),
      });
      // Wait for transaction receipt and check status
      if (!publicClient) {
        setError('Blockchain client not available.');
        setShowProgress(false);
        return;
      }
      const receipt = await publicClient.waitForTransactionReceipt({ hash: tx });
      if (receipt.status !== 'success') {
        setError('Transaction failed. Please try again.');
        setShowProgress(false);
        return;
      }
      // Parse logs for CollectionCreated event to get contract address
      let nftContractAddress = '';
      try {
        const eventAbi = parseAbiItem('event CollectionCreated((address creator,address collection,string collectionType,string name,string symbol,uint256 maxSupply,uint256 mintPrice,uint256 maxPerWallet,uint256 releaseDate,uint256 mintEndDate,bool infiniteMint) data)');
        const eventSelector = getEventSelector(eventAbi);
        for (const log of receipt.logs) {
          if (
            log.topics &&
            Array.isArray(log.topics) &&
            typeof log.data === 'string' &&
            log.topics[0] === eventSelector
          ) {
            try {
              const decoded = decodeEventLog({ abi: [eventAbi], data: log.data, topics: log.topics });
              nftContractAddress = decoded.args.data.collection;
              break;
            } catch (err) { /* skip if decode fails */ }
          }
        }
      } catch (e) { /* fallback: leave blank if not found */ }
      setCurrentStep(3);
      // Step 4: Save to Firebase (store ipfs://... for minting, convert to HTTP only for UI display)
      const collectionData: Omit<NFTCollection, 'id' | 'createdAt'> & {
        contractAddress?: string;
        mintStartDate?: number;
        mintEndDate?: number;
        totalSupply?: string;
        discord: string;
        twitter: string;
      } = {
        name,
        description,
        symbol,
        category,
        mintPrice,
        traits: traits.map(trait => ({
          type: trait.type,
          value: trait.value,
          display_type: 'string'
        })),
        mediaUrl: imageIpfsUrl, // ipfs://... for storage
        mediaType: media.type.startsWith('image') ? 'image' : 'video',
        metadataUrl: metadataIpfsUrl, // ipfs://... for storage
        creatorAddress: address,
        contractAddress: nftContractAddress,
        mintStartDate: mintDate ? Math.floor(new Date(mintDate).getTime() / 1000) : Math.floor(Date.now() / 1000),
        mintEndDate: mintEndDate ? Math.floor(new Date(mintEndDate).getTime() / 1000) : 0,
        totalSupply: maxSupply || '',
        discord,
        twitter,
        maxPerWallet,
      };
      const collectionId = await createNFTCollection(collectionData);
      onCreate({
        id: collectionId,
        ...collectionData,
        createdAt: Date.now()
      });
      setShowCongrats(true);
      setTimeout(() => setShowCongrats(false), 2000);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" style={{ background: 'linear-gradient(135deg, #fff0f6 0%, #fdf6fa 100%)', paddingRight: '1rem' }}>
          <div className="p-6 relative">
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10">
              <FaTimes size={24} />
            </button>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Create NFT Collection</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {steps[step]}
              {royaltyPercent && parseFloat(royaltyPercent) > 5 && (
                <div className="text-xs text-red-500 mt-1">Royalty cannot exceed 5%</div>
              )}
              <div className="flex justify-between mt-6">
                <div>
                  {step > 0 && (
        <button
                      type="button"
                      className="px-4 py-1 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium shadow-sm transition"
                      onClick={() => setStep(step - 1)}
        >
                      Back
        </button>
                  )}
                </div>
                <div className="flex flex-col items-end w-full">
                  {step < steps.length - 1 && (
                    <button
                      type="button"
                      className="px-4 py-1 rounded-full bg-pink-100 hover:bg-pink-200 text-pink-600 text-sm font-semibold shadow-sm transition"
                      onClick={() => canProceed && setStep(step + 1)} disabled={!canProceed}
                    >
                      Next
                    </button>
                  )}
                  {step === steps.length - 1 && (
                    <button
                      type="submit"
                      className="px-4 py-1 rounded-full bg-pink-500 hover:bg-pink-600 text-white text-sm font-bold shadow transition"
                    >
                      Create Collection
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      <ProgressModal
        isOpen={showProgress}
        currentStep={currentStep}
        error={error || undefined}
        steps={PROGRESS_STEPS}
        onClose={() => {
          setShowProgress(false);
          setError(null);
        }}
      />
      {showCongrats && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="bg-white rounded-xl shadow-xl px-8 py-6 text-2xl font-bold text-green-600 border-2 border-green-300 animate-bounce">
            �� Collection created successfully! 🎉
      </div>
    </div>
      )}
    </>
  );
} 