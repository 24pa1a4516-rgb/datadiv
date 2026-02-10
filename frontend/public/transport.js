// ===============================
// TRANSPORT REGISTRATION LOGIC
// ===============================

/**
 * Handles the registration of vehicle details
 * Calls the backend API and redirects to dashboard
 */
async function submitVehicle() {
  const type = document.getElementById("vehicleType").value;
  const capacityStr = document.getElementById("capacity").value;
  const plate = document.getElementById("plate").value;
  const location = document.getElementById("location").value;

  // Validation
  if (!type || !capacityStr || !plate || !location) {
    alert("Please fill all vehicle details");
    return;
  }

  // Parse capacity (e.g., "5 Tons" -> 5)
  const capacity = parseInt(capacityStr);

  // Retrieve user info from previous steps (login/otp)
  const phone = localStorage.getItem("phone") || "0000000000";
  const name = localStorage.getItem("username") || "Transporter";
  const userId = "transporter_" + phone;

  // Prepare data for backend
  const registrationData = {
    userId: userId,
    name: name,
    phone: phone,
    truckType: type,
    capacity: capacity,
    plateNumber: plate,
    baseLocation: location
  };

  try {
    // Show loading state (optional)
    const btn = document.querySelector("button");
    const originalText = btn.innerText;
    btn.innerText = "Registering...";
    btn.disabled = true;

    const response = await fetch("/api/register-transporter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(registrationData)
    });

    const result = await response.json();

    if (result.success) {
      // Save details locally for the dashboard to use
      localStorage.setItem("vehicleType", type);
      localStorage.setItem("capacity", capacity);
      localStorage.setItem("plateNumber", plate);
      localStorage.setItem("location", location);
      localStorage.setItem("userId", userId);
      localStorage.setItem("role", "transporter");

      // Success redirect
      window.location.href = "dashboard.html";
    } else {
      alert("Registration failed: " + result.error);
      btn.innerText = originalText;
      btn.disabled = false;
    }
  } catch (err) {
    console.error("Registration Error:", err);
    alert("Could not connect to server. Please check your connection.");
    const btn = document.querySelector("button");
    btn.innerText = "Continue to Dashboard";
    btn.disabled = false;
  }
}

