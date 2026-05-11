#!/usr/bin/env python3
"""
Arduino to Web Server Bridge
Reads serial data from Arduino and sends it to the web server
"""

import serial
import json
import time
import requests
import sys
from datetime import datetime

# Configuration
ARDUINO_PORT = 'COM3'  # Arduino Uno detected on COM3
BAUD_RATE = 9600
SERVER_URL = 'http://localhost:5000/api/incidents'
SECRET_KEY = 'arduino_secret_key_12345'
LOCATION_ID = 1

# Initialize serial connection
try:
    arduino = serial.Serial(ARDUINO_PORT, BAUD_RATE, timeout=1)
    print(f"✅ Connected to Arduino on {ARDUINO_PORT}")
except serial.SerialException as e:
    print(f"❌ Error connecting to Arduino: {e}")
    print("Please check:")
    print(f"- Arduino is connected to {ARDUINO_PORT}")
    print("- Arduino is powered on")
    print("- No other program is using the port")
    sys.exit(1)

def send_to_server(flame_detected, sensor_value):
    """Send data to web server"""
    data = {
        'flame_detected': flame_detected,
        'sensor_value': sensor_value,
        'temperature': 25.0 + (sensor_value % 10),  # Simulate temperature
        'humidity': 60.0 + (sensor_value % 20),     # Simulate humidity
        'location_id': LOCATION_ID,
        'secret_key': SECRET_KEY
    }
    
    try:
        response = requests.post(SERVER_URL, json=data, timeout=5)
        if response.status_code == 200:
            print(f"✅ Data sent to server: {data}")
            return True
        else:
            print(f"❌ Server error: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Connection error: {e}")
        return False

def parse_arduino_data(line):
    """Parse Arduino serial output"""
    line = line.strip()
    
    if line == "ALERT_FIRE":
        return True, 0  # Fire detected
    elif line == "SAFE":
        return False, 1023  # Safe (high sensor value)
    else:
        # Try to parse as number (for analog sensors)
        try:
            value = int(line)
            flame_detected = value < 400  # Low value = flame detected
            return flame_detected, value
        except ValueError:
            return None, None

def main():
    print("🔥 Arduino Bridge Started")
    print("Monitoring Arduino serial data...")
    print("Press Ctrl+C to stop")
    print("-" * 50)
    
    last_state = None
    last_send_time = 0
    send_interval = 5  # Send data every 5 seconds max
    
    try:
        while True:
            if arduino.in_waiting > 0:
                line = arduino.readline().decode('utf-8').strip()
                
                if line:
                    print(f"📨 Arduino: {line}")
                    
                    flame_detected, sensor_value = parse_arduino_data(line)
                    
                    if flame_detected is not None:
                        current_time = time.time()
                        
                        # Send if state changed or enough time passed
                        if (flame_detected != last_state or 
                            current_time - last_send_time > send_interval):
                            
                            success = send_to_server(flame_detected, sensor_value)
                            if success:
                                last_state = flame_detected
                                last_send_time = current_time
            
            time.sleep(0.1)  # Small delay to prevent CPU overload
            
    except KeyboardInterrupt:
        print("\n👋 Bridge stopped by user")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
    finally:
        arduino.close()
        print("🔌 Serial connection closed")

if __name__ == "__main__":
    main()
