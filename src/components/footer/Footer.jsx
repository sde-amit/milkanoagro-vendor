import "./footer.scss";
import logo from "../../assets/logo.png";
import { Link } from 'react-router-dom';
import { AppStoreButton, SocialIcons } from '../common';

const Footer = () => {
    return (
        <>
            <div className="container-fluid footer_main_container_fluid mt-5">
                <div className="row g-0">
                    {/* Left Yellow Section */}
                    <div className="col-lg-5 footer_left_section">
                        <div className="footer_company_info">
                            <div className="footer_logo">
                                <img src={logo} alt="Company Logo" />
                            </div>
                            <h2 className="company_name">Milkano Agro India Pvt. Ltd.</h2>
                            <div className="company_address">
                                <p><strong>Regd. office:</strong> Vaatsalya Kids Building, Shanti Nagar Colony</p>
                                <p>Near Prakar Hospital, Shivpur, Varanasi</p>
                                <p>Varanasi-221003, Uttar Pradesh</p>
                            </div>
                            <div className="app_download_section">
                                <span>Download Our App <h3 className="big_bonus"> BigBonus</h3></span>
                                <div className="app_store_buttons">
                                    <AppStoreButton type="playstore" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Purple Section */}
                    <div className="col-lg-7 footer_right_section">
                        <div className="footer_links_container">
                            <div className="row">
                                <div className="col-md-3 mb-4">
                                    <div className="footer_links_column">
                                        <h4>Use Full links</h4>
                                        <div className="link_wrapper">
                                            <Link to="/home">Home</Link>
                                            <Link to="/about--us">About us</Link>
                                            <Link to="/data--entry--services">Our Offering</Link>
                                            <Link to="/frequently--asked--question">Our Usp</Link>
                                            <Link to="/business--opportunities">Business Solutions</Link>
                                            <Link to="/contact--us">Investor Relations</Link>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-3 mb-4">
                                    <div className="footer_links_column">
                                        <h4>&nbsp;</h4>
                                        <div className="link_wrapper">
                                            <Link to="/vendor--onboarding">Vendor Onboarding</Link>
                                            <Link to="/contact--us">Contact us</Link>
                                            <Link to="/frequently--asked--question">Career</Link>
                                            <Link to="/frequently--asked--question">FAQs</Link>
                                            <Link to="/blog">Blog</Link>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-3 mb-4">
                                    <div className="footer_links_column">
                                        <h4>&nbsp;</h4>
                                        <div className="link_wrapper">
                                            <Link to="#">Refund & Cancellation Policy</Link>
                                            <Link to="#">Terms & Conditions</Link>
                                            <Link to="#">Privacy Policy</Link>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-3 mb-4">
                                    <div className="footer_links_column">
                                        <div className="social_connect_section">
                                            <h4>Connect with us</h4>
                                            <SocialIcons className="social_media_icons" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="row g-0">
                <div className="col-lg-5 footer_left_section" style={{ background: " #fcc300" }}></div>
                <div className="col-lg-7 footer_right_section">
                    <div className="container-fluid copy_right_container">
                        <div className="container">
                            <p className="copy_right_text"> © {new Date().getFullYear()}. Milkano Agro India Pvt. Ltd.</p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default Footer