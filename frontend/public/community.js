// --- CONFIG & STATE ---
const phone = localStorage.getItem("phone") || "0000000000";
const farmerId = "farmer_" + phone;
let currentLat = null;
let currentLng = null;

// --- GEOLOCATION ---
function initLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((pos) => {
      currentLat = pos.coords.latitude;
      currentLng = pos.coords.longitude;
      fetchNearbyFarmers();
    }, (err) => {
      console.warn("Location error:", err);
      // Fallback: fetch without location
      fetchNearbyFarmers();
      fetchClusters();
    });
  } else {
    fetchNearbyFarmers();
    fetchClusters();
  }
}

// --- FETCH NEARBY ---
async function fetchNearbyFarmers() {
  try {
    let url = '/api/community/nearby';
    if (currentLat && currentLng) {
      url += `?lat=${currentLat}&lng=${currentLng}`;
    }

    const response = await fetch(url);
    const members = await response.json();

    renderCommunityList(members);
  } catch (err) {
    console.error("Fetch Community Error:", err);
  }
}

// --- FETCH CLUSTERS (ML) ---
async function fetchClusters() {
  try {
    const response = await fetch('/api/community/clusters');
    const data = await response.json();
    if (data.success && data.clusters.length > 0) {
      document.getElementById("mlClusters").style.display = "block";
      renderClusters(data.clusters);
    } else {
      document.getElementById("mlClusters").style.display = "none";
    }
  } catch (err) {
    console.error("Fetch Clusters Error:", err);
  }
}

function renderClusters(clusters) {
  const listEl = document.getElementById("clusterList");
  listEl.innerHTML = "";
  clusters.forEach(c => {
    const card = document.createElement("div");
    card.className = "card";
    card.style.borderLeft = "4px solid #1e5bff";
    card.style.padding = "15px";

    card.innerHTML = `
            <div style="font-weight:bold; margin-bottom:8px;">📦 Group Volume: ${c.totalQuantity} quintals</div>
            <div class="info" style="font-size:13px;">👨‍🌾 Members: ${c.memberCount} Farmers</div>
            <div class="info" style="font-size:13px;">🌾 Crops: ${c.crops.join(", ")}</div>
            <div class="badge" style="background:#eef4ff; color:#1e5bff; margin-top:10px;">Ready for 10-Ton Truck</div>
        `;
    listEl.appendChild(card);
  });
}

// --- RENDER ---
function renderCommunityList(members) {
  const listEl = document.getElementById("communityList");
  if (!listEl) return;

  if (members.length === 0) {
    listEl.innerHTML = `<p style="text-align:center; color:gray; padding:20px;">No community members nearby yet. Be the first to join!</p>`;
    return;
  }

  listEl.innerHTML = "";
  members.forEach(m => {
    const card = document.createElement("div");
    card.className = "card";

    // Don't show delete button for others
    const isSelf = m.userId === farmerId;

    card.innerHTML = `
            <div class="card-header">
                <h3>${m.name} ${isSelf ? "(You)" : ""}</h3>
                ${isSelf ? `<button class="delete-btn" onclick="withdrawMember('${m.userId}')">🗑️</button>` : ""}
            </div>
            <div class="info">🌾 Crop: ${m.crop}</div>
            <div class="info">📦 Quantity: ${m.quantity} quintals</div>
            <div class="info">📅 Harvest Date: ${m.harvestDate}</div>
            <div class="info">📍 ${m.location} ${m.distance ? `(${m.distance} km away)` : ""}</div>
            <span class="badge">Community Member</span>
        `;
    listEl.appendChild(card);
  });
}

// --- JOIN COMMUNITY ---
async function addMember() {
  const name = document.getElementById("farmerName").value;
  const crop = document.getElementById("cropType").value;
  const harvest = document.getElementById("harvestDate").value;
  const qty = document.getElementById("quantity").value;
  const loc = document.getElementById("location").value;

  if (!name || !crop || !harvest || !qty || !loc) {
    alert("Please fill all fields");
    return;
  }

  const payload = {
    userId: farmerId,
    name,
    crop,
    quantity: qty,
    harvestDate: harvest,
    location: loc,
    lat: currentLat,
    lng: currentLng
  };

  try {
    const response = await fetch('/api/community/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    if (result.success) {
      alert("Success! You've joined the community.");
      closeModal();
      fetchNearbyFarmers();
    } else {
      alert("Error: " + result.error);
    }
  } catch (err) {
    console.error("Join Error:", err);
    alert("Failed to connect to server.");
  }
}

// --- WITHDRAW ---
async function withdrawMember(id) {
  if (confirm("Do you want to withdraw from the community?")) {
    // Technically we could add a DELETE endpoint, but for now we'll just alert.
    // In a real app we'd call: await fetch(`/api/community/${id}`, { method: 'DELETE' });
    alert("Withdrawal requested (Integration pending).");
  }
}

// Initialize on load
document.addEventListener("DOMContentLoaded", initLocation);

// Export for global access via onclick
window.addMember = addMember;
window.withdrawMember = withdrawMember;
window.openModal = () => document.getElementById("communityModal").style.display = "flex";
window.closeModal = () => document.getElementById("communityModal").style.display = "none";
