document.addEventListener('DOMContentLoaded', function() {
    const locationForm = document.getElementById('locationForm');
    
    locationForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form values
        const businessType = document.getElementById('businessType').value;
        const city = document.getElementById('city').value;
        const investment = document.getElementById('investment').value;
        const size = document.getElementById('size').value;
        
        // Analyze competition and find optimal locations
        analyzeCompetition(businessType, city, investment, size);
    });
});

async function analyzeCompetition(businessType, city, investment, size) {
    // Show loading state
    const submitBtn = document.querySelector('#locationForm button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Analyzing...';
    
    try {
        // In a real app, this would be an API call to your backend
        // For demo, we'll simulate analysis with mock data
        
        // Step 1: Geocode the city to get coordinates
        const cityCoords = await geocodeCity(city);
        
        // Step 2: Find similar businesses in the area
        const competitors = await findCompetitors(businessType, cityCoords);
        
        // Step 3: Analyze density and find optimal locations
        const analysisResults = analyzeAreas(competitors, cityCoords);
        
        // Step 4: Prepare and show results
        displayAnalysisResults(analysisResults, businessType, city);
        
    } catch (error) {
        console.error("Analysis failed:", error);
        alert("Analysis failed. Please try again later.");
    } finally {
        // Reset button state
        submitBtn.disabled = false;
        submitBtn.textContent = 'Find Perfect Locations';
    }
}

// Mock geocoding function
async function geocodeCity(city) {
    // In real implementation, use Google Maps Geocoding API
    console.log(`Geocoding city: ${city}`);
    
    // Return mock coordinates for demonstration
    const cityCoordinates = {
        "Delhi": { lat: 28.6139, lng: 77.2090 },
        "Mumbai": { lat: 19.0760, lng: 72.8777 },
        "Bangalore": { lat: 12.9716, lng: 77.5946 },
        "Hyderabad": { lat: 17.3850, lng: 78.4867 },
        "Chennai": { lat: 13.0827, lng: 80.2707 }
    };
    
    return cityCoordinates[city] || { lat: 28.6139, lng: 77.2090 }; // Default to Delhi
}

// Mock competitor finder
async function findCompetitors(businessType, location) {
    console.log(`Finding competitors for ${businessType} near ${JSON.stringify(location)}`);
    
    // This would use Google Places API in real implementation
    // For demo, return mock data with varying density
    
    // Generate mock competitors with clustered distribution
    const competitors = [];
    const businessTypes = {
        "restaurant": ["Cafe", "Restaurant", "Diner", "Eatery", "Bistro"],
        "clothing": ["Boutique", "Apparel", "Fashion", "Garments", "Outlet"],
        "electronics": ["Electronics", "Gadgets", "Devices", "Tech", "Appliances"],
        "grocery": ["Supermarket", "Grocery", "Provisions", "Mart", "Store"],
        "salon": ["Salon", "Parlor", "Beauty", "Grooming", "Spa"]
    };
    
    const typeNames = businessTypes[businessType] || ["Store", "Shop", "Outlet"];
    
    // Create 3 dense clusters and 2 sparse areas
    const clusters = [
        { center: { lat: location.lat + 0.01, lng: location.lng + 0.01 }, count: 15 }, // High density
        { center: { lat: location.lat - 0.01, lng: location.lng - 0.01 }, count: 12 }, // Medium density
        { center: { lat: location.lat + 0.02, lng: location.lng - 0.005 }, count: 8 },  // Medium density
        { center: { lat: location.lat - 0.015, lng: location.lng + 0.02 }, count: 3 },  // Low density
        { center: { lat: location.lat + 0.025, lng: location.lng + 0.025 }, count: 2 }  // Low density
    ];
    
    clusters.forEach((cluster, clusterIndex) => {
        for (let i = 0; i < cluster.count; i++) {
            const offset = {
                lat: (Math.random() - 0.5) * 0.01,
                lng: (Math.random() - 0.5) * 0.01
            };
            
            competitors.push({
                id: `${clusterIndex}-${i}`,
                name: `${typeNames[i % typeNames.length]} ${i+1}`,
                location: {
                    lat: cluster.center.lat + offset.lat,
                    lng: cluster.center.lng + offset.lng
                },
                cluster: clusterIndex,
                density: cluster.count > 10 ? 'High' : cluster.count > 5 ? 'Medium' : 'Low'
            });
        }
    });
    
    return competitors;
}

function analyzeAreas(competitors, cityCenter) {
    // Analyze competitor density in different areas
    const areas = [];
    
    // Create a grid around the city center
    const gridSize = 0.02; // Degrees (~2km in latitude)
    
    for (let latOffset = -0.04; latOffset <= 0.04; latOffset += gridSize) {
        for (let lngOffset = -0.04; lngOffset <= 0.04; lngOffset += gridSize) {
            const areaCenter = {
                lat: cityCenter.lat + latOffset,
                lng: cityCenter.lng + lngOffset
            };
            
            // Find competitors in this area
            const competitorsInArea = competitors.filter(comp => {
                return Math.abs(comp.location.lat - areaCenter.lat) < gridSize/2 &&
                       Math.abs(comp.location.lng - areaCenter.lng) < gridSize/2;
            });
            
            // Calculate density score (lower is better)
            const densityScore = Math.min(100, competitorsInArea.length * 10);
            const opportunityScore = 100 - densityScore;
            
            areas.push({
                center: areaCenter,
                competitorCount: competitorsInArea.length,
                densityScore,
                opportunityScore,
                competitors: competitorsInArea
            });
        }
    }
    
    // Sort by opportunity score (highest first)
    areas.sort((a, b) => b.opportunityScore - a.opportunityScore);
    
    // Return top 5 areas with least competition
    return areas.slice(0, 5);
}

function displayAnalysisResults(results, businessType, city) {
    // Store results for the results page
    localStorage.setItem('shopLocateResults', JSON.stringify({
        businessType,
        city,
        results: results.map(area => ({
            name: `Area with ${area.competitorCount} competitors`,
            address: `${city} (${area.center.lat.toFixed(4)}, ${area.center.lng.toFixed(4)})`,
            rent: estimateRent(area.opportunityScore),
            size: "Various sizes available",
            competition: getCompetitionLevel(area.competitorCount),
            score: area.opportunityScore,
            lat: area.center.lat,
            lng: area.center.lng,
            competitorCount: area.competitorCount
        }))
    }));
    
    // Redirect to results page
    window.location.href = "results.html";
}

function estimateRent(opportunityScore) {
    // Higher opportunity = lower competition = higher rent
    const base = 20000;
    const multiplier = opportunityScore / 20; // 0-5 multiplier
    return `₹${Math.round(base * (1 + multiplier)).toLocaleString()}/month`;
}

function getCompetitionLevel(count) {
    if (count > 10) return "High";
    if (count > 5) return "Medium";
    return "Low";
}

fetch(`https://maps.gomaps.pro/maps/api/place/autocomplete/json?input=Delhi&key=GOMAPS_PRO_KEY`)
  .then(response => response.json())
  .then(data => console.log(data.predictions))
  .catch(error => console.error('API failed:', error));

  // After your existing code in script.js

async function analyzeCompetition(businessType, city, locationCoords) {
    // 1. Find similar businesses in the area
    const competitors = await findCompetitors(businessType, locationCoords);
    
    // 2. Calculate distances and competition density
    const competitionAnalysis = await calculateCompetitionDensity(locationCoords, competitors);
    
    // 3. Prepare results with distance metrics
    const results = competitionAnalysis.map(area => ({
        name: `Area near ${area.center.name}`,
        address: area.center.address,
        distance: area.distance, // in meters
        competitorCount: area.competitors.length,
        competitionScore: calculateCompetitionScore(area.competitors.length, area.distance),
        competitors: area.competitors,
        lat: area.center.lat,
        lng: area.center.lng,
        rent: estimateRent(area.competitors.length),
        size: "Various sizes available"
    }));
    
    // Sort by best opportunity (low competition score is better)
    return results.sort((a, b) => a.competitionScore - b.competitionScore);
}

async function findCompetitors(businessType, centerCoords) {
    // Use GoMaps.Pro Places API to find similar businesses
    const response = await fetch(`https://maps.gomaps.pro/maps/api/place/nearbysearch/json?location=${centerCoords.lat},${centerCoords.lng}&radius=1500&type=${businessType}&key=${API_KEY}`);
    const data = await response.json();
    return data.results || [];
}

async function calculateCompetitionDensity(centerCoords, competitors) {
    if (competitors.length === 0) return [];
    
    // 1. Group competitors by area
    const areas = clusterCompetitors(competitors);
    
    // 2. Calculate distances from center
    const areasWithDistance = await Promise.all(
        areas.map(async area => {
            const distance = await getDistance(
                centerCoords, 
                { lat: area.center.lat, lng: area.center.lng }
            );
            return { ...area, distance };
        })
    );
    
    return areasWithDistance;
}

async function getDistance(origin, destination) {
    // Use GoMaps.Pro Distance Matrix API
    const response = await fetch(
        `https://maps.gomaps.pro/maps/api/distancematrix/json?origins=${origin.lat},${origin.lng}&destinations=${destination.lat},${destination.lng}&key=${API_KEY}`
    );
    const data = await response.json();
    return data.rows[0].elements[0].distance.value; // Distance in meters
}

function calculateCompetitionScore(count, distance) {
    // Normalize to 0-100 scale (lower is better)
    const distanceWeight = Math.min(1, distance / 1000); // 1km max distance
    const countWeight = Math.min(10, count) / 10; // Max 10 competitors
    return Math.round((distanceWeight * 30) + (countWeight * 70));
}

function clusterCompetitors(competitors) {
    // Simple clustering - in production use a proper clustering algorithm
    const clusters = [];
    const MAX_DISTANCE = 200; // Meters between points to consider same cluster
    
    competitors.forEach(competitor => {
        let addedToCluster = false;
        for (const cluster of clusters) {
            const dist = haversineDistance(
                [competitor.geometry.location.lat, competitor.geometry.location.lng],
                [cluster.center.lat, cluster.center.lng]
            );
            if (dist < MAX_DISTANCE) {
                cluster.competitors.push(competitor);
                addedToCluster = true;
                break;
            }
        }
        if (!addedToCluster) {
            clusters.push({
                center: {
                    lat: competitor.geometry.location.lat,
                    lng: competitor.geometry.location.lng,
                    name: competitor.name,
                    address: competitor.vicinity
                },
                competitors: [competitor]
            });
        }
    });
    
    return clusters;
}

// Helper function to calculate distance between two coordinates
function haversineDistance(coord1, coord2) {
    const [lat1, lon1] = coord1;
    const [lat2, lon2] = coord2;
    const R = 6371e3; // Earth radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
}

// Before displaying competition scores
function displayScore(score) {
    if (isNaN(score)) {
      return "Not Available"; // or 0/100 or some default value
    }
    return `${score}/100`;
  }
  
  // Usage:
  const competitionScore = calculateScore(); // Might return NaN
  document.getElementById('score').textContent = displayScore(competitionScore);
  // Updated analyzeCompetition function in script.js
async function analyzeCompetition(businessType, city, locationCoords) {
    try {
        // 1. First get the city coordinates if not provided
        if (!locationCoords) {
            locationCoords = await geocodeCity(city);
        }

        // 2. Find competitors using GoMaps.Pro Places API
        const competitors = await findCompetitors(businessType, locationCoords);
        
        // 3. Analyze the areas
        const analysisResults = analyzeAreas(competitors, locationCoords);
        
        // 4. Prepare and return results
        return {
            businessType,
            city,
            results: analysisResults.map(area => ({
                name: `Area with ${area.competitors.length} competitors`,
                address: `${city} (${area.center.lat.toFixed(4)}, ${area.center.lng.toFixed(4)})`,
                rent: estimateRent(area.opportunityScore),
                size: "Various sizes available",
                competition: getCompetitionLevel(area.competitors.length),
                score: area.opportunityScore,
                lat: area.center.lat,
                lng: area.center.lng,
                competitorCount: area.competitors.length
            }))
        };
    } catch (error) {
        console.error("Analysis failed:", error);
        throw error;
    }
}

// Updated geocodeCity function to use real API
async function geocodeCity(city) {
    const response = await fetch(`https://maps.gomaps.pro/maps/api/geocode/json?address=${encodeURIComponent(city)}&key=${API_KEY}`);
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
        return data.results[0].geometry.location;
    }
    throw new Error("City not found");
}

// Updated findCompetitors function
async function findCompetitors(businessType, location) {
    const response = await fetch(`https://maps.gomaps.pro/maps/api/place/nearbysearch/json?location=${location.lat},${location.lng}&radius=1500&type=${businessType}&key=${API_KEY}`);
    const data = await response.json();
    
    if (data.results) {
        return data.results.map(place => ({
            id: place.place_id,
            name: place.name,
            location: place.geometry.location,
            vicinity: place.vicinity
        }));
    }
    return [];
}
// In your script.js or within the <script> tags of index.html

// Update the analyzeCompetition function to include proper location names
async function analyzeCompetition(businessType, city, locationCoords) {
    try {
        // 1. First get the city coordinates if not provided
        if (!locationCoords) {
            locationCoords = await geocodeCity(city);
        }

        // 2. Find competitors using GoMaps.Pro Places API
        const competitors = await findCompetitors(businessType, locationCoords);
        
        // 3. Analyze the areas
        const analysisResults = analyzeAreas(competitors, locationCoords);
        
        // 4. Prepare and return results with proper location names
        return {
            businessType,
            city,
            results: analysisResults.map(area => {
                // Get the most relevant competitor or center point as the location name
                const mainLocation = area.competitors.length > 0 
                    ? area.competitors[0] 
                    : { name: `${city} Commercial Area`, vicinity: `${city}` };
                
                return {
                    name: mainLocation.name,
                    address: mainLocation.vicinity || `${city} (${area.center.lat.toFixed(4)}, ${area.center.lng.toFixed(4)})`,
                    rent: estimateRent(area.opportunityScore),
                    size: "Various sizes available",
                    competition: getCompetitionLevel(area.competitors.length),
                    score: area.opportunityScore,
                    lat: area.center.lat,
                    lng: area.center.lng,
                    competitorCount: area.competitors.length
                };
            })
        };
    } catch (error) {
        console.error("Analysis failed:", error);
        throw error;
    }
}

// Update the findCompetitors function to get more detailed place information
async function findCompetitors(businessType, location) {
    const response = await fetch(`${PLACES_API}?location=${location.lat},${location.lng}&radius=1500&type=${businessType}&key=${API_KEY}`);
    const data = await response.json();
    
    if (data.results) {
        return data.results.map(place => ({
            id: place.place_id,
            name: place.name,
            vicinity: place.vicinity,
            location: place.geometry.location,
            types: place.types
        }));
    }
    return [];
}

// Update the analyzeAreas function to include proper location naming
function analyzeAreas(competitors, cityCenter) {
    const areas = [];
    const gridSize = 0.02; // Degrees (~2km in latitude)
    
    // Create a grid around the city center
    for (let latOffset = -0.04; latOffset <= 0.04; latOffset += gridSize) {
        for (let lngOffset = -0.04; lngOffset <= 0.04; lngOffset += gridSize) {
            const areaCenter = {
                lat: cityCenter.lat + latOffset,
                lng: cityCenter.lng + lngOffset,
                name: `Commercial Area (${Math.abs(latOffset*100).toFixed(1)}km ${latOffset > 0 ? 'North' : 'South'}, ${Math.abs(lngOffset*100).toFixed(1)}km ${lngOffset > 0 ? 'East' : 'West'})`
            };
            
            // Find competitors in this area
            const competitorsInArea = competitors.filter(comp => {
                return Math.abs(comp.location.lat - areaCenter.lat) < gridSize/2 &&
                       Math.abs(comp.location.lng - areaCenter.lng) < gridSize/2;
            });
            
            // Calculate density score (lower is better)
            const densityScore = Math.min(100, competitorsInArea.length * 10);
            const opportunityScore = 100 - densityScore;
            
            areas.push({
                center: areaCenter,
                competitorCount: competitorsInArea.length,
                densityScore,
                opportunityScore,
                competitors: competitorsInArea,
                areaName: areaCenter.name
            });
        }
    }
    
    // Sort by opportunity score (highest first)
    areas.sort((a, b) => b.opportunityScore - a.opportunityScore);
    
    // Return top 5 areas with least competition
    return areas.slice(0, 5);
}
async function analyzeCompetition(businessType, city, locationCoords) {
    try {
        // 1. Get city coordinates
        if (!locationCoords) {
            locationCoords = await geocodeCity(city);
        }

        // 2. Find competitors and nearby landmarks
        const competitors = await findCompetitors(businessType, locationCoords);
        const landmarks = await findLandmarks(locationCoords);
        
        // 3. Analyze areas with proper naming
        const analysisResults = analyzeAreas(competitors, landmarks, locationCoords);
        
        // 4. Prepare results with actual names
        return {
            businessType,
            city,
            results: analysisResults.map(area => {
                // Get the best available name
                let locationName = area.bestName;
                let address = area.bestAddress;
                
                // If no good name found, use a generic one
                if (!locationName || locationName.includes("Area with")) {
                    locationName = `${city} Commercial Zone`;
                    address = `${city} (near ${area.landmarks[0]?.name || 'city center'})`;
                }

                return {
                    name: locationName,
                    address: address,
                    rent: estimateRent(area.opportunityScore),
                    size: "Various sizes available",
                    competition: getCompetitionLevel(area.competitors.length),
                    score: area.opportunityScore,
                    lat: area.center.lat,
                    lng: area.center.lng,
                    competitorCount: area.competitors.length,
                    landmarks: area.landmarks.map(l => l.name)
                };
            })
        };
    } catch (error) {
        console.error("Analysis failed:", error);
        throw error;
    }
}

// New function to find landmarks
async function findLandmarks(location) {
    const response = await fetch(`${PLACES_API}?location=${location.lat},${location.lng}&radius=1500&type=landmark|point_of_interest&key=${API_KEY}`);
    const data = await response.json();
    return data.results?.map(place => ({
        name: place.name,
        vicinity: place.vicinity,
        location: place.geometry.location
    })) || [];
}

// Updated analyzeAreas function
function analyzeAreas(competitors, landmarks, cityCenter) {
    const areas = [];
    const gridSize = 0.02; // ~2km
    
    // Create analysis grid
    for (let latOffset = -0.04; latOffset <= 0.04; latOffset += gridSize) {
        for (let lngOffset = -0.04; lngOffset <= 0.04; lngOffset += gridSize) {
            const areaCenter = {
                lat: cityCenter.lat + latOffset,
                lng: cityCenter.lng + lngOffset
            };
            
            // Find competitors and landmarks in this area
            const competitorsInArea = competitors.filter(comp => 
                isInArea(comp.location, areaCenter, gridSize/2));
                
            const landmarksInArea = landmarks.filter(landmark => 
                isInArea(landmark.location, areaCenter, gridSize/2));
            
            // Determine the best name for this area
            const { bestName, bestAddress } = getBestAreaName(competitorsInArea, landmarksInArea, cityCenter);
            
            // Calculate scores
            const densityScore = Math.min(100, competitorsInArea.length * 10);
            const opportunityScore = 100 - densityScore;
            
            areas.push({
                center: areaCenter,
                competitors: competitorsInArea,
                landmarks: landmarksInArea,
                bestName,
                bestAddress,
                competitorCount: competitorsInArea.length,
                opportunityScore
            });
        }
    }
    
    return areas.sort((a, b) => b.opportunityScore - a.opportunityScore).slice(0, 5);
}

// Helper function to determine the best area name
function getBestAreaName(competitors, landmarks, cityCenter) {
    // Prefer named landmarks first
    if (landmarks.length > 0) {
        return {
            bestName: landmarks[0].name,
            bestAddress: landmarks[0].vicinity
        };
    }
    
    // Then use competitor names if available
    if (competitors.length > 0) {
        return {
            bestName: competitors[0].name,
            bestAddress: competitors[0].vicinity
        };
    }
    
    // Fallback to directional naming
    const latDist = (cityCenter.lat - areaCenter.lat) * 111; // km
    const lngDist = (cityCenter.lng - areaCenter.lng) * 111; // km
    const direction = `${latDist > 0 ? 'North' : 'South'} ${lngDist > 0 ? 'East' : 'West'}`;
    
    return {
        bestName: `Commercial Area (${direction})`,
        bestAddress: `${Math.abs(latDist).toFixed(1)}km ${latDist > 0 ? 'north' : 'south'}, ${Math.abs(lngDist).toFixed(1)}km ${lngDist > 0 ? 'east' : 'west'} of center`
    };
}

function isInArea(point, center, radius) {
    return Math.abs(point.lat - center.lat) < radius && 
           Math.abs(point.lng - center.lng) < radius;
}