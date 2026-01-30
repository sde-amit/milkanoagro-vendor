import { Link } from 'react-router-dom';
import playstore from "../../assets/playstore.png";
import appstoreimg from "../../assets/appstore.png";

const AppStoreButton = ({
    type = "playstore",
    className = "app_store_btn",
    showText = false,
    text = "Download BigBonus App"
}) => {
    const getButtonContent = () => {
        switch (type) {
            case "playstore":
                return (
                    <>
                        {showText && <span className="download_text">{text}</span>}
                        <img src={playstore} alt="Google Play Store" />
                    </>
                );
            case "appstore":
                return (
                    <>
                        {showText && <span className="download_text">{text}</span>}
                        <img src={appstoreimg} alt="App Store" />
                    </>
                );
            default:
                return showText ? text : "Download App";
        }
    };

    return (
        <Link to="#" className={className}>
            {getButtonContent()}
        </Link>
    );
};

export default AppStoreButton;