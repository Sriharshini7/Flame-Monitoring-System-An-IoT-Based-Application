import serial
import serial.tools.list_ports

print("Scanning for Arduino ports...")
ports = serial.tools.list_ports.comports()

for port in ports:
    print(f"Found: {port.device} - {port.description}")
    
    if "Arduino" in port.description:
        print(f"Trying to connect to {port.device}...")
        try:
            ser = serial.Serial(port.device, 9600, timeout=2)
            print(f"✅ Successfully connected to {port.device}")
            ser.close()
            break
        except Exception as e:
            print(f"❌ Error connecting to {port.device}: {e}")
            print("Please:")
            print("1. Close Arduino IDE")
            print("2. Close any Serial Monitor")
            print("3. Unplug and replug Arduino")
            print("4. Try again")
