// --- CONFIG & STATE ---
const socket = io();
let mediaRecorder;
let audioChunks = [];
let audioBlob = null;
let imageBase64 = null;
let currentLat = null;
let currentLng = null;

// --- GEOLOCATION ---
function initLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
            currentLat = pos.coords.latitude;
            currentLng = pos.coords.longitude;
            document.getElementById('locationText').value = `${currentLat.toFixed(4)}, ${currentLng.toFixed(4)} (GPS Active)`;
        }, (err) => {
            console.warn("Location error:", err);
            document.getElementById('locationText').value = "Location access denied";
        });
    } else {
        document.getElementById('locationText').value = "Geolocation not supported";
    }
}

// --- CAMERA HANDLING ---
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const capturedImage = document.getElementById('capturedImage');
const placeholderText = document.getElementById('placeholderText');
const startCameraBtn = document.getElementById('startCameraBtn');
const captureBtn = document.getElementById('captureBtn');
const retakeBtn = document.getElementById('retakeBtn');
let stream = null;

async function startCamera() {
    try {
        stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' },
            audio: false
        });
        video.srcObject = stream;
        video.style.display = 'block';
        capturedImage.style.display = 'none';
        placeholderText.style.display = 'none';

        startCameraBtn.style.display = 'none';
        captureBtn.style.display = 'flex';
        retakeBtn.style.display = 'none';
    } catch (err) {
        console.error("Camera access error:", err);
        alert("Could not access camera. Please ensure you have given permission.");
    }
}

function takeSnapshot() {
    const context = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    imageBase64 = canvas.toDataURL('image/jpeg');
    capturedImage.src = imageBase64;

    capturedImage.style.display = 'block';
    video.style.display = 'none';

    captureBtn.style.display = 'none';
    retakeBtn.style.display = 'flex';

    stopCamera();
}

function stopCamera() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }
}

startCameraBtn.onclick = startCamera;
captureBtn.onclick = takeSnapshot;
retakeBtn.onclick = startCamera;

// Fallback for file input (if needed)
document.getElementById('imageInput').addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (event) {
            imageBase64 = event.target.result;
            capturedImage.src = imageBase64;
            capturedImage.style.display = 'block';
            video.style.display = 'none';
            placeholderText.style.display = 'none';
            startCameraBtn.style.display = 'none';
            retakeBtn.style.display = 'flex';
        };
        reader.readAsDataURL(file);
    }
});

// --- AUDIO RECORDING ---
const recordBtn = document.getElementById('recordBtn');
const stopBtn = document.getElementById('stopBtn');
const audioStatus = document.getElementById('audioStatus');
const audioPlayback = document.getElementById('audioPlayback');

recordBtn.onclick = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];

        mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };

        mediaRecorder.onstop = () => {
            audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            const audioUrl = URL.createObjectURL(audioBlob);
            audioPlayback.src = audioUrl;
            audioPlayback.style.display = 'block';
        };

        mediaRecorder.start();
        recordBtn.disabled = true;
        stopBtn.disabled = false;
        audioStatus.style.display = 'block';
        recordBtn.classList.add('active');
    } catch (err) {
        alert("Camera/Mic access required for reporting problems.");
    }
};

stopBtn.onclick = () => {
    mediaRecorder.stop();
    recordBtn.disabled = false;
    stopBtn.disabled = true;
    audioStatus.style.display = 'none';
    recordBtn.classList.remove('active');
};

// --- SUBMISSION ---
document.getElementById('submitBtn').onclick = async () => {
    const description = document.getElementById('description').value.trim();
    const phone = localStorage.getItem("phone") || "0000000000";
    const userId = localStorage.getItem("userId") || "transporter_" + phone;

    if (!description && !audioBlob && !imageBase64) {
        alert("Please provide at least one form of evidence (Text, Audio, or Image)");
        return;
    }

    const submitBtn = document.getElementById('submitBtn');
    submitBtn.innerText = "Submitting...";
    submitBtn.disabled = true;

    // Convert audio to base64 if exists
    let audioBase64 = null;
    if (audioBlob) {
        audioBase64 = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(audioBlob);
        });
    }

    const payload = {
        userId: userId,
        userType: "Transporter",
        description: description,
        image: imageBase64,
        audio: audioBase64,
        lat: currentLat,
        lng: currentLng,
        location: document.getElementById('locationText').value
    };

    try {
        const response = await fetch('/api/road-issues', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        if (result.success) {
            alert("Road problem reported successfully! Other transporters will be notified.");
            location.href = 'dashboard.html';
        } else {
            alert("Error: " + result.message);
            submitBtn.innerText = "Report Road Problem";
            submitBtn.disabled = false;
        }
    } catch (err) {
        console.error("Report Error:", err);
        alert("Failed to connect to server.");
        submitBtn.disabled = false;
    }
};

// Start location on page load
initLocation();
