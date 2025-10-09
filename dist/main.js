"use strict";
const memoryList = [];
let leafletMap = null;
// Dark mode functionality
class MemoryMapDarkModeManager {
    constructor() {
        this.init();
    }
    init() {
        const savedMode = localStorage.getItem('darkMode');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (savedMode === 'dark' || (!savedMode && prefersDark)) {
            this.enableDarkMode();
        }
        else {
            this.disableDarkMode();
        }
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
        }
        else {
            this.enableDarkMode();
        }
    }
}
// Map functionality
class MemoryMap {
    constructor() {
        this.selectedLocation = null;
        this.initializeEventListeners();
    }
    initializeEventListeners() {
        const startMappingBtn = document.getElementById('startMappingBtn');
        if (startMappingBtn) {
            startMappingBtn.addEventListener('click', () => this.openMapModal());
        }
        const closeMapBtn = document.getElementById('closeMapBtn');
        const mapModal = document.getElementById('mapModal');
        if (closeMapBtn) {
            closeMapBtn.addEventListener('click', () => this.closeMapModal());
        }
        if (mapModal) {
            mapModal.addEventListener('click', (e) => {
                if (e.target === mapModal)
                    this.closeMapModal();
            });
        }
        const closeFormBtn = document.getElementById('closeFormBtn');
        const cancelMemoryBtn = document.getElementById('cancelMemoryBtn');
        const addMemoryForm = document.getElementById('addMemoryForm');
        if (closeFormBtn) {
            closeFormBtn.addEventListener('click', () => this.hideMemoryForm());
        }
        if (cancelMemoryBtn) {
            cancelMemoryBtn.addEventListener('click', () => this.hideMemoryForm());
        }
        if (addMemoryForm) {
            addMemoryForm.addEventListener('submit', (e) => this.handleMemorySubmit(e));
        }
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeMapModal();
                this.hideMemoryForm();
            }
        });
    }
    openMapModal() {
        const modal = document.getElementById('mapModal');
        if (modal) {
            modal.classList.remove('hidden');
        }
        if (!leafletMap) {
            this.initializeMap();
        }
        setTimeout(() => {
            if (leafletMap)
                leafletMap.invalidateSize();
        }, 100);
    }
    closeMapModal() {
        const modal = document.getElementById('mapModal');
        if (modal) {
            modal.classList.add('hidden');
        }
        this.hideMemoryForm();
    }
    initializeMap() {
        leafletMap = L.map('realMap').setView([40.7128, -74.0060], 2);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(leafletMap);
        this.addSampleMemories();
        leafletMap.on('click', (e) => {
            this.handleMapClick(e);
        });
        this.getCurrentLocation();
    }
    getCurrentLocation() {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition((position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                leafletMap.setView([lat, lng], 10);
                const currentLocationIcon = L.divIcon({
                    className: 'current-location-marker',
                    html: '<div style="background: #3b82f6; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white;"></div>',
                    iconSize: [16, 16],
                    iconAnchor: [8, 8]
                });
                L.marker([lat, lng], { icon: currentLocationIcon })
                    .addTo(leafletMap)
                    .bindPopup("You are here!");
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
            memoryList.push(memory);
        });
    }
    addMemoryToMap(memory) {
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
        const marker = L.marker([memory.lat, memory.lng], { icon: customIcon })
            .addTo(leafletMap)
            .bindPopup(popupContent);
        return marker;
    }
    handleMapClick(e) {
        this.selectedLocation = e.latlng;
        this.showMemoryForm();
        if (this.tempMarker) {
            leafletMap.removeLayer(this.tempMarker);
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
            .addTo(leafletMap);
    }
    showMemoryForm() {
        const form = document.getElementById('memoryForm');
        if (form) {
            form.classList.remove('hidden');
            form.classList.add('show-fixed');
            setTimeout(() => {
                const titleInput = document.getElementById('memoryTitle');
                if (titleInput) {
                    titleInput.focus();
                }
            }, 100);
        }
    }
    hideMemoryForm() {
        const form = document.getElementById('memoryForm');
        if (form) {
            form.classList.add('hidden');
            form.classList.remove('show-fixed');
        }
        if (this.tempMarker) {
            leafletMap.removeLayer(this.tempMarker);
            this.tempMarker = null;
        }
        const addMemoryForm = document.getElementById('addMemoryForm');
        if (addMemoryForm) {
            addMemoryForm.reset();
        }
        this.selectedLocation = null;
    }
    handleMemorySubmit(e) {
        e.preventDefault();
        if (!this.selectedLocation)
            return;
        const titleInput = document.getElementById('memoryTitle');
        const descriptionInput = document.getElementById('memoryDescription');
        const friendsInput = document.getElementById('memoryFriends');
        const title = titleInput?.value.trim() || '';
        const description = descriptionInput?.value.trim() || '';
        const friendsStr = friendsInput?.value.trim() || '';
        const friends = friendsStr ? friendsStr.split(',').map(f => f.trim()) : [];
        if (!title) {
            alert('Please enter a title for your memory!');
            return;
        }
        const memory = {
            lat: this.selectedLocation.lat,
            lng: this.selectedLocation.lng,
            title,
            description,
            friends,
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
    }
    showSuccessMessage(title) {
        alert(`Memory "${title}" added successfully!`);
    }
}
// Interactive map pins (existing functionality)
document.querySelectorAll('.map-pin').forEach(pin => {
    pin.addEventListener('click', function () {
        const location = this.dataset?.location;
        console.log(`Clicked on ${location}`);
    });
});
// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    new MemoryMapDarkModeManager();
    new MemoryMap();
});
