const io = require("socket.io-client");
const axios = require("axios");

const SERVER_URL = "http://localhost:3001";
const socketUrl = "http://localhost:3001";

// --- SIMULATION CONFIG ---
const TRANSPORTER_ID = "transporter_001";
const FARMER_ID = "farmer_002";

const transporterSocket = io(socketUrl);
const farmerSocket = io(socketUrl);

// --- TRANSPORTER FLOW ---
transporterSocket.on("connect", () => {
    console.log(`[Transporter] Connected: ${transporterSocket.id}`);
    transporterSocket.emit("join", { userId: TRANSPORTER_ID, role: "transporter" });

    // Send location update
    const sendUpdate = () => {
        transporterSocket.emit("updateLocation", {
            lat: 28.6139,
            lng: 77.2090,
            capacity: 1000 // kg
        });
        // console.log("[Transporter] Sent location update");
    };

    // Wait for join to process
    setTimeout(() => {
        sendUpdate();
        setInterval(sendUpdate, 5000);
    }, 500);
});

transporterSocket.on("newRequest", async (data) => {
    console.log("[Transporter] Received Request:", data);

    // Simulate think time then accept
    setTimeout(async () => {
        console.log("[Transporter] Accepting request...");
        try {
            const res = await axios.post(`${SERVER_URL}/api/accept`, {
                transporterId: TRANSPORTER_ID,
                requestId: data.requestId
            });
            console.log("[Transporter] Acceptance sent:", res.data);
        } catch (err) {
            console.error("[Transporter] Error accepting:", err.message);
        }
    }, 2000);
});

// --- FARMER FLOW ---
farmerSocket.on("connect", () => {
    console.log(`[Farmer] Connected: ${farmerSocket.id}`);
    farmerSocket.emit("join", { userId: FARMER_ID, role: "farmer" });

    // Simulate sending a request after a few seconds
    setTimeout(sendRequest, 3000);
});

farmerSocket.on("requestAccepted", (data) => {
    console.log("✅ [Farmer] YAY! Request Accepted:", data);
    process.exit(0);
});

async function sendRequest() {
    console.log("[Farmer] Sending transport request...");
    try {
        const res = await axios.post(`${SERVER_URL}/api/request`, {
            farmerId: FARMER_ID,
            lat: 28.6100,
            lng: 77.2000,
            quantity: 500,
            crop: "Wheat"
        });
        console.log("[Farmer] Request sent, response:", res.data);
    } catch (err) {
        console.error("[Farmer] Error sending request:", err.response?.data || err.message);
    }
}
