const SuccessModal = ({
    isOpen,
    onClose,
    title = "Thank you!",
    message = "Your submission has been sent",
    autoClose = false,
    autoCloseDelay = 3000
}) => {
    if (autoClose && isOpen) {
        setTimeout(() => {
            onClose();
        }, autoCloseDelay);
    }

    if (!isOpen) return null;

    return (
        <div className="success_modal_overlay">
            <div className="success_modal">
                <div className="success_modal_content">
                    <div className="success_icon">
                        <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="40" cy="40" r="40" fill="#4CAF50" />
                            <path d="M25 40L35 50L55 30" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <h3 className="success_title">{title}</h3>
                    <p className="success_message">{message}</p>
                    <button onClick={onClose} className="success_close_btn">
                        ×
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SuccessModal;