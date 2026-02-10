
let selectedRole = "";

const roleCards = document.querySelectorAll(".role-card");
const nameSection = document.getElementById("nameSection");
const continueBtn = document.getElementById("continueBtn");
const usernameInput = document.getElementById("username");

// Select role
roleCards.forEach(card => {
  card.addEventListener("click", () => {
    roleCards.forEach(c => c.classList.remove("selected"));
    card.classList.add("selected");

    selectedRole = card.dataset.role;
    nameSection.style.display = "block";
    checkEnable();
  });
});

// Enable button only if name entered
usernameInput.addEventListener("input", checkEnable);

function checkEnable() {
  if (selectedRole && usernameInput.value.trim() !== "") {
    continueBtn.disabled = false;
    continueBtn.classList.add("enabled");
  } else {
    continueBtn.disabled = true;
    continueBtn.classList.remove("enabled");
  }
}

// Continue button click
continueBtn.addEventListener("click", () => {
  localStorage.setItem("username", usernameInput.value);
  localStorage.setItem("role", selectedRole);

  // ✅ REDIRECT
  if (selectedRole === "Farmer") {
    window.location.href = "farmer.html";
  } 
  else if (selectedRole === "Transporter") {
    window.location.href = "transport.html";
  } 
  else if (selectedRole === "NGO") {
    window.location.href = "NGOlogin.html";
  }
});

