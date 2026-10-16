import { useState, useEffect } from "react";

export default function useCounter(target = 0, duration = 1000) {
    const [count, setCount] = useState(0);

    useEffect(() => {
        const num = Number(target) || 0;
        if (num <= 0) {
            setCount(0);
            return;
        }

        let start = 0;
        const stepTime = 20;
        const totalSteps = Math.max(1, Math.floor(duration / stepTime));
        const increment = num / totalSteps;

        const timer = setInterval(() => {
            start += increment;
            if (start >= num) {
                setCount(num);
                clearInterval(timer);
            } else {
                setCount(Math.floor(start));
            }
        }, stepTime);

        return () => clearInterval(timer);
    }, [target, duration]);

    return count;
}