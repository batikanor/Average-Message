"use client";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

// Dynamically import Globe to avoid SSR issues
const Globe = dynamic(() => import("react-globe.gl"), { ssr: false });

// Example placeholder data for memory pins
const sampleMemories = [
  {
    id: 1,
    lat: 40.7128, // New York
    lng: -74.006,
    text: "A memory from NYC!",
    color: "#ffcc00",
  },
  {
    id: 2,
    lat: 48.8566, // Paris
    lng: 2.3522,
    text: "Bonjour from Paris!",
    color: "#00cfff",
  },
  {
    id: 3,
    lat: 35.6895, // Tokyo
    lng: 139.6917,
    text: "Tokyo vibes.",
    color: "#ff66cc",
  },
];

export default function GlobeComponent() {
  const globeEl = useRef();
  const [memories, setMemories] = useState(sampleMemories);

  // Use a lighter, more visually appealing globe texture
  const globeTexture =
    "//unpkg.com/three-globe/example/img/earth-blue-marble.jpg";

  // Optional: Animate globe on mount
  useEffect(() => {
    if (globeEl.current) {
      globeEl.current.pointOfView({ lat: 20, lng: 0, altitude: 2 }, 2000);
    }
  }, []);

  return (
    <div className="w-full h-[600px] bg-transparent flex items-center justify-center">
      {/* react-globe.gl renders a 3D globe. Pins are shown for each memory. */}
      <Globe
        ref={globeEl}
        globeImageUrl={globeTexture}
        pointsData={memories}
        pointLat={(d) => d.lat}
        pointLng={(d) => d.lng}
        pointColor={(d) => d.color}
        pointAltitude={0.03}
        pointRadius={0.25}
        pointLabel={(d) => d.text}
        atmosphereColor="#aee9f9"
        atmosphereAltitude={0.18}
      />
    </div>
  );
}
