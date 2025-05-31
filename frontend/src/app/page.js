"use client";
import { useEffect, useRef, useState } from "react";
import Globe from "../components/Globe";

export default function Home() {
  const [message, setMessage] = useState("");
  const containerRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [memoryText, setMemoryText] = useState("");
  const [memories, setMemories] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [geoError, setGeoError] = useState("");

  useEffect(() => {
    async function fetchMessage() {
      try {
        // Use localhost:5000 or backend:5000 depending on environment, this needs to be configured in the docker compose
        console.log(" le frontend running yoo");
        console.log(process.env.NEXT_PUBLIC_API_URL);
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5555";
        const response = await fetch(`${apiUrl}/api/hello`);
        const data = await response.json();
        setMessage(data.message);
      } catch (error) {
        console.error("Error fetching message:", error);
      }
    }

    fetchMessage();
  }, []);

  // Get geolocation on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
          setGeoError("");
        },
        (err) => {
          setGeoError("Geolocation permission denied or unavailable.");
        },
        { enableHighAccuracy: true }
      );
    } else {
      setGeoError("Geolocation is not supported by your browser.");
    }
  }, []);

  // Fullscreen toggle logic
  const handleFullscreen = () => {
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      } else if (containerRef.current.webkitRequestFullscreen) {
        containerRef.current.webkitRequestFullscreen();
      } else if (containerRef.current.msRequestFullscreen) {
        containerRef.current.msRequestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  // Listen for fullscreen change to update state
  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("webkitfullscreenchange", onFullscreenChange);
    document.addEventListener("msfullscreenchange", onFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        onFullscreenChange
      );
      document.removeEventListener("msfullscreenchange", onFullscreenChange);
    };
  }, []);

  // Modal open/close handlers
  const openModal = () => setShowModal(true);
  const closeModal = () => {
    setShowModal(false);
    setMemoryText("");
  };

  // Handle memory submission
  const handleMemorySubmit = (e) => {
    e.preventDefault();
    if (!userLocation) return;
    // Add new memory to local state
    setMemories((prev) => [
      ...prev,
      {
        id: Date.now(),
        lat: userLocation.lat,
        lng: userLocation.lng,
        text: memoryText,
        color: "#7f5af0", // Nice purple
      },
    ]);
    closeModal();
  };

  return (
    <main
      ref={containerRef}
      className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-800 relative overflow-hidden"
    >
      {/* Fullscreen Toggle Button */}
      <button
        onClick={handleFullscreen}
        className="absolute top-4 right-4 z-50 bg-gray-800 bg-opacity-80 hover:bg-opacity-100 text-white rounded-full p-3 shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all text-xl md:text-2xl"
        aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        style={{ WebkitTapHighlightColor: "transparent" }}
      >
        {isFullscreen ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 9V5.25A2.25 2.25 0 016 3h3.75M14.25 3H18a2.25 2.25 0 012.25 2.25V9M20.25 15v3.75A2.25 2.25 0 0118 21h-3.75M9.75 21H6a2.25 2.25 0 01-2.25-2.25V15"
            />
          </svg>
        )}
      </button>
      {/* Centered Globe */}
      <div className="flex flex-col items-center justify-center w-full h-full">
        {/* <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-4 md:mb-8 drop-shadow-lg text-center">
          Global Memory Wall
        </h1> */}
        <div className="w-full flex justify-center items-center">
          <div className="w-full h-[50vh] md:h-[600px] max-w-full md:max-w-4xl">
            <Globe memories={memories} userLocation={userLocation} />
          </div>
        </div>
      </div>
      {/* Geolocation warning */}
      {geoError && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-red-600 bg-opacity-80 text-white px-4 py-2 rounded-lg shadow-lg text-center text-base border border-red-400 max-w-[90vw] z-50">
          {geoError}
        </div>
      )}
      {/* Backend message card at the bottom */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-900 bg-opacity-80 text-white px-4 py-2 md:px-6 md:py-3 rounded-lg shadow-lg text-center text-base md:text-lg border border-gray-700 max-w-[90vw]">
        <span className="font-semibold">Message from backend:</span>{" "}
        {message || "Loading..."}
      </div>

      {/* Floating Add Memory Button */}
      <button
        onClick={openModal}
        className="fixed bottom-8 right-8 z-50 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 text-white rounded-full shadow-2xl p-5 hover:scale-105 transition-all focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Add a memory"
        disabled={!userLocation}
        title={
          !userLocation ? "Enable geolocation to add a memory" : "Add a memory"
        }
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="w-8 h-8"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 4v16m8-8H4"
          />
        </svg>
      </button>

      {/* Memory Submission Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
          <div className="relative bg-white bg-opacity-20 backdrop-blur-lg rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4 border border-white border-opacity-30 flex flex-col items-center animate-fadeIn">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-gray-200 hover:text-white focus:outline-none"
              aria-label="Close modal"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <h2 className="text-2xl font-bold text-white mb-4 drop-shadow-lg text-center">
              Share a Memory
            </h2>
            <form
              onSubmit={handleMemorySubmit}
              className="w-full flex flex-col gap-4"
            >
              <textarea
                className="w-full min-h-[100px] max-h-[200px] rounded-xl p-4 bg-white bg-opacity-40 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none shadow-inner"
                placeholder="Type your memory here..."
                value={memoryText}
                onChange={(e) => setMemoryText(e.target.value)}
                maxLength={280}
                required
                aria-label="Memory text"
                disabled={!userLocation}
              />
              <div className="flex gap-4 justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-lg bg-gray-700 bg-opacity-70 text-white hover:bg-opacity-90 transition-all focus:outline-none focus:ring-2 focus:ring-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold shadow-lg hover:from-blue-600 hover:to-purple-600 transition-all focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!userLocation}
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
