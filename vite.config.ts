import { defineConfig } from 'vite';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import babel from '@rolldown/plugin-babel';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), babel({ presets: [reactCompilerPreset()] }), tailwindcss()],
  resolve: {
    alias: {
      types: path.resolve(__dirname, './src/types'),
      components: path.resolve(__dirname, './src/components'),
      consts: path.resolve(__dirname, './src/consts'),
      utils: path.resolve(__dirname, './src/utils'),
    },
  },
});
