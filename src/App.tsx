import { useReducer, useState } from 'react';
import './App.css';
import { AppReducer, initialAppState } from './reducers/appReducer';
import { Game } from './components/Game';
import { Editor } from './components/Editor';
import { Menu } from './components/Menu';

function App() {
  const [state, dispatch] = useReducer(AppReducer, initialAppState);

  function getCurrentScreen() {
    switch (state.screen) {
      // case 'splash': {
      //   return <Splash />;
      // }
      case 'menu': {
        return (
          <Menu
            onPlay={() => dispatch({ type: 'changeScreen', payload: 'game' })}
            onOpenEditor={() => dispatch({ type: 'changeScreen', payload: 'editor' })}
          />
        );
      }
      case 'game': {
        return (
          <Game
            currentLevel={state.currentLevel}
            unlockedLevels={state.unlockedLevels}
            onLevelUnlock={() => dispatch({ type: 'unlockNextLevel' })}
            onBack={() => dispatch({ type: 'changeScreen', payload: 'menu' })}
          />
        );
      }
      case 'editor': {
        return <Editor />;
      }
      // case 'settings': {
      //   return <Settings />;
      // }
    }
  }

  return (
    <>{getCurrentScreen()}</>
    // <Game
    //   currentLevel={state.currentLevel}
    //   onLevelUnlock={() => dispatch({ type: 'unlockNextLevel' })}
    // />
    // // <Editor />
  );
}

export default App;
