import { useReducer } from 'react';
import { GameReducer, initialState } from '../reducers/gameReducer';

export function useGame() {
  const [state, dispatch] = useReducer(GameReducer, initialState);
}
