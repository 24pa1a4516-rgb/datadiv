async function verifyOTP() {
  const otp = document.getElementById("otp").value.trim();
  const error = document.getElementById("error");
  const phone = localStorage.getItem("phone");

  // Clean inputs
  const cleanOtp = otp.replace(/\D/g, "");
  const cleanPhone = phone ? phone.replace(/\D/g, "").slice(-10) : "";

  if (/^\d{4}$/.test(cleanOtp)) {
    error.textContent = "Verifying...";

    try {
      const response = await fetch("/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: cleanPhone, otp: cleanOtp })
      });

      const data = await response.json();

      if (data.success) {
        error.textContent = "";
        // Redirect to homepage
        window.location.href = "homepage.html";
      } else {
        error.textContent = data.message || "Invalid OTP. Please try again.";
      }
    } catch (err) {
      console.error("OTP Verification Error:", err);
      error.textContent = "Server error. Please try again.";
    }
  } else {
    error.textContent = "Please enter a valid 4-digit OTP";
  }
}
