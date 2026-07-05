import React, { useState, useEffect } from 'react';
import { Plus, Coffee, BedDouble, FolderPlus, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import KebabMenu from '../components/KebabMenu';
import '../pages/SuperAdminDashboard.css';

const MasterCatalog = () => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('menu');
  const [menuItems, setMenuItems] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [branches, setBranches] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [itemModal, setItemModal] = useState({ open: false, data: null });
  const [roomModal, setRoomModal] = useState({ open: false, data: null });
  const [categoryModal, setCategoryModal] = useState({ open: false });
  const [branchModal, setBranchModal] = useState({ open: false, type: null, id: null, selectedBranches: [] });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [menuRes, roomRes, catRes, branchRes] = await Promise.all([
        fetch('http://localhost:3000/api/business/catalog/menu-items', { credentials: 'include' }).then(r => r.json()),
        fetch('http://localhost:3000/api/business/catalog/room-types', { credentials: 'include' }).then(r => r.json()),
        fetch('http://localhost:3000/api/business/catalog/categories', { credentials: 'include' }).then(r => r.json()),
        fetch('http://localhost:3000/api/business/branches', { credentials: 'include' }).then(r => r.json())
      ]);
      setMenuItems(menuRes);
      setRoomTypes(roomRes);
      setCategories(catRes);
      setBranches(branchRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  // Handlers for Items
  const handleSaveItem = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = Object.fromEntries(formData.entries());
    
    const url = itemModal.data 
      ? `http://localhost:3000/api/business/catalog/menu-items/${itemModal.data.id}`
      : 'http://localhost:3000/api/business/catalog/menu-items';
    const method = itemModal.data ? 'PUT' : 'POST';

    try {
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      setItemModal({ open: false, data: null });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      await fetch(`http://localhost:3000/api/business/catalog/menu-items/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  // Handlers for Rooms
  const handleSaveRoom = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = Object.fromEntries(formData.entries());
    
    const url = roomModal.data 
      ? `http://localhost:3000/api/business/catalog/room-types/${roomModal.data.id}`
      : 'http://localhost:3000/api/business/catalog/room-types';
    const method = roomModal.data ? 'PUT' : 'POST';

    try {
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      setRoomModal({ open: false, data: null });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteRoom = async (id) => {
    if (!window.confirm('Are you sure you want to delete this room type?')) return;
    try {
      await fetch(`http://localhost:3000/api/business/catalog/room-types/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  // Handlers for Categories
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = Object.fromEntries(formData.entries());
    try {
      await fetch('http://localhost:3000/api/business/catalog/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      setCategoryModal({ open: false });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  // Handlers for Branch Availability
  const openBranchModal = async (type, id) => {
    try {
      const res = await fetch(`http://localhost:3000/api/business/catalog/${type}/${id}/availability`, { credentials: 'include' });
      const activeBranches = await res.json();
      setBranchModal({ open: true, type, id, selectedBranches: activeBranches });
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveAvailability = async (e) => {
    e.preventDefault();
    try {
      await fetch(`http://localhost:3000/api/business/catalog/${branchModal.type}/${branchModal.id}/availability`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ branchIds: branchModal.selectedBranches })
      });
      setBranchModal({ open: false, type: null, id: null, selectedBranches: [] });
    } catch (err) {
      console.error(err);
    }
  };

  const toggleBranchSelection = (branchId) => {
    setBranchModal(prev => {
      const isSelected = prev.selectedBranches.includes(branchId);
      return {
        ...prev,
        selectedBranches: isSelected 
          ? prev.selectedBranches.filter(id => id !== branchId)
          : [...prev.selectedBranches, branchId]
      };
    });
  };

  const itemActions = (item) => [
    { label: 'View/Edit', onClick: () => setItemModal({ open: true, data: item }) },
    { label: 'Branch Availability', onClick: () => openBranchModal('menu-items', item.id) },
    { label: 'Delete', danger: true, onClick: () => handleDeleteItem(item.id) }
  ];

  const roomActions = (room) => [
    { label: 'View/Edit', onClick: () => setRoomModal({ open: true, data: room }) },
    { label: 'Branch Availability', onClick: () => openBranchModal('room-types', room.id) },
    { label: 'Delete', danger: true, onClick: () => handleDeleteRoom(room.id) }
  ];

  if (loading) return <div className="dashboard"><p>Loading Master Catalog...</p></div>;

  const filteredItems = activeCategory ? menuItems.filter(i => i.category_id === activeCategory) : menuItems;

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h2>Master Catalog</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className={`btn-ghost ${activeTab === 'menu' ? 'fw-500' : ''}`} onClick={() => setActiveTab('menu')} style={{ borderColor: activeTab === 'menu' ? 'var(--color-primary)' : '' }}>
            <Coffee size={14} style={{ marginRight: '6px' }} /> Menu Builder
          </button>
          <button className={`btn-ghost ${activeTab === 'rooms' ? 'fw-500' : ''}`} onClick={() => setActiveTab('rooms')} style={{ borderColor: activeTab === 'rooms' ? 'var(--color-primary)' : '' }}>
            <BedDouble size={14} style={{ marginRight: '6px' }} /> Room Types
          </button>
        </div>
      </header>

      {activeTab === 'menu' && (
        <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '24px', alignItems: 'start' }}>
          {/* Categories Sidebar */}
          <section className="card" style={{ padding: '0' }}>
            <div className="card-header" style={{ padding: '16px', borderBottom: '1px solid var(--color-surface-container-highest)' }}>
              <h3 style={{ fontSize: '16px', margin: 0 }}>Categories</h3>
              <button className="btn-ghost" onClick={() => setCategoryModal({ open: true })} style={{ padding: '4px 8px' }}>
                <FolderPlus size={16} />
              </button>
            </div>
            <div style={{ padding: '8px' }}>
              <div 
                style={{ padding: '12px', cursor: 'pointer', borderRadius: '4px', background: activeCategory === null ? 'var(--color-surface-container-highest)' : 'transparent' }}
                onClick={() => setActiveCategory(null)}
              >
                All Items
              </div>
              {categories.map(cat => (
                <div 
                  key={cat.id} 
                  style={{ padding: '12px', cursor: 'pointer', borderRadius: '4px', background: activeCategory === cat.id ? 'var(--color-surface-container-highest)' : 'transparent' }}
                  onClick={() => setActiveCategory(cat.id)}
                >
                  {cat.name}
                </div>
              ))}
            </div>
          </section>

          {/* Menu Items Table */}
          <section className="table-section" style={{ margin: 0 }}>
            <div className="card">
              <div className="card-header">
                <h3>{activeCategory ? categories.find(c => c.id === activeCategory)?.name : 'Global Menu Items'}</h3>
                <button className="btn-primary" onClick={() => setItemModal({ open: true, data: null })}>
                  <Plus size={14} style={{ marginRight: '4px' }} /> Add Item
                </button>
              </div>
              <div className="table-container">
                <table className="dense-table">
                  <thead>
                    <tr>
                      <th>Item Name</th>
                      <th>Category</th>
                      <th>Base Price</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map(item => (
                      <tr key={item.id}>
                        <td className="fw-500">{item.name}</td>
                        <td>{item.category || 'N/A'}</td>
                        <td className="label-mono">रु{item.price.toFixed(2)}</td>
                        <td>
                          <span className={`badge badge-${item.status === 'active' ? 'success' : 'neutral'}`}>
                            {item.status.toUpperCase()}
                          </span>
                        </td>
                        <td><KebabMenu actions={itemActions(item)} /></td>
                      </tr>
                    ))}
                    {filteredItems.length === 0 && (
                      <tr><td colSpan="5" style={{ textAlign: 'center', padding: '16px' }}>No items found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>
      )}

      {activeTab === 'rooms' && (
        <section className="table-section">
          <div className="card">
            <div className="card-header">
              <h3>Global Room Types</h3>
              <button className="btn-primary" onClick={() => setRoomModal({ open: true, data: null })}>
                <Plus size={14} style={{ marginRight: '4px' }} /> Add Room Type
              </button>
            </div>
            <div className="table-container">
              <table className="dense-table">
                <thead>
                  <tr>
                    <th>Room Type</th>
                    <th>Base Price / Night</th>
                    <th>Capacity</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {roomTypes.map(room => (
                    <tr key={room.id}>
                      <td className="fw-500">{room.name}</td>
                      <td className="label-mono">रु{room.basePrice.toFixed(2)}</td>
                      <td>{room.capacity} Persons</td>
                      <td>
                        <span className={`badge badge-${room.status === 'active' ? 'success' : 'neutral'}`}>
                          {room.status.toUpperCase()}
                        </span>
                      </td>
                      <td><KebabMenu actions={roomActions(room)} /></td>
                    </tr>
                  ))}
                  {roomTypes.length === 0 && (
                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: '16px' }}>No room types found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* Modals */}
      {itemModal.open && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{itemModal.data ? 'Edit Menu Item' : 'Add Menu Item'}</h3>
              <button className="btn-icon" onClick={() => setItemModal({ open: false, data: null })}><X size={20}/></button>
            </div>
            <form onSubmit={handleSaveItem}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Item Name</label>
                  <input name="name" type="text" required defaultValue={itemModal.data?.name} />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select name="category_id" required defaultValue={itemModal.data?.category_id || activeCategory || ''}>
                    <option value="" disabled>Select Category...</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Base Price</label>
                  <input name="price" type="number" step="0.01" required defaultValue={itemModal.data?.price} />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea name="description" rows="3" defaultValue={itemModal.data?.description}></textarea>
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select name="status" defaultValue={itemModal.data?.status || 'active'}>
                    <option value="active">Active</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-ghost" onClick={() => setItemModal({ open: false, data: null })}>Cancel</button>
                <button type="submit" className="btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {roomModal.open && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{roomModal.data ? 'Edit Room Type' : 'Add Room Type'}</h3>
              <button className="btn-icon" onClick={() => setRoomModal({ open: false, data: null })}><X size={20}/></button>
            </div>
            <form onSubmit={handleSaveRoom}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Room Type Name</label>
                  <input name="name" type="text" required defaultValue={roomModal.data?.name} />
                </div>
                <div className="form-group">
                  <label>Capacity</label>
                  <input name="capacity" type="number" required defaultValue={roomModal.data?.capacity} />
                </div>
                <div className="form-group">
                  <label>Base Price / Night</label>
                  <input name="basePrice" type="number" step="0.01" required defaultValue={roomModal.data?.basePrice} />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea name="description" rows="3" defaultValue={roomModal.data?.description}></textarea>
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select name="status" defaultValue={roomModal.data?.status || 'active'}>
                    <option value="active">Active</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-ghost" onClick={() => setRoomModal({ open: false, data: null })}>Cancel</button>
                <button type="submit" className="btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {categoryModal.open && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Add Category</h3>
              <button className="btn-icon" onClick={() => setCategoryModal({ open: false })}><X size={20}/></button>
            </div>
            <form onSubmit={handleSaveCategory}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Category Name</label>
                  <input name="name" type="text" required />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-ghost" onClick={() => setCategoryModal({ open: false })}>Cancel</button>
                <button type="submit" className="btn-primary">Save Category</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {branchModal.open && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Manage Branch Availability</h3>
              <button className="btn-icon" onClick={() => setBranchModal({ open: false, type: null, id: null, selectedBranches: [] })}><X size={20}/></button>
            </div>
            <form onSubmit={handleSaveAvailability}>
              <div className="modal-body">
                <p className="text-muted" style={{ marginBottom: '16px' }}>Select which branches should offer this item.</p>
                {branches.length === 0 ? (
                  <p>No active branches found.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {branches.map(b => (
                      <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input 
                          type="checkbox" 
                          id={`branch_${b.id}`} 
                          checked={branchModal.selectedBranches.includes(b.id)}
                          onChange={() => toggleBranchSelection(b.id)}
                        />
                        <label htmlFor={`branch_${b.id}`} style={{ cursor: 'pointer' }}>{b.name} ({b.address})</label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-ghost" onClick={() => setBranchModal({ open: false, type: null, id: null, selectedBranches: [] })}>Cancel</button>
                <button type="submit" className="btn-primary">Save Availability</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MasterCatalog;
