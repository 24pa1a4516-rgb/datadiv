document.getElementById("loginBtn").addEventListener("click", async function () {
  const phoneInput = document.getElementById("phone").value.trim();
  const statusEl = document.getElementById("statusMessage");
  const loginBtn = document.getElementById("loginBtn");

  // Clean phone number: remove all non-digits
  const cleanPhone = phoneInput.replace(/\D/g, "");

  // Basic validation (at least 10 digits)
  if (cleanPhone.length < 10) {
    alert("Enter a valid 10-digit mobile number");
    return;
  }

  // Final 10 digits for the API
  const finalPhone = cleanPhone.slice(-10);

  try {
    statusEl.innerText = "Sending OTP...";
    statusEl.style.color = "#185a9d";
    loginBtn.disabled = true;

    const response = await fetch("/api/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: finalPhone })
    });

    const data = await response.json();

    if (data.success) {
      localStorage.setItem("phone", finalPhone);

      // ✅ SUCCESS! Show OTP on screen so user can't miss it
      statusEl.innerText = "OTP: " + data.otp + " (Sent successfully)";
      statusEl.style.color = "#2e7d32"; // Green

      // Keep it visible for 2 seconds then redirect
      setTimeout(() => {
        window.location.href = "otp.html";
      }, 2000);
    } else {
      statusEl.innerText = "Error: " + (data.error || "Failed to send");
      statusEl.style.color = "#c62828"; // Red
      loginBtn.disabled = false;
    }
  } catch (error) {
    console.error("Login Error:", error);
    statusEl.innerText = "Connection failed. Please check network.";
    statusEl.style.color = "#c62828";
    loginBtn.disabled = false;
  }
});
