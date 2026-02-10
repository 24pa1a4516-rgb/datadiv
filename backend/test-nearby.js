const io = require("socket.io-client");

const socketUrl = "http://localhost:3001";

const farmer = { userId: "farmer_test", role: "farmer", lat: 28.6139, lng: 77.2090, quantity: 500 };

const socket = io(socketUrl);

socket.on("connect", () => {
    console.log("Connected as farmer");
    socket.emit("join", { userId: farmer.userId, role: farmer.role });

    console.log(`Searching for transporters near (${farmer.lat}, ${farmer.lng}) with capacity >= ${farmer.quantity}...`);
    socket.emit("getNearby", { lat: farmer.lat, lng: farmer.lng, quantity: farmer.quantity });
});

socket.on("nearbyTransporters", (matches) => {
    console.log(`\n✅ Found ${matches.length} particular transporters:`);
    matches.forEach(m => {
        console.log(`- ${m.name || m.id}: ${m.distance.toFixed(2)} km away, Capacity: ${m.capacity}, Truck: ${m.truckType}`);
    });

    if (matches.length > 0) {
        console.log("\nSuccess! The 'particular' transporters (nearby and with capacity) are being shown.");
    } else {
        console.log("\nNo matching transporters found.");
    }

    process.exit(0);
});

setTimeout(() => {
    console.log("Timed out waiting for response.");
    process.exit(1);
}, 5000);
