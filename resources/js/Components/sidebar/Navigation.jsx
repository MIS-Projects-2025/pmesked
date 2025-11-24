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
            {["pmtech", "seniortech"].includes(emp_data?.emp_system_role) && (
                <div>
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
                        label: "TNR Calibration Report",
                        icon: (
                        <i className="far fa-square"></i>
                        ),
                        // notification: 125,
                    },
                ]}
                />
                </div>
            )}

            {["seniortech"].includes(emp_data?.emp_system_role) && (
                <div>

                    <SidebarLink
                        href={route("tnr.massApproved")}
                        label="TNR Mass Approved"
                        icon={<i className="fa-solid fa-list-check"></i>}
                    />
            </div>
            )}
            
            {["pmtech", "seniortech"].includes(emp_data?.emp_system_role) && (
                <div>
                    <Dropdown
                label="Non-TNR"
                icon={
                    <i className="fa-solid fa-rectangle-list"></i>
                }
                className='disabled'
                links={[
                    {
                        
                        href: route("non-tnr-checklists.index"),
                        label: "Checklist",
                        icon: (
                           <i className="far fa-square"></i>
                        ),
                        className: "opacity-50 pointer-events-none",
                        // notification: true,
                    },
                    {
                        href: route("calibration.calibrationReportNontnr"),
                        label: "Calibration Report",
                        icon: (
                        <i className="far fa-square"></i>
                        ),
                        className: "opacity-50 pointer-events-none",
                        // notification: 125,
                    },

                    
                    {
                        href: route("bake.calibration.index"),
                        label: "Bake Calibration Report",
                        icon: (
                        <i className="far fa-square"></i>
                        ),
                        className: "opacity-50 pointer-events-none",
                        // notification: 125,
                    },
                    
                ]}
                // notification={true}
            />
                </div>
            )}

            {["seniortech"].includes(emp_data?.emp_system_role) && (
                <div>

                    <SidebarLink
                        href={route("non_tnr.mass.index")}
                        label="Non-TNR Mass Approved"
                        icon={<i className="fa-regular fa-calendar-check"></i>}
                    />
            </div>
            )}

             {["pmtech", "seniortech"].includes(emp_data?.emp_system_role) && (
                <div>
                    <Dropdown
                label="Air Ionizer"
                icon={
                    <i className="fas fa-fan"></i>
                }
                className='disabled'
                links={[
                    {
                        href: route("ionizer.index"),
                        label: "Checklist",
                        icon: (
                           <i className="far fa-square"></i>
                        ),
                        className: "opacity-50 pointer-events-none",
                        // notification: true,
                    },

                    {
                        href: route("calibration.IonizerCalibrationReport"),
                        label: "Ionizer Calibration Report",
                        icon: (
                        <i className="far fa-square"></i>
                        ),
                        className: "opacity-50 pointer-events-none",
                        // notification: 125,
                    },

                    {
                        href: route("calibration.dthm.index"),
                        label: "DTHM",
                        icon: (
                        <i className="far fa-square"></i>
                        ),
                        className: "opacity-50 pointer-events-none",
                        // notification: 125,
                    },
                    
                ]}
                // notification={true}
            />
                </div>
            )}

             {["seniortech"].includes(emp_data?.emp_system_role) && (
                <div>

                    <SidebarLink
                        href={route("ionizer.mass.index")}
                        label="Ionizer Mass Approved"
                        icon={<i className="fa-solid fa-clipboard-check"></i>}
                    />
            </div>
            )}

            {["esd"].includes(emp_data?.emp_system_role) && (
                <div>
                    <SidebarLink
                        href={route("calibration.dthm.index")}
                        label="DTHM"
                        icon={<i className="fa-solid fa-list"></i>}
                    />
                </div>
            )}
            
            {["1788"].includes(emp_data?.emp_id) && (
                <div>

                    <SidebarLink
                        href={route("bake.calibration.index")}
                        label="Bake Calibration Report"
                        icon={<i className="fa-solid fa-file-pen"></i>}
                    />
            </div>
            )}

              {["esd", "engineer"].includes(emp_data?.emp_system_role) && (
                <div>

                <Dropdown
                label="Tnr MassApproved"
                icon={
                    <i className="fas fa-file-contract"></i>
                }
                links={[
                    {
                        href: route("tnr.massApproved"),
                        label: "TNR Checklist",
                        icon: (
                           <i className="far fa-square"></i>
                        ),
                        className: "opacity-50 pointer-events-none",
                        // notification: true,
                    },

                    {
                        href: route("calibration.tnr.mass.approval"),
                        label: "TNR Calibration Report",
                        icon: (
                        <i className="far fa-square"></i>
                        ),
                        className: "opacity-50 pointer-events-none",
                        // notification: 125,
                    },
                    
                ]}
                // notification={true}
                />

                <Dropdown
                label="NonTnr MassApproved"
                icon={
                    <i className="fas fa-file"></i>
                }
                links={[
                    {
                        href: route("non_tnr.mass.index"),
                        label: "Non Tnr Checklist",
                        icon: (
                           <i className="far fa-square"></i>
                        ),
                        className: "opacity-50 pointer-events-none",
                        // notification: true,
                    },

                    {
                        href: route("calibration.non-tnr.mass.approval"),
                        label: "Non Tnr Calibration Report",
                        icon: (
                        <i className="far fa-square"></i>
                        ),
                        className: "opacity-50 pointer-events-none",
                        // notification: 125,
                    },
                    
                ]}
                // notification={true}
                />

                <Dropdown
                label="Ionizer MassApproved"
                icon={
                    <i className="fas fa-fan"></i>
                }
                links={[
                    {
                        href: route("ionizer.mass.index"),
                        label: "Ionizer Checklist",
                        icon: (
                           <i className="far fa-square"></i>
                        ),
                        className: "opacity-50 pointer-events-none",
                        // notification: true,
                    },

                    {
                        href: route("ionizer.ionizer.mass.approval"),
                        label: "Ionizer Calibration Report",
                        icon: (
                        <i className="far fa-square"></i>
                        ),
                        className: "opacity-50 pointer-events-none",
                        // notification: 125,
                    },
                    
                ]}
                // notification={true}
                />

                </div>
            )}
            
            {["1742" , "1788"].includes(emp_data?.emp_id) && (
                <div>

                    <SidebarLink
                        href={route("calibration.index")}
                        label="TNR PM Checklist Items"
                        icon={<i className="fa-solid fa-list"></i>}
                    />
            </div>
            )}
             {["17807", "1788"].includes(emp_data?.emp_id) && (
                <div>
                    <SidebarLink
                        href={route("ionizer-items.index")}
                        label="Ionizer Checklist Items"
                        icon={<i className="fa-solid fa-table-list"></i>}
                    />
            </div>
            )}
             {["1088", "1788", "1638"].includes(emp_data?.emp_id) && (
                <div>
                    <SidebarLink
                        href={route("non-tnr-items.index")}
                        label="Non-TNR Checklist Items"
                        icon={<i className="fa-solid fa-table-list"></i>}
                    />
            </div>
            )}


            {["superadmin", "admin", "engineer" ].includes(emp_data?.emp_system_role) || ["pmtech" ].includes(emp_data?.emp_system_role) && ["1742" ].includes(emp_data?.emp_id) && (
                <div>
                    <SidebarLink
                        href={route("admin")}
                        label="PM Personnel"
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
