// ==========================================
// LEAFLET MAP
// ==========================================

const map = L.map("map").setView(
    [22.0, 80.0],
    5
);


// OpenStreetMap tiles
L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
        attribution: "&copy; OpenStreetMap contributors"
    }
).addTo(map);


// Store the current route
let currentRoute = null;

// Store markers
let startMarker = null;
let destinationMarker = null;


// ==========================================
// MODAL
// ==========================================

const modal = document.getElementById("modal");

function openDemo() {
    modal.style.display = "grid";
}

function closeDemo() {
    modal.style.display = "none";
}


// ==========================================
// CALCULATE REAL ROUTE
// ==========================================

async function optimize() {

    // Get input values
    const origin = document.getElementById("o").value.trim();
    const destination = document.getElementById("d").value.trim();
    const vehicle = document.getElementById("v").value;

    const result = document.getElementById("result");


    // Check input
    if (origin === "" || destination === "") {

        result.innerHTML = `
            <b>Please enter both locations.</b>
        `;

        return;
    }


    // Loading message
    result.innerHTML = `
        <b>Calculating route...</b>
        <p>
            Finding the real road distance and route.
        </p>
    `;


    try {

        // ==========================================
        // 1. FIND STARTING LOCATION
        // ==========================================

        const startURL =
            "https://nominatim.openstreetmap.org/search" +
            "?format=json" +
            "&limit=1" +
            "&q=" +
            encodeURIComponent(origin);


        const startResponse = await fetch(startURL);

        const startData = await startResponse.json();


        if (startData.length === 0) {

            throw new Error(
                "Starting location could not be found."
            );
        }


        const startLat =
            parseFloat(startData[0].lat);

        const startLon =
            parseFloat(startData[0].lon);


        // ==========================================
        // 2. FIND DESTINATION
        // ==========================================

        const destinationURL =
            "https://nominatim.openstreetmap.org/search" +
            "?format=json" +
            "&limit=1" +
            "&q=" +
            encodeURIComponent(destination);


        const destinationResponse =
            await fetch(destinationURL);

        const destinationData =
            await destinationResponse.json();


        if (destinationData.length === 0) {

            throw new Error(
                "Destination could not be found."
            );
        }


        const destinationLat =
            parseFloat(destinationData[0].lat);

        const destinationLon =
            parseFloat(destinationData[0].lon);


        // ==========================================
        // 3. CREATE OSRM ROUTING URL
        // ==========================================

        const routeURL =
            "https://router.project-osrm.org/route/v1/driving/" +
            startLon +
            "," +
            startLat +
            ";" +
            destinationLon +
            "," +
            destinationLat +
            "?overview=full&geometries=geojson";


        // ==========================================
        // 4. REQUEST REAL ROAD ROUTE
        // ==========================================

        const routeResponse =
            await fetch(routeURL);

        const routeData =
            await routeResponse.json();


        if (routeData.code !== "Ok") {

            throw new Error(
                "A road route could not be calculated."
            );
        }


        // ==========================================
        // 5. GET ROUTE DATA
        // ==========================================

        const route =
            routeData.routes[0];


        // Distance returned by OSRM is in metres
        const distanceKm =
            route.distance / 1000;


        // Duration returned by OSRM is in seconds
        const durationMinutes =
            route.duration / 60;


        const hours =
            Math.floor(durationMinutes / 60);


        const minutes =
            Math.round(durationMinutes % 60);


        // ==========================================
        // 6. REMOVE OLD ROUTE
        // ==========================================

        if (currentRoute !== null) {

            map.removeLayer(currentRoute);

        }


        // Remove old markers
        if (startMarker !== null) {

            map.removeLayer(startMarker);

        }

        if (destinationMarker !== null) {

            map.removeLayer(destinationMarker);

        }


        // ==========================================
        // 7. DRAW REAL ROAD ROUTE
        // ==========================================

        currentRoute =
            L.geoJSON(
                route.geometry,
                {
                    style: {
                        color: "#39d99b",
                        weight: 6,
                        opacity: 0.9
                    }
                }
            ).addTo(map);


        // ==========================================
        // 8. ADD START MARKER
        // ==========================================

        startMarker =
            L.marker(
                [startLat, startLon]
            )
            .addTo(map)
            .bindPopup(
                "<b>Starting Point</b><br>" +
                origin
            );


        // ==========================================
        // 9. ADD DESTINATION MARKER
        // ==========================================

        destinationMarker =
            L.marker(
                [destinationLat, destinationLon]
            )
            .addTo(map)
            .bindPopup(
                "<b>Destination</b><br>" +
                destination
            );


        // ==========================================
        // 10. ZOOM TO ROUTE
        // ==========================================

        map.fitBounds(
            currentRoute.getBounds(),
            {
                padding: [30, 30]
            }
        );


        // ==========================================
        // 11. DISPLAY RESULT
        // ==========================================

        result.innerHTML = `
            <b>Real Route Calculated</b>

            <h3>
                ${origin} → ${destination}
            </h3>

            <p>
                <strong>Vehicle:</strong>
                ${vehicle}
            </p>

            <p>
                <strong>Distance:</strong>
                ${distanceKm.toFixed(2)} km
            </p>

            <p>
                <strong>Estimated Travel Time:</strong>
                ${hours}h ${minutes}m
            </p>

            <p>
                <strong>Route Status:</strong>
                Real road route
            </p>
        `;

    }
    catch (error) {

        console.error(error);

        result.innerHTML = `
            <b>Unable to calculate route.</b>

            <p>
                ${error.message}
            </p>

            <p>
                Check the location names and try again.
            </p>
        `;
    }
}


// ==========================================
// CLOSE MODAL BY CLICKING OUTSIDE
// ==========================================

modal.addEventListener(
    "click",
    function (event) {

        if (event.target === modal) {

            closeDemo();

        }

    }
);


// ==========================================
// CLOSE MODAL WITH ESCAPE KEY
// ==========================================

document.addEventListener(
    "keydown",
    function (event) {

        if (event.key === "Escape") {

            closeDemo();

        }

    }
);