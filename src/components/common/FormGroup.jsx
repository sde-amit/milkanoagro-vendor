const FormGroup = ({
    label,
    children,
    className = "form_group",
    required = false,
    error = null
}) => {
    return (
        <div className={className}>
            {label && (
                <label>
                    {label}
                    {required && <span className="required">*</span>}
                </label>
            )}
            {children}
            {error && <span className="error_message">{error}</span>}
        </div>
    );
};

export default FormGroup;