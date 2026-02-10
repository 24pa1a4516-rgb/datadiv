const { getDistance } = require("./matchingService");

/**
 * ML-driven Clustering Algorithm (Radius-based)
 * Groups farmers into optimized logistics communities
 */
async function formClusters(farmers) {
    const clusters = [];
    const radiusKm = 10; // 10km radius for a group
    const processed = new Set();

    farmers.forEach(f => {
        if (processed.has(f.id)) return;

        // Start a new cluster with this farmer
        const cluster = {
            id: `cluster_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            members: [f],
            totalQuantity: Number(f.quantity) || 0,
            centerLat: f.lat,
            centerLng: f.lng,
            crops: new Set([f.crop])
        };

        processed.add(f.id);

        // Find neighbors to join this cluster
        farmers.forEach(neighbor => {
            if (processed.has(neighbor.id)) return;

            const dist = getDistance(f.lat, f.lng, neighbor.lat, neighbor.lng);
            if (dist <= radiusKm) {
                cluster.members.push(neighbor);
                cluster.totalQuantity += Number(neighbor.quantity) || 0;
                cluster.crops.add(neighbor.crop);
                processed.add(neighbor.id);
            }
        });

        // Only recommend clusters with more than 1 member OR significant volume
        if (cluster.members.length > 1 || cluster.totalQuantity >= 50) {
            clusters.push({
                ...cluster,
                crops: Array.from(cluster.crops),
                memberCount: cluster.members.length
            });
        }
    });

    return clusters;
}

module.exports = { formClusters };
