const { db } = require("./config/firebase");

async function testConnection() {
    console.log("🔍 Checking Firestore connection...");
    try {
        const testDoc = db.collection("test").doc("connection-check");
        await testDoc.set({
            status: "online",
            timestamp: new Date()
        });
        console.log("✅ Firestore connection successful!");
        process.exit(0);
    } catch (err) {
        console.error("❌ Firestore Connection Failed!");
        console.error("Error Code:", err.code);
        console.error("Error Message:", err.message);

        if (err.message.includes("NOT_FOUND")) {
            console.log("\n💡 Possible causes:");
            console.log("1. The project ID in serviceAccountKey.json is wrong.");
            console.log("2. You haven't clicked 'Create Database' in the Firebase Console yet.");
            console.log("3. The Firestore API is still propagating (wait 2 mins).");
        }
        process.exit(1);
    }
}

testConnection();
