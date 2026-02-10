const io = require("socket.io-client");
const axios = require("axios");

const SERVER_URL = "http://localhost:3001";
const socketUrl = "http://localhost:3001";

const FARMER_ID = "farmer_browser_test_" + Math.floor(Math.random() * 1000);
const farmerSocket = io(socketUrl);

farmerSocket.on("connect", () => {
    console.log(`[Farmer] Connected: ${farmerSocket.id}`);
    farmerSocket.emit("join", { userId: FARMER_ID, role: "farmer" });

    // Send request after 2 seconds
    setTimeout(sendRequest, 2000);
});

farmerSocket.on("requestAccepted", (data) => {
    console.log("✅ [Farmer] YAY! Request Accepted by:", data.transporterId);
    console.log("Message:", data.message);
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
            crop: "Fresh Wheat"
        });
        console.log("[Farmer] Request sent!", res.data);
    } catch (err) {
        console.error("[Farmer] Error:", err.response?.data || err.message);
    }
}
