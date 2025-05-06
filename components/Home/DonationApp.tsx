import React, { useState, useEffect } from 'react';
import { useFrame } from '../farcaster-provider';
import { useAccount, useSignTypedData, useConnect, useSwitchChain, useBalance, useDisconnect, useContractWrite, useContractRead } from 'wagmi';
import { monadTestnet } from 'viem/chains';
import { useMiniAppContext } from '@/hooks/use-miniapp-context';
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc } from "firebase/firestore";
import { initializeApp } from "firebase/app";
import { parseEther, parseGwei } from 'viem';
import confetti from 'canvas-confetti';

interface DonationCard {
  id: string;
  title: string;
  description: string;
  goalAmount: number;
  currentAmount: number;
  duration?: number;
  endDate?: string;
  creatorAddress: string;
  isActive: boolean;
  avatarUrl: string;
  isGoalBased: boolean;
  ipfsHash?: string;
  createdAt: number;
  firestoreId: string;
  cardColor: string;
}

// Add EIP-712 types for donation
const EIP712_DONATION_TYPES = {
  Donation: [
    { name: 'campaignId', type: 'string' },
    { name: 'amount', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
  ],
};

function isValidAddress(address: string) {
  // Simple regex for 0x-prefixed 40-hex address
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

function truncateAddress(addr: string) {
  if (!addr) return '';
  return addr.slice(0, 6) + '...' + addr.slice(-4);
}

// Utility: EIP-712 domain and types
const EIP712_DOMAIN = {
  name: 'FarcasterDonations',
  version: '1',
  chainId: 1, // Update as needed
};
const EIP712_TYPES = {
  Campaign: [
    { name: 'title', type: 'string' },
    { name: 'description', type: 'string' },
    { name: 'goal', type: 'uint256' },
    { name: 'endDate', type: 'uint256' },
    { name: 'donationAddress', type: 'address' },
    { name: 'nonce', type: 'uint256' },
  ],
};

// Utility: Pinata IPFS upload
async function uploadToPinata(data: any): Promise<any> {
  const res = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.NEXT_PUBLIC_PINATA_JWT}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Pinata upload failed');
  return await res.json();
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Utility function to check if a campaign is ended
function isCampaignEnded(card: DonationCard) {
  if (!card.isActive) return true;
  if (card.isGoalBased) return false;
  if (!card.endDate) return false;
  const end = new Date((card.endDate as unknown) as string);
  if (isNaN(end.getTime())) return false;
  return end <= new Date();
}

// Replace hardcoded contract address with env variable
const DONATION_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_DONATION_CONTRACT_ADDRESS as `0x${string}`;

// Contract ABI
const DONATION_CONTRACT_ABI = [{"inputs":[{"internalType":"address","name":"_monTokenAddress","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"OwnableInvalidOwner","type":"error"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"OwnableUnauthorizedAccount","type":"error"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"string","name":"campaignId","type":"string"},{"indexed":true,"internalType":"address","name":"creator","type":"address"},{"indexed":false,"internalType":"uint256","name":"goalAmount","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"timestamp","type":"uint256"}],"name":"CampaignCreated","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"string","name":"campaignId","type":"string"},{"indexed":true,"internalType":"address","name":"donor","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"timestamp","type":"uint256"}],"name":"DonationMade","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"inputs":[{"internalType":"string","name":"","type":"string"}],"name":"campaigns","outputs":[{"internalType":"string","name":"campaignId","type":"string"},{"internalType":"address","name":"creator","type":"address"},{"internalType":"uint256","name":"goalAmount","type":"uint256"},{"internalType":"uint256","name":"currentAmount","type":"uint256"},{"internalType":"bool","name":"isActive","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"string","name":"_campaignId","type":"string"},{"internalType":"uint256","name":"_goalAmount","type":"uint256"}],"name":"createCampaign","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"string","name":"_campaignId","type":"string"}],"name":"donate","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"string","name":"_campaignId","type":"string"}],"name":"getCampaign","outputs":[{"internalType":"string","name":"campaignId","type":"string"},{"internalType":"address","name":"creator","type":"address"},{"internalType":"uint256","name":"goalAmount","type":"uint256"},{"internalType":"uint256","name":"currentAmount","type":"uint256"},{"internalType":"bool","name":"isActive","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"monToken","outputs":[{"internalType":"contract IERC20","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"string","name":"_campaignId","type":"string"}],"name":"toggleCampaignActive","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"}];

// Color palette for campaign cards
const CARD_COLORS = [
  '#f9fafb', // light gray
  '#fef3c7', // light yellow
  '#dbeafe', // light blue
  '#fce7f3', // light pink
  '#d1fae5', // light green
  '#ede9fe', // light purple
  '#fee2e2', // light red
  '#fff7ed', // light orange
];

export default function DonationApp({ onBack }: { onBack?: () => void }) {
  const { address } = useAccount();
  const { context } = useFrame();
  const farcasterName = context?.user?.displayName || context?.user?.username || '';
  const farcasterPfp = context?.user?.pfpUrl || '';
  const farcasterAddress = address || '';
  const [donationCards, setDonationCards] = useState<DonationCard[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [donationAmount, setDonationAmount] = useState('');
  const [isDonating, setIsDonating] = useState(false);
  const [donationError, setDonationError] = useState('');
  const [newDonation, setNewDonation] = useState({
    title: '',
    description: '',
    goalAmount: 0,
    endDate: '',
    endTime: '12:00',
    isGoalBased: true,
    donationAddress: farcasterAddress,
    cardColor: '#f9fafb', // default color
  });
  const [errors, setErrors] = useState<{[key:string]: string}>({});
  const [showAddressInfo, setShowAddressInfo] = useState(false);
  const [showGoalInfo, setShowGoalInfo] = useState(false);
  const [editingAddress, setEditingAddress] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showEndDateInfo, setShowEndDateInfo] = useState(false);
  const [selectedCard, setSelectedCard] = useState<DonationCard | null>(null);
  const { signTypedDataAsync } = useSignTypedData();
  const { connect, connectors, error: connectError } = useConnect();
  const { switchChain, error: switchError } = useSwitchChain();
  const { isEthProviderAvailable, actions } = useMiniAppContext();
  const { chainId } = useAccount();
  const { data: balanceData } = useBalance({ address, chainId: monadTestnet.id });
  const { disconnect } = useDisconnect();

  // Contract write hooks
  const { writeContractAsync: createCampaignContract } = useContractWrite();

  const { writeContractAsync: donateToCampaign } = useContractWrite();

  const [showCongrats, setShowCongrats] = useState(false);
  const [showCreateCongrats, setShowCreateCongrats] = useState(false);

  // Add state for tab and sorting
  const [activeTab, setActiveTab] = useState<'ongoing' | 'halfway' | 'ended'>('ongoing');
  const [sortOrder, setSortOrder] = useState<'high' | 'low'>('high');

  const [showOnboarding, setShowOnboarding] = useState(true);

  // Load campaigns from Firestore on mount
  useEffect(() => {
    async function fetchCampaigns() {
      try {
        const querySnapshot = await getDocs(collection(db, "donationCampaigns"));
        const campaigns = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: data.id || '',
            title: data.title || '',
            description: data.description || '',
            goalAmount: data.goalAmount || 0,
            currentAmount: data.currentAmount || 0,
            duration: data.duration,
            endDate: data.endDate,
            creatorAddress: data.creatorAddress || '',
            isActive: typeof data.isActive === 'boolean' ? data.isActive : true,
            avatarUrl: data.avatarUrl || '',
            isGoalBased: typeof data.isGoalBased === 'boolean' ? data.isGoalBased : true,
            ipfsHash: data.ipfsHash,
            createdAt: data.createdAt || 0,
            firestoreId: doc.id,
            cardColor: data.cardColor || '#f9fafb',
          };
        });
        setDonationCards(campaigns);
      } catch (err) {
        console.error("Failed to fetch campaigns from Firestore:", err);
      }
    }
    fetchCampaigns();
  }, []);

  // Add useEffect to update donation address when Farcaster context or wallet address changes
  useEffect(() => {
    setNewDonation((prev) => ({
      ...prev,
      donationAddress: address || prev.donationAddress,
    }));
  }, [address]);

  const generateAvatar = (seed: string) => {
    return `https://api.dicebear.com/7.x/notionists/svg?seed=${seed}`;
  };

  const validate = () => {
    const errs: {[key:string]: string} = {};
    if (!newDonation.title.trim()) errs.title = 'Title is required.';
    if (!newDonation.description.trim()) errs.description = 'Description is required.';
    if (!newDonation.goalAmount || newDonation.goalAmount <= 0) errs.goalAmount = 'Goal must be greater than 0.';
    if (!isValidAddress(newDonation.donationAddress)) errs.donationAddress = 'Invalid address.';
    if (!newDonation.isGoalBased && !newDonation.endDate) errs.endDate = 'End date is required.';
    return errs;
  };

  const handleCreate = async () => {
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    if (!address) return;

    try {
      // 1. Create campaign in smart contract
      const campaignId = Math.random().toString(36).substr(2, 9);
      const goalAmount = parseEther(newDonation.goalAmount.toString());
      
      const createTx = await createCampaignContract({
        abi: DONATION_CONTRACT_ABI,
        address: DONATION_CONTRACT_ADDRESS,
        functionName: 'createCampaign',
        args: [campaignId, goalAmount],
      });

      // 2. Create campaign in Firestore
      const newCard: DonationCard = {
        id: campaignId,
        title: newDonation.title,
        description: newDonation.description,
        goalAmount: newDonation.goalAmount,
        currentAmount: 0,
        creatorAddress: newDonation.donationAddress,
        isActive: true,
        isGoalBased: newDonation.isGoalBased,
        avatarUrl: farcasterPfp || `https://api.dicebear.com/7.x/notionists/svg?seed=${farcasterName || address}`,
        ...(newDonation.isGoalBased ? {} : {
          endDate: new Date(newDonation.endDate + 'T' + (newDonation.endTime || '00:00')).toISOString()
        }),
        createdAt: Date.now(),
        firestoreId: '',
        cardColor: newDonation.cardColor,
      };

      await addDoc(collection(db, "donationCampaigns"), newCard);
      
      // 3. Update UI
      setDonationCards(prev => [...prev, newCard]);
      setShowCreateModal(false);
      setShowCreateCongrats(true);
      setTimeout(() => setShowCreateCongrats(false), 2000);
      setNewDonation({
        title: '',
        description: '',
        goalAmount: 0,
        endDate: '',
        endTime: '12:00',
        isGoalBased: true,
        donationAddress: farcasterAddress,
        cardColor: '#f9fafb',
      });
      setErrors({});

    } catch (err) {
      console.error('Campaign creation failed:', err);
      setErrors({ submit: 'Failed to create campaign. Please try again.' });
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(newDonation.donationAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const handleDonate = async () => {
    if (!selectedCard || !address) return;
    const amount = parseFloat(donationAmount);
    if (isNaN(amount) || amount <= 0) {
      setDonationError('Please enter a valid amount');
      return;
    }
    setIsDonating(true);
    setDonationError('');
    try {
      console.log('Preparing to send donation transaction:', {
        campaignId: selectedCard.id,
        value: donationAmount,
        address,
        contract: DONATION_CONTRACT_ADDRESS
      });
      const donateTx = await donateToCampaign({
        abi: DONATION_CONTRACT_ABI,
        address: DONATION_CONTRACT_ADDRESS,
        functionName: 'donate',
        args: [selectedCard.id],
        value: parseEther(donationAmount),
        gas: BigInt(500_000),
        gasPrice: parseGwei("0.1"),
      });
      console.log('Donation transaction sent! Tx result:', donateTx);
      // 3. Update Firestore (use firestoreId)
      const campaignRef = doc(db, "donationCampaigns", selectedCard.firestoreId);
      await updateDoc(campaignRef, {
        currentAmount: selectedCard.currentAmount + amount
      });
      console.log('Firestore updated for campaign:', selectedCard.firestoreId);
      // 4. Update local state
      const updatedCards = donationCards.map(card => {
        if (card.id === selectedCard.id) {
          return {
            ...card,
            currentAmount: card.currentAmount + amount
          };
        }
        return card;
      });
      setDonationCards(updatedCards);
      setShowDonateModal(false);
      setDonationAmount('');
      console.log('Donation modal closed and state updated.');
      // Show congrats message and confetti
      setShowCongrats(true);
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 }
      });
      setTimeout(() => setShowCongrats(false), 2000);
    } catch (err) {
      console.error('Donation failed:', err);
      setDonationError('Failed to process donation. Please try again.');
    } finally {
      setIsDonating(false);
    }
  };

  // Filter and sort campaigns for each tab
  const ongoingCampaigns = donationCards.filter(card => card.isActive && !isCampaignEnded(card) && (card.currentAmount / card.goalAmount) < 0.5);
  const halfwayCampaigns = donationCards.filter(card => card.isActive && !isCampaignEnded(card) && (card.currentAmount / card.goalAmount) >= 0.5);
  const endedCampaigns = donationCards.filter(card => !card.isActive || isCampaignEnded(card));

  function sortCampaigns(cards: DonationCard[]) {
    return [...cards].sort((a, b) => sortOrder === 'high' ? b.goalAmount - a.goalAmount : a.goalAmount - b.goalAmount);
  }

  if (showOnboarding) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-between bg-gradient-to-br from-pink-50 to-green-50 font-sans">
        {onBack && (
          <button
            className="absolute top-0 left-0 z-10 flex items-center gap-1 px-3 py-1 bg-white/80 text-gray-700 rounded-full text-sm font-medium hover:bg-white transition -translate-y-1 mt-4 ml-4"
            onClick={onBack}
            style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
          >
            <span className="text-lg">←</span> Back
          </button>
        )}
        <div className="flex-1 flex flex-col items-center justify-center w-full px-4">
          <div className="max-w-xl w-full flex flex-col items-center text-center mt-12 mb-8">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-pink-600" style={{ fontFamily: 'Poppins, Inter, sans-serif' }}>
              Make a Difference, One Donation at a Time
            </h1>
            <h2 className="text-lg md:text-xl text-gray-700 mb-6 font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
              Join a community of givers. Start or support a campaign and help change lives on Monad.
            </h2>
            <div className="w-full flex justify-center mb-6">
              <img src="/images/donation.jpg" alt="Donate" className="rounded-2xl shadow-lg max-h-64 object-cover border-4 border-white" style={{ maxWidth: '100%' }} />
            </div>
            <div className="w-full flex flex-col items-center gap-4 mb-6">
              <button
                className="px-8 py-4 bg-gradient-to-r from-pink-500 to-green-400 text-white rounded-full font-bold text-2xl shadow-lg hover:opacity-90 transition-opacity w-full max-w-xs"
                style={{ fontFamily: 'Poppins, Inter, sans-serif', letterSpacing: '0.01em' }}
                onClick={() => {
                  setShowOnboarding(false);
                  setShowCreateModal(true);
                }}
              >
                Create Campaign
              </button>
              <button
                className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-400 text-white rounded-full font-bold text-2xl shadow-lg hover:opacity-90 transition-opacity w-full max-w-xs"
                style={{ fontFamily: 'Poppins, Inter, sans-serif', letterSpacing: '0.01em' }}
                onClick={() => setShowOnboarding(false)}
              >
                Donate
              </button>
            </div>
          </div>
        </div>
        <div className="w-full flex flex-col items-center mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-gray-500 font-semibold">Built on</span>
            <img src="/images/monad.png" alt="Monad" className="h-6 w-auto" />
          </div>
          <div className="flex items-center gap-2">
            <img src="/images/profile.png" alt="Chris Wilder" className="w-7 h-7 rounded-full border-2 border-gray-400" />
            <a
              href="https://x.com/realchriswilder"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-400 hover:underline flex items-center gap-1"
              title="@realchriswilder on X"
            >
              Built by Chris Wilder
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M20.5 3h-17A.5.5 0 0 0 3 3.5v17a.5.5 0 0 0 .5.5h17a.5.5 0 0 0 .5-.5v-17a.5.5 0 0 0-.5-.5zm-2.47 3.03l-4.24 5.66 4.24 5.28h-2.06l-3.22-4.01-3.22 4.01H5.5l4.24-5.28-4.24-5.66h2.06l3.22 4.01 3.22-4.01h2.03z" fill="#1DA1F2"/></svg>
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-8 relative">
      {onBack && (
        <button
          className="absolute top-0 left-0 z-10 flex items-center gap-1 px-3 py-1 bg-white/80 text-gray-700 rounded-full text-sm font-medium hover:bg-white transition -translate-y-1"
          onClick={onBack}
          style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
        >
          <span className="text-lg">←</span> Back
        </button>
      )}
      <div className="pt-4">
        {/* Wallet Connect & Chain Switch UI */}
        <div className="absolute top-0 right-4 z-30 flex flex-col items-end gap-2">
          {!isEthProviderAvailable && (
            <div className="text-red-400 font-bold text-xs flex items-center gap-1">
              <span>Wallet not available</span>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M2 7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7zm2 0v10h16V7H4zm2 2h12v6H6V9z" fill="#f43f5e"/></svg>
            </div>
          )}
          {isEthProviderAvailable && !address && (
            <button
              className="flex items-center gap-2 bg-pink-500 hover:bg-pink-600 text-white font-bold py-1 px-3 rounded-full text-xs shadow mb-1 disabled:opacity-50"
              onClick={() => connect({ connector: connectors[0] })}
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 14.93V17a1 1 0 1 1-2 0v-.07A8.001 8.001 0 0 1 4.07 13H5a1 1 0 1 1 0 2h-.93A8.001 8.001 0 0 1 11 19.93zM19.93 11H19a1 1 0 1 1 0-2h.93A8.001 8.001 0 0 1 13 4.07V5a1 1 0 1 1-2 0v-.93A8.001 8.001 0 0 1 19.93 11z" fill="#fff"/></svg>
              Connect Wallet
            </button>
          )}
          {isEthProviderAvailable && address && chainId !== monadTestnet.id && (
            <button
              className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-1 px-3 rounded-full text-xs shadow mb-1"
              onClick={() => switchChain({ chainId: monadTestnet.id })}
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 14.93V17a1 1 0 1 1-2 0v-.07A8.001 8.001 0 0 1 4.07 13H5a1 1 0 1 1 0 2h-.93A8.001 8.001 0 0 1 11 19.93zM19.93 11H19a1 1 0 1 1 0-2h.93A8.001 8.001 0 0 1 13 4.07V5a1 1 0 1 1-2 0v-.93A8.001 8.001 0 0 1 19.93 11z" fill="#f59e42"/></svg>
              Switch to Monad Testnet
            </button>
          )}
          {address && chainId === monadTestnet.id && (
            <div className="flex items-center gap-2 bg-white/80 rounded-full px-3 py-1 shadow text-xs font-mono text-gray-700 mt-0">
              <svg width="10" height="10" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#10b981"/></svg>
              {balanceData && <span className="ml-2">MON: {Number(balanceData.formatted).toFixed(2)}</span>}
              <button onClick={() => disconnect()} className="ml-2 p-1 rounded-full hover:bg-gray-200 transition" title="Disconnect">
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M15.25 8.75L19.5 13M19.5 13L15.25 17.25M19.5 13H7.5" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </div>
          )}
        </div>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-10 gap-4">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800">Donation Campaigns</h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-8 py-3 bg-gradient-to-r from-pink-500 to-green-400 text-white rounded-full font-bold text-lg shadow-lg hover:opacity-90 transition-opacity"
          >
            Create Campaign
          </button>
        </div>
        {/* Tabs and sort UI */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2">
            <button onClick={() => setActiveTab('ongoing')} className={`px-3 py-1 rounded-full text-sm font-semibold ${activeTab === 'ongoing' ? 'bg-pink-500 text-white' : 'bg-gray-100 text-gray-700'}`}>🟢</button>
            <button onClick={() => setActiveTab('halfway')} className={`px-3 py-1 rounded-full text-sm font-semibold ${activeTab === 'halfway' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-700'}`}>🌓</button>
            <button onClick={() => setActiveTab('ended')} className={`px-3 py-1 rounded-full text-sm font-semibold ${activeTab === 'ended' ? 'bg-gray-400 text-white' : 'bg-gray-100 text-gray-700'}`}>🔴</button>
          </div>
          <div className="flex items-center gap-1">
            <select value={sortOrder} onChange={e => setSortOrder(e.target.value as 'high' | 'low')} className="text-xs rounded px-2 py-1 border border-gray-200 bg-white focus:outline-none">
              <option value="high">High to Low</option>
              <option value="low">Low to High</option>
            </select>
          </div>
        </div>
        {/* Show campaigns for the active tab */}
        <div className="grid grid-cols-2 gap-4">
          {activeTab === 'ongoing' && sortCampaigns(ongoingCampaigns).length === 0 && (
            <div className="col-span-2 text-center text-gray-400 text-xl py-16">No ongoing campaigns.</div>
          )}
          {activeTab === 'halfway' && sortCampaigns(halfwayCampaigns).length === 0 && (
            <div className="col-span-2 text-center text-gray-400 text-xl py-16">No halfway campaigns.</div>
          )}
          {activeTab === 'ended' && sortCampaigns(endedCampaigns).length === 0 && (
            <div className="col-span-2 text-center text-gray-400 text-xl py-16">No ended campaigns.</div>
          )}
          {(activeTab === 'ongoing' ? sortCampaigns(ongoingCampaigns)
            : activeTab === 'halfway' ? sortCampaigns(halfwayCampaigns)
            : sortCampaigns(endedCampaigns)
          ).map(card => (
            <button
              key={card.id}
              className="bg-white rounded-lg shadow-xl border border-gray-100 flex flex-col justify-between aspect-square overflow-hidden p-5 min-w-[160px] min-h-[160px] text-left cursor-pointer focus:outline-none text-sm relative"
              style={{ background: card.cardColor || '#f9fafb' }}
              onClick={() => setSelectedCard(card)}
            >
              <img
                src={card.avatarUrl}
                alt="Creator Avatar"
                className="w-10 h-10 rounded-full border-2 border-pink-200 absolute top-3 left-3 z-10"
              />
              <div className="pl-12 pt-1 w-full">
                <h3 className="font-semibold text-base text-gray-800 truncate w-full" style={{maxWidth: '100%'}}>{card.title}</h3>
                <span className={`inline-block px-1.5 py-0.5 rounded bg-pink-100 text-pink-700 text-[10px] font-semibold whitespace-nowrap ${card.isGoalBased ? '' : 'bg-blue-100 text-blue-700'}`}>{card.isGoalBased ? 'Goal-based' : 'Time-based'}</span>
              </div>
              <p className="text-gray-600 mb-4 line-clamp-3 text-xs">{card.description}</p>
              <div className="mb-4">
                <div className="flex justify-between items-center text-xs mb-2">
                  <span>Prog.</span>
                  <span className="font-bold whitespace-nowrap">
                    {Number(card.currentAmount).toFixed(2)} / {Number(card.goalAmount).toFixed(0)} <span className="font-normal">MON</span>
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-pink-500 to-green-400 h-2 rounded-full"
                    style={{ width: `${(card.currentAmount / card.goalAmount) * 100}%` }}
                  />
                </div>
              </div>
              <div className="mb-6 flex justify-center items-end h-8">
                {!isCampaignEnded(card) ? (
                  <span className="inline-block w-4 h-4 rounded-full bg-green-400 shadow-[0_0_8px_2px_rgba(34,197,94,0.7)] border-2 border-white"></span>
                ) : (
                  <span className="inline-block w-4 h-4 rounded-full bg-red-400 shadow-[0_0_8px_2px_rgba(239,68,68,0.7)] border-2 border-white"></span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
      {/* Create Donation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full relative overflow-hidden">
            {/* Creator Info */}
            <div className="flex flex-col items-center mb-6">
              {farcasterPfp ? (
                <img src={farcasterPfp} alt="Profile" className="w-16 h-16 rounded-full mb-2 border-2 border-pink-200" />
              ) : (
                <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${farcasterName || address}`} alt="Avatar" className="w-16 h-16 rounded-full mb-2 border-2 border-pink-200" />
              )}
              <div className="font-bold text-lg mb-1">{farcasterName}</div>
              <div className="flex items-center gap-1 w-full justify-center relative mt-1">
                {editingAddress ? (
                  <input
                    type="text"
                    className="text-center font-mono text-xs bg-gray-100 rounded-lg px-2 py-1 border border-gray-200 flex-1 min-w-0"
                    value={newDonation.donationAddress}
                    onChange={e => setNewDonation({...newDonation, donationAddress: e.target.value})}
                    autoFocus
                  />
                ) : (
                  <span
                    className="text-center font-mono text-xs bg-gray-50 rounded-full px-3 py-1 border border-gray-200 shadow-sm transition-all duration-200 max-w-[180px] truncate cursor-pointer hover:bg-gray-100"
                    title={newDonation.donationAddress}
                    style={{ display: 'inline-block' }}
                  >
                    {truncateAddress(newDonation.donationAddress)}
                  </span>
                )}
                <button type="button" onClick={handleCopy} className="text-gray-400 hover:text-pink-400 px-1" title="Copy address">
                  {copied ? '✅' : '📋'}
                </button>
                <button type="button" onClick={() => setEditingAddress(e => !e)} className="text-gray-400 hover:text-pink-400 px-1" title="Edit address">
                  ✏️
                </button>
                <button type="button" onClick={() => setShowAddressInfo(v => !v)} className="text-gray-400 hover:text-pink-400 px-1" title="About address">
                  <span className="bg-blue-500 text-white rounded-full px-1">i</span>
                </button>
                {showAddressInfo && (
                  <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-white border border-gray-200 rounded shadow-lg p-3 w-64 z-50 text-xs text-gray-700">
                    <div className="font-bold mb-1">Donation Address</div>
                    This is the address where donations will be sent. You can use your connected Farcaster wallet or enter a different ERC20/Monad address.
                    <button className="mt-2 text-pink-500 hover:underline" onClick={() => setShowAddressInfo(false)}>Close</button>
                  </div>
                )}
              </div>
              {errors.donationAddress && <div className="text-xs text-red-500 mt-1">{errors.donationAddress}</div>}
            </div>
            {/* Scrollable Form Body */}
            <div className="overflow-y-auto max-h-[60vh] pr-1">
              {/* Campaign Details */}
              <div className="mb-4">
                <label className="block font-semibold mb-1">Campaign Title</label>
                <input
                  type="text"
                  placeholder="Campaign Title"
                  className="w-full p-2 border rounded-lg"
                  value={newDonation.title}
                  onChange={(e) => setNewDonation({...newDonation, title: e.target.value})}
                />
                {errors.title && <div className="text-xs text-red-500 mt-1">{errors.title}</div>}
              </div>
              <div className="mb-4">
                <label className="block font-semibold mb-1">Description</label>
                <textarea
                  placeholder="Campaign Description"
                  className="w-full p-2 border rounded-lg"
                  rows={4}
                  value={newDonation.description}
                  onChange={(e) => setNewDonation({...newDonation, description: e.target.value})}
                />
                {errors.description && <div className="text-xs text-red-500 mt-1">{errors.description}</div>}
              </div>
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <label className="font-semibold">Goal Amount (MON)</label>
                  <button type="button" onClick={() => setShowGoalInfo(v => !v)} className="text-gray-400 hover:text-pink-400" title="About goal">
                    <span className="bg-blue-500 text-white rounded-full px-1">i</span>
                  </button>
                </div>
                <input
                  type="number"
                  placeholder="Goal Amount (MON)"
                  className="w-full p-2 border rounded-lg"
                  value={newDonation.goalAmount}
                  onChange={(e) => setNewDonation({...newDonation, goalAmount: Number(e.target.value)})}
                />
                {showGoalInfo && (
                  <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-white border border-gray-200 rounded shadow-lg p-3 w-64 z-50 text-xs text-gray-700">
                    <div className="font-bold mb-1">Goal Amount</div>
                    The total amount of MON tokens you want to raise for this campaign.
                    <button className="mt-2 text-pink-500 hover:underline" onClick={() => setShowGoalInfo(false)}>Close</button>
                  </div>
                )}
                {errors.goalAmount && <div className="text-xs text-red-500 mt-1">{errors.goalAmount}</div>}
              </div>
              <div className="mb-4">
                <label className="font-semibold mr-2">Goal Type</label>
                <input
                  type="checkbox"
                  id="goalBased"
                  checked={newDonation.isGoalBased}
                  onChange={(e) => setNewDonation({...newDonation, isGoalBased: e.target.checked})}
                />
                <label htmlFor="goalBased">Goal-based (until target reached)</label>
                {!newDonation.isGoalBased && (
                  <div className="mt-2 relative">
                    <div className="flex items-center gap-2 mb-1">
                      <label className="font-semibold">End Date</label>
                      <button type="button" onClick={() => setShowEndDateInfo(v => !v)} className="text-gray-400 hover:text-pink-400" title="About end date">
                        <span className="bg-blue-500 text-white rounded-full px-1">i</span>
                      </button>
                    </div>
                    <input
                      type="date"
                      className="w-full p-2 border rounded-lg"
                      value={newDonation.endDate}
                      onChange={(e) => setNewDonation({...newDonation, endDate: e.target.value})}
                    />
                    <input
                      type="time"
                      className="w-full p-2 border rounded-lg mt-2"
                      value={newDonation.endTime}
                      onChange={(e) => setNewDonation({...newDonation, endTime: e.target.value})}
                    />
                    {showEndDateInfo && (
                      <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-white border border-gray-200 rounded shadow-lg p-3 w-64 z-50 text-xs text-gray-700">
                        <div className="font-bold mb-1">End Date & Time</div>
                        This is the last day and time your campaign will accept donations. After this, the campaign will close even if the goal is not reached.
                        <button className="mt-2 text-pink-500 hover:underline" onClick={() => setShowEndDateInfo(false)}>Close</button>
                      </div>
                    )}
                    {errors.endDate && <div className="text-xs text-red-500 mt-1">{errors.endDate}</div>}
                  </div>
                )}
              </div>
              <div className="mb-4">
                <label className="block font-semibold mb-1">Card Color</label>
                <div className="flex gap-2 mb-2 flex-wrap">
                  {CARD_COLORS.map(color => (
                    <button
                      key={color}
                      type="button"
                      className={`w-7 h-7 rounded-full border-2 ${newDonation.cardColor === color ? 'border-pink-500' : 'border-gray-200'} focus:outline-none`}
                      style={{ background: color }}
                      onClick={() => setNewDonation({ ...newDonation, cardColor: color })}
                      aria-label={`Pick color ${color}`}
                    />
                  ))}
                  <input
                    type="color"
                    value={newDonation.cardColor}
                    onChange={e => setNewDonation({ ...newDonation, cardColor: e.target.value })}
                    className="w-7 h-7 rounded-full border-2 border-gray-200 p-0 cursor-pointer"
                    title="Custom color"
                    style={{ minWidth: 28 }}
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                className="px-4 py-2 bg-gradient-to-r from-pink-500 to-green-400 text-white rounded-lg"
              >
                Create Campaign
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Campaign Details Modal */}
      {selectedCard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full relative overflow-y-auto max-h-[90vh]"
            style={{ background: selectedCard.cardColor || '#f9fafb' }}
          >
            <button
              className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-white/80 hover:bg-pink-100 border border-pink-200 text-pink-500 text-xl font-bold shadow-sm transition"
              onClick={() => setSelectedCard(null)}
              aria-label="Close"
            >
              ×
            </button>
            {/* Share to Farcaster button */}
            <button
              className="absolute top-3 right-12 w-8 h-8 flex items-center justify-center rounded-full bg-white/80 hover:bg-blue-100 border border-blue-200 text-blue-500 text-xl font-bold shadow-sm transition"
              title="Share to Farcaster"
              onClick={async () => {
                const shareUrl = `${window.location.origin}/share?campaign=${selectedCard.id}`;
                const shareText = `🎉 Donation Campaign: ${selectedCard.title}\n${selectedCard.description}\nGoal: ${selectedCard.goalAmount} MON`;
                if (actions && actions.composeCast) {
                  await actions.composeCast({
                    text: shareText,
                    embeds: [shareUrl],
                  });
                } else {
                  const url = `https://warpcast.com/~/compose?text=${encodeURIComponent(shareText)}&embeds[]=${encodeURIComponent(shareUrl)}`;
                  window.open(url, '_blank');
                }
              }}
            >
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 16V4m0 0l-4 4m4-4l4 4" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <div className="flex flex-col items-center mb-4">
              <img src={selectedCard.avatarUrl} alt="Creator Avatar" className="w-16 h-16 rounded-full border-2 border-pink-200 mb-2" />
              <div className="font-bold text-lg mb-1">{selectedCard.creatorAddress ? truncateAddress(selectedCard.creatorAddress) : 'Unknown'}</div>
              <span className="text-xs text-gray-500 flex items-center gap-1">Campaign Creator
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-pink-500 shadow-sm ml-1">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="#fff" className="w-3 h-3">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293a1 1 0 00-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z" clipRule="evenodd" />
                  </svg>
                </span>
              </span>
            </div>
            <div className="mb-4">
              <h2 className="text-2xl font-extrabold text-gray-800 mb-2">{selectedCard.title}</h2>
              <p className="text-gray-700 mb-2 whitespace-pre-line">{selectedCard.description}</p>
              <div className="flex flex-wrap gap-2 items-center mb-2">
                <span className="px-2 py-1 rounded bg-pink-100 text-pink-700 text-xs font-semibold">{selectedCard.isGoalBased ? 'Goal-based' : 'Time-based'}</span>
                {selectedCard.endDate && !selectedCard.isGoalBased && (
                  !isCampaignEnded(selectedCard) ? (
                    <span className="px-2 py-1 rounded bg-blue-100 text-blue-700 text-xs font-semibold">Ends: {new Date((selectedCard.endDate as unknown) as string).toLocaleString()}</span>
                  ) : (
                    <span className="px-2 py-1 rounded bg-red-100 text-red-700 text-xs font-semibold flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-red-400 shadow-[0_0_8px_2px_rgba(239,68,68,0.7)]"></span>Ended</span>
                  )
                )}
              </div>
              <div className="mb-2">
                <div className="flex justify-between items-center text-xs mb-1">
                  <span>Prog.</span>
                  <span className="font-bold whitespace-nowrap">
                    {Number(selectedCard.currentAmount).toFixed(2)} / {Number(selectedCard.goalAmount).toFixed(0)} <span className="font-normal">MON</span>
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                  <div
                    className="bg-gradient-to-r from-pink-500 to-green-400 h-2 rounded-full"
                    style={{ width: `${(selectedCard.currentAmount / selectedCard.goalAmount) * 100}%` }}
                  />
                </div>
              </div>
              <div className="mb-2 flex items-center gap-2">
                <span className="font-semibold text-sm">Donation Address:</span>
                <span className="font-mono text-xs bg-gray-100 rounded-lg px-2 py-1 border border-gray-200 truncate" title={selectedCard.creatorAddress}>{truncateAddress(selectedCard.creatorAddress)}</span>
                <button type="button" onClick={() => {navigator.clipboard.writeText(selectedCard.creatorAddress)}} className="text-gray-400 hover:text-pink-400" title="Copy address">📋</button>
              </div>
            </div>
            <div className="mb-4">
              <span className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold mb-2">Decentralized & Transparent</span>
              <div className="text-xs text-gray-500">This donation campaign is powered by a decentralized, transparent platform. All donations go directly to the campaign address on-chain.</div>
            </div>
            <button
              className={`w-full py-2 rounded-lg font-semibold mt-2 ${selectedCard.isActive && !isCampaignEnded(selectedCard) ? 'bg-gradient-to-r from-pink-500 to-green-400 text-white' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
              disabled={!(selectedCard.isActive && !isCampaignEnded(selectedCard))}
              onClick={() => setShowDonateModal(true)}
            >
              Donate
            </button>
          </div>
        </div>
      )}
      {/* Donation Modal */}
      {showDonateModal && selectedCard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full relative">
            <button
              className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-white/80 hover:bg-pink-100 border border-pink-200 text-pink-500 text-xl font-bold shadow-sm transition"
              onClick={() => {
                setShowDonateModal(false);
                setDonationAmount('');
                setDonationError('');
              }}
              aria-label="Close"
            >
              ×
            </button>
            
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Donate to Campaign</h2>
              <p className="text-gray-600">{selectedCard.title}</p>
            </div>

            <div className="mb-6">
              <label className="block font-semibold mb-2">Amount (MON)</label>
              <div className="relative">
                <input
                  type="number"
                  className="w-full p-3 border rounded-lg pr-12"
                  placeholder="Enter amount"
                  value={donationAmount}
                  onChange={(e) => {
                    setDonationAmount(e.target.value);
                    setDonationError('');
                  }}
                  min="0"
                  step="0.1"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">MON</span>
              </div>
              {donationError && (
                <div className="text-red-500 text-sm mt-2">{donationError}</div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                onClick={() => {
                  setShowDonateModal(false);
                  setDonationAmount('');
                  setDonationError('');
                }}
                disabled={isDonating}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-gradient-to-r from-pink-500 to-green-400 text-white rounded-lg disabled:opacity-50"
                onClick={handleDonate}
                disabled={isDonating || !donationAmount}
              >
                {isDonating ? 'Processing...' : 'Confirm Donation'}
              </button>
            </div>
          </div>
        </div>
      )}
      {showCongrats && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="bg-white rounded-xl shadow-xl px-8 py-6 text-2xl font-bold text-green-600 border-2 border-green-300 animate-bounce">
            🎉 Thank you for your donation! 🎉
          </div>
        </div>
      )}
      {showCreateCongrats && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="bg-white rounded-xl shadow-xl px-6 py-4 max-w-xs w-full text-center text-lg font-semibold text-pink-600 border-2 border-pink-300 animate-bounce">
            🎉 Campaign created! Thank you for making a difference! 🎉
          </div>
        </div>
      )}
    </div>
  );
} 