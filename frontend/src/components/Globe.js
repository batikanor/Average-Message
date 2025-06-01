/*  frontend/src/components/Globe.js  */
"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

// Dynamically import Globe to avoid SSR issues
const Globe = dynamic(() => import("react-globe.gl"), { ssr: false });

/* ------------------------------------------------------------------
   ALGORITHMIC CLUSTERING CONFIGURATION
   ------------------------------------------------------------------ */
const CLUSTERING_CONFIG = {
  // No clustering below this altitude
  minClusteringAltitude: 0.003,

  // Maximum clustering distance at highest altitude
  maxDistanceKm: 1500,

  // Altitude at which maximum clustering kicks in
  maxClusteringAltitude: 100,

  // Exponential curve steepness (higher = more aggressive clustering at high altitudes)
  clusteringCurve: 2.5,

  // Point display configuration
  points: {
    // Single point properties
    single: {
      baseRadius: 0.00009,
      baseAltitude: 0.00015,
      // How much points grow at higher altitudes
      altitudeScaling: 0.001,
    },
    // Cluster point properties
    cluster: {
      baseRadius: 0.03,
      baseAltitude: 0.03,
      // Additional scaling based on cluster size
      sizeScaling: 0.005,
      // Max scaling factor
      maxScaling: 3,
    },
  },
};

/* ---------- ALGORITHMIC FUNCTIONS ---------- */

/**
 * Calculate clustering distance based on altitude using exponential curve
 */
function getClusteringDistance(altitude) {
  const {
    minClusteringAltitude,
    maxDistanceKm,
    maxClusteringAltitude,
    clusteringCurve,
  } = CLUSTERING_CONFIG;

  // No clustering below minimum altitude
  if (altitude <= minClusteringAltitude) {
    return 0;
  }

  // Normalize altitude to 0-1 range
  const normalizedAltitude = Math.min(
    (altitude - minClusteringAltitude) /
      (maxClusteringAltitude - minClusteringAltitude),
    1
  );

  // Apply exponential curve for more aggressive clustering at higher altitudes
  const curvedValue = Math.pow(normalizedAltitude, 1 / clusteringCurve);

  // Scale to final distance
  const distanceKm = curvedValue * maxDistanceKm;

  console.log(
    `Altitude: ${altitude.toFixed(
      4
    )} → Normalized: ${normalizedAltitude.toFixed(
      4
    )} → Distance: ${distanceKm.toFixed(1)}km`
  );

  return distanceKm;
}

/**
 * Calculate point radius based on altitude and cluster status
 */
function getPointRadius(point, altitude) {
  const { single, cluster } = CLUSTERING_CONFIG.points;

  if (point.isCluster) {
    // Cluster points: base size + cluster size multiplier, all scaled by altitude
    const sizeMultiplier = Math.min(
      1 + (point.count - 1) * cluster.sizeScaling,
      cluster.maxScaling
    );
    const altitudeScaling = Math.max(1, altitude * 5); // Minimum 1x scaling
    return cluster.baseRadius * sizeMultiplier * altitudeScaling;
  } else {
    // Single points: base size scaled by altitude, but never smaller than original
    const altitudeScaling = Math.max(1, altitude * 5); // Minimum 1x scaling
    return Math.max(single.baseRadius, single.baseRadius * altitudeScaling);
  }
}

/**
 * Calculate point altitude (height above surface) based on altitude and cluster status
 */
function getPointAltitude(point, altitude) {
  const { single, cluster } = CLUSTERING_CONFIG.points;

  // Base altitude scaling with current altitude (applies to all points)
  const altitudeScaling = Math.max(0.1, altitude * 3); // Scale with current altitude

  if (point.isCluster) {
    // Cluster points: base height + cluster size multiplier, all scaled by altitude
    const sizeMultiplier = Math.min(
      1 + (point.count - 1) * cluster.sizeScaling * 0.5,
      cluster.maxScaling
    );
    return cluster.baseAltitude * sizeMultiplier * altitudeScaling;
  } else {
    // Single points: base height scaled by altitude
    return single.baseAltitude * altitudeScaling;
  }
}

/* ---------- existing helper functions (unchanged) ---------- */

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius (km)
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(a));
}

function clusterPoints(originalPoints, mergeKm) {
  // Always work with original points, not previously clustered ones
  if (mergeKm <= 0) return originalPoints; // no clustering needed

  const clusters = [];
  const visited = new Set();

  for (let i = 0; i < originalPoints.length; i++) {
    if (visited.has(i)) continue;

    const base = originalPoints[i];
    const members = [base];
    visited.add(i);

    // gather neighbours
    for (let j = i + 1; j < originalPoints.length; j++) {
      if (visited.has(j)) continue;
      const p = originalPoints[j];
      if (haversineKm(base.lat, base.lng, p.lat, p.lng) <= mergeKm) {
        members.push(p);
        visited.add(j);
      }
    }

    // single point ➜ keep as-is
    if (members.length === 1) {
      clusters.push(base);
      continue;
    }

    // build cluster marker
    const lat = members.reduce((sum, m) => sum + m.lat, 0) / members.length;
    const lng = members.reduce((sum, m) => sum + m.lng, 0) / members.length;

    clusters.push({
      lat,
      lng,
      count: members.length,
      color: "#ffaa00",
      text:
        `Count: ${members.length}\n` + members.map((m) => m.text).join(" | "),
      isCluster: true, // Mark this as a cluster
    });
  }

  return clusters;
}

/* ---------- main component ---------- */

export default function GlobeComponent({ memories, userLocation }) {
  const globeEl = useRef();
  const [altitude, setAltitude] = useState(2);
  const [displayedPoints, setDisplayedPoints] = useState(memories || []);
  const [originalMemories, setOriginalMemories] = useState(memories || []);

  // Keep track of original memories separately
  useEffect(() => {
    setOriginalMemories(memories || []);
  }, [memories]);

  /* --- keep altitude in state --- */
  useEffect(() => {
    // Wait for globe to be fully initialized
    const timer = setTimeout(() => {
      if (!globeEl.current) return;

      console.log("Setting up altitude tracking...");

      const updateAltitude = () => {
        if (globeEl.current) {
          const pov = globeEl.current.pointOfView();
          const alt = pov.altitude;
          setAltitude((prevAlt) => {
            if (Math.abs(prevAlt - alt) > 0.001) {
              // More sensitive threshold
              console.log(`Altitude changed from ${prevAlt} to ${alt}`);
              return alt;
            }
            return prevAlt;
          });
        }
      };

      // Try accessing Three.js camera directly
      try {
        const renderer = globeEl.current.renderer();
        const scene = globeEl.current.scene();
        const camera = globeEl.current.camera();

        console.log("Globe internals:", { renderer, scene, camera });

        // Listen to renderer's render events
        const originalRender = renderer.render;
        renderer.render = function (...args) {
          updateAltitude();
          return originalRender.apply(this, args);
        };

        return () => {
          renderer.render = originalRender;
        };
      } catch (error) {
        console.error("Error setting up altitude tracking:", error);

        // Fallback: simple interval
        const interval = setInterval(updateAltitude, 200);
        return () => clearInterval(interval);
      }
    }, 1000); // Wait 1 second for globe to initialize

    return () => clearTimeout(timer);
  }, []);

  /* --- recompute clusters whenever altitude or original memories change --- */
  useEffect(() => {
    const clusteringDistance = getClusteringDistance(altitude);
    console.log(
      "Reclustering with altitude:",
      altitude,
      "merge distance:",
      clusteringDistance
    );

    // Always cluster from original memories, not from previously clustered points
    const newDisplayedPoints = clusterPoints(
      originalMemories,
      clusteringDistance
    );
    console.log(
      "Original points:",
      originalMemories.length,
      "Clustered points:",
      newDisplayedPoints.length
    );
    setDisplayedPoints(newDisplayedPoints);
  }, [originalMemories, altitude]);

  /* --- initial camera animation --- */
  useEffect(() => {
    globeEl.current?.pointOfView({ lat: 20, lng: 0, altitude: 2 }, 2000);
  }, []);

  /* --- OpenStreetMap tiles --- */
  const globeTileEngineUrl = (x, y, z) =>
    `https://a.tile.openstreetmap.org/${z}/${x}/${y}.png`;

  /* --- user location ring + label --- */
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
      <Globe
        ref={globeEl}
        globeTileEngineUrl={globeTileEngineUrl}
        showGlobe
        showAtmosphere
        /* ------ data ------ */
        pointsData={displayedPoints}
        pointLat={(d) => d.lat}
        pointLng={(d) => d.lng}
        /* Dynamic color: cluster markers are orange; singles keep their own colour */
        pointColor={(d) => d.color || "#ff0000"}
        /* Dynamic radius based on altitude and cluster status */
        pointRadius={(d) => getPointRadius(d, altitude)}
        /* Dynamic altitude based on altitude and cluster status */
        pointAltitude={(d) => getPointAltitude(d, altitude)}
        pointResolution={16}
        pointLabel={(d) => d.text}
        /* ------ user ring/label ------ */
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
        /* ------ atmosphere ------ */
        atmosphereColor="#aee9f9"
        atmosphereAltitude={0.18}
      />
    </div>
  );
}
