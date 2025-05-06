import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebase-config';

export interface NFTCollection {
  id?: string;
  name: string;
  description: string;
  symbol: string;
  category: string;
  mintPrice: string;
  traits?: any[];
  mediaUrl: string;
  mediaType: 'image' | 'video';
  metadataUrl: string;
  creatorAddress: string;
  createdAt: number;
  maxPerWallet?: string;
  totalSupply?: string;
  contractAddress?: string;
  mintStartDate?: number | string;
  mintEndDate?: number | string;
  collectionType?: string;
  discord?: string;
  twitter?: string;
}

export async function createNFTCollection(collectionData: Omit<NFTCollection, 'id' | 'createdAt'>): Promise<string> {
  const collectionsRef = collection(db, 'nft_collections');
  const docRef = await addDoc(collectionsRef, {
    ...collectionData,
    createdAt: Date.now(),
  });
  return docRef.id;
}

export async function getNFTCollections(): Promise<NFTCollection[]> {
  const collectionsRef = collection(db, 'nft_collections');
  const querySnapshot = await getDocs(collectionsRef);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
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
    ...doc.data()
  } as NFTCollection;
} 