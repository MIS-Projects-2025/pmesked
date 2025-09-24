import { useState, useEffect } from "react";
import { useForm, usePage } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import DataTable from "@/Components/DataTable";

export default function CalibrationReport({ machines, empData }) {
  const { props } = usePage();
  const reports = props.reports;
  const filters = props.filters || {};
  const user = props.auth?.user;

  // 🔹 Flash messages
  const { flash } = usePage().props;

  useEffect(() => {
    if (flash.success) {
      alert(flash.success);
    }
    if (flash.error) {
      alert(flash.error);
    }
  }, [flash]);

  // 🔹 Modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
const [viewModal, setViewModal] = useState(false);


  // 🔹 Form state (Inertia form helper)
  // const { data, setData, post, processing, reset } = useForm({
  //   equipment: "",
  //   model: "",
  //   serial: "",
  //   manufacturer: "",
  //   control_no: "",
  //   calibration_date: "",
  //   calibration_due: "",
  //   performed_by: empData?.emp_name || user?.name || "",
  //   temperature: "",
  //   relative_humidity: "",
  //   specs: "",
  //   report_no: "",
  //   cal_interval: "",
  // });

  const { data, setData, post, processing, reset } = useForm({
  equipment: "",
  model: "",
  serial: "",
  manufacturer: "",
  control_no: "",
  calibration_date: "",
  calibration_due: "",
  performed_by: empData?.emp_name || user?.name || "",
  temperature: "",
  relative_humidity: "",
  specs: "",
  report_no: "",
  cal_interval: "",
  cal_std_use: [
    {
      description: "",
      cal_manufacturer: "",
      model_no: "",
      cal_control_no: "",
      serial_no: "",
      accuracy: "",
      cal_date: "",
      cal_due: "",
      traceability: "",
    },
  ],
  cal_details: [
    {
      function_tested: "",
      nominal: "",
      tolerance: "",
      unit_under_test: "",
      standard_instrument: "",
      disparity: "",
      correction: "",
      remarks: "",
    },
  ],
});


  // 🔹 Tables state
  const [standards, setStandards] = useState([
    {
      description: "",
      cal_manufacturer: "",
      model_no: "",
      cal_control_no: "",
      serial_no: "",
      accuracy: "",
      cal_date: "",
      cal_due: "",
      traceability: "",
    },
  ]);

  const [details, setDetails] = useState([
    {
      function_tested: "",
      nominal: "",
      tolerance: "",
      unit_under_test: "",
      standard_instrument: "",
      disparity: "",
      correction: "",
      remarks: "",
    },
  ]);

  // 🔹 Compute work week
  const getWorkWeek = (date) => {
    const start = new Date("2024-11-03");
    const diffMs = date - start;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return 501 + Math.floor(diffDays / 7);
  };

  // 🔹 Autofill when selecting machine
  const handleMachineChange = (e) => {
    const selected = e.target.value;
    const machine = machines.find((m) => m.machine_num === selected);
    if (!machine) return;

    const today = new Date();
    const pmDateWW = getWorkWeek(today);
    const dueDate = new Date(today);
    dueDate.setDate(today.getDate() + 5 * 7);
    const pmDueWW = getWorkWeek(dueDate);

    setData((prev) => ({
      ...prev,
      equipment: selected,
      model: machine?.model ?? machine?.machine_model ?? "",
      serial: machine?.serial ?? machine?.serial_no ?? "",
      manufacturer: machine?.machine_manufacturer ?? machine?.manufacturer ?? "",
      control_no: machine?.cn_no ?? machine?.control_no ?? "",
      calibration_date: `WW${pmDateWW}`,
      calibration_due: `WW${pmDueWW}`,
      performed_by: empData?.emp_name || user?.name || "",
      temperature: "",
      relative_humidity: "",
      specs: "",
      report_no: "",
      cal_interval: "",
    }));
  };

  // 🔹 Table row handlers
const handleStandardChange = (index, e) => {
  const { name, value } = e.target;
  const updated = [...standards];
  updated[index] = { ...updated[index], [name]: value };
  setStandards(updated);

  // Sync with Inertia form data
  setData("cal_std_use", updated);
};

const handleDetailChange = (index, e) => {
  const { name, value } = e.target;
  const updated = [...details];
  updated[index] = { ...updated[index], [name]: value };
  setDetails(updated);

  // Sync with Inertia form data
  setData("cal_details", updated);
};


  const addStandardRow = () => {
    setStandards([
      ...standards,
      {
        description: "",
        cal_manufacturer: "",
        model_no: "",
        cal_control_no: "",
        serial_no: "",
        accuracy: "",
        cal_date: "",
        cal_due: "",
        traceability: "",
      },
    ]);
  };

  const removeStandardRow = (i) => {
    const updated = [...standards];
    updated.splice(i, 1);
    setStandards(updated);
  };

  const addDetailRow = () => {
    setDetails([
      ...details,
      {
        function_tested: "",
        nominal: "",
        tolerance: "",
        unit_under_test: "",
        standard_instrument: "",
        disparity: "",
        correction: "",
        remarks: "",
      },
    ]);
  };

  const removeDetailRow = (i) => {
    const updated = [...details];
    updated.splice(i, 1);
    setDetails(updated);
  };

  // 🔹 Submit form
// const handleSubmit = () => {

//   post(route("calibration-reports.store"), {
//     preserveScroll: true,
//     data: {
//       ...data,
//       cal_std_use: standards,
//       cal_details: details,
//     },
//     onSuccess: () => {
//       alert("✅ Calibration Report saved successfully!");

//       reset();
//       setStandards([
//         {
//           description: "",
//           cal_manufacturer: "",
//           model_no: "",
//           cal_control_no: "",
//           serial_no: "",
//           accuracy: "",
//           cal_date: "",
//           cal_due: "",
//           traceability: "",
//         },
//       ]);
//       setDetails([
//         {
//           function_tested: "",
//           nominal: "",
//           tolerance: "",
//           unit_under_test: "",
//           standard_instrument: "",
//           disparity: "",
//           correction: "",
//           remarks: "",
//         },
//       ]);
//       setShowModal(false);
//     },
//     onError: (errors) => {
//       console.error(errors);
//       alert("❌ Failed to save Calibration Report!");
//     },
//   });
// };

const handleSubmit = () => {
  const filteredStandards = standards.filter(
    (s) => Object.values(s).some((v) => v !== "")
  );
  const filteredDetails = details.filter(
    (d) => Object.values(d).some((v) => v !== "")
  );

  post(route("calibration-reports.store"), {
    preserveScroll: true,
    data: {
      ...data,
      cal_std_use: filteredStandards,
      cal_details: filteredDetails,
    },
    onSuccess: () => {
      alert("✅ Calibration Report saved successfully!");
      reset();
      setStandards([
        {
          description: "",
          cal_manufacturer: "",
          model_no: "",
          cal_control_no: "",
          serial_no: "",
          accuracy: "",
          cal_date: "",
          cal_due: "",
          traceability: "",
        },
      ]);
      setDetails([
        {
          function_tested: "",
          nominal: "",
          tolerance: "",
          unit_under_test: "",
          standard_instrument: "",
          disparity: "",
          correction: "",
          remarks: "",
        },
      ]);
      setShowModal(false);
    },
    onError: (errors) => {
      console.error(errors);
      alert("❌ Failed to save Calibration Report!");
    },
  });
};





const dataWithAction = reports.data.map((r) => ({
  ...r,
  action: (
    <button
       className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
      onClick={() => {
        setSelectedReport(r);
        setViewModal(true);
      }}
    >
      <i className="fas fa-eye"></i> View
    </button>
  ),
}));


  return (
    <AuthenticatedLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold">Calibration Report</h1>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            + New Report
          </button>
        </div>

        {/* DataTable */}
        <DataTable
          columns={[
            { key: "equipment", label: "Equipment" },
            { key: "model", label: "Model" },
            { key: "performed_by", label: "Performed By" },
            { key: "review_by", label: "Reviewed By" },
            { key: "calibration_date", label: "Calibration Date" },
            { key: "calibration_due", label: "Calibration Due" },
            { key: "action", label: "Action" },
          ]}
          data={dataWithAction}
          meta={{
            from: reports.from,
            to: reports.to,
            total: reports.total,
            links: reports.links,
            currentPage: reports.current_page,
            lastPage: reports.last_page,
          }}
          routeName={route("calibration.calibrationReport")}
          filters={filters}
          rowKey="id"
          sortBy="id"
          sortOrder="desc"
        />

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded shadow-lg w-10/12 max-h-[90vh] overflow-y-auto border-t-4 border-blue-600">
              <div className="flex justify-between items-center bg-gradient-to-r from-gray-600 to-black text-white p-4 rounded-t-lg sticky top-0 z-10">
                <h2 className="text-lg font-bold mt-4 ml-4">
                  <i className="fas fa-list"></i> New Calibration Report
                </h2>
                 <button
                  className="text-white text-xl"
                  onClick={() => setShowModal(false)}
                >
                  <i className="fas fa-times text-red-500 hover:text-red-700"></i>
                </button>
              </div>

              {/* 🔹 Machine Info */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div>
                  <label className="block font-semibold text-gray-500">
                    Machine
                  </label>
                  <select
                    name="equipment"
                    value={data.equipment}
                    onChange={handleMachineChange}
                    className="border p-2 rounded w-full text-gray-600"
                  >
                    <option value="">-- Select Equipment --</option>
                    {machines.map((m, index) => (
                      <option
                        key={`${m.machine_num}-${index}`}
                        value={m.machine_num}
                      >
                        {m.machine_num}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-500">
                    Manufacturer
                  </label>
                  <input
                    name="manufacturer"
                    value={data.manufacturer}
                    onChange={(e) =>
                      setData("manufacturer", e.target.value)
                    }
                    placeholder="Machine Manufacturer"
                    className="border p-2 rounded w-full text-gray-600"
                    readOnly
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-500">
                    CN No.
                  </label>
                  <input
                    name="control_no"
                    value={data.control_no}
                    onChange={(e) => setData("control_no", e.target.value)}
                    placeholder="CN No."
                    className="border p-2 rounded w-full text-gray-600"
                    readOnly
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-500">
                    Perform By
                  </label>
                  <div className="relative">
                    <input
                      name="performed_by"
                      value={data.performed_by}
                      readOnly
                      className="border p-2 rounded bg-gray-100 text-sky-400 pl-8 w-full"
                    />
                    <i className="fas fa-user-gear absolute left-2 top-1/2 transform -translate-y-1/2 text-sky-300"></i>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-gray-500">
                    Calibration Date
                  </label>
                  <input
                    type="text"
                    name="calibration_date"
                    value={data.calibration_date}
                    onChange={(e) =>
                      setData("calibration_date", e.target.value)
                    }
                    className="border p-2 rounded w-full text-gray-600"
                    readOnly
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-500">
                    Calibration Due
                  </label>
                  <input
                    type="text"
                    name="calibration_due"
                    value={data.calibration_due}
                    onChange={(e) => setData("calibration_due", e.target.value)}
                    className="border p-2 rounded w-full text-gray-600"
                    readOnly
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-500">
                    Model
                  </label>
                  <input
                    name="model"
                    value={data.model}
                    onChange={(e) => setData("model", e.target.value)}
                    placeholder="Model"
                    className="border p-2 rounded w-full text-gray-600"
                    readOnly
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-500">
                    Serial
                  </label>
                  <input
                    name="serial"
                    value={data.serial}
                    onChange={(e) => setData("serial", e.target.value)}
                    placeholder="Serial"
                    className="border p-2 rounded w-full text-gray-600"
                    readOnly
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-500">
                    Temperature (°C)
                  </label>
                  <input
                    name="temperature"
                    value={data.temperature}
                    onChange={(e) => setData("temperature", e.target.value)}
                    placeholder="XX.X... °C"
                    className="border p-2 rounded w-full text-gray-600"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-500">
                    Relative Humidity (%)
                  </label>
                  <input
                    name="relative_humidity"
                    value={data.relative_humidity}
                    onChange={(e) => setData("relative_humidity", e.target.value)}
                    placeholder="XX.X... % "
                    className="border p-2 rounded w-full text-gray-600"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-500">
                    Cal. Specs No.
                  </label>
                  <input
                    name="specs"
                    value={data.specs}
                    onChange={(e) => setData("specs", e.target.value)}
                    placeholder="TFPXX-XXX..."
                    className="border p-2 rounded w-full text-gray-600"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-500">
                    Report No.
                  </label>
                  <input
                    name="report_no"
                    value={data.report_no}
                    onChange={(e) => setData("report_no", e.target.value)}
                    placeholder="XX..."
                    className="border p-2 rounded w-full text-gray-600"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-500">
                    Cal Interval
                  </label>
                  <input
                    name="cal_interval"
                    value={data.cal_interval}
                    onChange={(e) => setData("cal_interval", e.target.value)}
                    placeholder="Quarterly..."
                    className="border p-2 rounded w-full text-gray-600"
                    required
                  />
                </div>
              </div>

              {/* 🔹 Calibration Standard Used */}
              <h3 className="text-md font-semibold text-gray-600 mb-2">
                Calibration Standard Used
              </h3>
              <table className="w-full border mb-3 text-sm">
                <thead className="bg-gray-400">
                  <tr>
                    <th className="border p-2">Description</th>
                    <th className="border p-2">Manufacturer</th>
                    <th className="border p-2">Model No.</th>
                    <th className="border p-2">Control No.</th>
                    <th className="border p-2">Serial No.</th>
                    <th className="border p-2">Accuracy</th>
                    <th className="border p-2">Cal Date</th>
                    <th className="border p-2">Cal Due</th>
                    <th className="border p-2">Traceability</th>
                    <th className="border p-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {standards.map((row, i) => (
                    <tr key={i}>
                      {Object.keys(row).map((key) => (
                        <td key={key} className="border p-2 text-gray-600">
                          <input
                            type={
                              key === "cal_date" || key === "cal_due"
                                ? "date"
                                : "text"
                            }
                            name={key}
                            value={row[key]}
                            onChange={(e) => handleStandardChange(i, e)}
                            className="w-full border p-1 rounded"
                          />
                        </td>
                      ))}
                      <td className="border p-2 text-center">
                        <button
                          onClick={() => removeStandardRow(i)}
                          className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button
                onClick={addStandardRow}
                className="mb-6 px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
              >
                <i className="fas fa-plus"></i> Add Row
              </button>

              {/* 🔹 Calibration Details */}
              <h3 className="text-md font-semibold text-gray-600 mb-2">
                Calibration Details
              </h3>
              <table className="w-full border mb-3 text-sm">
                <thead className="bg-gray-400">
                  <tr>
                    <th className="border p-2">Function Tested</th>
                    <th className="border p-2">Nominal</th>
                    <th className="border p-2">Tolerance</th>
                    <th className="border p-2">Actual Reading (UUT)</th>
                    <th className="border p-2">Actual Reading (Std Inst.)</th>
                    <th className="border p-2">Disparity</th>
                    <th className="border p-2">Correction</th>
                    <th className="border p-2">Remarks</th>
                    <th className="border p-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {details.map((row, i) => (
                    <tr key={i}>
                      {Object.keys(row).map((key) => (
                        <td key={key} className="border p-2 text-gray-600">
                          <input
                            type="text"
                            name={key}
                            value={row[key]}
                            onChange={(e) => handleDetailChange(i, e)}
                            className="w-full border p-1 rounded"
                          />
                        </td>
                      ))}
                      <td className="border p-2 text-center">
                        <button
                          onClick={() => removeDetailRow(i)}
                          className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button
                onClick={addDetailRow}
                className="mb-6 px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
              >
                <i className="fas fa-plus"></i> Add Row
              </button>

              {/* 🔹 Action buttons */}
              <div className="flex justify-end gap-2 mt-4 border-t pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded bg-red-500 text-white hover:bg-red-600"
                >
                  <i className="fas fa-times mr-2"></i>
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={processing}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  <i className="fas fa-save mr-2"></i>
                  {processing ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        )}

        {viewModal && selectedReport && (
  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
    <div className="bg-white p-6 rounded shadow-lg w-10/12 max-h-[90vh] overflow-y-auto border-t-4 border-blue-600">
       <div className="flex justify-between items-center bg-gradient-to-r from-gray-600 to-black text-white p-4 rounded-t-lg sticky top-0 z-10">
        <h2 className="text-lg font-bold ml-4"> <i className="fa-regular fa-rectangle-list"></i> Calibration Report View</h2>
        <button
                  className="text-white text-xl"
                  onClick={() => setViewModal(false)}
                >
                  <i className="fas fa-times text-red-500 hover:text-red-700"></i>
                </button>
      </div>

      {/* Machine info - read only */}
      <div className="grid grid-cols-4 gap-4 mb-6 mt-4 text-gray-500 ">
        {["equipment", "manufacturer", "control_no", "performed_by", "calibration_date", "calibration_due", "model", "serial", "temperature", "relative_humidity", "specs", "report_no", "cal_interval"].map((key) => (
          <div key={key}>
            <label className="block font-semibold">{key.replace(/_/g, " ")}</label>
            <input
              type="text"
              value={selectedReport[key] || ""}
              readOnly
              className="border p-2 rounded w-full text-gray-600 bg-gray-100"
            />
          </div>
        ))}
      </div>
    
      {/* Calibration Standard Used */}
      <h3 className="text-md font-semibold mb-2 text-gray-500">Calibration Standard Used</h3>
      
      <table className="w-full border mb-3 text-sm">
        <thead className="bg-gray-400">
          <tr>
            {Object.keys(selectedReport.cal_std_use?.[0] || {}).map((key) => (
              <th key={key} className="border p-2">{key.replace(/_/g, " ")}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {selectedReport.cal_std_use?.map((row, i) => (
            <tr key={i}>
              {Object.keys(row).map((key) => (
                <td key={key} className="border p-2 text-gray-500">
                  <input type="text" value={row[key]} readOnly className="w-full border p-1 rounded bg-gray-100" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Calibration Details */}
      <h3 className="text-md font-semibold mb-2 text-gray-500">Calibration Details</h3>
      <table className="w-full border mb-3 text-sm">
        <thead className="bg-gray-400">
          <tr>
            {Object.keys(selectedReport.cal_details?.[0] || {}).map((key) => (
              <th key={key} className="border p-2">{key.replace(/_/g, " ")}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {selectedReport.cal_details?.map((row, i) => (
            <tr key={i}>
              {Object.keys(row).map((key) => (
                <td key={key} className="border p-2 text-gray-500">
                  <input type="text" value={row[key]} readOnly className="w-full border p-1 rounded bg-gray-100" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      

      <div className="flex justify-end mt-4">
        <button
          type="button"
          onClick={() => setViewModal(false)}
          className="px-4 py-2 border rounded bg-red-500 text-white hover:bg-red-600"
        >
          <i className="fas fa-times mr-2"></i>
          Close
        </button>
      </div>
    </div>
  </div>
        )}

      </div>
    </AuthenticatedLayout>
  );
}
