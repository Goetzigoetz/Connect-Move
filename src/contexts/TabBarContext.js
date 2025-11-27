import React, { createContext, useContext, useState } from 'react';

const TabBarContext = createContext();

export const TabBarProvider = ({ children }) => {
  const [isTabBarVisible, setIsTabBarVisible] = useState(true);

  return (
    <TabBarContext.Provider value={{ isTabBarVisible, setIsTabBarVisible }}>
      {children}
    </TabBarContext.Provider>
  );
};

export const useTabBar = () => {
  const context = useContext(TabBarContext);
  if (!context) {
    throw new Error('useTabBar must be used within TabBarProvider');
  }
  return context;
};
