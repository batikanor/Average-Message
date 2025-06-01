"use client";
import { useCallback, useEffect, useRef, useState } from "react";
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
  const [loadingMemories, setLoadingMemories] = useState(true);
  const [memoriesError, setMemoriesError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [generating, setGenerating] = useState(false);

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

  // Fetch all memories from backend on mount
  useEffect(() => {
    async function fetchMemories() {
      setLoadingMemories(true);
      setMemoriesError("");
      try {
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5555";
        const res = await fetch(`${apiUrl}/api/memories`);
        if (!res.ok) throw new Error("Failed to fetch memories");
        const data = await res.json();
        setMemories(data);
      } catch (err) {
        setMemoriesError("Could not load memories from server.");
      } finally {
        setLoadingMemories(false);
      }
    }
    fetchMemories();
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
  const handleMemorySubmit = async (e) => {
    e.preventDefault();
    if (!userLocation) return;
    setSubmitting(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5555";
      const res = await fetch(`${apiUrl}/api/memories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: memoryText,
          lat: userLocation.lat,
          lng: userLocation.lng,
        }),
      });
      if (!res.ok) throw new Error("Failed to submit memory");
      setMemoryText("");
      setShowModal(false);
      // Refresh memories
      const updated = await fetch(`${apiUrl}/api/memories`).then((r) =>
        r.json()
      );
      setMemories(updated);
    } catch (err) {
      alert("Could not submit memory. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Handler for resetting the database
  const handleResetDatabase = useCallback(async () => {
    setResetting(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5555";
      const res = await fetch(`${apiUrl}/api/reset`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to reset database");
      // Refresh memories
      const updated = await fetch(`${apiUrl}/api/memories`).then((r) =>
        r.json()
      );
      setMemories(updated);
      alert("Database reset!");
    } catch (err) {
      alert("Could not reset database. Please try again.");
    } finally {
      setResetting(false);
    }
  }, []);

  // Handler for generating mock data
  const handleGenerateMockData = useCallback(async () => {
    setGenerating(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5555";
      // Generate 1000 mock memories
      const mockMemories = Array.from({ length: 1000 }).map((_, i) => {
        // Cluster some, scatter some
        const cluster = i < 200 ? 1 : i < 400 ? 2 : 0;
        let lat, lng;
        if (cluster === 1) {
          // Cluster 1: New York
          lat = 40.7128 + Math.random() * 0.5 - 0.25;
          lng = -74.006 + Math.random() * 0.5 - 0.25;
        } else if (cluster === 2) {
          // Cluster 2: Tokyo
          lat = 35.6895 + Math.random() * 0.5 - 0.25;
          lng = 139.6917 + Math.random() * 0.5 - 0.25;
        } else {
          // Random global
          lat = -80 + Math.random() * 160;
          lng = -180 + Math.random() * 360;
        }
        const texts = [
          "A beautiful day!",
          "Saw something amazing.",
          "Unforgettable moment.",
          "Met a new friend.",
          "Tried a new food.",
          "Watched the sunset.",
          "Heard a great story.",
          "Learned something new.",
          "Shared a laugh.",
          "Felt inspired.",
        ];
        return {
          text: `Mock memory #${i + 1}: ${texts[i % texts.length]}`,
          lat,
          lng,
        };
      });
      // Send in batches of 100 to avoid overloading
      for (let i = 0; i < mockMemories.length; i += 100) {
        const batch = mockMemories.slice(i, i + 100);
        await Promise.all(
          batch.map((mem) =>
            fetch(`${apiUrl}/api/memories`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(mem),
            })
          )
        );
      }
      // Refresh memories
      const updated = await fetch(`${apiUrl}/api/memories`).then((r) =>
        r.json()
      );
      setMemories(updated);
      alert("Mock data generated!");
    } catch (err) {
      alert("Could not generate mock data. Please try again.");
    } finally {
      setGenerating(false);
    }
  }, []);

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
      {/* Memories loading/error */}
      {loadingMemories && (
        <div className="absolute top-32 left-1/2 transform -translate-x-1/2 bg-gray-800 bg-opacity-80 text-white px-4 py-2 rounded-lg shadow-lg text-center text-base border border-gray-700 max-w-[90vw] z-50">
          Loading memories...
        </div>
      )}
      {memoriesError && (
        <div className="absolute top-32 left-1/2 transform -translate-x-1/2 bg-red-600 bg-opacity-80 text-white px-4 py-2 rounded-lg shadow-lg text-center text-base border border-red-400 max-w-[90vw] z-50">
          {memoriesError}
        </div>
      )}
      {/* Backend message card at the bottom */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-900 bg-opacity-80 text-white px-4 py-2 md:px-6 md:py-3 rounded-lg shadow-lg text-center text-base md:text-lg border border-gray-700 max-w-[90vw]">
        <span className="font-semibold">Message from backend:</span>{" "}
        {message || "Loading..."}
      </div>

      {/* Floating Add Memory Button */}
      <div className="fixed bottom-8 right-8 z-50 flex flex-row items-end gap-3">
        {/* Reset DB Button */}
        <button
          onClick={handleResetDatabase}
          className="bg-gradient-to-br from-red-500 via-orange-500 to-yellow-500 text-white rounded-full shadow-2xl p-3 hover:scale-105 transition-all focus:outline-none focus:ring-4 focus:ring-red-300 disabled:opacity-50 disabled:cursor-not-allowed text-base"
          aria-label="Reset database"
          disabled={resetting || generating}
          title="Reset database"
        >
          {/* Refresh icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 104.582 9m15.356 2V9m0 0h-3m3 0V6"
            />
          </svg>
        </button>
        {/* Generate Mock Data Button */}
        <button
          onClick={handleGenerateMockData}
          className="bg-gradient-to-br from-green-500 via-blue-500 to-purple-500 text-white rounded-full shadow-2xl p-3 hover:scale-105 transition-all focus:outline-none focus:ring-4 focus:ring-green-300 disabled:opacity-50 disabled:cursor-not-allowed text-base"
          aria-label="Generate mock data"
          disabled={resetting || generating}
          title="Generate mock data"
        >
          {/* Sparkles icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.364-6.364l-1.414 1.414M6.05 17.95l-1.414 1.414m0-13.414l1.414 1.414M17.95 17.95l1.414 1.414"
            />
          </svg>
        </button>
        {/* Add Memory Button (existing +) */}
        <button
          onClick={openModal}
          className="bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 text-white rounded-full shadow-2xl p-5 hover:scale-105 transition-all focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed text-xl"
          aria-label="Add a memory"
          disabled={!userLocation || resetting || generating}
          title={
            !userLocation
              ? "Enable geolocation to add a memory"
              : "Add a memory"
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
      </div>

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
                disabled={!userLocation || submitting}
              />
              <div className="flex gap-4 justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-lg bg-gray-700 bg-opacity-70 text-white hover:bg-opacity-90 transition-all focus:outline-none focus:ring-2 focus:ring-gray-400"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold shadow-lg hover:from-blue-600 hover:to-purple-600 transition-all focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!userLocation || submitting}
                >
                  {submitting ? "Submitting..." : "Submit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
