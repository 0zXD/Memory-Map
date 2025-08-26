// Memory data storage
const memories = [];
let map = null;
let selectedLocation = null;

// Dark mode functionality
class DarkModeManager {
    constructor() {
        this.init();
    }

    init() {
        // Check for saved dark mode preference or default to light mode
        const savedMode = localStorage.getItem('darkMode');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        if (savedMode === 'dark' || (!savedMode && prefersDark)) {
            this.enableDarkMode();
        } else {
            this.disableDarkMode();
        }

        // Add event listener for the toggle button
        const toggleBtn = document.getElementById('darkModeToggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggleDarkMode());
        }
    }

    enableDarkMode() {
        document.documentElement.classList.add('dark');
        localStorage.setItem('darkMode', 'dark');
    }

    disableDarkMode() {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('darkMode', 'light');
    }

    toggleDarkMode() {
        if (document.documentElement.classList.contains('dark')) {
            this.disableDarkMode();
        } else {
            this.enableDarkMode();
        }
    }
}

// Map functionality
class MemoryMapApp {
    constructor() {
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Start mapping buttons
        const startMappingBtn = document.getElementById('startMappingBtn');
        if (startMappingBtn) {
            startMappingBtn.addEventListener('click', () => this.openMapModal());
        }

        // Modal controls
        const closeMapBtn = document.getElementById('closeMapBtn');
        const mapModal = document.getElementById('mapModal');

        closeMapBtn.addEventListener('click', () => this.closeMapModal());
        mapModal.addEventListener('click', (e) => {
            if (e.target === mapModal) this.closeMapModal();
        });

        // Form controls
        const closeFormBtn = document.getElementById('closeFormBtn');
        const cancelMemoryBtn = document.getElementById('cancelMemoryBtn');
        const addMemoryForm = document.getElementById('addMemoryForm');

        closeFormBtn.addEventListener('click', () => this.hideMemoryForm());
        cancelMemoryBtn.addEventListener('click', () => this.hideMemoryForm());
        addMemoryForm.addEventListener('submit', (e) => this.handleMemorySubmit(e));

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeMapModal();
                this.hideMemoryForm();
            }
        });
    }

    openMapModal() {
        const modal = document.getElementById('mapModal');
        modal.classList.remove('hidden');

        // Initialize map if not already done
        if (!map) {
            this.initializeMap();
        }

        // Resize map after opening
        setTimeout(() => {
            if (map) map.invalidateSize();
        }, 100);
    }

    closeMapModal() {
        const modal = document.getElementById('mapModal');
        modal.classList.add('hidden');
        this.hideMemoryForm();
    }

    initializeMap() {
        // Initialize Leaflet map
        map = L.map('realMap').setView([40.7128, -74.0060], 2);

        // Add tile layer (OpenStreetMap)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(map);

        // Add some sample memories
        this.addSampleMemories();

        // Map click event to add new memories
        map.on('click', (e) => {
            this.handleMapClick(e);
        });

        // Try to get user's current location
        this.getCurrentLocation();
    }

    getCurrentLocation() {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition((position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                map.setView([lat, lng], 10);

                // Add a "You are here" marker
                const currentLocationIcon = L.divIcon({
                    className: 'current-location-marker',
                    html: '<div style="background: #3b82f6; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white;"></div>',
                    iconSize: [16, 16],
                    iconAnchor: [8, 8]
                });

                L.marker([lat, lng], { icon: currentLocationIcon })
                    .addTo(map)
                    .bindPopup("📍 You are here!");
            });
        }
    }

    addSampleMemories() {
        const sampleMemories = [
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

        sampleMemories.forEach(memory => {
            this.addMemoryToMap(memory);
            memories.push(memory);
        });
    }

    addMemoryToMap(memory) {
        // Create custom marker icon
        const customIcon = L.divIcon({
            className: 'custom-memory-marker',
            html: `<div style="
                        background: #ef4444;
                        width: 20px;
                        height: 20px;
                        border-radius: 50% 50% 50% 0;
                        transform: rotate(-45deg);
                        border: 2px solid white;
                        cursor: pointer;
                        position: relative;
                    ">
                        <div style="
                            position: absolute;
                            top: 50%;
                            left: 50%;
                            transform: translate(-50%, -50%) rotate(45deg);
                            width: 8px;
                            height: 8px;
                            background: white;
                            border-radius: 50%;
                        "></div>
                    </div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 20]
        });

        // Create popup content
        const friendsText = memory.friends.length > 0
            ? `<p style="font-size: 12px; color: #64748b; margin-top: 8px;"><i class="fas fa-users"></i> With: ${memory.friends.join(', ')}</p>`
            : '';

        const popupContent = `
            <div style="min-width: 180px;">
                <h3 style="font-weight: 600; font-size: 14px; margin-bottom: 6px; color: #1e293b;">${memory.title}</h3>
                <p style="color: #64748b; margin-bottom: 6px; font-size: 12px;">${memory.description}</p>
                ${friendsText}
                <p style="font-size: 11px; color: #94a3b8; margin-top: 6px;"><i class="fas fa-calendar"></i> ${memory.date}</p>
            </div>
        `;

        // Add marker to map
        const marker = L.marker([memory.lat, memory.lng], { icon: customIcon })
            .addTo(map)
            .bindPopup(popupContent);

        return marker;
    }

    handleMapClick(e) {
        selectedLocation = e.latlng;
        this.showMemoryForm();

        // Add a temporary marker
        if (this.tempMarker) {
            map.removeLayer(this.tempMarker);
        }

        const tempIcon = L.divIcon({
            className: 'temp-marker',
            html: `<div style="
                        background: #10b981;
                        width: 16px;
                        height: 16px;
                        border-radius: 50%;
                        border: 2px solid white;
                    "></div>`,
            iconSize: [16, 16],
            iconAnchor: [8, 8]
        });

        this.tempMarker = L.marker([e.latlng.lat, e.latlng.lng], { icon: tempIcon })
            .addTo(map);
    }

    showMemoryForm() {
        const form = document.getElementById('memoryForm');
        form.classList.remove('hidden');
        form.classList.add('show-fixed');
        
        // Focus on the title input
        setTimeout(() => {
            const titleInput = document.getElementById('memoryTitle');
            if (titleInput) {
                titleInput.focus();
            }
        }, 100);
    }

    hideMemoryForm() {
        const form = document.getElementById('memoryForm');
        form.classList.add('hidden');
        form.classList.remove('show-fixed');

        // Remove temporary marker
        if (this.tempMarker) {
            map.removeLayer(this.tempMarker);
            this.tempMarker = null;
        }

        // Reset form
        document.getElementById('addMemoryForm').reset();
        selectedLocation = null;
    }

    handleMemorySubmit(e) {
        e.preventDefault();

        if (!selectedLocation) return;

        // Get form data
        const title = document.getElementById('memoryTitle').value.trim();
        const description = document.getElementById('memoryDescription').value.trim();
        const friendsInput = document.getElementById('memoryFriends').value.trim();
        const friends = friendsInput ? friendsInput.split(',').map(f => f.trim()) : [];

        if (!title) {
            alert('Please enter a title for your memory!');
            return;
        }

        // Create memory object
        const memory = {
            lat: selectedLocation.lat,
            lng: selectedLocation.lng,
            title: title,
            description: description,
            friends: friends,
            date: new Date().toISOString().split('T')[0]
        };

        // Add to memories array
        memories.push(memory);

        // Remove temporary marker
        if (this.tempMarker) {
            map.removeLayer(this.tempMarker);
            this.tempMarker = null;
        }

        // Add permanent marker
        this.addMemoryToMap(memory);

        // Hide form and show success message
        this.hideMemoryForm();
        this.showSuccessMessage(memory.title);

        console.log('Memory added:', memory);
        console.log('All memories:', memories);
    }

    showSuccessMessage(title) {
        // Simple alert for now - you can replace with a nicer notification
        alert(`Memory "${title}" added successfully!`);
    }
}

// Interactive map pins (existing functionality)
document.querySelectorAll('.map-pin').forEach(pin => {
    pin.addEventListener('click', function () {
        const location = this.dataset.location;
        console.log(`Clicked on ${location}`);
    });
});

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    new DarkModeManager();
    new MemoryMapApp();
});