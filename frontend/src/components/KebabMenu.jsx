import React, { useState, useRef, useEffect } from 'react';
import './KebabMenu.css';

const KebabMenu = ({ actions, tenant }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="kebab-menu-container" ref={menuRef}>
      <button className="btn-icon" onClick={() => setIsOpen(!isOpen)}>
        ⋮
      </button>
      {isOpen && (
        <div className="kebab-dropdown">
          {actions.map((action, index) => (
            <button
              key={index}
              className={`dropdown-item ${action.danger ? 'danger' : ''}`}
              onClick={() => {
                action.onClick(tenant);
                setIsOpen(false);
              }}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default KebabMenu;
