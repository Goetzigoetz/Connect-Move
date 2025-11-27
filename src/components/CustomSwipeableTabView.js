import React, { useState, useMemo } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { TabView } from 'react-native-tab-view';
import CustomTabBar from './CustomTabBar';
import * as Haptics from 'expo-haptics';

/**
 * TabView personnalisé avec swipe horizontal
 * @param {Array} routes - Liste des routes [{key: string, name: string, component: Component}]
 * @param {number} initialIndex - Index initial (défaut: 0)
 */
const CustomSwipeableTabView = ({ routes, initialIndex = 0 }) => {
  const layout = useWindowDimensions();
  const [index, setIndex] = useState(initialIndex);

  // Créer les routes pour TabView avec une structure compatible avec CustomTabBar
  const tabRoutes = useMemo(() => routes.map((route) => ({
    key: route.key,
    name: route.name, // Important pour CustomTabBar
    title: route.title || route.name,
  })), [routes]);

  // Mémoriser les composants pour éviter de recréer les navigateurs
  const sceneComponents = useMemo(() => {
    const components = {};
    routes.forEach(route => {
      components[route.key] = route.component;
    });
    return components;
  }, [routes]);

  // Render les scènes manuellement pour supporter les navigateurs imbriqués
  const renderScene = ({ route }) => {
    const Component = sceneComponents[route.key];
    if (!Component) return null;
    return <Component />;
  };

  // Gérer le changement d'index avec haptic feedback
  const handleIndexChange = (newIndex) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIndex(newIndex);
  };

  // Créer un objet state compatible avec CustomTabBar
  const tabBarState = {
    index,
    routes: tabRoutes,
  };

  // Créer un objet navigation compatible avec emit
  const navigation = {
    navigate: (routeName) => {
      const routeIndex = routes.findIndex(r => r.name === routeName || r.key === routeName);
      if (routeIndex !== -1) {
        setIndex(routeIndex);
      }
    },
    emit: ({ type, target, canPreventDefault }) => {
      // Simuler l'émission d'événement de React Navigation
      return { defaultPrevented: false };
    },
  };

  // Créer un objet descriptors compatible avec CustomTabBar
  const descriptors = tabRoutes.reduce((acc, tabRoute) => {
    const route = routes.find(r => r.key === tabRoute.key);
    acc[tabRoute.key] = {
      options: {
        title: route?.title || tabRoute.title,
        tabBarAccessibilityLabel: route?.title || tabRoute.title,
        tabBarTestID: tabRoute.key,
      },
      render: () => null, // Pas utilisé mais requis pour la structure
    };
    return acc;
  }, {});

  return (
    <View style={styles.container}>
      <TabView
        navigationState={{ index, routes: tabRoutes }}
        renderScene={renderScene}
        onIndexChange={handleIndexChange}
        initialLayout={{ width: layout.width }}
        renderTabBar={() => null} // On utilise notre CustomTabBar
        swipeEnabled={true}
        lazy={false}
        animationEnabled={true}
      />
      <CustomTabBar
        state={tabBarState}
        descriptors={descriptors}
        navigation={navigation}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default CustomSwipeableTabView;
