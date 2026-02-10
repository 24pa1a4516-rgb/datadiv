/**
 * Calculate distance between two points in KM
 */
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
}

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}

/**
 * Find the best transporter for a request
 */
async function findBestTransporter(db, transportersInMemory, requestData) {
    const { lat, lng, quantity } = requestData;
    let nearest = null;
    let minDist = Infinity;

    for (const [id, t] of Object.entries(transportersInMemory)) {
        if (t.status === "AVAILABLE" && t.capacity >= quantity) {
            const dist = getDistance(lat, lng, t.lat, t.lng);
            if (dist < minDist) {
                minDist = dist;
                nearest = { id, ...t, distance: dist };
            }
        }
    }

    return nearest;
}

module.exports = { getDistance, findBestTransporter };
