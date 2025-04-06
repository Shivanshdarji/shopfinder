document.addEventListener('DOMContentLoaded', function() {
    const searchData = JSON.parse(localStorage.getItem('shopLocateResults'));
    
    if (!searchData) {
        window.location.href = "index.html";
        return;
    }
    
    // Display search criteria
    document.getElementById('resultsHeading').textContent = 
        `Optimal Locations for ${searchData.businessType} in ${searchData.city}`;
    document.getElementById('searchCriteria').textContent = 
        `Areas with least competition for your business type`;
    
    // Initialize the map with results
    initResultsMap(searchData.results);
    
    // Display results list with competition analysis
    displayResultsList(searchData.results);
});

function initResultsMap(results) {
    if (results.length === 0) return;
    
    try {
        const map = new google.maps.Map(document.getElementById("resultsMap"), {
            zoom: 12,
            center: { lat: results[0].lat, lng: results[0].lng },
            mapTypeControl: false
        });
        
        // Add markers for each recommended area
        results.forEach((area, index) => {
            const marker = new google.maps.Marker({
                position: { lat: area.lat, lng: area.lng },
                map: map,
                title: `Opportunity Score: ${area.score}`,
                icon: {
                    url: getMarkerIcon(area.score),
                    scaledSize: new google.maps.Size(32, 32)
                },
                label: {
                    text: (index + 1).toString(),
                    color: 'white',
                    fontWeight: 'bold'
                }
            });
            
            // Add info window with competition details
            const infoWindow = new google.maps.InfoWindow({
                content: `
                    <div class="map-info-window">
                        <h6>Area ${index + 1}</h6>
                        <p>Competitors nearby: <strong>${area.competitorCount}</strong></p>
                        <p>Competition level: <strong>${area.competition}</strong></p>
                        <p>Opportunity score: <strong>${area.score}/100</strong></p>
                        <p>Estimated rent: <strong>${area.rent}</strong></p>
                    </div>
                `
            });
            
            marker.addListener('click', () => {
                infoWindow.open(map, marker);
            });
        });
        
        // Add heatmap showing competition density
        addCompetitionHeatmap(map, results);
        
    } catch (error) {
        console.error("Error initializing map:", error);
        document.getElementById('resultsMap').innerHTML = `
            <div class="alert alert-warning">
                Map could not be loaded. Here are the recommended areas:
            </div>
        `;
    }
}

function addCompetitionHeatmap(map, areas) {
    // Create heatmap data based on competition density
    const heatmapData = areas.map(area => {
        return {
            location: new google.maps.LatLng(area.lat, area.lng),
            weight: (100 - area.score) / 20 // Convert opportunity to competition weight
        };
    });
    
    new google.maps.visualization.HeatmapLayer({
        data: heatmapData,
        map: map,
        radius: 50,
        gradient: [
            'rgba(0, 255, 0, 0)',
            'rgba(0, 255, 0, 1)',
            'rgba(255, 255, 0, 1)',
            'rgba(255, 165, 0, 1)',
            'rgba(255, 0, 0, 1)'
        ]
    });
}

function displayResultsList(results) {
    const resultsContainer = document.getElementById('resultsContainer');
    resultsContainer.innerHTML = '';
    
    results.forEach((area, index) => {
        const scoreColor = getScoreColor(area.score);
        
        const locationCard = document.createElement('div');
        locationCard.className = 'col-md-6 col-lg-4 mb-4';
        locationCard.innerHTML = `
            <div class="card h-100">
                <div class="card-img-top map-thumbnail" 
                     style="background-image: url('https://maps.googleapis.com/maps/api/staticmap?center=${area.lat},${area.lng}&zoom=15&size=600x300&maptype=roadmap&markers=color:green%7C${area.lat},${area.lng}&key=YOUR_API_KEY')">
                    <span class="badge bg-${area.competition === 'High' ? 'danger' : area.competition === 'Medium' ? 'warning' : 'success'} position-absolute top-0 end-0 m-2">
                        ${area.competition} Competition
                    </span>
                </div>
                <div class="card-body">
                    <h5 class="card-title">Area ${index + 1}</h5>
                    <p class="card-text text-muted">
                        <i class="fas fa-map-marker-alt"></i> ${area.address}
                    </p>
                    <div class="d-flex justify-content-between mb-2">
                        <span><i class="fas fa-money-bill-wave"></i> ${area.rent}</span>
                        <span><i class="fas fa-store-alt"></i> ${area.competitorCount} competitors</span>
                    </div>
                    <div class="progress mb-3" style="height: 10px;">
                        <div class="progress-bar ${scoreColor}" role="progressbar" 
                             style="width: ${area.score}%;" 
                             aria-valuenow="${area.score}" 
                             aria-valuemin="0" 
                             aria-valuemax="100">
                        </div>
                    </div>
                    <div class="d-flex justify-content-between align-items-center">
                        <span>Opportunity Score: <strong>${area.score}/100</strong></span>
                        <button class="btn btn-sm btn-outline-primary view-details" data-lat="${area.lat}" data-lng="${area.lng}">
                            View Area
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        resultsContainer.appendChild(locationCard);
    });
    
    // Add event listeners to view buttons
    document.querySelectorAll('.view-details').forEach(button => {
        button.addEventListener('click', function() {
            const lat = parseFloat(this.getAttribute('data-lat'));
            const lng = parseFloat(this.getAttribute('data-lng'));
            centerMapOnLocation(lat, lng);
        });
    });
}

function getMarkerIcon(score) {
    // Green = high opportunity, Red = low opportunity
    const hue = Math.round(score * 1.2); // 0-120 (red to green)
    return `https://chart.googleapis.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|${hue},${100-hue},0|000000|000000`;
}

function getScoreColor(score) {
    if (score >= 80) return 'bg-success';
    if (score >= 60) return 'bg-primary';
    if (score >= 40) return 'bg-warning';
    return 'bg-danger';
}

function centerMapOnLocation(lat, lng) {
    const mapElement = document.getElementById('resultsMap');
    if (mapElement) {
        const map = new google.maps.Map(mapElement, {
            zoom: 15,
            center: { lat, lng }
        });
        new google.maps.Marker({
            position: { lat, lng },
            map: map
        });
        mapElement.scrollIntoView({ behavior: 'smooth' });
    }
}
function createLocationCard(location, index) {
    const competitionLevel = getCompetitionLevel(location.competitorCount);
    const competitionColor = getCompetitionColor(location.competitorCount);
    
    // Create landmarks text if available
    const landmarksText = location.landmarks?.length > 0 
        ? `<p class="text-muted small mb-2"><i class="fas fa-landmark"></i> Near: ${location.landmarks.join(', ')}</p>`
        : '';
    
    const col = document.createElement('div');
    col.className = 'col-md-6 col-lg-4 mb-4';
    col.innerHTML = `
        <div class="card h-100">
            <div class="position-relative">
                <img src="https://maps.gomaps.pro/maps/api/staticmap?center=${location.lat},${location.lng}&zoom=16&size=600x300&maptype=roadmap&markers=color:0x${getColorHex(competitionColor)}%7C${location.lat},${location.lng}&key=${API_KEY}" 
                     class="card-img-top" alt="${location.name}">
                <span class="badge bg-${competitionColor} position-absolute top-0 end-0 m-2">
                    ${competitionLevel} Competition
                </span>
            </div>
            <div class="card-body">
                <h5 class="card-title">${index + 1}. ${location.name}</h5>
                <p class="card-text text-muted">
                    <i class="fas fa-map-marker-alt"></i> ${location.address}
                </p>
                ${landmarksText}
                <div class="d-flex justify-content-between mb-2">
                    <span><i class="fas fa-store"></i> Similar Businesses:</span>
                    <span class="fw-bold">${location.competitorCount}</span>
                </div>
                <div class="d-flex justify-content-between mb-3">
                    <span><i class="fas fa-money-bill-wave"></i> Est. Rent:</span>
                    <span class="fw-bold">${location.rent}</span>
                </div>
                <div class="d-grid gap-2">
                    <a href="https://www.google.com/maps/?q=${location.lat},${location.lng}" 
                       class="btn btn-sm btn-primary" target="_blank">
                        <i class="fas fa-map-marked-alt"></i> View on Map
                    </a>
                </div>
            </div>
        </div>
    `;
    
    return col;
}