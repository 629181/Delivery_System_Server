let riderId = null;

function register() {
    const btn = document.getElementById("regBtn");
    const name = document.getElementById("name").value;
    const phone = document.getElementById("phone").value;
    const vehicle = document.getElementById("vehicle").value;

    if (!name || !phone) {
        alert("Please fill in your name and phone.");
        return;
    }

    // UI Feedback: Loading state
    btn.innerHTML = "Connecting...";
    btn.style.opacity = "0.7";
    btn.disabled = true;

    fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, vehicle })
    })
        .then(res => res.json())
        .then(data => {
            riderId = data._id;

            // Hide inputs and show live status
            document.querySelectorAll('.input-group').forEach(el => el.style.display = 'none');
            btn.style.display = 'none';

            const statusContainer = document.getElementById("statusContainer");
            statusContainer.style.display = "block";
            document.getElementById("statusText").innerText = "You are now ONLINE";

            startTracking();
        })
        .catch(err => {
            btn.innerText = "Error - Try Again";
            btn.disabled = false;
            console.error(err);
        });
}

function startTracking() {
    // Get immediate position once
    navigator.geolocation.getCurrentPosition((pos) => {
        sendLocation(pos.coords.latitude, pos.coords.longitude);
    });

    // Then watch for movement
    navigator.geolocation.watchPosition((pos) => {
        sendLocation(pos.coords.latitude, pos.coords.longitude);
    }, (err) => console.error(err), {
        enableHighAccuracy: true // IMPORTANT for premium tracking
    });
}

function sendLocation(lat, lng) {
    fetch("/api/update-location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ riderId, lat, lng })
    });
}