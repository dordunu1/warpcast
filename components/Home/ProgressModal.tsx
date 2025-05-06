import React, { useEffect, useState } from 'react';
import { FaSpinner, FaCheck, FaTimes } from 'react-icons/fa';

interface ProgressModalProps {
  isOpen: boolean;
  currentStep: number;
  error?: string;
  steps: {
    title: string;
    description: string;
  }[];
  onClose?: () => void;
}

export default function ProgressModal({ isOpen, currentStep, error, steps, onClose }: ProgressModalProps) {
  const [showSuccessCheck, setShowSuccessCheck] = useState(false);

  useEffect(() => {
    if (currentStep === steps.length - 1 && !error) {
      setShowSuccessCheck(false);
      const timer = setTimeout(() => setShowSuccessCheck(true), 3000);
      return () => clearTimeout(timer);
    } else {
      setShowSuccessCheck(false);
    }
  }, [currentStep, error, steps.length]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 relative">
        {onClose && (
          <button
            className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-white/80 hover:bg-pink-100 border border-pink-200 text-pink-500 text-xl font-bold shadow-sm transition"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        )}
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Creating Your NFT Collection</h2>
        
        <div className="space-y-4">
          {steps.map((step, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;
            const isError = isCurrent && error;

            return (
              <div key={index} className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isCompleted ? 'bg-green-500' : 
                  isError ? 'bg-red-500' :
                  isCurrent ? (index === steps.length - 1 && !error && showSuccessCheck ? 'bg-green-500' : 'bg-pink-500') : 'bg-gray-200'
                }`}>
                  {isCompleted ? (
                    <FaCheck className="text-white" />
                  ) : isError ? (
                    <FaTimes className="text-white" />
                  ) : isCurrent ? (
                    index === steps.length - 1 && !error ? (
                      showSuccessCheck ? <FaCheck className="text-white" /> : <FaSpinner className="text-white animate-spin" />
                    ) : (
                      <FaSpinner className="text-white animate-spin" />
                    )
                  ) : (
                    <span className="text-gray-500">{index + 1}</span>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className={`font-semibold ${
                    isCompleted ? 'text-green-600' :
                    isError ? 'text-red-600' :
                    isCurrent ? 'text-pink-600' : 'text-gray-600'
                  }`}>
                    {step.title}
                  </h3>
                  <p className="text-sm text-gray-500">{step.description}</p>
                  {isError && (
                    <p className="text-sm text-red-500 mt-1">{error}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
} 