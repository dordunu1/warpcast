const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT;
const PINATA_BASE_URL = 'https://api.pinata.cloud/pinning';

export async function uploadFileToPinata(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${PINATA_BASE_URL}/pinFileToIPFS`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PINATA_JWT}`,
    },
    body: formData,
  });
  if (!res.ok) throw new Error('Pinata file upload failed');
  const data = await res.json();
  return data.IpfsHash;
}

export async function uploadJSONToPinata(json: any): Promise<string> {
  const res = await fetch(`${PINATA_BASE_URL}/pinJSONToIPFS`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${PINATA_JWT}`,
    },
    body: JSON.stringify(json),
  });
  if (!res.ok) throw new Error('Pinata JSON upload failed');
  const data = await res.json();
  return data.IpfsHash;
} 