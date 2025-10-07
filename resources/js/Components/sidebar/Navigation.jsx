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
            {["Equipment Engineering"].includes(emp_data?.emp_dept) && !["Equipment Engineer",  "Supervisor - Equipment Technician",  "Senior Equipment Engineer",  "Sr. Equipment Engineer",  "Equipment Engineering Section Head",  "Section Head - Equipment Engineering"].includes(emp_data?.emp_jobtitle) && (
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

                    {
                        href: route("tnr.massApproved"),   // bagong link
                        label: "Tnr Mass Approved",
                        icon:  <i className="far fa-square"></i>,
                    },
                ]}
                // notification={true}
                />
                </div>
            )}
           
                {[
                "ESD Technician 1", "ESD Technician 2", "Senior QA Engineer", "DIC Clerk 1",
                 "Equipment Engineer",  "Supervisor - Equipment Technician",  "Senior Equipment Engineer",  "Sr. Equipment Engineer",  "Equipment Engineering Section Head",  "Section Head - Equipment Engineering"


            ].includes(emp_data?.emp_jobtitle) && (
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

            {["ESD Technician 1", "ESD Technician 2", "Senior QA Engineer", "DIC Clerk 1"].includes(emp_data?.emp_jobtitle) && (
                <div>
                    <SidebarLink
                        href={route("calibration.dthm.index")}
                        label="DTHM"
                        icon={<i className="fa-solid fa-list"></i>}
                    />
                </div>
            )}
           

            {["Equipment Engineering"].includes(emp_data?.emp_dept) && !["Equipment Engineer",  "Supervisor - Equipment Technician",  "Senior Equipment Engineer",  "Sr. Equipment Engineer",  "Equipment Engineering Section Head",  "Section Head - Equipment Engineering"].includes(emp_data?.emp_jobtitle) && (
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
                        href: route("non_tnr.mass.index"),
                        label: "Non Tnr Mass Approved",
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

             {["Equipment Engineering"].includes(emp_data?.emp_dept) && !["Equipment Engineer",  "Supervisor - Equipment Technician",  "Senior Equipment Engineer",  "Sr. Equipment Engineer",  "Equipment Engineering Section Head",  "Section Head - Equipment Engineering"].includes(emp_data?.emp_jobtitle) && (
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

                    {
                        href: route("ionizer.mass.index"),
                        label: "Ionizer Mass Approved Checklist",
                        icon: (
                           <i className="far fa-square"></i>
                        ),
                        className: "opacity-50 pointer-events-none",
                        // notification: true,
                    },
                    
                ]}
                // notification={true}
            />
                </div>
            )}
            
            {["Equipment Engineering"].includes(emp_data?.emp_dept) && !["Equipment Engineering Section Head", "Section Head - Equipment Engineering"].includes(emp_data?.emp_jobtitle) && (
                <div>

                    <SidebarLink
                        href={route("calibration.index")}
                        label="TNR PM Checklist Items"
                        icon={<i className="fa-solid fa-list"></i>}
                    />

                    <SidebarLink
                        href={route("ionizer-items.index")}
                        label="Ionizer Checklist Items"
                        icon={<i className="fa-solid fa-table-list"></i>}
                    />

                    <SidebarLink
                        href={route("non-tnr-items.index")}
                        label="Non-TNR Checklist Items"
                        icon={<i className="fa-solid fa-table-list"></i>}
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
