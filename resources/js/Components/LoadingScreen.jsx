export default function LoadingScreen({ text = "Loading..." }) {
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 font-[Poppins]">

            {/* Floating Glow Effect */}
            <div className="absolute w-80 h-80 bg-blue-500 opacity-20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute w-72 h-72 bg-purple-500 opacity-20 rounded-full blur-3xl animate-pulse delay-300"></div>

            {/* Content */}
            <div className="relative flex flex-col items-center">
                
                {/* Animated Ring */}
                <div className="relative">
                    <div className="w-28 h-28 border-4 border-transparent border-t-blue-500 border-l-blue-500 rounded-full animate-spin-slow"></div>

                    <div className="absolute inset-0 flex items-center justify-center">
                        <i className="fa-solid fa-gear text-blue-400 text-4xl animate-spin-slower"></i>
                    </div>
                </div>

                {/* Text */}
                <p className="mt-6 text-2xl font-semibold text-white tracking-wide animate-fade-in">
                    {text}
                </p>

                <p className="text-gray-300 text-lg animate-bounce mt-1">•••</p>
            </div>
        </div>
    );
}
