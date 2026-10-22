/**
 * Root component: providers, a tiny state-based navigator and Android back handling.
 * (Five screens do not need a navigation library.)
 */
import React, { useCallback, useEffect, useState } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LEVEL_COUNT } from './src/engine/constants.js';
import { generateLevel } from './src/engine/levels.js';
import { ScreenBackground } from './src/components/ScreenBackground';
import { TABS, TabBar } from './src/components/TabBar';
import { DailyScreen } from './src/screens/DailyScreen';
import { GameScreen } from './src/screens/GameScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { HowToPlayScreen } from './src/screens/HowToPlayScreen';
import { LevelsScreen } from './src/screens/LevelsScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { AppProvider, useApp } from './src/state/AppContext';
import { getUnlockedLevel } from './src/state/progress.js';

const isTab = (name) => TABS.some((tab) => tab.name === name);

function Root() {
  const { ready, theme, progress } = useApp();
  const [route, setRoute] = useState({ name: 'home' });

  const go = useCallback((name) => setRoute({ name }), []);
  const startGame = useCallback((level, returnTo) => setRoute({ name: 'game', level, returnTo }), []);

  // Android back: sub-screens return home; Home exits the app; the game screen handles its own.
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (route.name === 'game' || route.name === 'home') return false;
      setRoute({ name: 'home' });
      return true;
    });
    return () => subscription.remove();
  }, [route.name]);

  if (!ready) return <View style={[styles.root, { backgroundColor: theme.gradient[2] }]} />;

  if (route.name === 'game') {
    const { level, returnTo } = route;
    const hasNext = level.kind === 'campaign' && level.id < LEVEL_COUNT;
    return (
      <View style={styles.root}>
        <StatusBar style={theme.statusBar} />
        <GameScreen
          key={level.id}
          level={level}
          onExit={() => go(returnTo)}
          onNext={hasNext ? () => startGame(generateLevel(level.id + 1), returnTo) : null}
        />
      </View>
    );
  }

  const screens = {
    home: (
      <HomeScreen
        onPlay={() => startGame(generateLevel(getUnlockedLevel(progress)), 'home')}
        onLevels={() => go('levels')}
        onHowTo={() => go('howto')}
      />
    ),
    levels: <LevelsScreen onSelect={(number) => startGame(generateLevel(number), 'levels')} />,
    daily: <DailyScreen onPlay={(level) => startGame(level, 'daily')} />,
    settings: <SettingsScreen />,
    howto: <HowToPlayScreen onBack={() => go('home')} />,
  };

  return (
    <View style={styles.root}>
      <StatusBar style={theme.statusBar} />
      <ScreenBackground>
        <View style={styles.root}>{screens[route.name]}</View>
        {isTab(route.name) ? <TabBar active={route.name} onSelect={go} /> : null}
      </ScreenBackground>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <Root />
      </AppProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });
