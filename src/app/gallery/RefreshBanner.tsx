import React from 'react';

interface RefreshBannerProps {
  show: boolean;
}

const RefreshBanner: React.FC<RefreshBannerProps> = ({ show }) => {
  if (!show) return null;
  return (
    <div className="fixed top-0 left-0 w-full bg-red-600 text-white text-center py-2 z-50 font-bold shadow-lg animate-pulse">
      🔄 Refresh broadcast received!
    </div>
  );
};

export default RefreshBanner;
