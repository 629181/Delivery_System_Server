let map;
let markers = {};
let selectedRiderId = null;

// Initialize the High-Detail Map
function initMap() {
    // Set view to Kolkata (matching your original coordinates)
    map = L.map("map", { zoomControl: false }).setView([22.5726, 88.3639], 13);

    // High-Detail OpenStreetMap Layer (Shows all shops, places, and labels)
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
    }).addTo(map);

    // Move zoom controls to bottom right for a cleaner look
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Initialize Socket.io for real-time tracking
    const socket = io();

    socket.on("locationUpdated", (rider) => {
        updateMarker(rider);
        // If the admin is currently looking at this rider's activity, refresh the list
        if (selectedRiderId === rider._id) {
            loadActivity(rider._id);
        }
    });

    loadRiders();
}

// Custom Marker Creator: Creates a Pulse + Pin + Initials + Label
function createRiderIcon(name, color = "#6366f1") {
    const initial = name.charAt(0).toUpperCase();
    return L.divIcon({
        className: 'custom-rider-marker',
        html: `
            <div class="marker-container">
                <div class="marker-pulse"></div>
                <div class="marker-pin" style="background-color: ${color};">
                    <span>${initial}</span>
                </div>
                <div class="marker-label">${name}</div>
            </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 40]
    });
}

// Fetch all registered riders from API
function loadRiders() {
    fetch("/api/riders")
        .then(res => res.json())
        .then(data => {
            const list = document.getElementById("riderList");
            list.innerHTML = "";
            data.forEach((rider) => {
                const li = document.createElement("li");
                li.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="width: 10px; height: 10px; border-radius: 50%; background: #10b981;"></div>
                        <div>
                            <strong>${rider.name}</strong><br>
                            <small style="color: #64748b;">${rider.vehicle || 'Standard'}</small>
                        </div>
                    </div>
                `;
                li.onclick = () => selectRider(rider);
                list.appendChild(li);

                // If rider has coordinates, put them on the map immediately
                if (rider.location && rider.location.lat) {
                    updateMarker(rider);
                }
            });
        });
}

// Update or Create Marker on the Map
function updateMarker(rider) {
    // 1. ADD THIS SAFETY CHECK: Skip if location data is missing
    if (!rider.location || typeof rider.location.lat === 'undefined') {
        console.log(`Rider ${rider.name} has no location data yet.`);
        return;
    }

    const pos = [rider.location.lat, rider.location.lng];

    if (markers[rider._id]) {
        markers[rider._id].setLatLng(pos);
    } else {
        markers[rider._id] = L.marker(pos, { icon: createRiderIcon(rider.name) })
            .addTo(map)
            .bindPopup(`
                <div style="text-align: center;">
                    <strong>${rider.name}</strong><br>
                    <span style="color: #6366f1;">${rider.vehicle}</span>
                </div>
            `);

        // 2. AUTO-FOCUS: If this is the first rider, center the map on them
        if (Object.keys(markers).length === 1) {
            map.setView(pos, 14);
        }
    }
}

// Action when clicking a rider in the sidebar
function selectRider(rider) {
    selectedRiderId = rider._id;

    // Smoothly "Fly" to the rider's location (Premium animation)
    map.flyTo([rider.location.lat, rider.location.lng], 16, {
        animate: true,
        duration: 1.5
    });

    // Automatically open the popup to show rider info
    if (markers[rider._id]) {
        markers[rider._id].openPopup();
    }

    loadActivity(rider._id);
}

// Fetch the logs/activity for the specific rider
function loadActivity(riderId) {
    fetch(`/api/activity/${riderId}`)
        .then(res => res.json())
        .then(data => {
            const activityList = document.getElementById("activity");
            activityList.innerHTML = "";

            if (data.length === 0) {
                activityList.innerHTML = "<li style='color: #94a3b8; text-align: center;'>No logs available</li>";
                return;
            }

            // Show last 10 activities with a premium timeline style
            data.slice(0, 10).forEach(log => {
                const li = document.createElement("li");
                li.style.borderLeft = "3px solid #6366f1";
                li.style.marginBottom = "5px";
                li.innerHTML = `
                    <div style="font-size: 0.85rem;">${log.message}</div>
                    <div style="font-size: 0.7rem; color: #94a3b8;">${new Date(log.time).toLocaleTimeString()}</div>
                `;
                activityList.appendChild(li);
            });
        });
}

// Launch the map once the window loads
window.onload = initMap;
