import React from 'react';
import silverFallback from '../assets/images/product_silver_stack_1792232997744.jpg';

interface Props {
  image?: string;
  gameName: string;
  currencyLabel: string;
}

export const GameCurrencyImage: React.FC<Props> = ({ image, gameName, currencyLabel }) => (
  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full border border-amber-200 bg-amber-50 shadow-sm sm:h-16 sm:w-16">
    <img
      src={image || silverFallback}
      alt={`${gameName} ${currencyLabel} coin`}
      onError={(event) => {
        event.currentTarget.onerror = null;
        event.currentTarget.src = silverFallback;
      }}
      className="h-full w-full object-cover"
    />
  </div>
);
