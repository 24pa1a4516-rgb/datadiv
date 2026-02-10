async function loadAnalytics() {
    const phone = localStorage.getItem("phone") || "0000000000";
    const transporterId = localStorage.getItem("userId") || "transporter_" + phone;

    try {
        const response = await fetch(`/api/analytics/${transporterId}`);
        const data = await response.json();

        if (data.success) {
            const stats = data.stats;

            document.getElementById("totalAccepted").innerText = stats.totalAccepted;
            document.getElementById("totalCompleted").innerText = stats.totalCompleted;
            document.getElementById("totalEarnings").innerText = "₹" + stats.totalEarnings.toLocaleString();
            document.getElementById("summaryTrips").innerText = stats.totalCompleted;

            const ratio = stats.totalAccepted > 0
                ? Math.round((stats.totalCompleted / stats.totalAccepted) * 100)
                : 100;

            document.getElementById("successRatio").innerText = ratio + "%";
        }
    } catch (err) {
        console.error("Analytics Load Error:", err);
    }
}

// Start
document.addEventListener("DOMContentLoaded", loadAnalytics);
