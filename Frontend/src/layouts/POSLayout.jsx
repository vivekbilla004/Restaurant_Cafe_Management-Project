import React from 'react';
import { Outlet } from 'react-router-dom';

const POSLayout = () => {
  return (
    // High-contrast, clean slate background for a professional POS feel
    <div className="h-screen w-screen overflow-hidden bg-slate-100 flex text-slate-800 font-sans">
      <Outlet />
    </div>
  );
};

export default POSLayout;