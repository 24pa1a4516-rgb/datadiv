const admin = require("firebase-admin");
const path = require("path");

// WARNING: User must provide this file in the config folder
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

module.exports = { admin, db };
