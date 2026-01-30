import './header.css'
import { Link } from 'react-router-dom';
import { ContactInfo, SocialIcons } from '../common';

const TopHead = () => {
    return (
        <>
            <section className="container-fluid top__bar">
                <div className="container top_bar_container">
                    <ContactInfo />

                    <span className='right_top_bar'>
                        <span className="download_text" style={{ color: "#ffffff81" }}>About / Help / Contact</span>
                        <div className="app_buttons">
                            <Link to="" className="app_store_btn" style={{ color: "#ffffff81" }}>
                                <span>Follow on:</span>
                            </Link>
                        </div>
                        <SocialIcons />
                    </span>
                </div>
            </section>
        </>
    )
}

export default TopHead