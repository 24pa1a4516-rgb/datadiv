const { findBestTransporter } = require("../services/matchingService");
const { db } = require("../config/firebase");

// In-memory cache for live tracking (mirrored in Firestore)
const activeTransporters = {};

module.exports = (io) => {
    io.on("connection", (socket) => {
        console.log("Socket Connected:", socket.id);

        socket.on("join", ({ userId, role }) => {
            socket.userId = userId;
            socket.role = role;
            socket.join(userId);
            console.log(`${role} joined: ${userId}`);
        });

        // Transporter sends live location
        socket.on("locationUpdate", async (data) => {
            if (socket.role === "transporter") {
                const { lat, lng, capacity, status } = data;

                // Update Memory
                activeTransporters[socket.userId] = {
                    lat, lng, capacity, status: status || "AVAILABLE",
                    socketId: socket.id,
                    lastSeen: Date.now()
                };

                // Update Firestore (Async, don't block socket)
                db.collection("transporters").doc(socket.userId).update({
                    location: { lat, lng },
                    updatedAt: new Date()
                }).catch(err => console.error("Firestore Update Error:", err));
            }
        });

        // Farmer Request (Socket version)
        socket.on("requestTransport", async (requestData) => {
            const { farmerId, lat, lng, quantity, crop, transporterId } = requestData;
            console.log(`[Request] From ${farmerId} for ${crop}`);

            let targetTransporter = null;

            if (transporterId) {
                // Direct request to a specific transporter
                targetTransporter = { id: transporterId };
            } else {
                // 1. Find Best Match automatically
                targetTransporter = await findBestTransporter(db, activeTransporters, { lat, lng, quantity });
            }

            if (!targetTransporter) {
                socket.emit("no_match", { message: "No transporters available nearby" });
                return;
            }

            // 2. Create Request in Firestore
            const requestRef = await db.collection("requests").add({
                farmerId,
                lat, lng,
                quantity,
                crop: crop || "General Cargo",
                status: "PENDING",
                transporterId: targetTransporter.id,
                createdAt: new Date()
            });

            // 3. Notify Transporter (Emit to their specific room)
            io.to(targetTransporter.id).emit("newRequest", {
                requestId: requestRef.id,
                farmerId,
                lat, lng,
                quantity,
                crop: crop || "General Cargo"
            });

            socket.emit("request_sent", { requestId: requestRef.id });
            console.log(`Request ${requestRef.id} sent to ${targetTransporter.id}`);
        });

        socket.on("acceptRequest", async ({ requestId, transporterId }) => {
            try {
                // Update Request Status
                const reqRef = db.collection("requests").doc(requestId);
                const reqDoc = await reqRef.get();

                if (!reqDoc.exists) return;
                const farmerId = reqDoc.data().farmerId;

                await reqRef.update({ status: "ACCEPTED", updatedAt: new Date() });

                // Update Transporter Status
                await db.collection("transporters").doc(transporterId).update({ status: "BUSY" });
                if (activeTransporters[transporterId]) activeTransporters[transporterId].status = "BUSY";

                // Notify Farmer
                io.to(farmerId).emit("requestAccepted", {
                    message: "A transporter has accepted your request!",
                    transporterId
                });

            } catch (err) {
                console.error("Accept Error:", err);
            }
        });

        socket.on("completeRequest", async ({ requestId, transporterId }) => {
            try {
                // Update Request Status
                const reqRef = db.collection("requests").doc(requestId);
                await reqRef.update({
                    status: "COMPLETED",
                    completedAt: new Date()
                });

                // Update Transporter Status back to AVAILABLE
                await db.collection("transporters").doc(transporterId).update({
                    status: "AVAILABLE"
                });
                if (activeTransporters[transporterId]) {
                    activeTransporters[transporterId].status = "AVAILABLE";
                }

                // Notify Farmer (if they are online)
                const reqDoc = await reqRef.get();
                if (reqDoc.exists) {
                    const farmerId = reqDoc.data().farmerId;
                    io.to(farmerId).emit("orderCompleted", { requestId });
                }

                console.log(`[Order] Request ${requestId} marked as COMPLETED by ${transporterId}`);

            } catch (err) {
                console.error("Complete Order Error:", err);
            }
        });

        socket.on("disconnect", () => {
            if (socket.role === "transporter" && socket.userId) {
                // Keep in memory but mark offline if needed or delete
                delete activeTransporters[socket.userId];
            }
        });
    });
};
