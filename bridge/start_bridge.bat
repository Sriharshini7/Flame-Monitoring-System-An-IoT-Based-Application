@echo off
echo Starting Arduino Bridge...

echo.
echo Installing Python dependencies...
pip install -r requirements.txt

echo.
echo Starting bridge...
echo Make sure Arduino is connected and running the flame_sensor_serial.ino sketch
echo.
python arduino_bridge.py

echo.
echo Bridge stopped. Press any key to exit...
pause >nul
