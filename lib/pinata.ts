import axios from 'axios';

const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT;
const PINATA_API = 'https://api.pinata.cloud/pinning';
const IPFS_GATEWAY = 'https://ipfs.io/ipfs/';

export async function uploadFileToPinata(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await axios.post(`${PINATA_API}/pinFileToIPFS`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${PINATA_JWT}`,
      },
      maxBodyLength: Infinity,
    });
    const ipfsHash = response.data.IpfsHash;
    return `ipfs://${ipfsHash}`;
  } catch (error) {
    console.error('Error uploading file to IPFS:', error);
    throw new Error('Failed to upload file to IPFS');
  }
}

export async function uploadJSONToPinata(metadata: any): Promise<string> {
  try {
    const response = await axios.post(
      `${PINATA_API}/pinJSONToIPFS`,
      metadata,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${PINATA_JWT}`,
        },
      }
    );
    return `ipfs://${response.data.IpfsHash}`;
  } catch (error) {
    console.error('Error uploading metadata to IPFS:', error);
    throw new Error('Failed to upload metadata to IPFS');
  }
}

// Utility to convert IPFS URL to HTTP URL for web display
export function ipfsToHttp(ipfsUrl: string): string {
  if (!ipfsUrl) return '';
  if (ipfsUrl.startsWith('http')) return ipfsUrl;
  return ipfsUrl.replace('ipfs://', IPFS_GATEWAY);
} 