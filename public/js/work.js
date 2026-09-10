// worker.js
self.onmessage = function(event) {
    const { locations, userLatitude, userLongitude } = event.data;
    const results = locations.map(location => {
        const distance = calculateDistance(userLatitude, userLongitude, location.latitude, location.longitude).toFixed(2);
        return { ...location, distance };
    });
    self.postMessage(results);
};

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
