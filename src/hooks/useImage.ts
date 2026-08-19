import { useEffect, useState } from 'react';

export function useImage(src: string): HTMLImageElement | null {
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    setImage(null);

    const img = new Image();
    img.src = src;

    img.onload = () => {
      setImage(img);
    };

    img.onerror = () => {
      console.log('Не удалось загрузить');
    };
  }, [src]);

  return image;
}
