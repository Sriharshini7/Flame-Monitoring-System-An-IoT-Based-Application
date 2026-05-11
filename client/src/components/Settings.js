import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Settings.css';

const Settings = () => {
  const [contacts, setContacts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [showAddContact, setShowAddContact] = useState(false);
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', phone: '', email: '' });
  const [newLocation, setNewLocation] = useState({ name: '', description: '', latitude: '', longitude: '', address: '' });

  useEffect(() => {
    fetchContacts();
    fetchLocations();
  }, []);

  const fetchContacts = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/contacts');
      setContacts(response.data);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    }
  };

  const fetchLocations = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/locations');
      setLocations(response.data);
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  const addContact = async () => {
    try {
      await axios.post('http://localhost:5000/api/contacts', newContact);
      setNewContact({ name: '', phone: '', email: '' });
      setShowAddContact(false);
      fetchContacts();
    } catch (error) {
      console.error('Error adding contact:', error);
    }
  };

  const addLocation = async () => {
    try {
      await axios.post('http://localhost:5000/api/locations', newLocation);
      setNewLocation({ name: '', description: '', latitude: '', longitude: '', address: '' });
      setShowAddLocation(false);
      fetchLocations();
    } catch (error) {
      console.error('Error adding location:', error);
    }
  };

  return (
    <div className="settings">
      <div className="settings-header">
        <h1>⚙️ System Settings</h1>
        <p>Manage contacts, locations, and system configuration</p>
      </div>

      <div className="settings-grid">
        {/* Contacts Section */}
        <div className="settings-section">
          <div className="section-header">
            <h2>📱 Emergency Contacts</h2>
            <button 
              className="add-btn"
              onClick={() => setShowAddContact(true)}
            >
              + Add Contact
            </button>
          </div>
          
          <div className="contacts-list">
            {contacts.map(contact => (
              <div key={contact.id} className="contact-card">
                <div className="contact-info">
                  <h3>{contact.name}</h3>
                  <p>📞 {contact.phone}</p>
                  <p>📧 {contact.email}</p>
                </div>
                <div className="contact-status">
                  <span className="status-dot active"></span>
                  Active
                </div>
              </div>
            ))}
            {contacts.length === 0 && (
              <div className="empty-state">
                <p>No contacts added yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Locations Section */}
        <div className="settings-section">
          <div className="section-header">
            <h2>📍 Sensor Locations</h2>
            <button 
              className="add-btn"
              onClick={() => setShowAddLocation(true)}
            >
              + Add Location
            </button>
          </div>
          
          <div className="locations-list">
            {locations.map(location => (
              <div key={location.id} className="location-card">
                <div className="location-info">
                  <h3>{location.name}</h3>
                  <p>{location.description}</p>
                  <p>📍 {location.address}</p>
                  {location.latitude && location.longitude && (
                    <p>🗺️ {location.latitude}, {location.longitude}</p>
                  )}
                </div>
                <div className="location-status">
                  <span className="status-dot active"></span>
                  Active
                </div>
              </div>
            ))}
            {locations.length === 0 && (
              <div className="empty-state">
                <p>No locations added yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Contact Modal */}
      {showAddContact && (
        <div className="modal">
          <div className="modal-content">
            <h3>Add Emergency Contact</h3>
            <div className="form-group">
              <label>Name:</label>
              <input
                type="text"
                value={newContact.name}
                onChange={(e) => setNewContact({...newContact, name: e.target.value})}
                placeholder="Enter contact name"
              />
            </div>
            <div className="form-group">
              <label>Phone:</label>
              <input
                type="tel"
                value={newContact.phone}
                onChange={(e) => setNewContact({...newContact, phone: e.target.value})}
                placeholder="Enter phone number"
              />
            </div>
            <div className="form-group">
              <label>Email:</label>
              <input
                type="email"
                value={newContact.email}
                onChange={(e) => setNewContact({...newContact, email: e.target.value})}
                placeholder="Enter email address"
              />
            </div>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowAddContact(false)}>
                Cancel
              </button>
              <button className="save-btn" onClick={addContact}>
                Save Contact
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Location Modal */}
      {showAddLocation && (
        <div className="modal">
          <div className="modal-content">
            <h3>Add Sensor Location</h3>
            <div className="form-group">
              <label>Location Name:</label>
              <input
                type="text"
                value={newLocation.name}
                onChange={(e) => setNewLocation({...newLocation, name: e.target.value})}
                placeholder="e.g., Laboratory Room 101"
              />
            </div>
            <div className="form-group">
              <label>Description:</label>
              <textarea
                value={newLocation.description}
                onChange={(e) => setNewLocation({...newLocation, description: e.target.value})}
                placeholder="Describe this location"
                rows="3"
              />
            </div>
            <div className="form-group">
              <label>Address:</label>
              <input
                type="text"
                value={newLocation.address}
                onChange={(e) => setNewLocation({...newLocation, address: e.target.value})}
                placeholder="Building address"
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Latitude:</label>
                <input
                  type="number"
                  step="any"
                  value={newLocation.latitude}
                  onChange={(e) => setNewLocation({...newLocation, latitude: e.target.value})}
                  placeholder="e.g., 40.7128"
                />
              </div>
              <div className="form-group">
                <label>Longitude:</label>
                <input
                  type="number"
                  step="any"
                  value={newLocation.longitude}
                  onChange={(e) => setNewLocation({...newLocation, longitude: e.target.value})}
                  placeholder="e.g., -74.0060"
                />
              </div>
            </div>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowAddLocation(false)}>
                Cancel
              </button>
              <button className="save-btn" onClick={addLocation}>
                Save Location
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
