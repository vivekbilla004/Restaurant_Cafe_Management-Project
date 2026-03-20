import React from 'react';
import { Outlet } from 'react-router-dom';

const KitchenLayout = () => {
  return (
    // Dark mode by default for the Kitchen so it's easy to read under bright lights
    <div className="min-h-screen w-screen bg-slate-950 text-slate-100 font-sans overflow-x-hidden">
      <Outlet />
    </div>
  );
};

export default KitchenLayout;