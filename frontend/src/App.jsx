import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css';

// Comprehensive Indian cities coordinates with states
const CITY_COORDINATES = {
  // Delhi NCR
  'Delhi': [28.6139, 77.2090],
  'Gurugram': [28.4595, 77.0266],
  'Noida': [28.5355, 77.3910],
  'Faridabad': [28.4089, 77.3178],
  'Ghaziabad': [28.6692, 77.4538],
  
  // Maharashtra
  'Mumbai': [19.0760, 72.8777],
  'Pune': [18.5204, 73.8567],
  'Nagpur': [21.1458, 79.0882],
  'Thane': [19.2183, 72.9781],
  'Nashik': [20.0059, 73.7910],
  
  // Karnataka
  'Bangalore': [12.9716, 77.5946],
  'Mysore': [12.2958, 76.6394],
  'Hubli': [15.3647, 75.1240],
  'Mangalore': [12.9141, 74.8560],
  
  // Tamil Nadu
  'Chennai': [13.0827, 80.2707],
  'Coimbatore': [11.0168, 76.9558],
  'Madurai': [9.9252, 78.1198],
  'Salem': [11.6643, 78.1460],
  
  // West Bengal
  'Kolkata': [22.5726, 88.3639],
  'Howrah': [22.5958, 88.2636],
  'Durgapur': [23.5204, 87.3119],
  
  // Telangana
  'Hyderabad': [17.3850, 78.4867],
  'Warangal': [17.9784, 79.6002],
  
  // Gujarat
  'Ahmedabad': [23.0225, 72.5714],
  'Surat': [21.1702, 72.8311],
  'Vadodara': [22.3072, 73.1812],
  'Rajkot': [22.3039, 70.8022],
  
  // Rajasthan
  'Jaipur': [26.9124, 75.7873],
  'Jodhpur': [26.2389, 73.0243],
  'Udaipur': [24.5854, 73.7125],
  'Kota': [25.2138, 75.8648],
  
  // Uttar Pradesh
  'Lucknow': [26.8467, 80.9462],
  'Kanpur': [26.4499, 80.3319],
  'Varanasi': [25.3176, 82.9739],
  'Agra': [27.1767, 78.0081],
  
  // Madhya Pradesh
  'Bhopal': [23.2599, 77.4126],
  'Indore': [22.7196, 75.8577],
  'Gwalior': [26.2183, 78.1828],
  
  // Punjab
  'Chandigarh': [30.7333, 76.7794],
  'Ludhiana': [30.9010, 75.8573],
  'Amritsar': [31.6340, 74.8723],
  
  // Bihar
  'Patna': [25.5941, 85.1376],
  'Gaya': [24.7955, 84.9994],
  
  // Kerala
  'Kochi': [9.9312, 76.2673],
  'Thiruvananthapuram': [8.5241, 76.9366],
  'Kozhikode': [11.2588, 75.7804]
};

// State-wise city grouping
const STATE_CITIES = {
  'Delhi NCR': ['Delhi', 'Gurugram', 'Noida', 'Faridabad', 'Ghaziabad'],
  'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Thane', 'Nashik'],
  'Karnataka': ['Bangalore', 'Mysore', 'Hubli', 'Mangalore'],
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Salem'],
  'West Bengal': ['Kolkata', 'Howrah', 'Durgapur'],
  'Telangana': ['Hyderabad', 'Warangal'],
  'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot'],
  'Rajasthan': ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota'],
  'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Varanasi', 'Agra'],
  'Madhya Pradesh': ['Bhopal', 'Indore', 'Gwalior'],
  'Punjab': ['Chandigarh', 'Ludhiana', 'Amritsar'],
  'Bihar': ['Patna', 'Gaya'],
  'Kerala': ['Kochi', 'Thiruvananthapuram', 'Kozhikode']
};

// Custom icons for different AQI levels
const createCustomIcon = (aqi) => {
  const { color } = getAQICategory(aqi);
  const size = 28 + (aqi / 500) * 24; // Size increases with AQI
  
  return new Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="${size}" height="${size}">
        <circle cx="16" cy="16" r="14" fill="${color}" stroke="#fff" stroke-width="2"/>
        <text x="16" y="20" text-anchor="middle" fill="#fff" font-size="10" font-weight="bold">${Math.round(aqi)}</text>
      </svg>
    `)}`,
    iconSize: [size, size],
    iconAnchor: [size/2, size/2],
    popupAnchor: [0, -size/2]
  });
};

// AQI calculation function
const calculateAQI = (data) => {
  const aqi = (
    0.4 * data.PM2_5 +
    0.3 * data.PM10 +
    0.1 * data.NO2 +
    0.08 * data.CO * 1000 +
    0.08 * data.SO2 +
    0.02 * (100 - data.humidity) +
    0.02 * Math.max(0, data.temperature - 25)
  );
  return Math.min(Math.max(Math.round(aqi), 0), 500);
};

// Get AQI category and color
const getAQICategory = (aqi) => {
  if (aqi <= 50) return { category: 'Good', color: '#00E400', description: 'Air quality is satisfactory' };
  if (aqi <= 100) return { category: 'Moderate', color: '#FFFF00', description: 'Air quality is acceptable' };
  if (aqi <= 150) return { category: 'Unhealthy for Sensitive Groups', color: '#FF7E00', description: 'Members of sensitive groups may experience health effects' };
  if (aqi <= 200) return { category: 'Unhealthy', color: '#FF0000', description: 'Everyone may begin to experience health effects' };
  if (aqi <= 300) return { category: 'Very Unhealthy', color: '#8F3F97', description: 'Health alert: everyone may experience more serious health effects' };
  return { category: 'Hazardous', color: '#7E0023', description: 'Health warning of emergency conditions' };
};

// Generate random nearby coordinates
const generateNearbyCoordinates = (baseLat, baseLng, count) => {
  const coordinates = [];
  for (let i = 0; i < count; i++) {
    const lat = baseLat + (Math.random() - 0.5) * 0.2;
    const lng = baseLng + (Math.random() - 0.5) * 0.2;
    coordinates.push([lat, lng]);
  }
  return coordinates;
};

function App() {
  const [formData, setFormData] = useState({
    city: 'Delhi',
    temperature: 25,
    humidity: 60,
    PM2_5: 35,
    PM10: 60,
    CO: 1.0,
    NO2: 20,
    SO2: 15
  });
  
  const [syntheticData, setSyntheticData] = useState([]);
  const [markers, setMarkers] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [aqiDistribution, setAqiDistribution] = useState([]);
  const [selectedState, setSelectedState] = useState('Delhi NCR');
  const [selectedCity, setSelectedCity] = useState('Delhi');
  const [pollutionRankings, setPollutionRankings] = useState({ mostPolluted: [], cleanest: [] });

  useEffect(() => {
    generateSyntheticData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: parseFloat(value) || value
    }));
  };

  const handleStateChange = (e) => {
    const state = e.target.value;
    setSelectedState(state);
    const firstCity = STATE_CITIES[state][0];
    setSelectedCity(firstCity);
    setFormData(prev => ({ ...prev, city: firstCity }));
  };

  const handleCityChange = (e) => {
    const city = e.target.value;
    setSelectedCity(city);
    setFormData(prev => ({ ...prev, city }));
  };

  const generateSyntheticData = () => {
    const baseCoords = CITY_COORDINATES[selectedCity];
    if (!baseCoords) return;

    const numLocations = 15;
    const nearbyCoords = generateNearbyCoordinates(baseCoords[0], baseCoords[1], numLocations);
    
    const newData = nearbyCoords.map((coords, index) => {
      const locationData = {
        id: index + 1,
        locationName: `${selectedCity} Area ${String.fromCharCode(65 + index)}`, // A, B, C, etc.
        latitude: coords[0],
        longitude: coords[1],
        temperature: formData.temperature + (Math.random() - 0.5) * 8,
        humidity: Math.max(20, Math.min(95, formData.humidity + (Math.random() - 0.5) * 15)),
        PM2_5: Math.max(5, formData.PM2_5 + (Math.random() - 0.5) * 25),
        PM10: Math.max(10, formData.PM10 + (Math.random() - 0.5) * 40),
        CO: Math.max(0.1, formData.CO + (Math.random() - 0.5) * 0.4),
        NO2: Math.max(5, formData.NO2 + (Math.random() - 0.5) * 12),
        SO2: Math.max(2, formData.SO2 + (Math.random() - 0.5) * 8)
      };
      
      const aqi = calculateAQI(locationData);
      const { category, color, description } = getAQICategory(aqi);
      
      return {
        ...locationData,
        aqi,
        category,
        color,
        description
      };
    });

    setSyntheticData(newData);
    updateVisualizations(newData);
    generatePollutionRankings(newData);
  };

  const updateVisualizations = (data) => {
    const newMarkers = data.map(item => ({
      position: [item.latitude, item.longitude],
      data: item
    }));
    setMarkers(newMarkers);

    const chartData = data.map(item => ({
      name: item.locationName,
      AQI: item.aqi,
      PM2_5: item.PM2_5,
      PM10: item.PM10,
      category: item.category,
      color: item.color
    }));
    setChartData(chartData);

    const distribution = Object.entries(
      data.reduce((acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + 1;
        return acc;
      }, {})
    ).map(([name, value]) => ({ name, value }));
    
    setAqiDistribution(distribution);
  };

  const generatePollutionRankings = () => {
    // Generate rankings for all major cities
    const allCityData = Object.keys(CITY_COORDINATES).map(city => {
      const baseData = {
        temperature: 25 + (Math.random() - 0.5) * 10,
        humidity: 60 + (Math.random() - 0.5) * 20,
        PM2_5: 35 + (Math.random() * 100), // Wider range for variation
        PM10: 60 + (Math.random() * 150),
        CO: 1.0 + (Math.random() * 2),
        NO2: 20 + (Math.random() * 50),
        SO2: 15 + (Math.random() * 30)
      };
      
      const aqi = calculateAQI({ ...baseData, city });
      const { category, color } = getAQICategory(aqi);
      
      return {
        city,
        aqi,
        category,
        color,
        state: Object.entries(STATE_CITIES).find(([, cities]) => cities.includes(city))?.[0] || 'Unknown'
      };
    });

    // Sort by AQI (descending for most polluted, ascending for cleanest)
    const sortedByAQI = [...allCityData].sort((a, b) => b.aqi - a.aqi);
    
    setPollutionRankings({
      mostPolluted: sortedByAQI.slice(0, 10), // Top 10 most polluted
      cleanest: sortedByAQI.reverse().slice(0, 10) // Top 10 cleanest
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    generateSyntheticData();
  };

  const handleReset = () => {
    setSyntheticData([]);
    setMarkers([]);
    setChartData([]);
    setAqiDistribution([]);
  };

  const downloadCSV = () => {
    const headers = ['Location Name', 'Latitude', 'Longitude', 'Temperature (°C)', 'Humidity (%)', 'PM2.5 (μg/m³)', 'PM10 (μg/m³)', 'CO (ppm)', 'NO₂ (ppb)', 'SO₂ (ppb)', 'AQI', 'Category'];
    const csvContent = [
      headers.join(','),
      ...syntheticData.map(item => [
        item.locationName,
        item.latitude.toFixed(6),
        item.longitude.toFixed(6),
        item.temperature.toFixed(1),
        item.humidity.toFixed(1),
        item.PM2_5.toFixed(1),
        item.PM10.toFixed(1),
        item.CO.toFixed(2),
        item.NO2.toFixed(1),
        item.SO2.toFixed(1),
        item.aqi,
        item.category
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aqi_data_${selectedCity}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const calculateManualAQI = () => {
    return calculateAQI(formData);
  };

  const COLORS = ['#00E400', '#FFFF00', '#FF7E00', '#FF0000', '#8F3F97', '#7E0023'];

  const manualAQI = calculateManualAQI();
  const manualAQICategory = getAQICategory(manualAQI);

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1>🌍 India Air Quality Index (AQI) Dashboard</h1>
          <p>Comprehensive Air Quality Monitoring Across Indian States & Cities</p>
        </div>
      </header>

      <div className="app-body">
        <div className="control-panel">
          <div className="panel-card">
            <h2>📍 Select State & City</h2>
            
            <div className="form-group">
              <label className="form-label">Select State:</label>
              <select 
                value={selectedState} 
                onChange={handleStateChange}
                className="form-select"
              >
                {Object.keys(STATE_CITIES).map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Select City:</label>
              <select 
                value={selectedCity} 
                onChange={handleCityChange}
                className="form-select"
              >
                {STATE_CITIES[selectedState]?.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            <h3 style={{marginTop: '1.5rem', marginBottom: '1rem'}}>⚙️ Air Quality Parameters</h3>
            
            <form onSubmit={handleSubmit} className="aqi-form">
              <div className="parameters-grid">
                {[
                  { name: 'temperature', label: 'Temperature (°C)', min: -10, max: 50, step: 0.1 },
                  { name: 'humidity', label: 'Humidity (%)', min: 0, max: 100, step: 0.1 },
                  { name: 'PM2_5', label: 'PM2.5 (μg/m³)', min: 0, max: 500, step: 0.1 },
                  { name: 'PM10', label: 'PM10 (μg/m³)', min: 0, max: 600, step: 0.1 },
                  { name: 'CO', label: 'CO (ppm)', min: 0, max: 10, step: 0.01 },
                  { name: 'NO2', label: 'NO₂ (ppb)', min: 0, max: 200, step: 0.1 },
                  { name: 'SO2', label: 'SO₂ (ppb)', min: 0, max: 200, step: 0.1 }
                ].map(field => (
                  <div key={field.name} className="form-group">
                    <label className="form-label">{field.label}</label>
                    <input
                      type="number"
                      name={field.name}
                      value={formData[field.name]}
                      onChange={handleInputChange}
                      min={field.min}
                      max={field.max}
                      step={field.step}
                      className="form-input"
                      required
                    />
                  </div>
                ))}
              </div>

              <div className="manual-aqi-display">
                <div className="aqi-badge" style={{ backgroundColor: manualAQICategory.color }}>
                  <span className="aqi-label">Current AQI</span>
                  <span className="aqi-value">{manualAQI}</span>
                  <span className="aqi-category">{manualAQICategory.category}</span>
                </div>
                <p className="aqi-description">{manualAQICategory.description}</p>
              </div>

              <div className="button-group">
                <button type="submit" className="btn btn-primary">
                  🚀 Generate AQI Data
                </button>
                <button type="button" onClick={handleReset} className="btn btn-secondary">
                  🔄 Reset Map
                </button>
                {syntheticData.length > 0 && (
                  <button type="button" onClick={downloadCSV} className="btn btn-success">
                    📥 Download CSV
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="panel-card">
            <h3>📊 AQI Color Legend</h3>
            <div className="legend">
              {[
                { range: '0-50', label: 'Good', color: '#00E400' },
                { range: '51-100', label: 'Moderate', color: '#FFFF00' },
                { range: '101-150', label: 'Unhealthy for Sensitive', color: '#FF7E00' },
                { range: '151-200', label: 'Unhealthy', color: '#FF0000' },
                { range: '201-300', label: 'Very Unhealthy', color: '#8F3F97' },
                { range: '301-500', label: 'Hazardous', color: '#7E0023' }
              ].map(item => (
                <div key={item.range} className="legend-item">
                  <span className="color-dot" style={{backgroundColor: item.color}}></span>
                  <div className="legend-text">
                    <strong>{item.label}</strong>
                    <span>{item.range}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="main-content">
          <div className="map-section">
            <div className="section-header">
              <div>
                <h2>🗺️ Live AQI Map - {selectedCity}, {selectedState}</h2>
                <p className="section-subtitle">Monitoring {markers.length} locations across the city</p>
              </div>
              <div className="map-stats">
                <div className="stat">
                  <span className="stat-label">Total Locations</span>
                  <span className="stat-value">{markers.length}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Average AQI</span>
                  <span className="stat-value">
                    {syntheticData.length > 0 ? Math.round(syntheticData.reduce((sum, item) => sum + item.aqi, 0) / syntheticData.length) : 0}
                  </span>
                </div>
                <div className="stat">
                  <span className="stat-label">Status</span>
                  <span className="stat-value">{manualAQICategory.category}</span>
                </div>
              </div>
            </div>
            <div className="map-container">
              <MapContainer 
                center={CITY_COORDINATES[selectedCity] || [20.5937, 78.9629]} 
                zoom={11} 
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                
                {markers.map((marker, index) => (
                  <Marker 
                    key={index} 
                    position={marker.position}
                    icon={createCustomIcon(marker.data.aqi)}
                  >
                    <Popup className="custom-popup">
                      <div className="popup-content">
                        <h3>{marker.data.locationName}</h3>
                        <div className="aqi-display" style={{ borderColor: marker.data.color }}>
                          <span className="aqi-value">{marker.data.aqi}</span>
                          <span className="aqi-category">{marker.data.category}</span>
                        </div>
                        <div className="popup-grid">
                          <div className="param">
                            <label>🌡️ Temperature</label>
                            <span>{marker.data.temperature.toFixed(1)}°C</span>
                          </div>
                          <div className="param">
                            <label>💧 Humidity</label>
                            <span>{marker.data.humidity.toFixed(1)}%</span>
                          </div>
                          <div className="param">
                            <label>🌫️ PM2.5</label>
                            <span>{marker.data.PM2_5.toFixed(1)} μg/m³</span>
                          </div>
                          <div className="param">
                            <label>🏭 PM10</label>
                            <span>{marker.data.PM10.toFixed(1)} μg/m³</span>
                          </div>
                          <div className="param">
                            <label>🚗 CO</label>
                            <span>{marker.data.CO.toFixed(2)} ppm</span>
                          </div>
                          <div className="param">
                            <label>🏭 NO₂</label>
                            <span>{marker.data.NO2.toFixed(1)} ppb</span>
                          </div>
                          <div className="param">
                            <label>🏭 SO₂</label>
                            <span>{marker.data.SO2.toFixed(1)} ppb</span>
                          </div>
                        </div>
                        <p className="popup-description">{marker.data.description}</p>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </div>

          {syntheticData.length > 0 && (
            <div className="analytics-section">
              <div className="analytics-header">
                <h2>📈 Air Quality Analytics</h2>
              </div>
              
              <div className="analytics-grid">
                <div className="chart-card wide-card">
                  <h3>📍 AQI Distribution Across {selectedCity}</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="AQI" fill="#8884d8" name="AQI Value" />
                      <Bar dataKey="PM2_5" fill="#82ca9d" name="PM2.5 (μg/m³)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="chart-card">
                  <h3>📊 Air Quality Categories</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={aqiDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {aqiDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Pollution Rankings */}
                <div className="ranking-card">
                  <h3>🔴 Top 10 Most Polluted Cities in India</h3>
                  <div className="ranking-list">
                    {pollutionRankings.mostPolluted.map((city, index) => (
                      <div key={city.city} className="ranking-item">
                        <div className="rank-number">#{index + 1}</div>
                        <div className="city-info">
                          <span className="city-name">{city.city}</span>
                          <span className="city-state">{city.state}</span>
                        </div>
                        <div className="aqi-display-small" style={{ backgroundColor: city.color }}>
                          {city.aqi}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="ranking-card">
                  <h3>🟢 Top 10 Cleanest Cities in India</h3>
                  <div className="ranking-list">
                    {pollutionRankings.cleanest.map((city, index) => (
                      <div key={city.city} className="ranking-item">
                        <div className="rank-number">#{index + 1}</div>
                        <div className="city-info">
                          <span className="city-name">{city.city}</span>
                          <span className="city-state">{city.state}</span>
                        </div>
                        <div className="aqi-display-small" style={{ backgroundColor: city.color }}>
                          {city.aqi}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Data Table */}
              <div className="data-section">
                <h3>📋 Detailed AQI Data for {selectedCity}</h3>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Location</th>
                        <th>AQI</th>
                        <th>Category</th>
                        <th>PM2.5</th>
                        <th>PM10</th>
                        <th>Temperature</th>
                        <th>Humidity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {syntheticData.map(item => (
                        <tr key={item.id}>
                          <td>
                            <div className="location-cell">
                              <span className="location-name">{item.locationName}</span>
                            </div>
                          </td>
                          <td>
                            <span className="aqi-badge-small" style={{ backgroundColor: item.color }}>
                              {item.aqi}
                            </span>
                          </td>
                          <td>{item.category}</td>
                          <td>{item.PM2_5.toFixed(1)} μg/m³</td>
                          <td>{item.PM10.toFixed(1)} μg/m³</td>
                          <td>{item.temperature.toFixed(1)}°C</td>
                          <td>{item.humidity.toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;