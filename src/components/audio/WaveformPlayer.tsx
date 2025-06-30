import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import WaveSurfer from "wavesurfer.js";
import { CollectionTrack } from "../../types";
import {
  HiMiniBackward,
  HiMiniForward,
  HiMiniPause,
  HiMiniPlay,
} from "react-icons/hi2";

type WaveformPlayerProps = {
  tracks: CollectionTrack[];
  currentTrackIndex: number;
  onTrackChange: (index: number) => void;
};

export default function WaveformPlayer({
  tracks,
  currentTrackIndex,
  onTrackChange,
}: WaveformPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isWaveformReady, setIsWaveformReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Start with loading true
  const [isInitialized, setIsInitialized] = useState(false);
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurfer = useRef<WaveSurfer | null>(null);
  const abortController = useRef<AbortController | null>(null);
  const currentTrack = tracks[currentTrackIndex]?.audio_file;
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Initialize WaveSurfer
  useEffect(() => {
    if (!waveformRef.current) return;

    wavesurfer.current = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: "#CFCFD1",
      progressColor: "#FF9500",
      cursorColor: "rgba(255, 255, 255, 0.8)",
      barWidth: 2,
      barGap: 1,
      barRadius: 3,
      cursorWidth: 0,
      height: 30,
      barHeight: 2,
      normalize: true,
      backend: "WebAudio",
      interact: true,
    });

    wavesurfer.current.setVolume(1.0);

    wavesurfer.current.on("finish", () => {
      setIsPlaying(false);
      playNextTrack();
    });

    wavesurfer.current.on("play", () => setIsPlaying(true));
    wavesurfer.current.on("pause", () => {
      setIsPlaying(false);
      if (wavesurfer.current) {
        wavesurfer.current.seekTo(0);
      }
    });

    wavesurfer.current.on("ready", () => {
      if (wavesurfer.current) {
        setDuration(wavesurfer.current.getDuration() || 0);
        setCurrentTime(0);
        wavesurfer.current.setVolume(1.0);
        setIsWaveformReady(true);
        setIsLoading(false);
        setIsInitialized(true);
      }
    });

    wavesurfer.current.on("loading", (percent: number) => {
      setIsLoading(percent < 100);
      console.log(`Loading: ${percent}%`);
    });

    wavesurfer.current.on("audioprocess", () => {
      if (wavesurfer.current) {
        setCurrentTime(wavesurfer.current.getCurrentTime() || 0);
      }
    });

    // wavesurfer.current.on("seek", () => {
    //   if (wavesurfer.current) {
    //     setCurrentTime(wavesurfer.current.getCurrentTime() || 0);
    //   }
    // });

    wavesurfer.current.on("error", (error: any) => {
      console.error("WaveSurfer error:", error);
      setIsWaveformReady(false);
      setIsLoading(false);
    });

    return () => {
      if (abortController.current) {
        abortController.current.abort();
      }
      if (wavesurfer.current) {
        wavesurfer.current.destroy();
      }
    };
  }, []); // Only run once on mount

  // Load tracks when WaveSurfer is ready or track changes
  useEffect(() => {
    if (!wavesurfer.current) return;

    if (!currentTrack) {
      // Keep showing loading state when no track is available
      setIsLoading(true);
      setIsWaveformReady(false);
      setIsInitialized(false);
      return;
    }

    if (abortController.current) {
      abortController.current.abort();
    }

    // Reset states before loading new track
    setIsWaveformReady(false);
    setIsLoading(true);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setIsInitialized(false);

    abortController.current = new AbortController();
    wavesurfer.current.load(currentTrack.file_url);
    wavesurfer.current.setVolume(1.0);

    return () => {
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, [currentTrack, tracks.length, wavesurfer.current]); // Include tracks.length to detect when tracks are loading

  const togglePlayPause = () => {
    if (!wavesurfer.current || !isWaveformReady) return;

    if (isPlaying) {
      wavesurfer.current.pause();
    } else {
      wavesurfer.current.play();
    }
  };

  const playNextTrack = () => {
    if (currentTrackIndex < tracks.length - 1) {
      onTrackChange(currentTrackIndex + 1);
    } else {
      onTrackChange(0);
    }
  };

  const playPreviousTrack = () => {
    if (wavesurfer.current && wavesurfer.current.getCurrentTime() > 3) {
      wavesurfer.current.seekTo(0);
    } else if (currentTrackIndex > 0) {
      onTrackChange(currentTrackIndex - 1);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  // Only show "No tracks to play" if we definitely have no tracks and have initialized
  if (!currentTrack && tracks.length === 0 && isInitialized) {
    return (
      <div className="text-center py-4 text-gray-400">No tracks to play</div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full flex flex-col "
    >
      <div className="w-full flex flex-col gap-2">
        <div className="relative h-[30px]">
          <div
            ref={waveformRef}
            className={`cursor-pointer transition-opacity duration-300 ${
              isWaveformReady ? "opacity-100" : "opacity-0"
            }`}
          />

          {/* Loading placeholder - show when loading OR when not ready */}
          {(isLoading || !isWaveformReady) && (
            <div className="w-full absolute inset-0 flex items-center justify-center bg-transparent">
              <div className="w-full h-[20px] flex space-x-1 items-end">
                {Array.from({ length: 60 }, (_, i) => (
                  <motion.div
                    key={`loading-bar-${i}`}
                    className="bg-[#D7D8DA] rounded-full flex-1 min-w-0"
                    initial={{ height: 4 }}
                    animate={{
                      height: [4, Math.floor(Math.random() * 20) + 8, 4],
                    }}
                    transition={{
                      duration: 1.2,
                      repeat: Infinity,
                      delay: i * 0.05,
                      ease: "easeInOut",
                      repeatType: "reverse",
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="w-full flex justify-between text-[#464646]">
          <p className=" text-sm">
            {isWaveformReady ? formatTime(currentTime) : "-:-"}
          </p>
          <div className="flex justify-center items-center space-x-10">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={playPreviousTrack}
              className={`text-white disabled:opacity-50 disabled:cursor-not-allowed`}
              aria-label="Previous Track"
              disabled={!currentTrack || isLoading || !isWaveformReady}
            >
              <HiMiniBackward size={32} fill="#212224" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={togglePlayPause}
              className={`text-white disabled:opacity-50 disabled:cursor-not-allowed`}
              aria-label={isPlaying ? "Pause" : "Play"}
              disabled={!isWaveformReady || !currentTrack || isLoading}
            >
              {isPlaying ? (
                <HiMiniPause size={45} fill="#212224" />
              ) : (
                <HiMiniPlay size={45} fill="#212224" className="ml-1" />
              )}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={playNextTrack}
              className={`text-white disabled:opacity-50 disabled:cursor-not-allowed`}
              aria-label="Next Track"
              disabled={!currentTrack || isLoading || !isWaveformReady}
            >
              <HiMiniForward size={32} fill="#212224" />
            </motion.button>
          </div>
          <p className=" text-sm">
            {isWaveformReady ? formatTime(duration) : "-:-"}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
