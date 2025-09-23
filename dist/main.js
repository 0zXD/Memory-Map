"use strict";
const memoryList = [];
let leafletMap = null;


// API Configuration
const API_BASE_URL = 'http://localhost:8080';

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
        } else {
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
        } else {
            this.enableDarkMode();
        }
    }
}

// Map functionality
class MemoryMap {
    constructor() {
        this.selectedLocation = null;
        this.tempMarker = null;
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
                if (e.target === mapModal) this.closeMapModal();
            });
        }
        const closeFormBtn = document.getElementById('closeFormBtn');
        const cancelMemoryBtn = document.getElementById('cancelMemoryBtn');
        const addMemoryForm = document.getElementById('addMemoryForm');
        const closeCardsBtn = document.getElementById('closeCardsBtn');
        
        if (closeFormBtn) {
            closeFormBtn.addEventListener('click', () => this.hideMemoryForm());
        }
        if (cancelMemoryBtn) {
            cancelMemoryBtn.addEventListener('click', () => this.hideMemoryForm());
        }
        if (closeCardsBtn) {
            closeCardsBtn.addEventListener('click', () => this.hidePhotoCards());
        }
        if (addMemoryForm) {
            addMemoryForm.addEventListener('submit', (e) => this.handleMemorySubmit(e));
        }
        
        // Add photo preview functionality
        const photoInput = document.getElementById('memoryPhoto');
        if (photoInput) {
            photoInput.addEventListener('change', (e) => this.handlePhotoPreview(e));
        }
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideMemoryForm();
                this.hidePhotoCards();
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
            if (leafletMap) leafletMap.invalidateSize();
        }, 100);
    }

    closeMapModal() {
        const modal = document.getElementById('mapModal');
        if (modal) {
            modal.classList.add('hidden');
        }
        this.hideMemoryForm();
        this.hidePhotoCards();
    }

    initializeMap() {
        leafletMap = L.map('realMap').setView([40.7128, -74.0060], 2);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(leafletMap);
        
        // Load existing memories from database
        this.loadExistingMemories();
        
        leafletMap.on('click', (e) => {
            this.handleMapClick(e);
        });
        this.getCurrentLocation();
    }

    async loadExistingMemories() {
        try {
            const response = await fetch(`${API_BASE_URL}/posts`);
            if (response.ok) {
                const memories = await response.json();
                // Print all fetched memory info to the console
                console.log('Fetched memories from backend:', memories);
                memories.forEach(memory => {
                    this.addMemoryToMap(memory);
                });
            }
        } catch (error) {
            console.error('Error loading existing memories:', error);
        }
    }

    getCurrentLocation() {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    leafletMap.setView([lat, lng], 13);
                },
                (error) => {
                    console.log("Location access denied or unavailable");
                }
            );
        }
    }

    addMemoryToMap(memory) {
        const customIcon = L.divIcon({
            className: 'custom-memory-marker',
            html: `<div style="
                        background: linear-gradient(135deg, #10b981, #059669);
                        width: 24px;
                        height: 24px;
                        border-radius: 50% 50% 50% 0;
                        transform: rotate(-45deg);
                        border: 3px solid white;
                        cursor: pointer;
                        position: relative;
                        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
                        transition: all 0.3s ease;
                    " onmouseover="this.style.transform='rotate(-45deg) scale(1.2)'; this.style.boxShadow='0 6px 20px rgba(16, 185, 129, 0.6)';" onmouseout="this.style.transform='rotate(-45deg) scale(1)'; this.style.boxShadow='0 4px 12px rgba(16, 185, 129, 0.4)';">
                        <div style="
                            position: absolute;
                            top: 50%;
                            left: 50%;
                            transform: translate(-50%, -50%) rotate(45deg);
                            width: 10px;
                            height: 10px;
                            background: white;
                            border-radius: 50%;
                        "></div>
                    </div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 24]
        });

        // Format date nicely
        const formattedDate = memory.date ? new Date(memory.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }) : 'Unknown date';

        // Format friends/tags
        const friendsChips = memory.friends && memory.friends.length > 0
            ? memory.friends.map(friend => 
                `<span style="display: inline-block; background: rgba(16, 185, 129, 0.1); color: #10b981; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: 500; margin: 2px;">${friend}</span>`
              ).join('')
            : '';

        // Create beautiful popup content
        const popupContent = `
            <div style="
                min-width: 320px; 
                max-width: 360px; 
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                background: linear-gradient(145deg, #ffffff 0%, #fafbfc 100%);
                border-radius: 16px;
                overflow: hidden;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.12);
            ">
                <!-- Header with enhanced user info -->
                <div style="
                    display: flex; 
                    align-items: center; 
                    padding: 20px 20px 16px 20px;
                    background: linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(5, 150, 105, 0.08) 100%);
                    border-bottom: 1px solid rgba(16, 185, 129, 0.1);
                ">
                    <div style="
                        width: 44px; 
                        height: 44px; 
                        background: linear-gradient(135deg, #10b981, #059669); 
                        border-radius: 50%; 
                        display: flex; 
                        align-items: center; 
                        justify-content: center; 
                        margin-right: 12px;
                        box-shadow: 0 4px 16px rgba(16, 185, 129, 0.3);
                    ">
                        <i class="fas fa-user" style="color: white; font-size: 16px;"></i>
                    </div>
                    <div style="flex: 1;">
                        <h4 style="
                            margin: 0; 
                            font-weight: 700; 
                            font-size: 16px; 
                            color: #0f172a;
                            letter-spacing: -0.025em;
                        ">${memory.user?.username || 'Anonymous Explorer'}</h4>
                        <p style="
                            margin: 2px 0 0 0; 
                            font-size: 12px; 
                            color: #64748b;
                            display: flex;
                            align-items: center;
                            font-weight: 500;
                        ">
                            <i class="fas fa-calendar-alt" style="margin-right: 6px; color: #10b981;"></i>
                            ${formattedDate}
                        </p>
                    </div>
                    <div style="
                        padding: 4px 8px;
                        background: rgba(16, 185, 129, 0.1);
                        border-radius: 20px;
                        border: 1px solid rgba(16, 185, 129, 0.2);
                    ">
                        <span style="
                            font-size: 10px;
                            font-weight: 600;
                            color: #059669;
                            text-transform: uppercase;
                            letter-spacing: 0.5px;
                        ">Memory</span>
                    </div>
                </div>

                <!-- Enhanced memory title and description -->
                <div style="padding: 20px 20px 16px 20px;">
                    <h3 style="
                        margin: 0 0 10px 0; 
                        font-weight: 700; 
                        font-size: 20px; 
                        color: #0f172a; 
                        line-height: 1.2;
                        letter-spacing: -0.025em;
                    ">${memory.title}</h3>
                    ${memory.description ? `
                        <p style="
                            margin: 0; 
                            color: #475569; 
                            font-size: 14px; 
                            line-height: 1.5;
                            font-weight: 400;
                        ">${memory.description}</p>
                    ` : ''}
                </div>

                <!-- Enhanced photo preview -->
                ${memory.imageData ? `
                    <div style="padding: 0 20px 16px 20px;">
                        <div style="
                            position: relative;
                            border-radius: 12px;
                            overflow: hidden;
                            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
                        ">
                            <img src="${memory.imageData}" alt="${memory.title}" style="
                                width: 100%; 
                                height: 180px; 
                                object-fit: cover;
                                transition: transform 0.3s ease;
                            ">
                            <div style="
                                position: absolute;
                                top: 8px;
                                right: 8px;
                                background: rgba(0, 0, 0, 0.5);
                                backdrop-filter: blur(8px);
                                border-radius: 20px;
                                padding: 4px 8px;
                            ">
                                <i class="fas fa-camera" style="color: white; font-size: 10px; margin-right: 4px;"></i>
                                <span style="color: white; font-size: 10px; font-weight: 500;">Photo</span>
                            </div>
                        </div>
                    </div>
                ` : ''}

                <!-- Enhanced Friends/Tags -->
                ${friendsChips ? `
                    <div style="padding: 0 20px 16px 20px;">
                        <div style="
                            display: flex;
                            align-items: center;
                            margin-bottom: 8px;
                        ">
                            <i class="fas fa-tags" style="color: #10b981; font-size: 12px; margin-right: 6px;"></i>
                            <span style="
                                font-size: 11px; 
                                font-weight: 600; 
                                color: #64748b; 
                                text-transform: uppercase; 
                                letter-spacing: 0.5px;
                            ">Tagged</span>
                        </div>
                        <div style="display: flex; flex-wrap: wrap; gap: 4px;">${friendsChips}</div>
                    </div>
                ` : ''}

                <!-- Enhanced action buttons -->
                <div style="
                    padding: 16px 20px 20px 20px;
                    background: linear-gradient(145deg, #f8fafc 0%, #f1f5f9 100%);
                    border-top: 1px solid rgba(226, 232, 240, 0.8);
                ">
                    <div style="display: flex; gap: 8px; margin-bottom: 12px;">
                        <button onclick="memoryMap.showPhotoCardsForLocation(${memory.lat}, ${memory.lng})" style="
                            background: linear-gradient(135deg, #10b981, #059669); 
                            color: white; 
                            border: none; 
                            padding: 12px 16px; 
                            border-radius: 12px; 
                            font-size: 13px; 
                            font-weight: 600; 
                            cursor: pointer; 
                            transition: all 0.3s ease; 
                            box-shadow: 0 4px 16px rgba(16, 185, 129, 0.3);
                            flex: 1;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            letter-spacing: 0.025em;
                        "
                        onmouseover="
                            this.style.transform='translateY(-2px)'; 
                            this.style.boxShadow='0 8px 24px rgba(16, 185, 129, 0.4)';
                            this.style.background='linear-gradient(135deg, #059669, #047857)';
                        "
                        onmouseout="
                            this.style.transform='translateY(0)'; 
                            this.style.boxShadow='0 4px 16px rgba(16, 185, 129, 0.3)';
                            this.style.background='linear-gradient(135deg, #10b981, #059669)';
                        ">
                            <i class="fas fa-images" style="margin-right: 6px; font-size: 12px;"></i>
                            Explore
                        </button>
                        
                        <button onclick="memoryMap.deleteMemory('${memory._id || memory.id}', ${memory.lat}, ${memory.lng})" style="
                            background: linear-gradient(135deg, #ef4444, #dc2626); 
                            color: white; 
                            border: none; 
                            padding: 12px 16px; 
                            border-radius: 12px; 
                            font-size: 13px; 
                            font-weight: 600; 
                            cursor: pointer; 
                            transition: all 0.3s ease; 
                            box-shadow: 0 4px 16px rgba(239, 68, 68, 0.3);
                            flex: 1;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            letter-spacing: 0.025em;
                        "
                        onmouseover="
                            this.style.transform='translateY(-2px)'; 
                            this.style.boxShadow='0 8px 24px rgba(239, 68, 68, 0.4)';
                            this.style.background='linear-gradient(135deg, #dc2626, #b91c1c)';
                        "
                        onmouseout="
                            this.style.transform='translateY(0)'; 
                            this.style.boxShadow='0 4px 16px rgba(239, 68, 68, 0.3)';
                            this.style.background='linear-gradient(135deg, #ef4444, #dc2626)';
                        ">
                            <i class="fas fa-trash-alt" style="margin-right: 6px; font-size: 12px;"></i>
                            Delete
                        </button>
                    </div>
                    
                    <div style="text-align: center;">
                        <p style="
                            margin: 0;
                            font-size: 11px;
                            color: #94a3b8;
                            font-weight: 500;
                        ">
                            <i class="fas fa-info-circle" style="margin-right: 4px;"></i>
                            Delete action requires confirmation
                        </p>
                    </div>
                </div>
            </div>
        `;

        const marker = L.marker([memory.lat, memory.lng], { icon: customIcon })
            .addTo(leafletMap)
            .bindPopup(popupContent, {
                maxWidth: 320,
                className: 'custom-popup',
                closeButton: true,
                autoClose: false,
                closeOnEscapeKey: true
            });

        // Enhanced click event - show both popup and photo cards
        marker.on('click', () => {
            // Open the popup first
            marker.openPopup();
            
            // Then show photo cards after a short delay for better UX
            setTimeout(() => {
                this.showPhotoCardsForLocation(memory.lat, memory.lng);
            }, 300);
        });

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
            form.style.transform = 'translateX(0)';
            form.style.opacity = '1';
            setTimeout(() => {
                const usernameInput = document.getElementById('memoryUsername');
                if (usernameInput) {
                    usernameInput.focus();
                }
            }, 100);
        }
    }

    hideMemoryForm() {
        const form = document.getElementById('memoryForm');
        if (form) {
            form.classList.add('hidden');
            form.style.transform = 'translateX(100%)';
            form.style.opacity = '0';
        }
        if (this.tempMarker) {
            leafletMap.removeLayer(this.tempMarker);
            this.tempMarker = null;
        }
        const addMemoryForm = document.getElementById('addMemoryForm');
        if (addMemoryForm) {
            addMemoryForm.reset();
        }
        
        // Clear photo preview
        const previewContainer = document.getElementById('photoPreview');
        const previewImage = document.getElementById('previewImage');
        if (previewContainer) {
            previewContainer.classList.add('hidden');
        }
        if (previewImage) {
            previewImage.src = '';
        }
        
        this.selectedLocation = null;
    }

    handlePhotoPreview(e) {
        const file = e.target.files[0];
        const previewContainer = document.getElementById('photoPreview');
        const previewImage = document.getElementById('previewImage');
        const removeBtn = document.getElementById('removePreview');

        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                this.showMessage('Please select a valid image file', 'error');
                e.target.value = '';
                return;
            }

            // Validate file size (10MB limit)
            if (file.size > 10 * 1024 * 1024) {
                this.showMessage('File size must be less than 10MB', 'error');
                e.target.value = '';
                return;
            }

            // Create preview
            const reader = new FileReader();
            reader.onload = (event) => {
                previewImage.src = event.target.result;
                previewContainer.classList.remove('hidden');
            };
            reader.readAsDataURL(file);

            // Add remove functionality
            if (removeBtn) {
                removeBtn.onclick = () => {
                    e.target.value = '';
                    previewContainer.classList.add('hidden');
                    previewImage.src = '';
                };
            }
        } else {
            // Hide preview if no file selected
            previewContainer.classList.add('hidden');
            previewImage.src = '';
        }
    }

    async handleMemorySubmit(e) {
        e.preventDefault();
        if (!this.selectedLocation) return;

        const usernameInput = document.getElementById('memoryUsername');
        const titleInput = document.getElementById('memoryTitle');
        const descriptionInput = document.getElementById('memoryDescription');
        const friendsInput = document.getElementById('memoryFriends');
        const photoInput = document.getElementById('memoryPhoto');

        const username = usernameInput?.value.trim() || '';
        const title = titleInput?.value.trim() || '';
        const description = descriptionInput?.value.trim() || '';
        const friendsStr = friendsInput?.value.trim() || '';
        const friends = friendsStr ? friendsStr.split(',').map(f => f.trim()) : [];
        const photoFile = photoInput?.files[0];

        if (!username) {
            this.showMessage('Please enter your name', 'error');
            return;
        }

        if (!title) {
            this.showMessage('Please enter a title for this memory', 'error');
            return;
        }

        if (!photoFile) {
            this.showMessage('Please select a photo', 'error');
            return;
        }

        this.showLoadingSpinner(true);

        try {
            const uploadResult = await this.uploadImage(photoFile);
            
            // Add to local display
            const memory = {
                lat: this.selectedLocation.lat,
                lng: this.selectedLocation.lng,
                title,
                description,
                friends,
                date: new Date().toISOString().split('T')[0],
                user: { username }
            };

            if (this.tempMarker) {
                leafletMap.removeLayer(this.tempMarker);
            }

            this.addMemoryToMap(memory);
            this.hideMemoryForm();
            this.showSuccessMessage(memory.title);

        } catch (error) {
            console.error('Error uploading memory:', error);
            this.showMessage(error.message || 'Failed to upload memory', 'error');
        } finally {
            this.showLoadingSpinner(false);
        }
    }

    async uploadImage(file) {
        const formData = new FormData();
        formData.append('image', file);
        
        // Add memory metadata to the form data
        const username = document.getElementById('memoryUsername')?.value.trim() || '';
        const title = document.getElementById('memoryTitle')?.value.trim() || '';
        const description = document.getElementById('memoryDescription')?.value.trim() || '';
        const friendsStr = document.getElementById('memoryFriends')?.value.trim() || '';
        
        if (!username) {
            throw new Error('Please enter your name');
        }
        
        formData.append('username', username);
        formData.append('title', title);
        formData.append('caption', description);
        formData.append('tags', friendsStr); // Using tags field for friends
        formData.append('latitude', this.selectedLocation.lat.toString());
        formData.append('longitude', this.selectedLocation.lng.toString());

        const response = await fetch(`${API_BASE_URL}/upload`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Upload failed');
        }

        return await response.json();
    }

    showSuccessMessage(title) {
        this.showMessage(`Memory "${title}" added successfully!`, 'success');
    }

    showLoadingSpinner(show) {
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) {
            spinner.classList.toggle('hidden', !show);
        }
    }

    showMessage(message, type = 'info') {
        const container = document.getElementById('messageContainer') || this.createMessageContainer();
        
        const messageEl = document.createElement('div');
        messageEl.className = `p-3 rounded-lg shadow-lg transition-all duration-300 transform translate-x-full ${
            type === 'success' ? 'bg-green-500 text-white' : 
            type === 'error' ? 'bg-red-500 text-white' : 
            'bg-blue-500 text-white'
        }`;
        messageEl.textContent = message;
        
        container.appendChild(messageEl);
        
        setTimeout(() => {
            messageEl.classList.remove('translate-x-full');
        }, 10);
        
        setTimeout(() => {
            messageEl.classList.add('translate-x-full');
            setTimeout(() => {
                if (messageEl.parentNode) {
                    messageEl.parentNode.removeChild(messageEl);
                }
            }, 300);
        }, 3000);
    }

    createMessageContainer() {
        const container = document.createElement('div');
        container.id = 'messageContainer';
        container.className = 'fixed top-20 right-4 z-[60] space-y-2';
        document.body.appendChild(container);
        return container;
    }

    // Photo Cards Functions
    async showPhotoCardsForLocation(lat, lng) {
        try {
            // Fetch photos for this location (within a small radius)
            const radius = 0.001; // Very small radius for nearby photos
            const response = await fetch(`${API_BASE_URL}/posts/location/${lat}/${lng}?radius=${radius}`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch photos for location');
            }

            const photos = await response.json();
            this.displayPhotoCards(photos);
        } catch (error) {
            console.error('Error fetching photos for location:', error);
            this.showMessage('Failed to load photos for this location', 'error');
        }
    }

    displayPhotoCards(photos) {
        const container = document.getElementById('photoCardsContainer');
        const cardsList = document.getElementById('photoCardsList');
        
        if (!container || !cardsList) return;

        if (photos.length === 0) {
            cardsList.innerHTML = `
                <div class="text-center py-8 text-slate-500 dark:text-slate-400">
                    <i class="fas fa-camera text-3xl mb-2"></i>
                    <p>No memories found at this location</p>
                </div>
            `;
        } else {
            cardsList.innerHTML = photos.map(photo => this.createPhotoCard(photo)).join('');
        }

        // Show the container
        container.classList.remove('hidden');
        setTimeout(() => {
            container.style.transform = 'translateX(0)';
            container.style.opacity = '1';
        }, 10);
    }

    createPhotoCard(photo) {
        const friendsChips = photo.friends && photo.friends.length > 0 
            ? photo.friends.map(friend => `<span class="tag-chip">${friend}</span>`).join('') 
            : '';

        const userInfo = photo.user ? `
            <div class="flex items-center text-xs text-slate-500 dark:text-slate-400 mt-2">
                <i class="fas fa-user mr-1"></i>
                <span>${photo.user.username}</span>
                <span class="mx-2">•</span>
                <span>${photo.date}</span>
            </div>
        ` : '';

        return `
            <div class="photo-card border border-slate-200 dark:border-slate-600">
                <div class="relative overflow-hidden">
                    <img src="${photo.imageData}" alt="${photo.title}" 
                         class="photo-image w-full h-48 object-cover">
                </div>
                <div class="p-4">
                    <h4 class="font-semibold text-slate-800 dark:text-slate-100 mb-2">${photo.title}</h4>
                    <p class="text-sm text-slate-600 dark:text-slate-300 mb-3">${photo.description}</p>
                    ${friendsChips ? `<div class="mb-2">${friendsChips}</div>` : ''}
                    ${userInfo}
                </div>
            </div>
        `;
    }

    async deleteMemory(memoryId, lat, lng) {
        // Show confirmation dialog
        const confirmed = await this.showDeleteConfirmation();
        if (!confirmed) return;

        try {
            this.showLoadingSpinner(true);
            
            // Send delete request to backend
            const response = await fetch(`${API_BASE_URL}/posts/${memoryId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete memory');
            }

            // Remove marker from map
            this.removeMarkerFromMap(lat, lng);
            
            // Close any open popups
            leafletMap.closePopup();
            
            // Hide photo cards if open
            this.hidePhotoCards();
            
            // Show success message
            this.showMessage('Memory deleted successfully!', 'success');
            
        } catch (error) {
            console.error('Error deleting memory:', error);
            this.showMessage(error.message || 'Failed to delete memory', 'error');
        } finally {
            this.showLoadingSpinner(false);
        }
    }

    showDeleteConfirmation() {
        return new Promise((resolve) => {
            // Create and show custom confirmation modal
            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center';
            modal.innerHTML = `
                <div class="bg-white dark:bg-slate-800 rounded-xl p-6 mx-4 max-w-md w-full shadow-2xl">
                    <div class="text-center">
                        <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900 mb-4">
                            <i class="fas fa-exclamation-triangle text-red-600 dark:text-red-400 text-xl"></i>
                        </div>
                        <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">Delete Memory</h3>
                        <p class="text-sm text-slate-600 dark:text-slate-300 mb-6">
                            Are you sure you want to delete this memory? This action cannot be undone and will permanently remove the memory from the database.
                        </p>
                        <div class="flex space-x-3">
                            <button id="cancelDelete" class="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                                Cancel
                            </button>
                            <button id="confirmDelete" class="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors">
                                Delete Memory
                            </button>
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            // Add event listeners
            const cancelBtn = modal.querySelector('#cancelDelete');
            const confirmBtn = modal.querySelector('#confirmDelete');

            const cleanup = () => {
                document.body.removeChild(modal);
            };

            cancelBtn.addEventListener('click', () => {
                cleanup();
                resolve(false);
            });

            confirmBtn.addEventListener('click', () => {
                cleanup();
                resolve(true);
            });

            // Close on escape key
            const handleEscape = (e) => {
                if (e.key === 'Escape') {
                    cleanup();
                    resolve(false);
                    document.removeEventListener('keydown', handleEscape);
                }
            };
            document.addEventListener('keydown', handleEscape);

            // Close on backdrop click
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    cleanup();
                    resolve(false);
                }
            });
        });
    }

    removeMarkerFromMap(lat, lng) {
        // Find and remove the marker at the specified coordinates
        leafletMap.eachLayer((layer) => {
            if (layer instanceof L.Marker) {
                const markerLat = layer.getLatLng().lat;
                const markerLng = layer.getLatLng().lng;
                
                // Check if this marker is at the same location (within small tolerance)
                const tolerance = 0.0001;
                if (Math.abs(markerLat - lat) < tolerance && Math.abs(markerLng - lng) < tolerance) {
                    leafletMap.removeLayer(layer);
                }
            }
        });
    }

    hidePhotoCards() {
        const container = document.getElementById('photoCardsContainer');
        if (container) {
            container.style.transform = 'translateX(-100%)';
            container.style.opacity = '0';
            setTimeout(() => {
                container.classList.add('hidden');
            }, 300);
        }
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
let memoryMap; // Global reference for onclick handlers

document.addEventListener('DOMContentLoaded', function () {
    new MemoryMapDarkModeManager();
    memoryMap = new MemoryMap();
});

