export default function ThemeToggler({ toggleTheme, theme }) {
    return (
        <div className="flex items-center justify-start pl-3 mt-auto space-x-3 cursor-pointer">
            <div onClick={toggleTheme} className="flex items-center gap-2">
                
                {/* Toggle Icon */}
                <i 
                    className={
                        theme === "dark"
                        ? "fa-solid fa-toggle-on text-4xl text-black drop-shadow-[0_0_6px_rgba(100,149,237,0.9)]"
                        : "fa-solid fa-toggle-off text-4xl text-gray-100 drop-shadow-[0_0_6px_rgba(255,255,255,0.6)]"
                    }
                ></i>

                {/* Text label WITH GLOW (no color changes) */}
                <span
                    className={
                        theme === "dark"
                        ? "text-sm text-gray-100 drop-shadow-[0_0_6px_rgba(0,0,0,0.8)]"
                        : "text-sm text-gray-100 drop-shadow-[0_0_6px_rgba(255,255,255,0.9)]"
                    }
                >
                    {theme === "dark" ? "Dark Mode" : "Light Mode"}
                </span>

            </div>
        </div>
    );
}
