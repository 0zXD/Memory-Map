var memoryList = [];
var leafletMap = null;
// Dark mode functionality
var MemoryMapDarkModeManager = /** @class */ (function () {
    function MemoryMapDarkModeManager() {
        this.init();
    }
    MemoryMapDarkModeManager.prototype.init = function () {
        var _this = this;
        var savedMode = localStorage.getItem('darkMode');
        var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (savedMode === 'dark' || (!savedMode && prefersDark)) {
            this.enableDarkMode();
        }
        else {
            this.disableDarkMode();
        }
        var toggleBtn = document.getElementById('darkModeToggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', function () { return _this.toggleDarkMode(); });
        }
    };
    MemoryMapDarkModeManager.prototype.enableDarkMode = function () {
        document.documentElement.classList.add('dark');
        localStorage.setItem('darkMode', 'dark');
    };
    MemoryMapDarkModeManager.prototype.disableDarkMode = function () {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('darkMode', 'light');
    };
    MemoryMapDarkModeManager.prototype.toggleDarkMode = function () {
        if (document.documentElement.classList.contains('dark')) {
            this.disableDarkMode();
        }
        else {
            this.enableDarkMode();
        }
    };
    return MemoryMapDarkModeManager;
}());
// Map functionality
var MemoryMap = /** @class */ (function () {
    function MemoryMap() {
        this.selectedLocation = null;
        this.initializeEventListeners();
    }
    MemoryMap.prototype.initializeEventListeners = function () {
        var _this = this;
        var startMappingBtn = document.getElementById('startMappingBtn');
        if (startMappingBtn) {
            startMappingBtn.addEventListener('click', function () { return _this.openMapModal(); });
        }
        var closeMapBtn = document.getElementById('closeMapBtn');
        var mapModal = document.getElementById('mapModal');
        if (closeMapBtn) {
            closeMapBtn.addEventListener('click', function () { return _this.closeMapModal(); });
        }
        if (mapModal) {
            mapModal.addEventListener('click', function (e) {
                if (e.target === mapModal)
                    _this.closeMapModal();
            });
        }
        var closeFormBtn = document.getElementById('closeFormBtn');
        var cancelMemoryBtn = document.getElementById('cancelMemoryBtn');
        var addMemoryForm = document.getElementById('addMemoryForm');
        if (closeFormBtn) {
            closeFormBtn.addEventListener('click', function () { return _this.hideMemoryForm(); });
        }
        if (cancelMemoryBtn) {
            cancelMemoryBtn.addEventListener('click', function () { return _this.hideMemoryForm(); });
        }
        if (addMemoryForm) {
            addMemoryForm.addEventListener('submit', function (e) { return _this.handleMemorySubmit(e); });
        }
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') {
                _this.closeMapModal();
                _this.hideMemoryForm();
            }
        });
    };
    MemoryMap.prototype.openMapModal = function () {
        var modal = document.getElementById('mapModal');
        if (modal) {
            modal.classList.remove('hidden');
        }
        if (!leafletMap) {
            this.initializeMap();
        }
        setTimeout(function () {
            if (leafletMap)
                leafletMap.invalidateSize();
        }, 100);
    };
    MemoryMap.prototype.closeMapModal = function () {
        var modal = document.getElementById('mapModal');
        if (modal) {
            modal.classList.add('hidden');
        }
        this.hideMemoryForm();
    };
    MemoryMap.prototype.initializeMap = function () {
        var _this = this;
        leafletMap = L.map('realMap').setView([40.7128, -74.0060], 2);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(leafletMap);
        this.addSampleMemories();
        leafletMap.on('click', function (e) {
            _this.handleMapClick(e);
        });
        this.getCurrentLocation();
    };
    MemoryMap.prototype.getCurrentLocation = function () {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(function (position) {
                var lat = position.coords.latitude;
                var lng = position.coords.longitude;
                leafletMap.setView([lat, lng], 10);
                var currentLocationIcon = L.divIcon({
                    className: 'current-location-marker',
                    html: '<div style="background: #3b82f6; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white;"></div>',
                    iconSize: [16, 16],
                    iconAnchor: [8, 8]
                });
                L.marker([lat, lng], { icon: currentLocationIcon })
                    .addTo(leafletMap)
                    .bindPopup("📍 You are here!");
            });
        }
    };
    MemoryMap.prototype.addSampleMemories = function () {
        var _this = this;
        var sampleMemories = [
            {
                lat: 48.8566,
                lng: 2.3522,
                title: "Paris Adventure",
                description: "Amazing view from the Eiffel Tower!",
                friends: ["Sarah", "Mike"],
                date: "2024-06-15"
            },
            {
                lat: 35.6762,
                lng: 139.6503,
                title: "Tokyo Food Tour",
                description: "Best ramen I've ever had in Shibuya",
                friends: ["Yuki", "Emma"],
                date: "2024-07-20"
            },
            {
                lat: 40.7589,
                lng: -73.9851,
                title: "Central Park Morning",
                description: "Perfect sunrise jog through the park",
                friends: [],
                date: "2024-08-01"
            },
            {
                lat: 51.5074,
                lng: -0.1278,
                title: "London Bridge Walk",
                description: "Crossing the Thames at sunset",
                friends: ["James", "Lucy"],
                date: "2024-05-12"
            }
        ];
        sampleMemories.forEach(function (memory) {
            _this.addMemoryToMap(memory);
            memoryList.push(memory);
        });
    };
    MemoryMap.prototype.addMemoryToMap = function (memory) {
        var customIcon = L.divIcon({
            className: 'custom-memory-marker',
            html: "<div style=\"\n                        background: #ef4444;\n                        width: 20px;\n                        height: 20px;\n                        border-radius: 50% 50% 50% 0;\n                        transform: rotate(-45deg);\n                        border: 2px solid white;\n                        cursor: pointer;\n                        position: relative;\n                    \">\n                        <div style=\"\n                            position: absolute;\n                            top: 50%;\n                            left: 50%;\n                            transform: translate(-50%, -50%) rotate(45deg);\n                            width: 8px;\n                            height: 8px;\n                            background: white;\n                            border-radius: 50%;\n                        \"></div>\n                    </div>",
            iconSize: [20, 20],
            iconAnchor: [10, 20]
        });
        var friendsText = memory.friends.length > 0
            ? "<p style=\"font-size: 12px; color: #64748b; margin-top: 8px;\"><i class=\"fas fa-users\"></i> With: ".concat(memory.friends.join(', '), "</p>")
            : '';
        var popupContent = "\n            <div style=\"min-width: 180px;\">\n                <h3 style=\"font-weight: 600; font-size: 14px; margin-bottom: 6px; color: #1e293b;\">".concat(memory.title, "</h3>\n                <p style=\"color: #64748b; margin-bottom: 6px; font-size: 12px;\">").concat(memory.description, "</p>\n                ").concat(friendsText, "\n                <p style=\"font-size: 11px; color: #94a3b8; margin-top: 6px;\"><i class=\"fas fa-calendar\"></i> ").concat(memory.date, "</p>\n            </div>\n        ");
        var marker = L.marker([memory.lat, memory.lng], { icon: customIcon })
            .addTo(leafletMap)
            .bindPopup(popupContent);
        return marker;
    };
    MemoryMap.prototype.handleMapClick = function (e) {
        this.selectedLocation = e.latlng;
        this.showMemoryForm();
        if (this.tempMarker) {
            leafletMap.removeLayer(this.tempMarker);
        }
        var tempIcon = L.divIcon({
            className: 'temp-marker',
            html: "<div style=\"\n                        background: #10b981;\n                        width: 16px;\n                        height: 16px;\n                        border-radius: 50%;\n                        border: 2px solid white;\n                    \"></div>",
            iconSize: [16, 16],
            iconAnchor: [8, 8]
        });
        this.tempMarker = L.marker([e.latlng.lat, e.latlng.lng], { icon: tempIcon })
            .addTo(leafletMap);
    };
    MemoryMap.prototype.showMemoryForm = function () {
        var form = document.getElementById('memoryForm');
        if (form) {
            form.classList.remove('hidden');
            form.classList.add('show-fixed');
            setTimeout(function () {
                var titleInput = document.getElementById('memoryTitle');
                if (titleInput) {
                    titleInput.focus();
                }
            }, 100);
        }
    };
    MemoryMap.prototype.hideMemoryForm = function () {
        var form = document.getElementById('memoryForm');
        if (form) {
            form.classList.add('hidden');
            form.classList.remove('show-fixed');
        }
        if (this.tempMarker) {
            leafletMap.removeLayer(this.tempMarker);
            this.tempMarker = null;
        }
        var addMemoryForm = document.getElementById('addMemoryForm');
        if (addMemoryForm) {
            addMemoryForm.reset();
        }
        this.selectedLocation = null;
    };
    MemoryMap.prototype.handleMemorySubmit = function (e) {
        e.preventDefault();
        if (!this.selectedLocation)
            return;
        var titleInput = document.getElementById('memoryTitle');
        var descriptionInput = document.getElementById('memoryDescription');
        var friendsInput = document.getElementById('memoryFriends');
        var title = (titleInput === null || titleInput === void 0 ? void 0 : titleInput.value.trim()) || '';
        var description = (descriptionInput === null || descriptionInput === void 0 ? void 0 : descriptionInput.value.trim()) || '';
        var friendsStr = (friendsInput === null || friendsInput === void 0 ? void 0 : friendsInput.value.trim()) || '';
        var friends = friendsStr ? friendsStr.split(',').map(function (f) { return f.trim(); }) : [];
        if (!title) {
            alert('Please enter a title for your memory!');
            return;
        }
        var memory = {
            lat: this.selectedLocation.lat,
            lng: this.selectedLocation.lng,
            title: title,
            description: description,
            friends: friends,
            date: new Date().toISOString().split('T')[0]
        };
        memoryList.push(memory);
        if (this.tempMarker) {
            leafletMap.removeLayer(this.tempMarker);
            this.tempMarker = null;
        }
        this.addMemoryToMap(memory);
        this.hideMemoryForm();
        this.showSuccessMessage(memory.title);
        console.log('Memory added:', memory);
        console.log('All memories:', memoryList);
    };
    MemoryMap.prototype.showSuccessMessage = function (title) {
        alert("Memory \"".concat(title, "\" added successfully!"));
    };
    return MemoryMap;
}());
// Interactive map pins (existing functionality)
document.querySelectorAll('.map-pin').forEach(function (pin) {
    pin.addEventListener('click', function () {
        var _a;
        var location = (_a = this.dataset) === null || _a === void 0 ? void 0 : _a.location;
        console.log("Clicked on ".concat(location));
    });
});
// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    new MemoryMapDarkModeManager();
    new MemoryMap();
});
