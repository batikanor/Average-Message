"use client";
import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";

// Dynamically import Globe to avoid SSR issues
const Globe = dynamic(() => import("react-globe.gl"), { ssr: false });

export default function GlobeComponent({ memories, userLocation }) {
  const globeEl = useRef();

  // OpenStreetMap tile engine
  const globeTileEngineUrl = (x, y, z) =>
    `https://a.tile.openstreetmap.org/${z}/${x}/${y}.png`;

  // Animate globe on mount
  useEffect(() => {
    if (globeEl.current) {
      globeEl.current.pointOfView({ lat: 20, lng: 0, altitude: 2 }, 2000);
    }
  }, []);

  // Only show memory pins (no user pin)
  const points = memories || [];

  // User location as a glowing animated ring
  const rings = userLocation
    ? [
        {
          lat: userLocation.lat,
          lng: userLocation.lng,
          maxRadius: 1.2,
          propagationSpeed: 2,
          repeatPeriod: 1200,
          color: "#00ff99",
        },
      ]
    : [];

  // User location label
  const labels = userLocation
    ? [
        {
          lat: userLocation.lat,
          lng: userLocation.lng,
          text: "You",
          color: "#00ff99",
        },
      ]
    : [];

  return (
    <div className="w-full h-[600px] bg-transparent flex items-center justify-center">
      {/* react-globe.gl renders a 3D globe. Pins are shown for each memory. */}
      <Globe
        ref={globeEl}
        globeTileEngineUrl={globeTileEngineUrl}
        showGlobe={true}
        showAtmosphere={true}
        pointsData={points}
        pointLat={(d) => d.lat}
        pointLng={(d) => d.lng}
        pointColor={(d) => d.color || "#ff0000"} // red fallback (if theres no color thats fetched from the db, which is the case at the time of this commit, just mkea it red)
        pointAltitude={0.015} // much thinner
        pointRadius={0.08} // much thinner
        pointResolution={16}
        pointLabel={(d) => d.text}
        ringsData={rings}
        ringLat={(d) => d.lat}
        ringLng={(d) => d.lng}
        ringMaxRadius={(d) => d.maxRadius}
        ringPropagationSpeed={(d) => d.propagationSpeed}
        ringRepeatPeriod={(d) => d.repeatPeriod}
        ringColor={(d) => d.color}
        labelsData={labels}
        labelLat={(d) => d.lat}
        labelLng={(d) => d.lng}
        labelText={(d) => d.text}
        labelColor={(d) => d.color}
        labelAltitude={0.04}
        labelSize={0.6}
        atmosphereColor="#aee9f9"
        atmosphereAltitude={0.18}
      />
    </div>
  );
}
