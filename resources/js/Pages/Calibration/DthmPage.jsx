import React, { useState, useEffect } from "react";
import { useForm, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import DataTable from "@/Components/DataTable";

export default function DthmPage({ records = [], emp_data }) {
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const { data, setData, post, processing, reset } = useForm({
    control_no: "",
    ip_address: "",
    location: "",
    performed_by: emp_data?.emp_name ?? "",
    cal_date: "",
    cal_due: "",
    recording_interval: "",
    temp_offset: "",
    rh_offset: "",
    sample_frequency: "",
    master_temp: "",
    master_humidity: "",
    test_temp: "",
    test_humidity: "",
    expand_temp: "",
    expand_humidity: "",
    qa_sign: "",
    qa_sign_date: "",
  });

  // 🟩 AUTO-SET cal_date (today) & cal_due (+92 days)
  useEffect(() => {
    if (showModal) {
      const today = new Date();
      const due = new Date(today);
      due.setDate(today.getDate() + 92);

      const formatDate = (d) => {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        return `${mm}/${dd}/${yyyy}`; // MM/DD/YYYY
      };

      setData((prev) => ({
        ...prev,
        cal_date: formatDate(today),
        cal_due: formatDate(due),
      }));
    }
  }, [showModal]);

  // 🟩 Handle submit
  const handleSubmit = (e) => {
    e.preventDefault();
    post(route("calibration.dthm.store"), {
      onSuccess: () => {
        alert("✅ Record added successfully!");
        setShowModal(false);
        reset();
      },
    });
  };

  // 🟦 Handle View
  const handleView = (record) => {
    setSelectedRecord(record);
    setShowViewModal(true);
  };

  // Determine if current user is QA
 const isQA = ["esd"].includes(emp_data.emp_system_role);

// Handler for QA verification
const handleQAVerify = (id) => {
  if (!confirm("Confirm QA verification for this record?")) return;

  router.post(route("calibration.dthm.qa.verify"), { id }, {
    onSuccess: () => {
      alert("✅ Record verified successfully!");
      setShowViewModal(false);
    },
  });
};

// 🟩 Add View button + QA badge column
const dataWithAction = records.data
  ? records.data.map((rec) => ({
      ...rec,
      qa_sign: rec.qa_sign
        ? `✅ ${rec.qa_sign}`
        : "⚠️ Waiting for Verification",
      action: (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => handleView(rec)}
            className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-700 transition"
          >
            <i className="fas fa-eye mr-1"></i>View
          </button>
          {isQA && !rec.qa_sign && (
            <button
              onClick={() => handleQAVerify(rec.id)}
              className="px-4 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 transition"
            >
              <i className="fas fa-check mr-1"></i>QA Verify
            </button>
          )}
        </div>
      ),
    }))
  : [];



  return (
    <AuthenticatedLayout>
      <div className="p-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-5">
          <h1 className="text-xl font-semibold">
            <i className="fa-solid fa-sheet-plastic"></i>
             Thermohygrometer Calibration Data Log Sheet
          </h1>
         {["Equipment Engineering"].includes(emp_data?.emp_dept) && (
             <button
            onClick={() => setShowModal(true)}
            className="bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition border border-gray-900"
          >
            + Add New
          </button>
          )}
         
        </div>

        {/* 🧾 DataTable */}
<DataTable
  columns={[
    { key: "control_no", label: "Control No" },
    { key: "location", label: "Location" },
    { key: "performed_by", label: "Performed By" },
    { key: "cal_date", label: "Cal Date" },
    { key: "cal_due", label: "Cal Due" },
    { key: "master_temp", label: "Master Temp" },
    { key: "master_humidity", label: "Master Humidity" },
    { key: "qa_sign", label: "QA Verified" },
    { key: "action", label: "Action" },
  ]}
  data={dataWithAction}
  meta={{
    from: records.from,
    to: records.to,
    total: records.total,
    links: records.links,
    currentPage: records.current_page,
    lastPage: records.last_page,
  }}
  routeName={route("calibration.dthm.index")}
  rowKey="id"
  sortBy="id"
  sortOrder="desc"
/>


        {/* ➕ Add Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
            <div className="bg-white w-full max-w-5xl rounded-xl shadow-xl p-6  border-2 border-yellow-500">
              <h2 className="text-lg font-semibold mb-4 text-gray-500">
                <i className="fas fa-plus mr-2"></i> New Thermohygrometer Record
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* General Info */}
                <div className="grid grid-cols-5 gap-4">
                  {[
                    "control_no",
                    "ip_address",
                    "location",
                    "cal_date",
                    "cal_due",
                    "performed_by",
                    "recording_interval",
                    "temp_offset",
                    "rh_offset",
                    "sample_frequency",
                  ].map((key) => (
                    <div key={key}>
                      <label className="block text-xs uppercase font-semibold text-gray-600 mb-1">
                        {key.replace(/_/g, " ")}
                      </label>
                      <input
                        type="text"
                        name={key}
                        value={data[key]}
                        onChange={(e) => setData(key, e.target.value)}
                        readOnly={
                          key === "cal_date" ||
                          key === "cal_due" ||
                          key === "performed_by"
                        }
                        className={`w-full border border-gray-300 text-gray-600 rounded-md p-2 text-sm focus:ring-1 focus:ring-blue-400 ${
                          key === "cal_date" ||
                          key === "cal_due" ||
                          key === "performed_by"
                            ? "bg-gray-100"
                            : ""
                        }`}
                      />
                    </div>
                  ))}
                </div>

                       {/* ⚠️ Remarks Section */}
<div className="mt-6">
  <h3 className="text-base font-semibold text-gray-700 mb-3 flex items-center">
    <i className="fas fa-exclamation-triangle text-yellow-500 mr-2"></i>
    Remarks
  </h3>

  <div className="bg-yellow-50 border-l-2 border-yellow-400 rounded-lg p-4 space-y-2 shadow-sm">
    <p className="text-sm text-gray-700 leading-relaxed">
      ⚠️ Anyway, or develop inconsistent readings, the result may not be valid and the unit with the calibration results in the tables refer to the data at the time of calibration and should the instrument be modified or damaged in require recalibration. The user should determine the sustainability of this instrument for its intended use.
    </p>

    <p className="text-sm text-gray-700 font-medium">
      ⚙️ <span className="font-semibold">DUC</span> = Device Under Calibration
    </p>
  </div>
</div>

                {/* Temp/Humidity */}
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">
                    🌡 Temperature & Humidity Readings
                  </h3>
                  <table className="w-full border text-sm text-gray-700">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border p-2">Reading Type</th>
                        <th className="border p-2">Temperature (°C)</th>
                        <th className="border p-2">Humidity (%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ["Master Reference", "master_temp", "master_humidity"],
                        ["Test Instrument(DUC)", "test_temp", "test_humidity"],
                        ["Expanded Uncertainty(±)", "expand_temp", "expand_humidity"],
                      ].map(([label, tempKey, humKey]) => (
                        <tr key={label}>
                          <td className="border p-2 font-medium">{label}</td>
                          <td className="border p-2">
                            <input
                              type="text"
                              name={tempKey}
                              value={data[tempKey]}
                              onChange={(e) => setData(tempKey, e.target.value)}
                              className="w-full border border-gray-300 rounded-md p-1 text-sm"
                            />
                          </td>
                          <td className="border p-2">
                            <input
                              type="text"
                              name={humKey}
                              value={data[humKey]}
                              onChange={(e) => setData(humKey, e.target.value)}
                              className="w-full border border-gray-300 rounded-md p-1 text-sm"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Buttons */}
                <div className="flex justify-end mt-6 gap-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md"
                  >
                    <i className="fas fa-times mr-2"></i> Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={processing}
                    className="bg-green-600 text-white px-5 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    <i className="fas fa-save mr-2"></i>
                    {processing ? "Saving..." : "Save"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

   {/* 👁️ View Modal */}
{showViewModal && selectedRecord && (
  <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50 overflow-y-auto rounded">
    <div className="bg-white w-full max-w-5xl rounded-xl shadow-xl p-6">
      <h2 className="text-lg font-semibold mb-4 text-gray-700 flex items-center border-b-2 border-blue-500 pb-2">
       <i className="fas fa-eye text-blue-600 mr-2"></i>
        View Thermohygrometer Calibration Data Logsheet
      </h2>
{/* 🧾 View PDF Button */}
<div className="flex justify-end mb-4">
  <button
    type="button"
    onClick={() =>
      window.open(route("calibration.dthm.pdf", { id: selectedRecord.id }), "_blank")
    }
    className="px-3 py-2 bg-gray-100 text-red-600 rounded shadow hover:bg-red-700 hover:text-white border-2 border-red-600 hover:border-gray-500 flex items-center text-bold"
  >
    <i className="fas fa-file-pdf mr-2"></i> View PDF
  </button>
  </div>
      <form className="space-y-6">
        {/* General Info */}
        <div className="grid grid-cols-5 gap-4">
          {[
            "control_no",
            "ip_address",
            "location",
            "cal_date",
            "cal_due",
            "performed_by",
            "recording_interval",
            "temp_offset",
            "rh_offset",
            "sample_frequency",
          ].map((key) => (
            <div key={key}>
              <label className="block text-xs uppercase font-semibold text-gray-600 mb-1">
                {key.replace(/_/g, " ")}
              </label>
              <input
                type="text"
                value={selectedRecord[key] ?? ""}
                readOnly
                className="w-full border border-gray-300 text-gray-600 bg-gray-100 rounded-md p-2 text-sm"
              />
            </div>
          ))}
        </div>

        {/* ⚠️ Remarks Section */}
<div className="mt-6">
  <h3 className="text-base font-semibold text-gray-700 mb-3 flex items-center">
    <i className="fas fa-exclamation-triangle text-yellow-500 mr-2"></i>
    Remarks
  </h3>

  <div className="bg-yellow-50 border-l-2 border-yellow-400 rounded-lg p-4 space-y-2 shadow-sm">
    <p className="text-sm text-gray-700 leading-relaxed">
      ⚠️ Anyway, or develop inconsistent readings, the result may not be valid and the unit with the calibration results in the tables refer to the data at the time of calibration and should the instrument be modified or damaged in require recalibration. The user should determine the sustainability of this instrument for its intended use.
    </p>

    <p className="text-sm text-gray-700 font-medium">
      ⚙️ <span className="font-semibold">DUC</span> = Device Under Calibration
    </p>
  </div>
</div>


        {/* Temperature & Humidity Readings */}
        <div>
          <h3 className="font-semibold text-gray-700 mb-2">
            🌡 Temperature & Humidity Readings
          </h3>
          <table className="w-full border text-sm text-gray-700">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2">Reading Type</th>
                <th className="border p-2">Temperature (°C)</th>
                <th className="border p-2">Humidity (%)</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Master Reference", "master_temp", "master_humidity"],
                ["Test Instrument(DUC)", "test_temp", "test_humidity"],
                ["Expanded Uncertainty(±)", "expand_temp", "expand_humidity"],
              ].map(([label, tempKey, humKey]) => (
                <tr key={label}>
                  <td className="border p-2 font-medium">{label}</td>
                  <td className="border p-2">
                    <input
                      type="text"
                      value={selectedRecord[tempKey] ?? ""}
                      readOnly
                      className="w-full border border-gray-300 bg-gray-100 rounded-md p-1 text-sm"
                    />
                  </td>
                  <td className="border p-2">
                    <input
                      type="text"
                      value={selectedRecord[humKey] ?? ""}
                      readOnly
                      className="w-full border border-gray-300 bg-gray-100 rounded-md p-1 text-sm"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* QA Sign section */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs uppercase font-semibold text-gray-600 mb-1">
              QA Sign
            </label>
            <input
              type="text"
              value={selectedRecord.qa_sign ?? "Waiting for verification..."}
              readOnly
              className="w-full border border-gray-300 bg-gray-100 rounded-md p-2 text-sm text-gray-600"
            />
          </div>
          <div>
            <label className="block text-xs uppercase font-semibold text-gray-600 mb-1">
              QA Sign Date
            </label>
            <input
              type="text"
              value={selectedRecord.qa_sign_date ?? "Waiting for verification..."}
              readOnly
              className="w-full border border-gray-300 bg-gray-100 rounded-md p-2 text-sm text-gray-600"
            />
          </div>
        </div>

       {/* Buttons */}
<div className="flex justify-end mt-6 gap-2">
  

  {/* ✅ QA Verification Button (Visible only to QA roles) */}
  {isQA && !selectedRecord.qa_sign && (
    <button
      type="button"
      onClick={() => handleQAVerify(selectedRecord.id)}
      className="bg-amber-500 hover:bg-amber-600 text-white px-5 py-2 rounded-md"
    >
      <i className="fas fa-check mr-2"></i> Verify (QA Sign)
    </button>
  )}

  <button
    type="button"
    onClick={() => setShowViewModal(false)}
    className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-md"
  >
    <i className="fas fa-times"></i> Close
  </button>
</div>

      </form>
    </div>
  </div>
)}


      </div>
    </AuthenticatedLayout>
  );
}
