import { useEffect } from 'react';
import "./header.css";
import logo from "../../assets/logo.png"
import { Link } from 'react-router-dom';
import TopHead from './TopHead';
import { AppStoreButton } from '../common';


const Header = () => {
  useEffect(() => {
    const menu = document.querySelector('#menu-icon');
    const navbar = document.querySelector('.nav_bar');

    const toggleMenu = () => {
      menu.classList.toggle('fa-xmark');
      navbar.classList.toggle('open');
    }

    if (menu) {
      menu.addEventListener('click', toggleMenu);
    }

    return () => {
      if (menu) {
        menu.removeEventListener('click', toggleMenu);
      }
    }
  }, []);

  return (
    <>
      <TopHead />
      <header>
        <Link to={``} className='logo_img'>
          <img src={logo} alt="Milkano Logo" />
        </Link>

        <ul className='nav_bar'>
          <li><Link to={`/`} className='active'>Home</Link></li>
          <li><Link to={`/about-us`}>About Us</Link></li>
          <li><Link to={`/our-offering`}>Our Offering</Link></li>
          <li><Link to={`/our-usp`}>Our USP</Link></li>
          <li><Link to={`/business-solutions`}>Business Solutions</Link></li>
          <li><Link to={`/investor-relations`}>Investor Relations</Link></li>
          <li><Link to={`/vendor-onboarding`}>Vendor Onboarding</Link></li>
        </ul>

        <div className="main_wrap">
          <div className="header_app_buttons">
            <AppStoreButton
              type="playstore"
              className="app_store_btn_header"
              showText={true}
              text="Download BigBonus App"
            />
          </div>
          <div className='fa-solid fa-bars' id='menu-icon'></div>
        </div>
      </header>
    </>
  )
}

export default Header