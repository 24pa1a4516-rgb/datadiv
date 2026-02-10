const { db } = require("./config/firebase");

async function initDB() {
    console.log("🚀 Initializing Firestore Collections...");

    try {
        // 1. Setup Sample Transporters
        const transporters = [
            {
                userId: "transporter_01",
                name: "Raj Transport Services",
                phone: "9876543210",
                truckType: "Mini Truck",
                capacity: 100,
                plateNumber: "TS-01-AB-1234",
                status: "AVAILABLE",
                location: { lat: 17.3850, lng: 78.4867 }, // Hyderabad
                updatedAt: new Date()
            },
            {
                userId: "transporter_02",
                name: "Kumar Logistics",
                phone: "9912345678",
                truckType: "Large Container",
                capacity: 500,
                plateNumber: "AP-02-XY-5678",
                status: "AVAILABLE",
                location: { lat: 17.4065, lng: 78.4772 },
                updatedAt: new Date()
            }
        ];

        for (const t of transporters) {
            await db.collection("transporters").doc(t.userId).set(t);
            console.log(`✅ Transporter ${t.name} initialized.`);
        }

        // 2. Setup a Sample User (Farmer)
        await db.collection("users").doc("farmer_test_user").set({
            name: "Farmer Krishna",
            phone: "9000000001",
            role: "farmer",
            createdAt: new Date()
        });
        console.log("✅ Sample Farmer user initialized.");

        // 3. Create 'requests' collection with a dummy doc (to ensure it exists)
        await db.collection("requests").add({
            farmerId: "sample",
            status: "INITIALIZED",
            createdAt: new Date()
        });
        console.log("✅ 'requests' collection initialized.");

        console.log("\n✨ Database Setup Complete!");
    } catch (error) {
        console.error("❌ Setup Failed:", error.message);
        console.log("\nTIP: Make sure your 'serviceAccountKey.json' is in the 'backend/config/' folder!");
    }
}

initDB();
