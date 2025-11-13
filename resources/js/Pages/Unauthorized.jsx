import React, { useEffect, useState } from "react";
import { Head, router } from "@inertiajs/react";
import { motion } from "framer-motion";

export default function Unauthorized() {
    const [countdown, setCountdown] = useState(10);
    const [isChristmas, setIsChristmas] = useState(false);

    const logout = () => {
        const token = localStorage.getItem("authify-token");
        localStorage.removeItem("authify-token");
        router.get(route("logout"));
        // window.location.href = `http://192.168.2.221/authify/public/logout?key=${encodeURIComponent(
        window.location.href = `http://192.168.3.201/authify/public/logout?key=${encodeURIComponent(
            token
        )}&redirect=${encodeURIComponent(route("dashboard"))}`;
    };

    // 🎄 Check if within Christmas theme period (Nov 3 – Jan 2)
    useEffect(() => {
        const now = new Date();
        const year = now.getFullYear();
        const start = new Date(`${year}-11-03`);
        const end = new Date(`${year + 1}-01-02`);
        if (now >= start || now <= end) setIsChristmas(true);
    }, []);

    // Auto logout (10s)
    useEffect(() => {
        const timer = setInterval(() => setCountdown((prev) => prev - 1), 1000);
        const autoLogout = setTimeout(() => logout(), 10000);
        return () => {
            clearInterval(timer);
            clearTimeout(autoLogout);
        };
    }, []);

    // Theme setup
    const bgTheme = isChristmas
        ? "bg-gradient-to-b from-green-700 via-red-700 to-yellow-700"
        : "bg-gradient-to-b from-red-700 via-black to-gray-900";

    const accent = isChristmas ? "text-green-300" : "text-red-400";
    const glowColor = isChristmas
        ? "drop-shadow-[0_0_25px_rgba(0,255,100,0.6)]"
        : "drop-shadow-[0_0_25px_rgba(255,0,0,0.6)]";

    const accentGradient = isChristmas
        ? "from-green-500 via-yellow-400 to-red-500"
        : "from-red-600 via-red-700 to-red-900";

    return (
        <>
            <Head title="Unauthorized" />
            <div
                className={`flex items-center justify-center min-h-screen ${bgTheme} text-center relative overflow-hidden`}
            >
                {/* ❄️ Snowfall layer (only for Christmas theme) */}
                {isChristmas && (
                    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
                        {[...Array(80)].map((_, i) => (
                            <div
                                key={i}
                                className="absolute bg-white rounded-full opacity-80"
                                style={{
                                    width: `${Math.random() * 6 + 2}px`,
                                    height: `${Math.random() * 6 + 2}px`,
                                    top: `${Math.random() * -200}px`,
                                    left: `${Math.random() * 100}%`,
                                    animation: `fall ${
                                        6 + Math.random() * 6
                                    }s linear ${Math.random() * 10}s infinite`,
                                }}
                            ></div>
                        ))}
                    </div>
                )}

                {/* Sparkle pulse background */}
                {isChristmas && (
                    <div className="absolute inset-0 animate-pulse bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.15),transparent_70%)] z-0"></div>
                )}

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1 }}
                    className="relative z-10 p-16 rounded-3xl bg-white/10 backdrop-blur-md shadow-2xl border border-white/20 max-w-3xl w-full"
                >
                    <motion.h1
                        initial={{ scale: 0.9 }}
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className={`text-[120px] font-extrabold ${
                            isChristmas ? "text-yellow-300" : "text-red-500"
                        } ${glowColor} mb-4`}
                    >
                        401
                    </motion.h1>

                    <h2 className="text-5xl font-bold text-gray-100 mb-4">
                        Unauthorized Access
                    </h2>

                    <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
                        You do not have permission to access this area.
                        Please contact your administrator if you believe this is an error.
                    </p>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{
                            duration: 1.2,
                            repeat: Infinity,
                            repeatType: "reverse",
                        }}
                        className={`text-3xl font-semibold ${accent} mb-8`}
                    >
                        Auto logout in{" "}
                        <span className="text-white font-extrabold">{countdown}</span>{" "}
                        seconds...
                    </motion.div>

                    <button
                        onClick={logout}
                        className={`px-10 py-4 text-2xl font-semibold text-white rounded-full shadow-lg hover:scale-105 transition-transform duration-300 bg-gradient-to-r ${accentGradient}`}
                    >
                        Logout Now
                    </button>

                    {isChristmas && (
                        <p className="mt-6 text-lg text-yellow-200 animate-pulse">
                            🎅 Merry Christmas & Happy Holidays! 🎄
                        </p>
                    )}
                </motion.div>
            </div>

            {/* ❄️ Snowfall animation keyframes */}
            <style>
                {`
                @keyframes fall {
                    0% {
                        transform: translateY(0) rotate(0deg);
                        opacity: 1;
                    }
                    100% {
                        transform: translateY(100vh) rotate(360deg);
                        opacity: 0.3;
                    }
                }
                `}
            </style>
        </>
    );
}
