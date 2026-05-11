import React, { useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import moment from 'moment';
import './Dashboard.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const Dashboard = () => {
  const [incidents, setIncidents] = useState([]);
  const [activeIncidents, setActiveIncidents] = useState([]);
  const [stats, setStats] = useState({});
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentFlameStatus, setCurrentFlameStatus] = useState('SAFE');
  const [lastArduinoData, setLastArduinoData] = useState(null);

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io(process.env.REACT_APP_SERVER_URL || 'http://localhost:5000');
    setSocket(newSocket);

    // Listen for real-time updates
    newSocket.on('connect', () => {
      console.log('Connected to server via Socket.IO');
    });
    
    newSocket.on('newIncident', (incident) => {
      console.log('New incident received:', incident);
      setIncidents(prev => [incident, ...prev]);
      if (incident.flame_detected && !incident.resolved) {
        setActiveIncidents(prev => [incident, ...prev]);
      }
      // Update current flame status
      setCurrentFlameStatus(incident.flame_detected ? 'ALERT_FIRE' : 'SAFE');
      setLastArduinoData(incident);
      fetchStats(); // Refresh stats
    });
    
    newSocket.on('flameStatus', (data) => {
      console.log('Flame status update:', data);
      setCurrentFlameStatus(data.flame_detected ? 'ALERT_FIRE' : 'SAFE');
      setLastArduinoData(data);
    });
    
    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    // Fetch initial data
    fetchIncidents();
    fetchActiveIncidents();
    fetchStats();

    return () => newSocket.close();
  }, []);

  const fetchIncidents = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/incidents');
      setIncidents(response.data);
    } catch (error) {
      console.error('Error fetching incidents:', error);
    }
  };

  const fetchActiveIncidents = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/incidents/active');
      setActiveIncidents(response.data);
    } catch (error) {
      console.error('Error fetching active incidents:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/stats');
      setStats(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setLoading(false);
    }
  };

  const resolveIncident = async (id, notes) => {
    try {
      await axios.put(`http://localhost:5000/api/incidents/${id}/resolve`, { notes });
      // Refresh data
      fetchIncidents();
      fetchActiveIncidents();
      fetchStats();
    } catch (error) {
      console.error('Error resolving incident:', error);
    }
  };

  // Prepare chart data
  const chartData = {
    labels: incidents.slice(0, 20).reverse().map(incident => 
      moment(incident.timestamp).format('HH:mm')
    ),
    datasets: [
      {
        label: 'Sensor Value',
        data: incidents.slice(0, 20).reverse().map(incident => incident.sensor_value),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1,
      },
      {
        label: 'Temperature (°C)',
        data: incidents.slice(0, 20).reverse().map(incident => incident.temperature),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        tension: 0.1,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Real-time Sensor Data',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <h1>🔥 Flame Monitoring System</h1>
        <div className="live-indicator">
          <span className="live-dot"></span>
          Live Monitoring
        </div>
      </header>

      {/* Live Flame Status */}
      <div className={`flame-status-card ${currentFlameStatus === 'ALERT_FIRE' ? 'alert' : 'safe'}`}>
        <div className="flame-status-content">
          <div className="flame-status-icon">
            {currentFlameStatus === 'ALERT_FIRE' ? '🔥' : '✅'}
          </div>
          <div className="flame-status-text">
            <h3>Current Status: {currentFlameStatus === 'ALERT_FIRE' ? 'FIRE DETECTED!' : 'SAFE'}</h3>
            <p>{currentFlameStatus === 'ALERT_FIRE' ? 'Fire detected by Arduino sensor!' : 'No fire detected - monitoring normally'}</p>
            {lastArduinoData && (
              <div className="arduino-data">
                <small>
                  Last reading: {lastArduinoData.sensor_value} | 
                  Temp: {lastArduinoData.temperature}°C | 
                  Humidity: {lastArduinoData.humidity}% |
                  {moment(lastArduinoData.timestamp).fromNow()}
                </small>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>{stats.total || 0}</h3>
            <p>Total Incidents</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🔥</div>
          <div className="stat-content">
            <h3>{stats.active || 0}</h3>
            <p>Active Fires</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <h3>{stats.today || 0}</h3>
            <p>Today's Incidents</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📍</div>
          <div className="stat-content">
            <h3>{stats.locations || 0}</h3>
            <p>Active Locations</p>
          </div>
        </div>
      </div>

      {/* Active Alerts */}
      {activeIncidents.length > 0 && (
        <div className="active-alerts">
          <h2>🚨 Active Fire Alerts</h2>
          <div className="alerts-grid">
            {activeIncidents.map(incident => (
              <div key={incident.id} className="alert-card critical">
                <div className="alert-header">
                  <h3>🔥 Fire Detected</h3>
                  <span className="alert-time">
                    {moment(incident.timestamp).fromNow()}
                  </span>
                </div>
                <div className="alert-details">
                  <p><strong>Location:</strong> {incident.location}</p>
                  <p><strong>Sensor Value:</strong> {incident.sensor_value}</p>
                  <p><strong>Temperature:</strong> {incident.temperature}°C</p>
                  <p><strong>Humidity:</strong> {incident.humidity}%</p>
                </div>
                <div className="alert-actions">
                  <button 
                    onClick={() => resolveIncident(incident.id, 'Resolved from dashboard')}
                    className="resolve-btn"
                  >
                    Mark as Resolved
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="main-grid">
        {/* Chart */}
        <div className="chart-container">
          <h2>📈 Sensor Trends</h2>
          <Line data={chartData} options={chartOptions} />
        </div>

        {/* Recent Incidents */}
        <div className="incidents-container">
          <h2>📋 Recent Incidents</h2>
          <div className="incidents-list">
            {incidents.slice(0, 10).map(incident => (
              <div key={incident.id} className={`incident-item ${incident.flame_detected ? 'fire' : 'safe'}`}>
                <div className="incident-status">
                  {incident.flame_detected ? '🔥' : '✅'}
                </div>
                <div className="incident-info">
                  <h4>{incident.location}</h4>
                  <p>{moment(incident.timestamp).format('MMM DD, YYYY HH:mm')}</p>
                  <p>Sensor: {incident.sensor_value} | Temp: {incident.temperature}°C</p>
                </div>
                <div className="incident-status-text">
                  {incident.flame_detected ? 'Fire Detected' : 'Safe'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="system-status">
        <h2>🖥️ System Status</h2>
        <div className="status-grid">
          <div className="status-item">
            <span className="status-dot online"></span>
            <span>Arduino Connection</span>
          </div>
          <div className="status-item">
            <span className="status-dot online"></span>
            <span>Database</span>
          </div>
          <div className="status-item">
            <span className="status-dot online"></span>
            <span>Notification System</span>
          </div>
          <div className="status-item">
            <span className="status-dot online"></span>
            <span>Web Server</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
