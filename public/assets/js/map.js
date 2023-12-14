
var map = L.map('map').setView([51.505, -0.09], 13, {
    scrollWheelZoom: false
});
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

// Define the coordinates for your marker
var markerCoordinates = [51.505, -0.09];

// Create a marker and add it to the map
var marker = L.marker(markerCoordinates).addTo(map);

function enableScrollWheelZoom() {
    map.scrollWheelZoom.enable();
}
map.on('click', enableScrollWheelZoom);

function disableScrollWheelZoom() {
    map.scrollWheelZoom.disable();
}
map.on('mouseout', disableScrollWheelZoom);