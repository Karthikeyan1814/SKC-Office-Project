import { useState } from "react";

function ThemeCustomizer() {

    const [color, setColor] = useState("#cc00ff");

    const changeColor = (e) => {
        const value = e.target.value;

        setColor(value);

        document.documentElement.style.setProperty(
            "--primary",
            value
        );
    };

    return (
        <>
            <h2>Choose Theme Color</h2>

            <input
                type="color"
                value={color}
                onChange={changeColor}
            />
        </>
    );
}

export default ThemeCustomizer;