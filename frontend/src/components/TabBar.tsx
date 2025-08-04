// frontend/src/components/TabBar.tsx
// ПОЛНАЯ ВЕРСИЯ С НОВОЙ КНОПКОЙ "ЗАДАНИЯ"

import { NavLink } from 'react-router-dom';
import './TabBar.css'; // Предполагаем, что стили находятся здесь

// Импортируем иконки (предполагаем, что они есть, если нет - можно использовать текст)
// import { ReactComponent as HomeIcon } from '../assets/home.svg';
// import { ReactComponent as TasksIcon } from '../assets/tasks.svg';
// import { ReactComponent as FriendsIcon } from '../assets/friends.svg';
// import { ReactComponent as ProfileIcon } from '../assets/profile.svg';

const TabBar = () => {
  return (
    <nav className="tab-bar">
      <NavLink to="/" className="tab-item">
        {/* <HomeIcon /> */}
        <span>Главная</span>
      </NavLink>
      
      <NavLink to="/referral" className="tab-item">
        {/* <FriendsIcon /> */}
        <span>Друзья</span>
      </NavLink>
      
      {/* --- НОВАЯ КНОПКА --- */}
      <NavLink to="/tasks" className="tab-item">
        {/* <TasksIcon /> */}
        <span>Задания</span>
      </NavLink>
      {/* -------------------- */}
      
      <NavLink to="/profile" className="tab-item">
        {/* <ProfileIcon /> */}
        <span>Профиль</span>
      </NavLink>
    </nav>
  );
};

export default TabBar;