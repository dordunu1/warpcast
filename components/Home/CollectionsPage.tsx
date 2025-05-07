import React from "react";
import { FaMusic, FaPaintBrush, FaCamera, FaGamepad, FaGem, FaEllipsisH } from "react-icons/fa";
import { NFTCollection } from "../../lib/firebase";
import { ipfsToHttp } from '../../lib/pinata';

interface CollectionsPageProps {
  collections: NFTCollection[];
  onSelectCollection?: (collection: NFTCollection) => void;
}

const categoryIcons: Record<string, JSX.Element> = {
  Art: <FaPaintBrush className="text-xl text-blue-500" />,
  Music: <FaMusic className="text-xl text-pink-500" />,
  Photography: <FaCamera className="text-xl text-purple-500" />,
  Games: <FaGamepad className="text-xl text-green-500" />,
  Collectibles: <FaGem className="text-xl text-yellow-500" />,
  Other: <FaEllipsisH className="text-xl text-gray-400" />,
};

const CollectionsPage: React.FC<CollectionsPageProps> = ({ collections, onSelectCollection }) => {
  if (collections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full p-8">
        <div className="mb-6 text-center text-pink-600 text-lg font-semibold max-w-xs">
          Ready to make history? Like <span className="font-bold">Beeple</span> and countless creators, you can bring your art to life onchain.<br />
          <span className="text-pink-500">Launch your collection and inspire the world!</span>
        </div>
        <button
          className="w-full max-w-xs mx-auto py-3 px-6 rounded-full bg-pink-500 text-white font-bold shadow-md hover:bg-pink-600 transition text-lg"
          onClick={() => onSelectCollection && onSelectCollection(null as any)}
        >
          + Create Collection
        </button>
      </div>
    );
  }
  return (
    <>
      <div className="w-full text-center text-2xl font-extrabold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent mb-4 mt-2">
        Explore the collections from your favourite creator on Monad!
      </div>
      <div className="grid grid-cols-2 gap-4 w-full px-2 py-4">
          {collections.map((col, idx) => (
        <button
          key={idx}
          className="p-2 rounded-2xl border border-pink-200 bg-white flex flex-col gap-1 shadow-sm items-center hover:shadow-lg transition cursor-pointer justify-start"
          onClick={() => onSelectCollection && onSelectCollection(col)}
          style={{ minHeight: 220, maxWidth: 210 }}
        >
          {col.mediaType === 'image' ? (
            <img src={ipfsToHttp(col.mediaUrl)} alt="preview" className="rounded-lg w-full h-28 object-cover border border-pink-100" />
          ) : (
            <video src={ipfsToHttp(col.mediaUrl)} controls className="rounded-lg w-full h-28 object-cover border border-pink-100" />
              )}
          <div className="font-bold text-base text-pink-500 truncate w-full text-left mt-1" style={{ maxWidth: '100%' }} title={col.name}>
            {col.name.length > 18 ? col.name.slice(0, 16) + '…' : col.name}
          </div>
          <div className="flex items-center gap-1 mt-0 w-full text-left">
            {categoryIcons[col.category] || categoryIcons['Other']}
            <span className="text-xs text-gray-500">{col.category}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-600 mt-1 w-full text-left">
            <span className="font-semibold">Mint Price:</span>
            <span>{col.mintPrice || 'None'} MON</span>
            <img src="/images/monad.png" alt="MON" className="w-5 h-5 ml-1 inline-block align-middle" />
              </div>
        </button>
          ))}
      </div>
    </>
  );
};

export default CollectionsPage; 