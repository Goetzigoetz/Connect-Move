import React from 'react';
import CustomTabBar from './CustomTabBar';

// Pour l'instant, on retourne juste le CustomTabBar normal
// Le swipe sera géré différemment
const SwipeableTabNavigator = ({ state, navigation, descriptors, BottomTabBarComponent }) => {
  const TabBarComponent = BottomTabBarComponent || CustomTabBar;

  return <TabBarComponent state={state} descriptors={descriptors} navigation={navigation} />;
};

export default SwipeableTabNavigator;
