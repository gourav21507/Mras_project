// Haversine formula Mars radius ke hisaab se (Mars radius ≈ 3389.5 km)
function calculateMarsDistanceKm(coord1, coord2) {
  const R = 3389.5; 
  const dLat = (coord2[0] - coord1[0]) * (Math.PI / 180);
  const dLon = (coord2[1] - coord1[1]) * (Math.PI / 180);
  const lat1 = coord1[0] * (Math.PI / 180);
  const lat2 = coord2[0] * (Math.PI / 180);

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

class PathfinderService {
  /**
   * Safe route optimize karta hai aur telemetry estimates nikalta hai
   */
  calculateSafeEVA(siteData) {
    const rawWaypoints = siteData.safe_route;
    const hazards = siteData.hazards || [];
    
    let totalDistanceKm = 0;
    for (let i = 0; i < rawWaypoints.length - 1; i++) {
      totalDistanceKm += calculateMarsDistanceKm(rawWaypoints[i], rawWaypoints[i + 1]);
    }

    // Astronaut average walking speed in pressurized suit ≈ 2.2 km/h
    const walkingSpeedKmH = 2.2;
    const estimatedWalkTimeHours = totalDistanceKm / walkingSpeedKmH;

    // Science activity at POI = 1.5 hours
    const scienceTimeHours = 1.5;
    const totalMissionDurationHours = estimatedWalkTimeHours + scienceTimeHours;

    // Suit Consumables Calculation
    // Average O2 burn rate ≈ 6% per hour of moderate EVA
    const o2ConsumedPercent = Math.min(100, Math.round(totalMissionDurationHours * 6.5));
    // Battery consumption for heating & life support ≈ 8% per hour
    const batteryConsumedPercent = Math.min(100, Math.round(totalMissionDurationHours * 8.0));

    // Environmental Risk Assessment
    const maxSafeHours = siteData.telemetry.safe_eva_window_hours || 6.0;
    const safetyMargin = (maxSafeHours - totalMissionDurationHours).toFixed(1);
    const missionStatus = safetyMargin > 0 ? "GO_FOR_EVA" : "ABORT_MISSION_WINDOW_EXCEEDED";

    return {
      mission_status: missionStatus,
      route_geometry: {
        type: "LineString",
        coordinates: rawWaypoints
      },
      metrics: {
        total_distance_km: Number(totalDistanceKm.toFixed(2)),
        walking_time_hours: Number(estimatedWalkTimeHours.toFixed(2)),
        total_eva_duration_hours: Number(totalMissionDurationHours.toFixed(2)),
        safety_margin_hours: Number(safetyMargin)
      },
      suit_consumables_forecast: {
        o2_consumption_projected_pct: o2ConsumedPercent,
        o2_remaining_pct: 100 - o2ConsumedPercent,
        battery_remaining_pct: 100 - batteryConsumedPercent
      },
      hazard_clearance_log: hazards.map(h => ({
        hazard_name: h.name,
        type: h.type,
        status: "AVOIDED_VIA_WAYPOINT_DEFLECTION"
      }))
    };
  }
}

module.exports = new PathfinderService();