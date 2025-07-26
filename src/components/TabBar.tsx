// src/components/TabBar.tsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import { FaHome, FaUser, FaUsers } from 'react-icons/fa'; // Иконки
import './TabBar.css';

const TabBar = () => {
  return (
    <nav className="tab-bar">
      <NavLink to="/" className={({isActive}) => isActive ? 'tab-bar-item active' : 'tab-bar-item'}>
        <FaHome size={24} />
        <span>Главная</span>
      </NavLink>
      <NavLink to="/profile" className={({isActive}) => isActive ? 'tab-bar-item active' : 'tab-bar-item'}>
        <FaUser size={24} />
        <span>Профиль</span>
      </NavLink>
      <NavLink to="/referral" className={({isActive}) => isActive ? 'tab-bar-item active' : 'tab-bar-item'}>
        <FaUsers size={24} />
        <span>Друзья</span>
      </NavLink>
    </nav>
  );
};

export default TabBar;