import { useEffect, useId, useRef, useState } from "react";
import { FiChevronDown } from "react-icons/fi";

import "./CustomSelect.css";

function CustomSelect({
    value,
    options,
    onChange,
    placeholder = "선택해주세요",
    ariaLabel = "선택",
    disabled = false
}) {
    const [isOpen, setIsOpen] = useState(false);

    const selectRef = useRef(null);
    const listId = useId();

    const selectedOption = options.find(
        (option) => option.value === value
    );

    useEffect(() => {
        const handleOutsideClick = (event) => {
            if (
                selectRef.current &&
                !selectRef.current.contains(event.target)
            ) {
                setIsOpen(false);
            }
        };

        const handleEscape = (event) => {
            if (event.key === "Escape") {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleOutsideClick);
        document.addEventListener("keydown", handleEscape);

        return () => {
            document.removeEventListener(
                "mousedown",
                handleOutsideClick
            );
            document.removeEventListener("keydown", handleEscape);
        };
    }, []);

    const handleSelect = (option) => {
        onChange(option.value);
        setIsOpen(false);
    };

    return (
        <div
            ref={selectRef}
            className={`custom-select ${isOpen ? "open" : ""}`}
        >
            <button
                type="button"
                className="custom-select-trigger"
                onClick={() => setIsOpen((previous) => !previous)}
                aria-label={ariaLabel}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                aria-controls={listId}
                disabled={disabled}
            >
                {selectedOption ? (
                    <span className="custom-select-value">
                        {selectedOption.icon && (
                            <img
                                src={selectedOption.icon}
                                alt=""
                                className="custom-select-icon"
                            />
                        )}

                        <span>{selectedOption.label}</span>
                    </span>
                ) : (
                    <span className="custom-select-placeholder">
                        {placeholder}
                    </span>
                )}

                <FiChevronDown className="custom-select-arrow" />
            </button>

            {isOpen && (
                <div
                    id={listId}
                    className="custom-select-menu"
                    role="listbox"
                >
                    {options.map((option) => {
                        const isSelected = option.value === value;

                        return (
                            <button
                                key={option.value}
                                type="button"
                                role="option"
                                aria-selected={isSelected}
                                className={
                                    isSelected
                                        ? "custom-select-option selected"
                                        : "custom-select-option"
                                }
                                onClick={() => handleSelect(option)}
                            >
                                {option.icon && (
                                    <img
                                        src={option.icon}
                                        alt=""
                                        className="custom-select-icon"
                                    />
                                )}

                                <span>{option.label}</span>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default CustomSelect;