import { Link } from 'react-router-dom';

const SocialIcons = ({ className = "social_icons" }) => {
    const socialLinks = [
        { platform: "facebook", icon: "fa-brands fa-facebook", url: "#" },
        { platform: "twitter", icon: "fa-brands fa-twitter", url: "#" },
        { platform: "instagram", icon: "fa-brands fa-instagram", url: "#" },
        { platform: "linkedin", icon: "fa-brands fa-linkedin", url: "#" }
    ];

    return (
        <div className={className}>
            {socialLinks.map((social) => (
                <Link key={social.platform} to={social.url} aria-label={social.platform}>
                    <i className={social.icon}></i>
                </Link>
            ))}
        </div>
    );
};

export default SocialIcons;