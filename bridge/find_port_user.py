import subprocess
import re

def find_process_using_port():
    """Find which process is using COM3"""
    try:
        # Use Windows command to find processes using COM ports
        result = subprocess.run(['wmic', 'path', 'win32_serialport', 'get', 'DeviceID,PnPDeviceID'], 
                              capture_output=True, text=True)
        
        print("Checking COM port usage...")
        print(result.stdout)
        
        # Try to find what's using the port
        result2 = subprocess.run(['powershell', '-Command', 
                                 "Get-WmiObject Win32_SerialPort | Select-Object DeviceID, Status"], 
                                capture_output=True, text=True)
        print("\nPort status:")
        print(result2.stdout)
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    find_process_using_port()
