const express = require("express");
const router = express.Router();
const { db } = require("../config/firebase");
const { sendOTP } = require("../services/smsService");

// In-memory OTP storage (for demo purposes)
const otpStore = {};

// Send OTP
router.post("/send-otp", async (req, res) => {
    try {
        let { phone } = req.body;
        console.log(`[OTP Request] Raw phone received: "${phone}"`);

        if (!phone) {
            return res.status(400).json({ error: "No phone number provided" });
        }

        // Clean phone number: remove all non-digits
        const cleanPhone = phone.replace(/\D/g, "");

        // Handle various formats (e.g., 91XXXXXXXXXX or just XXXXXXXXXX)
        // For a simple 10-digit logic, we take the last 10 digits
        const finalPhone = cleanPhone.length >= 10 ? cleanPhone.slice(-10) : cleanPhone;

        if (finalPhone.length !== 10) {
            console.warn(`[OTP] Invalid phone length after cleaning: ${finalPhone} (clean was: ${cleanPhone})`);
            return res.status(400).json({ error: "Invalid phone number - please enter a 10-digit number" });
        }

        // Generate 4-digit OTP
        const otp = Math.floor(1000 + Math.random() * 9000).toString();

        // Store OTP using the cleaned 10-digit version
        otpStore[finalPhone] = otp;

        console.log(`[OTP] Generated ${otp} for target: ${finalPhone}`);

        // Send OTP via mock service
        await sendOTP(finalPhone, otp);

        // Include otp in response for "Free & Easy" development mode
        res.json({ success: true, message: "OTP sent successfully", otp: otp });
    } catch (error) {
        console.error(`[OTP Error] ${error.message}`);
        res.status(500).json({ error: error.message });
    }
});

// Verify OTP
router.post("/verify-otp", async (req, res) => {
    try {
        let { phone, otp } = req.body;
        const cleanPhone = phone ? phone.replace(/\D/g, "").slice(-10) : "";

        if (otpStore[cleanPhone] === otp) {
            delete otpStore[cleanPhone]; // Clear after use
            res.json({ success: true, message: "OTP verified" });
        } else {
            res.status(400).json({ success: false, message: "Invalid OTP" });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Transporter Registration
router.post("/register-transporter", async (req, res) => {
    try {
        const { userId, name, phone, truckType, capacity, plateNumber, baseLocation } = req.body;

        const transporterData = {
            name,
            phone,
            truckType,
            capacity: Number(capacity),
            plateNumber,
            baseLocation: baseLocation || "Unknown",
            status: "AVAILABLE",
            location: { lat: 17.3850, lng: 78.4867 }, // Default to Hyderabad if GPS fails
            updatedAt: new Date()
        };

        await db.collection("transporters").doc(userId).set(transporterData, { merge: true });

        // Update user role
        await db.collection("users").doc(userId).set({
            role: "transporter",
            name,
            phone
        }, { merge: true });

        res.json({ success: true, message: "Transporter registered" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const { getDistance } = require("../services/matchingService");

// Nearby Transporters List
router.get("/nearby-transporters", async (req, res) => {
    try {
        const { lat, lng } = req.query;
        const farmerLat = parseFloat(lat);
        const farmerLng = parseFloat(lng);

        const snapshot = await db.collection("transporters")
            .where("status", "==", "AVAILABLE")
            .get();

        const transporters = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            let distance = null;

            if (data.location && !isNaN(farmerLat) && !isNaN(farmerLng)) {
                distance = getDistance(
                    farmerLat, farmerLng,
                    data.location.lat, data.location.lng
                );
            }

            transporters.push({
                id: doc.id,
                ...data,
                distance: distance ? distance.toFixed(1) : "Unknown"
            });
        });

        // Sort by distance if available
        if (!isNaN(farmerLat)) {
            transporters.sort((a, b) => (parseFloat(a.distance) || Infinity) - (parseFloat(b.distance) || Infinity));
        }

        res.json(transporters);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Road Issues Endpoints

// NGO Registration
router.post("/register-ngo", async (req, res) => {
    try {
        const { userId, name, org, phone, location, lat, lng } = req.body;

        const ngoData = {
            name,
            org,
            phone,
            location: location || "Unknown",
            lat: parseFloat(lat),
            lng: parseFloat(lng),
            updatedAt: new Date()
        };

        await db.collection("ngos").doc(userId).set(ngoData, { merge: true });

        // Update user role
        await db.collection("users").doc(userId).set({
            role: "ngo",
            name,
            org,
            phone
        }, { merge: true });

        res.json({ success: true, message: "NGO registered successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 1. Report a Road Issue
router.post("/road-issues", async (req, res) => {
    try {
        console.log(`[Road Issue] Submission started by ${req.body.userId}`);
        const { userId, location, lat, lng, description, image, audio, userType } = req.body;

        let issueLat = parseFloat(lat);
        let issueLng = parseFloat(lng);
        if (isNaN(issueLat)) issueLat = 17.3850;
        if (isNaN(issueLng)) issueLng = 78.4867;

        console.log(`[Road Issue] Finding nearest NGO...`);
        let nearestNgo = null;
        let minDist = Infinity;

        ngosSnapshot.forEach(doc => {
            const ngo = doc.data();
            if (ngo.lat && ngo.lng && !isNaN(issueLat) && !isNaN(issueLng)) {
                const dist = getDistance(issueLat, issueLng, ngo.lat, ngo.lng);
                if (dist < minDist) {
                    minDist = dist;
                    nearestNgo = { id: doc.id, ...ngo, distance: dist };
                }
            }
        });

        const newIssue = {
            userId,
            userType: userType || "Transporter",
            location,
            lat: issueLat,
            lng: issueLng,
            description,
            image, // Base64 image
            audio, // Base64 audio
            status: "pending",
            assignedNgoId: nearestNgo ? nearestNgo.id : null,
            nearestNgoDistance: nearestNgo ? nearestNgo.distance.toFixed(1) : null,
            timestamp: new Date()
        };

        console.log(`[Road Issue] Saving to Firestore...`);
        const docRef = await db.collection("road_issues").add(newIssue);
        console.log(`[Road Issue] Saved with ID: ${docRef.id}`);

        const io = req.app.get("socketio");
        if (io) {
            io.emit("newRoadIssue", {
                id: docRef.id,
                ...newIssue
            });

            // Priority notification for the assigned NGO
            if (nearestNgo) {
                io.to(nearestNgo.id).emit("assignedIssue", {
                    id: docRef.id,
                    message: "A new road issue has been reported near your location!",
                    ...newIssue
                });
            }
            console.log(`[Road Issue] Broadcast sent. Assigned to NGO: ${nearestNgo ? nearestNgo.name : "None"}`);
        }

        res.json({ success: true, id: docRef.id, assignedNgo: nearestNgo ? nearestNgo.name : null });
    } catch (error) {
        console.error(`[Road Issue Error] ${error.message}`);
        res.status(500).json({ error: error.message });
    }
});

// 2. Get All Road Issues (for NGO)
router.get("/road-issues", async (req, res) => {
    try {
        const snapshot = await db.collection("road_issues").orderBy("timestamp", "desc").get();
        const issues = [];
        snapshot.forEach(doc => {
            issues.push({ id: doc.id, ...doc.data() });
        });
        res.json(issues);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 3. Update Issue Status (Verify/Resolve/Reject)
router.put("/road-issues/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // pending, verified, resolved, rejected

        await db.collection("road_issues").doc(id).update({ status });
        res.json({ success: true, message: `Issue marked as ${status}` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 4. Analytics for Transporters
router.get("/analytics/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const snapshot = await db.collection("requests").where("transporterId", "==", id).get();

        let accepted = 0;
        let completed = 0;
        let earnings = 0;

        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.status === "ACCEPTED" || data.status === "COMPLETED") accepted++;
            if (data.status === "COMPLETED") {
                completed++;
                // Simple earnings calculation: base fee + distance/quantity logic
                // For this prototype, we'll use a dummy calculation
                earnings += Math.round((data.quantity || 10) * 15);
            }
        });

        res.json({
            success: true,
            stats: {
                totalAccepted: accepted,
                totalCompleted: completed,
                totalEarnings: earnings,
                rating: 4.8 // Mock rating
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 5. Farmer Community Endpoints

// Join Community
router.post("/community/join", async (req, res) => {
    try {
        const { userId, name, crop, quantity, harvestDate, location, lat, lng } = req.body;

        if (!userId || !name || !crop) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const communityData = {
            userId,
            name,
            crop,
            quantity: Number(quantity),
            harvestDate,
            location: location || "Unknown",
            lat: parseFloat(lat),
            lng: parseFloat(lng),
            joinedAt: new Date()
        };

        await db.collection("community").doc(userId).set(communityData, { merge: true });

        res.json({ success: true, message: "Joined community successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Fetch Nearby Farmers
router.get("/community/nearby", async (req, res) => {
    try {
        const { lat, lng, radius = 50 } = req.query; // default 50km
        const farmerLat = parseFloat(lat);
        const farmerLng = parseFloat(lng);

        const snapshot = await db.collection("community").get();
        const communityMembers = [];

        snapshot.forEach(doc => {
            const data = doc.data();
            let distance = null;

            if (data.lat && data.lng && !isNaN(farmerLat) && !isNaN(farmerLng)) {
                distance = getDistance(farmerLat, farmerLng, data.lat, data.lng);
            }

            // Filter by radius (excluding self if needed, but here we show everyone nearby)
            if (distance === null || distance <= radius) {
                communityMembers.push({
                    id: doc.id,
                    ...data,
                    distance: distance ? distance.toFixed(1) : "Unknown"
                });
            }
        });

        // Sort by distance
        communityMembers.sort((a, b) => (parseFloat(a.distance) || Infinity) - (parseFloat(b.distance) || Infinity));

        res.json(communityMembers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const { formClusters } = require("../services/mlService");

// Get Smart Clusters (ML)
router.get("/community/clusters", async (req, res) => {
    try {
        const snapshot = await db.collection("community").get();
        const farmers = [];
        snapshot.forEach(doc => {
            farmers.push({ id: doc.id, ...doc.data() });
        });

        const clusters = await formClusters(farmers);
        res.json({ success: true, clusters });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
