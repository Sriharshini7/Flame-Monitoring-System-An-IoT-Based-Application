import serial
import time
import sys

print("🔍 Waiting for Arduino port to become available...")
print("Please close Arduino IDE and any Serial Monitor windows")
print("Press Ctrl+C to cancel\n")

port = 'COM3'
baud_rate = 9600

while True:
    try:
        print(f"Trying to connect to {port}...")
        arduino = serial.Serial(port, baud_rate, timeout=2)
        print(f"✅ Connected to Arduino on {port}!")
        
        # Test connection
        print("Testing connection...")
        time.sleep(2)
        
        if arduino.in_waiting > 0:
            data = arduino.readline().decode('utf-8').strip()
            print(f"📨 Received from Arduino: {data}")
        
        print("\n🎉 Connection successful! You can now run the main bridge.")
        arduino.close()
        break
        
    except serial.SerialException as e:
        print(f"❌ Port busy: {e}")
        print("Waiting 3 seconds...")
        time.sleep(3)
    except KeyboardInterrupt:
        print("\n👋 Cancelled by user")
        sys.exit(0)
