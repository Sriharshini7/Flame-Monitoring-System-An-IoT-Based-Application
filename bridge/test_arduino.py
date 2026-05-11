import serial
import time

print("🔍 Testing Arduino Serial Communication...")
print("Make sure Arduino is powered on and connected to COM3")

try:
    arduino = serial.Serial('COM3', 9600, timeout=5)
    print("✅ Connected to Arduino on COM3")
    print("📡 Listening for Arduino data...")
    
    for i in range(10):
        if arduino.in_waiting > 0:
            data = arduino.readline().decode('utf-8').strip()
            print(f"📨 Received: {data}")
        else:
            print(f"⏳ Waiting for data... ({i+1}/10)")
        time.sleep(1)
    
    arduino.close()
    print("🔌 Connection closed")
    
except Exception as e:
    print(f"❌ Error: {e}")
    print("Please check:")
    print("- Arduino is powered on")
    print("- USB cable is connected")
    print("- Arduino is not being used by another program")
