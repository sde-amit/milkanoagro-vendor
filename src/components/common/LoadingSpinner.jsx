const LoadingSpinner = ({
    text = "Loading...",
    className = "loading",
    size = "medium"
}) => {
    return (
        <div className={`${className} loading-${size}`}>
            <div className="spinner"></div>
            <span>{text}</span>
        </div>
    );
};

export default LoadingSpinner;