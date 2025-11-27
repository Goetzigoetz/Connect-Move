import React, { createContext, useContext, useRef } from 'react';

const TabSwipeContext = createContext(null);

export const TabSwipeProvider = ({ children }) => {
  const pagerRef = useRef(null);
  const currentPageRef = useRef(0);

  const value = {
    pagerRef,
    currentPageRef,
  };

  return (
    <TabSwipeContext.Provider value={value}>
      {children}
    </TabSwipeContext.Provider>
  );
};

export const useTabSwipe = () => {
  const context = useContext(TabSwipeContext);
  if (!context) {
    throw new Error('useTabSwipe must be used within TabSwipeProvider');
  }
  return context;
};
