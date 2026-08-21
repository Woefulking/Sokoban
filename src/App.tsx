import { Game } from 'pages/Game';
import { Editor } from 'pages/Editor';
import { Menu } from 'pages/Menu';
import { Custom } from 'pages/Custom';
import { useApp } from 'hooks/useApp';

function App() {
  const { state, changeScreen, selectLevel, unlockNextLevel } = useApp();

  function getCurrentScreen() {
    switch (state.screen) {
      case 'menu': {
        return (
          <Menu
            onPlay={() => changeScreen('game')}
            onOpenEditor={() => changeScreen('editor')}
            onOpenCustom={() => changeScreen('custom')}
          />
        );
      }
      case 'game': {
        return (
          <Game
            currentLevel={state.currentLevel}
            unlockedLevels={state.unlockedLevels}
            onSelectLevel={selectLevel}
            onLevelUnlock={() => unlockNextLevel()}
            onBack={() => changeScreen('menu')}
          />
        );
      }
      case 'editor': {
        return <Editor onBack={() => changeScreen('menu')} />;
      }
      case 'custom': {
        return <Custom onBack={() => changeScreen('menu')} />;
      }
    }
  }

  return <>{getCurrentScreen()}</>;
}

export default App;
