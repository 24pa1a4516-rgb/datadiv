// ===============================
// FARMER DASHBOARD SCRIPT
// ===============================

// ---------- USER ----------
const username = localStorage.getItem("username");
const farmerId = username ? username : "farmer_" + Date.now();

// welcome name
const welcomeEl = document.getElementById("welcomeName");
if (welcomeEl) {
  welcomeEl.innerText = farmerId.toUpperCase();
}

// ---------- SOCKET ----------
const socket = io();

// join farmer room
socket.emit("join", {
  userId: farmerId,
  role: "farmer"
});

// listen for transporter acceptance
socket.on("requestAccepted", (data) => {
  alert(data.message);
});

// ===============================
// MODAL HANDLING
// ===============================
function openModal() {
  const modal = document.getElementById("cropModal");
  if (modal) modal.style.display = "flex";
}

function closeModal() {
  const modal = document.getElementById("cropModal");
  if (modal) modal.style.display = "none";
}

// ===============================
// ADD CROP
// ===============================
function addCrop() {
  const type = document.getElementById("cropType").value;
  const harvest = document.getElementById("harvestDate").value;
  const qty = document.getElementById("quantity").value;
  const loc = document.getElementById("location").value;

  if (!type || !harvest || !qty || !loc) {
    alert("Please fill all fields");
    return;
  }

  document.getElementById("emptyState").style.display = "none";
  document.getElementById("cropList").style.display = "block";

  const card = document.createElement("div");
  card.className = "crop-card";

  card.innerHTML = `
    <div class="crop-header">
      <h3>${type}</h3>
      <button class="delete-btn" onclick="deleteCrop(this)">🗑️</button>
    </div>
    <span class="badge">Growing</span>
    <div class="crop-info">📍 ${loc}</div>
    <div class="crop-info">📦 ${qty} quintals</div>
    <div class="crop-info">📅 Harvest: ${harvest}</div>



  `;

  document.getElementById("cropList").appendChild(card);
  closeModal();

  // reset inputs
  document.getElementById("cropType").value = "";
  document.getElementById("harvestDate").value = "";
  document.getElementById("quantity").value = "";
  document.getElementById("location").value = "";
}

// ===============================
// DELETE CROP
// ===============================
function deleteCrop(btn) {
  btn.closest(".crop-card").remove();

  if (document.getElementById("cropList").children.length === 0) {
    document.getElementById("cropList").style.display = "none";
    document.getElementById("emptyState").style.display = "block";
  }
}

// ===============================
// REQUEST TRANSPORT
// ===============================
function requestTransport(quantity) {
  if (!navigator.geolocation) {
    alert("Geolocation not supported");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      fetch("/api/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          farmerId: farmerId,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          quantity: Number(quantity)
        })
      })
        .then((res) => res.json())
        .then((data) => {
          alert(data.message);
        })
        .catch(() => {
          alert("Server error. Try again.");
        });
    },
    () => {
      alert("Please allow location access");
    }
  );
}
