import { useRef, useEffect } from "react";

export default function useSound(src) {
  const audioRef = useRef(new Audio(src));

  useEffect(() => {
    const audio = audioRef.current;
    const unlock = () => {
      audio.play().then(() => {
        audio.pause();
        audio.currentTime = 0;
        document.removeEventListener("click", unlock);
      }).catch(() => {});
    };
    document.addEventListener("click", unlock);
    return () => document.removeEventListener("click", unlock);
  }, []);

  const play = () => {
    const audio = audioRef.current;
    audio.pause();
    audio.currentTime = 0;
    audio.play().catch(err => console.error("Play failed:", err));
  };

  return play;
}
