import { useState, useEffect } from "react";
import { Music, ExternalLink, CreditCard } from "lucide-react";
import WaveformPlayer from "../components/audio/WaveformPlayer";
import LoadingSpinner from "../components/layout/LoadingSpinner";
import { getPublicCollection } from "../lib/api";
import { CollectionTrack, Collection } from "../types";
import type { EmbedAccessState } from "../lib/subscriptionApi";
import musicImg from "./musicImg.png";
import { useParams } from "react-router-dom";

export default function EmbedPage() {
  const { collectionId } = useParams<{ collectionId: string }>();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [tracks, setTracks] = useState<CollectionTrack[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [embedAccessState, setEmbedAccessState] = useState<EmbedAccessState>('error');

  useEffect(() => {
    const fetchPublicCollection = async () => {
      if (!collectionId) return;
      try {
        setIsLoading(true);
        const { collection, tracks, embedAccessState } = await getPublicCollection(collectionId);
        setCollection(collection);
        setTracks(tracks);
        setEmbedAccessState(embedAccessState);
        
      } catch (err) {
        setError("This collection is not available.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPublicCollection();
  }, [collectionId]);

  const currentTrack = tracks.length > 0 ? tracks[currentTrackIndex] : null;

  if (isLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !collection) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <Music size={32} className="text-sky-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-800 mb-2">
            Collection Unavailable
          </h3>
          <p className="text-gray-500 text-sm">
            This collection may be private or no longer exists.
          </p>
        </div>
      </div>
    );
  }

  // Show appropriate message based on embed access state
  if (embedAccessState !== 'active') {
    const getErrorContent = () => {
      switch (embedAccessState) {
        case 'trial_ended':
          return {
            title: 'Trial Ended - Reactivate to Continue',
            description: 'Your 7-day free trial has ended. To continue using embeddable audio players, please reactivate your subscription or upgrade to lifetime access.',
            buttonText: 'Reactivate Subscription',
            buttonUrl: `${window.location.origin}/pricing`
          };
        case 'no_trial':
          return {
            title: 'Start Your Free Trial',
            description: 'This embedded audio collection requires a subscription to display. The owner needs to start their free 7-day trial or upgrade to access embeddable players.',
            buttonText: 'Start Free Trial',
            buttonUrl: `${window.location.origin}/pricing`
          };
        case 'error':
        default:
          return {
            title: 'Collection Unavailable',
            description: 'This embedded audio collection is temporarily unavailable. Please try again later or contact the collection owner.',
            buttonText: 'Learn More',
            buttonUrl: `${window.location.origin}/pricing`
          };
      }
    };

    const errorContent = getErrorContent();

    return (
      <div className="w-screen h-screen sfpro flex justify-center items-center bg-[#FEFEFE] sm:bg-[#f2f2f2]">
        <div className="transform scale-[0.4] 2xs:scale-[0.53] xs:scale-[0.6] sm:scale-[0.7] md:scale-[0.85] lg:scale-[1]">
          <main className="w-[750px] h-[550px] sm:h-[500px] flex items-center justify-center px-8 py-12 sm:shadow-lg rounded-lg bg-[#FEFEFE] overflow-hidden">
            <div className="text-center w-full h-full flex flex-col justify-center items-center px-8">
              <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-8">
                <CreditCard size={48} className="text-orange-600" />
              </div>
              <h3 className="text-3xl font-bold text-gray-800 mb-6 leading-tight">
                {errorContent.title}
              </h3>
              <p className="text-lg text-gray-600 mb-10 leading-relaxed max-w-lg">
                {errorContent.description}
              </p>
              <a
                href={errorContent.buttonUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold text-lg rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <ExternalLink size={22} className="mr-3" />
                {errorContent.buttonText}
              </a>
              <p className="text-sm text-gray-500 mt-8">
                Powered by ACE Audio Platform
              </p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen sfpro flex justify-center items-center bg-[#FEFEFE] sm:bg-[#f2f2f2]">
      <div className="transform scale-[0.4] 2xs:scale-[0.53] xs:scale-[0.6] sm:scale-[0.7] md:scale-[0.85] lg:scale-[1] ">
        <main className="w-[750px] h-[550px] sm:h-[500px] flex gap-8 px-8 py-12 sm:shadow-lg rounded-lg bg-[#FEFEFE] overflow-hidden">
          {/* Left Section */}
          <div className="w-1/2 flex flex-col gap-5 items-center justify-center">
            <img
              src={musicImg}
              alt={collection.title}
              className="w-[350px] h-[350px] rounded-lg"
            />
            <div className="w-full">
              {currentTrack && (
                <WaveformPlayer
                  tracks={tracks}
                  currentTrackIndex={currentTrackIndex}
                  onTrackChange={setCurrentTrackIndex}
                />
              )}
            </div>
          </div>

          {/* Right Section */}
          <div className="w-1/2 flex flex-col justify-start">
            <h1 className="font-semibold text-4xl text-[#1A191E] mb-1 truncate">
              {currentTrack?.audio_file.title || collection.title}
            </h1>
            <p className="text-2xl text-[#060606] mb-4 truncate">
              {currentTrack?.audio_file.artist || "Unknown Artist"}
            </p>

            <div className="flex-1 overflow-y-auto flex flex-col gap-1">
              {tracks.map((track, index) => (
                <div
                  key={track.id}
                  className={`px-2 py-2 rounded-lg cursor-pointer hover:bg-[#F3F3F3] transition ${
                    currentTrackIndex === index ? "bg-[#F3F3F3]" : ""
                  }`}
                  onClick={() => setCurrentTrackIndex(index)}
                >
                  <div className="font-medium text-[#131313] text-xl truncate">
                    {track.audio_file.title}
                  </div>
                  <div className="text-[#6C6C6C] text-lg truncate">
                    {track.audio_file.artist || "Unknown Artist"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}