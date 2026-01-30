import { Link } from 'react-router-dom';
import logo from "../../assets/logo.png";
import { FaHome, FaExclamationTriangle } from 'react-icons/fa';
import { useState, useEffect } from 'react';
import './notFound.scss';

const NotFound = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Trigger animation on component mount
        setIsVisible(true);
    }, []);

    return (
        <div className="not_found_container">
            <div className={`not_found_content ${isVisible ? 'visible' : ''}`}>
                {/* Company Logo */}
                <div className="company_branding">
                    <img src={logo} alt="Milkano Agro India" className="company_logo" />
                    <span className="company_name">Milkano Agro India</span>
                </div>

                {/* 404 Animation */}
                <div className="error_animation">
                    <div className="error_number">
                        <span className="four">4</span>
                        <span className="zero">
                            <div className="zero_inner">
                                <FaExclamationTriangle className="zero_icon" />
                            </div>
                        </span>
                        <span className="four">4</span>
                    </div>
                    <div className="error_subtitle">Page Not Found</div>
                </div>

                {/* Error Message */}
                <div className="error_message">
                    <h1 className="error_title">Oops! Something went wrong</h1>
                    <p className="error_description">
                        The page you're looking for might have been removed, had its name changed,
                        or is temporarily unavailable.
                    </p>
                </div>

                {/* Single Action Button */}
                <div className="error_actions">
                    <Link to="/" className="btn primary_btn">
                        <FaHome className="btn_icon" />
                        Go to Home
                    </Link>
                </div>

                {/* Decorative Elements */}
                <div className="decorative_elements">
                    <div className="floating_shape shape_1"></div>
                    <div className="floating_shape shape_2"></div>
                    <div className="floating_shape shape_3"></div>
                    <div className="floating_shape shape_4"></div>
                    <div className="floating_shape shape_5"></div>
                    <div className="floating_shape shape_6"></div>
                </div>
            </div>

            {/* Background Pattern */}
            <div className="background_pattern">
                <div className="pattern_dot"></div>
                <div className="pattern_dot"></div>
                <div className="pattern_dot"></div>
                <div className="pattern_dot"></div>
                <div className="pattern_dot"></div>
            </div>
        </div>
    );
};

export default NotFound;