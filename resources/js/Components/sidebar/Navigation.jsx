import Dropdown from "@/Components/sidebar/Dropdown";
import SidebarLink from "@/Components/sidebar/SidebarLink";
import { usePage } from "@inertiajs/react";

export default function NavLinks() {
    const { emp_data } = usePage().props;
    return (
        <nav
            className="flex flex-col flex-grow space-y-1 overflow-y-auto"
            style={{ scrollbarWidth: "none" }}
        >
            <SidebarLink
                href={route("dashboard")}
                label="Dashboard"
                icon={
                    <i className="fab fa-chromecast"></i>
                }
                // notifications={5}
            />

            <Dropdown
                label="TNR"
                icon={
                    <i className="fas fa-file-contract"></i>
                }
                links={[
                    {
                        href: route("tnr.schedulerTable"),
                        label: "TNR Checklist",
                        icon: (
                           <i className="far fa-square"></i>
                        ),
                        // notification: true,
                    },
                    {
                        href: route("calibration.calibrationReport"),
                        label: "Calibration Report",
                        icon: (
                        <i className="far fa-square"></i>
                        ),
                        // notification: 125,
                    },
                    // {
                    //     href: route("pdfs.index"),   // bagong link
                    //     label: "PDF Fillup",
                    //     icon:  <i className="far fa-square"></i>,
                    // },
                ]}
                // notification={true}
            />
            <Dropdown
                label="Non-TNR"
                icon={
                    <i className="fas fa-file-contract"></i>
                }
                className='disabled'
                links={[
                    {
                        href: '',
                        label: "Checklist",
                        icon: (
                           <i className="far fa-square"></i>
                        ),
                        className: "opacity-50 pointer-events-none",
                        // notification: true,
                    },
                    {
                        href: '',
                        label: "Calibration Report",
                        icon: (
                        <i className="far fa-square"></i>
                        ),
                        className: "opacity-50 pointer-events-none",
                        // notification: 125,
                    },
                    
                ]}
                // notification={true}
            />
            {["superadmin", "admin", "approver"].includes(emp_data?.emp_system_role) && (
                <div>

                    <SidebarLink
                        href={route("calibration.index")}
                        label="Calibration Checklist"
                        icon={<i className="fas fa-list"></i>}
                    />
                    </div>
            )}
            {["superadmin", "admin" ].includes(emp_data?.emp_system_role) && (
                <div>
                    <SidebarLink
                        href={route("admin")}
                        label="Administrators"
                        icon={
                            <i className="fas fa-user-shield"></i>
                        }
                        // notifications={5}
                    />
                </div>
            )}
        </nav>
    );
}
