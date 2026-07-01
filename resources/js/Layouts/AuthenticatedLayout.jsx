import NavBar from "@/Components/NavBar";
import Sidebar from "@/Components/sidebar/SideBar";
import LoadingScreen from "@/Components/LoadingScreen";
import { usePage, router } from "@inertiajs/react";
import { useEffect, useState } from "react";

export default function AuthenticatedLayout({ children }) {
    const { props } = usePage();
    const { emp_data } = props;

    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!emp_data?.emp_id) {
            router.visit(route("login"));
            return;
        }
        setIsLoading(false);
    }, [props]);

    if (isLoading) return <LoadingScreen text="Please wait..." />;

    return (
        <div className="flex h-screen w-screen overflow-hidden">
            {/* Sidebar */}
            <Sidebar />

            {/* Content */}
            <div className="flex flex-col flex-1 min-w-0">
                <NavBar />

                {/* MAIN */}
                <main className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-6">
                    {children}
                </main>
            </div>
        </div>
    );
}

