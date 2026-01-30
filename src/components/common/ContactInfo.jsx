import { IoMail } from "react-icons/io5";
import { FaLocationDot } from "react-icons/fa6";
import { Link } from 'react-router-dom';

const ContactInfo = ({
    email = "contact@milkanoagro.com",
    address = "Shanti Nagar Colony, Varanasi - 221003, UP",
    className = "details__top",
    showIcons = true,
    iconColor = "#FFD700",
    textColor = "#ffffff81"
}) => {
    return (
        <span className={className}>
            <span className="email_section">
                {showIcons && <IoMail style={{ marginRight: "4px", color: iconColor }} />}
                <Link
                    style={{ color: textColor }}
                    to={`mailto:${email}`}
                >
                    {email}
                </Link>
            </span>
            <span className="address_section">
                {showIcons && <FaLocationDot style={{ marginRight: "4px", color: iconColor, marginLeft: "6px" }} />}
                <Link style={{ color: textColor }}>
                    {address}
                </Link>
            </span>
        </span>
    );
};

export default ContactInfo;