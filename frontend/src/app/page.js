"use client";
import { useEffect, useRef, useState } from "react";
import Globe from "../components/Globe";

export default function Home() {
  const [message, setMessage] = useState("");
  const containerRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    async function fetchMessage() {
      try {
        // Use localhost:5000 or backend:5000 depending on environment, this needs to be configured in the docker compose
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
            <Globe />
          </div>
        </div>
      </div>
      {/* Backend message card at the bottom */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-900 bg-opacity-80 text-white px-4 py-2 md:px-6 md:py-3 rounded-lg shadow-lg text-center text-base md:text-lg border border-gray-700 max-w-[90vw]">
        <span className="font-semibold">Message from backend:</span>{" "}
        {message || "Loading..."}
      </div>
    </main>
  );
}
