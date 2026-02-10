const axios = require("axios");

const SERVER_URL = "http://localhost:3001";

async function testRegistration() {
    console.log("🚀 Testing Transporter Registration...");
    try {
        const res = await axios.post(`${SERVER_URL}/api/register/transporter`, {
            userId: "transporter_atlas_test_" + Math.floor(Math.random() * 100),
            name: "Atlas Driver",
            phone: "9876543210",
            truckType: "Mini Truck",
            capacity: 1200,
            lat: 28.57,
            lng: 77.32
        });
        console.log("✅ Registration Response:", res.data);
        console.log("\nNext: Try running 'node test-client.js' to see if this transporter is matched!");
    } catch (err) {
        console.error("❌ Registration Failed:", err.response?.data || err.message);
    }
}

testRegistration();
