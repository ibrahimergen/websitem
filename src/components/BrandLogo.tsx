import React from 'react';
const ogMark = '/oynagame-og-mark.svg';

interface Props {
  size?: 'small' | 'medium';
  wordmarkClassName?: string;
}

export const BrandLogo: React.FC<Props> = ({ size = 'medium', wordmarkClassName }) => {
  const markSize = size === 'small' ? 'h-8 w-8' : 'h-10 w-10';

  return (
    <span className="inline-flex items-center gap-2.5">
      <img src={ogMark} alt="" className={`${markSize} shrink-0`} />
      <span className={wordmarkClassName || 'font-sans text-lg font-extrabold tracking-normal text-[#172235]'}>
        OYNAGAME
      </span>
    </span>
  );
};
