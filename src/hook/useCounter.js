import { useState, useEffect } from "react";

export default function useCounter(target, duration = 2000) {

    const [count, setCount] = useState(0);

    useEffect(() => {

        let start = 0;

        const increment = target / (duration / 16);

        const timer = setInterval(() => {

            start += increment;

            if (start >= target) {
                setCount(target);
                clearInterval(timer);
            } else {
                setCount(Math.floor(start));
            }

        }, 16);

        return () => clearInterval(timer);

    }, [target, duration]);

    return count;
}