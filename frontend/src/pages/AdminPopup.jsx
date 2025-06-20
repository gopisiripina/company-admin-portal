import React, { useState, useEffect } from 'react';
import { X, Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import { db } from '../firebase/config';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, getDocs, orderBy } from 'firebase/firestore';

const AdminPopup = ({ isOpen, onClose, userRole }) => {
  const [admins, setAdmins] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'admin'
  });

  // Generate random password
  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  // Fetch admins using indexed query
  const fetchAdmins = async () => {
    try {
      setLoading(true);
      // Use indexed query for role field
      const q = query(
        collection(db, 'users'),
        where('role', '==', 'admin'),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const adminList = [];
      querySnapshot.forEach((doc) => {
        adminList.push({ id: doc.id, ...doc.data() });
      });
      setAdmins(adminList);
    } catch (error) {
      console.error('Error fetching admins:', error);
      alert('Error loading admins');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && userRole === 'superadmin') {
      fetchAdmins();
    }
  }, [isOpen, userRole]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const password = generatePassword();
      const adminData = {
        ...formData,
        password,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true
      };

      if (editingAdmin) {
        // Update existing admin
        await updateDoc(doc(db, 'users', editingAdmin.id), {
          ...formData,
          updatedAt: new Date()
        });
        alert('Admin updated successfully');
      } else {
        // Add new admin
        await addDoc(collection(db, 'users'), adminData);
        alert(`Admin created successfully! Password: ${password}`);
      }

      setFormData({ name: '', email: '', role: 'admin' });
      setShowForm(false);
      setEditingAdmin(null);
      fetchAdmins();
    } catch (error) {
      console.error('Error saving admin:', error);
      alert('Error saving admin');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (admin) => {
    setFormData({
      name: admin.name,
      email: admin.email,
      role: admin.role
    });
    setEditingAdmin(admin);
    setShowForm(true);
  };

  const handleDelete = async (adminId) => {
    if (window.confirm('Are you sure you want to delete this admin?')) {
      try {
        setLoading(true);
        await deleteDoc(doc(db, 'users', adminId));
        alert('Admin deleted successfully');
        fetchAdmins();
      } catch (error) {
        console.error('Error deleting admin:', error);
        alert('Error deleting admin');
      } finally {
        setLoading(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        width: '90%',
        maxWidth: '800px',
        maxHeight: '80vh',
        overflow: 'auto'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          borderBottom: '1px solid #e5e7eb',
          paddingBottom: '16px'
        }}>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '600' }}>
            Admin Management
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px'
            }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Add Admin Button */}
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              padding: '12px 20px',
              borderRadius: '8px',
              cursor: 'pointer',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Plus size={16} />
            Add New Admin
          </button>
        )}

        {/* Add/Edit Form */}
        {showForm && (
          <div style={{
            backgroundColor: '#f9fafb',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <h3 style={{ marginTop: 0 }}>
              {editingAdmin ? 'Edit Admin' : 'Add New Admin'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px'
                  }}
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px'
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    backgroundColor: '#10b981',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '6px',
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {loading ? 'Saving...' : editingAdmin ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingAdmin(null);
                    setFormData({ name: '', email: '', role: 'admin' });
                  }}
                  style={{
                    backgroundColor: '#6b7280',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Admin List */}
        <div>
          <h3>Existing Admins ({admins.length})</h3>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>Loading...</div>
          ) : (
            <div style={{ maxHeight: '300px', overflow: 'auto' }}>
              {admins.map((admin) => (
                <div key={admin.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  marginBottom: '8px'
                }}>
                  <div>
                    <div style={{ fontWeight: '500' }}>{admin.name}</div>
                    <div style={{ color: '#6b7280', fontSize: '14px' }}>{admin.email}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleEdit(admin)}
                      style={{
                        backgroundColor: '#f59e0b',
                        color: 'white',
                        border: 'none',
                        padding: '6px',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(admin.id)}
                      style={{
                        backgroundColor: '#ef4444',
                        color: 'white',
                        border: 'none',
                        padding: '6px',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
              {admins.length === 0 && (
                <div style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>
                  No admins found
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPopup;