import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebase-config';

export interface NFTCollection {
  id: string;
  name: string;
  description: string;
  symbol: string;
  category: string;
  mintPrice: string;
  traits: Array<{
    type: string;
    value: string;
    display_type?: string;
  }>;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  metadataUrl: string;
  creatorAddress: string;
  contractAddress?: string;
  mintStartDate?: number;
  mintEndDate?: number;
  totalSupply?: string;
  discord: string;
  twitter: string;
  maxPerWallet: string;
  website?: string;
  createdAt: number;
  whitelistEnabled?: boolean;
}

export async function createNFTCollection(collectionData: Omit<NFTCollection, 'id' | 'createdAt'>): Promise<string> {
  const collectionsRef = collection(db, 'nft_collections');
  const docRef = await addDoc(collectionsRef, {
    ...collectionData,
    createdAt: Date.now(),
    whitelistEnabled: collectionData.whitelistEnabled || false,
  });
  return docRef.id;
}

export async function getNFTCollections(): Promise<NFTCollection[]> {
  const collectionsRef = collection(db, 'nft_collections');
  const querySnapshot = await getDocs(collectionsRef);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    whitelistEnabled: doc.data().whitelistEnabled || false,
  } as NFTCollection));
}

export async function getNFTCollectionById(id: string): Promise<NFTCollection | null> {
  const collectionsRef = collection(db, 'nft_collections');
  const q = query(collectionsRef, where('__name__', '==', id));
  const querySnapshot = await getDocs(q);
  
  if (querySnapshot.empty) return null;
  
  const doc = querySnapshot.docs[0];
  return {
    id: doc.id,
    ...doc.data(),
    whitelistEnabled: doc.data().whitelistEnabled || false,
  } as NFTCollection;
} 