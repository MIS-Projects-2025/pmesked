import { Link, usePage, router } from "@inertiajs/react";
import { useState, useEffect } from "react";
import Navigation from "@/Components/sidebar/Navigation";
import ThemeToggler from "@/Components/sidebar/ThemeToggler";

export default function Sidebar() {
    const { display_name } = usePage().props;
    const [theme, setTheme] = useState("light");
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); // for responsiveness

    useEffect(() => {
        const storedTheme = localStorage.getItem("theme") || "light";
        setTheme(storedTheme);
        document.documentElement.setAttribute("data-theme", storedTheme);
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === "light" ? "dark" : "light";
        setTheme(newTheme);
        document.documentElement.setAttribute("data-theme", newTheme);
        localStorage.setItem("theme", newTheme);
    };

    const formattedAppName = display_name
        ?.split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

    return (
        <div className="flex ">
            {/* Mobile Hamburger */}
            <button
                className="absolute z-50 p-2 rounded top-4 right-4 md:hidden"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
                <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4 6h16M4 12h16M4 18h16"
                    />
                </svg>
            </button>

            {/* Sidebar */}
            <div
                className={`
                    fixed md:relative top-0 left-0 z-40 transition-transform transform bg-gray-500
                    ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
                    md:translate-x-0
                    md:flex
                    flex-col min-h-screen w-[270px] space-y-6 px-4 pb-6 pt-4
                    ${
                        theme === "light"
                            ? "bg-gray-50 text-black"
                            : "bg-base-100 text-base-content"
                    }
                `}
                style={{
                    scrollbarWidth: "none",
                    msOverflowStyle: "none",
                }}
            >
                {/* LOGO */}
                <Link
                    href={route("dashboard")}
                    className="flex items-center pl-[10px] text-lg font-bold"
                >
                    <i className="fa-solid fa-toolbox"></i>
                    <p className="pt-[2px] pl-1">{formattedAppName}</p>
                </Link>

                <Navigation />

                <ThemeToggler toggleTheme={toggleTheme} theme={theme} />
            </div>
        </div>
    );
}
