from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import pickle
import numpy as np

app = Flask(__name__)
CORS(app)

# Load the model and scaler
with open('model.pkl', 'rb') as f:
    model = pickle.load(f)

with open('scaler.pkl', 'rb') as f:
    scaler = pickle.load(f)

# Indian cities coordinates
CITY_COORDINATES = {
    'Delhi': [28.6139, 77.2090],
    'Mumbai': [19.0760, 72.8777],
    'Chennai': [13.0827, 80.2707],
    'Bangalore': [12.9716, 77.5946],
    'Kolkata': [22.5726, 88.3639],
    'Hyderabad': [17.3850, 78.4867],
    'Ahmedabad': [23.0225, 72.5714],
    'Pune': [18.5204, 73.8567],
    'Jaipur': [26.9124, 75.7873],
    'Lucknow': [26.8467, 80.9462]
}

feature_columns = ['PM2.5', 'PM10', 'NO', 'NO2', 'NOx', 'NH3', 'CO', 'SO2', 'O3', 'Benzene', 'Toluene', 'Xylene']

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.json
        
        user_input = pd.DataFrame({
            'PM2.5': [data.get('PM2_5', 0)],
            'PM10': [data.get('PM10', 0)],
            'NO': [data.get('NO', 0)],
            'NO2': [data.get('NO2', 0)],
            'NOx': [data.get('NOx', 0)],
            'NH3': [data.get('NH3', 0)],
            'CO': [data.get('CO', 0)],
            'SO2': [data.get('SO2', 0)],
            'O3': [data.get('O3', 0)],
            'Benzene': [data.get('Benzene', 0)],
            'Toluene': [data.get('Toluene', 0)],
            'Xylene': [data.get('Xylene', 0)]
        })
        
        user_input_scaled = scaler.transform(user_input)
        prediction = model.predict(user_input_scaled)
        
        aqi = float(prediction[0][0])
        category, color = get_aqi_category(aqi)
        
        return jsonify({
            'aqi': round(aqi, 2),
            'category': category,
            'color': color,
            'city': data.get('city', 'Unknown')
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 400

def get_aqi_category(aqi):
    if aqi <= 50:
        return 'Good', '#00E400'
    elif aqi <= 100:
        return 'Moderate', '#FFFF00'
    elif aqi <= 150:
        return 'Unhealthy for Sensitive Groups', '#FF7E00'
    elif aqi <= 200:
        return 'Unhealthy', '#FF0000'
    elif aqi <= 300:
        return 'Very Unhealthy', '#8F3F97'
    else:
        return 'Hazardous', '#7E0023'

@app.route('/cities', methods=['GET'])
def get_cities():
    return jsonify(list(CITY_COORDINATES.keys()))

@app.route('/city-coordinates', methods=['GET'])
def get_city_coordinates():
    return jsonify(CITY_COORDINATES)

if __name__ == '__main__':
    app.run(debug=True, port=5000)