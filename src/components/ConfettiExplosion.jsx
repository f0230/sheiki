// src/components/ConfettiExplosion.jsx
import React, { useEffect, useState } from 'react';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';

const ConfettiExplosion = ({ trigger }) => {
    const { width, height } = useWindowSize();
    const [show, setShow] = useState(false);

    useEffect(() => {
        if (trigger) {
            setShow(true);
            setTimeout(() => setShow(false), 8000); // duración confetti
        }
    }, [trigger]);

    return show ? <Confetti width={width} height={height} recycle={false} numberOfPieces={300} /> : null;
};

export default ConfettiExplosion;
