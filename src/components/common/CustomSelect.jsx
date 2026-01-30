import { IoChevronDown } from 'react-icons/io5';
import './common.css';

const CustomSelect = ({
    name,
    value,
    onChange,
    options,
    className = "form_select",
    id,
    placeholder = "Select"
}) => {
    return (
        <div className="custom_select_wrapper">
            <select
                id={id}
                name={name}
                value={value}
                onChange={onChange}
                className={className}
            >
                {options.map((option, index) => (
                    <option key={index} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            <div className="select_icon">
                <IoChevronDown />
            </div>
        </div>
    );
};

export default CustomSelect;