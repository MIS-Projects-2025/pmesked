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
                </div>
            )}
           
            {[
                "Senior Equipment Technician", "Equipment Technician 1", "Equipment Technician 2", "Equipment Technician 3", "PM Technician 1", "PM Technician 2" ,
                "ESD Technician 1", "ESD Technician 2", "Senior QA Engineer", "DIC Clerk 1",
                 "Equipment Engineer",  "Supervisor - Equipment Technician",  "Senior Equipment Engineer",  "Sr. Equipment Engineer",  "Equipment Engineering Section Head",  "Section Head - Equipment Engineering"


            ].includes(emp_data?.emp_jobtitle) && (
                <div>
            <SidebarLink
                href={route("tnr.massApproved")}
                label="TNR Mass Approved"
                icon={
                    <i className="fa-regular fa-thumbs-up"></i>
                }
                // notifications={5}
            />
            

                </div>
            )}
                {[
                "ESD Technician 1", "ESD Technician 2", "Senior QA Engineer", "DIC Clerk 1",
                 "Equipment Engineer",  "Supervisor - Equipment Technician",  "Senior Equipment Engineer",  "Sr. Equipment Engineer",  "Equipment Engineering Section Head",  "Section Head - Equipment Engineering"


            ].includes(emp_data?.emp_jobtitle) && (
                <div>
                     <SidebarLink
                href={route("calibration.mass.approval")}
                label="Calibration Mass Approved"
                fontSize="10px"
                icon={
                    <i className="fa-solid fa-check-to-slot"></i>
                }
                // notifications={5}
            />

               <SidebarLink
                href={route("ionizer.index")}
                label="Ionizer Checklist"
                fontSize="10px"
                icon={<i className="fas fa-fan"></i>}
                // notifications={5}
            />

            <SidebarLink
                href={route("calibration.IonizerCalibrationReport")}
                label="Ionizer Calibration Report"
                fontSize="10px"
                icon={<i className="fa-solid fa-pen-fancy"></i>}
                // notifications={5}
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
                        href: '',
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
                    
                ]}
                // notification={true}
            />
                </div>
            )}
            
            {["Equipment Engineering"].includes(emp_data?.emp_dept) && !["Equipment Engineering Section Head", "Section Head - Equipment Engineering", "Equipment Technician 1", "Equipment Technician 2", "Equipment Technician 3"].includes(emp_data?.emp_jobtitle) && (
                <div>

                    <SidebarLink
                        href={route("calibration.index")}
                        label="TNR PM Checklist"
                        icon={<i className="fa-solid fa-list"></i>}
                    />

                    <SidebarLink
                        href={route("ionizer-items.index")}
                        label="Checklist Ionizer Items"
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
