const io = require("socket.io-client");

const socketUrl = "http://localhost:3001";

const transporters = [
    { id: "T1", name: "Fast Logistics", lat: 28.6139, lng: 77.2090, capacity: 5000, truckType: "Heavy Truck" },
    { id: "T2", name: "Village Movers", lat: 28.6200, lng: 77.2200, capacity: 1000, truckType: "Mini Truck" },
    { id: "T3", name: "City Cargo", lat: 28.5000, lng: 77.1000, capacity: 2000, truckType: "Medium Truck" },
    { id: "T4", name: "Far Away Transport", lat: 29.5000, lng: 78.1000, capacity: 5000, truckType: "Heavy Truck" } // 100km+ away
];

transporters.forEach(t => {
    const socket = io(socketUrl);
    socket.on("connect", () => {
        console.log(`[${t.name}] Connected`);
        socket.emit("join", { userId: t.id, role: "transporter" });

        // Update location & capacity
        socket.emit("updateLocation", {
            lat: t.lat,
            lng: t.lng,
            capacity: t.capacity,
            name: t.name,
            truckType: t.truckType
        });
    });
});

console.log("🚀 Simulating 4 transporters...");
