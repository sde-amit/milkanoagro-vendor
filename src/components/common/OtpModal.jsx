import { useState, useEffect } from 'react';
import { Input, Button, Typography, Space } from 'antd';
import './OtpModal.scss';

const { Title, Text } = Typography;

const OtpModal = ({ isOpen, onClose, onSubmit, contactNumber, title = "SUBMIT OTP" }) => {
    const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            // Clear OTP when modal opens
            setOtpDigits(['', '', '', '', '', '']);
        }
    }, [isOpen]);

    const handleInputChange = (index, value) => {
        // Only allow single digit
        if (value.length > 1) return;

        // Only allow numbers
        if (value && !/^\d$/.test(value)) return;

        const newOtpDigits = [...otpDigits];
        newOtpDigits[index] = value;
        setOtpDigits(newOtpDigits);

        // Auto focus next input
        if (value && index < 5) {
            const nextInput = document.getElementById(`otp-input-${index + 1}`);
            if (nextInput) nextInput.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        // Handle backspace
        if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
            const prevInput = document.getElementById(`otp-input-${index - 1}`);
            if (prevInput) prevInput.focus();
        }
    };

    const handleSubmit = async () => {
        const otpCode = otpDigits.join('');
        if (otpCode.length === 6) {
            setLoading(true);
            try {
                await onSubmit(otpCode);
            } finally {
                setLoading(false);
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div className="otp_modal_overlay">
            <div className="otp_modal_container">
                <div className="otp_modal_header">
                    <Title level={3} className="otp_modal_title">
                        {title}
                    </Title>
                </div>

                <div className="otp_modal_body">
                    <Text className="otp_message">
                        We have send a<br />
                        SMS verification code to - <Text strong>{contactNumber}</Text>
                    </Text>

                    <Space className="otp_inputs_container" size="small">
                        {otpDigits.map((digit, index) => (
                            <Input
                                key={index}
                                id={`otp-input-${index}`}
                                value={digit}
                                onChange={(e) => handleInputChange(index, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                className="otp_input"
                                maxLength={1}
                                autoComplete="off"
                                size="large"
                            />
                        ))}
                    </Space>

                    <Button
                        type="primary"
                        size="large"
                        onClick={handleSubmit}
                        loading={loading}
                        disabled={otpDigits.join('').length !== 6}
                        className="otp_submit_btn"
                    >
                        Submit
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default OtpModal;