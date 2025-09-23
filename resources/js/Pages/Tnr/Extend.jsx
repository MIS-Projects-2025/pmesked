import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm } from "@inertiajs/react";

export default function Extend({ scheduler,  empData }) {

    
  const { data, setData, post, processing, errors } = useForm({
    pm_due: scheduler.pm_due || "",
  });

  const submit = (e) => {
    e.preventDefault();
    post(route("tnr.extend.update", { id: scheduler.id }));
  };

  return (
    <AuthenticatedLayout>
      <Head title="Extend PM Due" />

      <div className="max-w-4xl mx-auto bg-gray-100 p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-1 p-6 bg-gradient-to-r from-gray-600 to-black rounded-t-2xl">
          <h1 className="text-2xl font-bold mb-4"><i className="fa-solid fa-up-right-from-square"></i> Extend PM Due</h1>
        </div>
        <form onSubmit={submit} className="space-y-2">
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 font-semibold">Machine</label>
            <input
              type="text"
              value={scheduler.machine_num}
              readOnly
              className="w-full border rounded p-2 bg-gray-100 text-gray-600"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold">Current PM Due</label>
            <input
              type="text"
              name="first_cycle"
              value={scheduler.pm_due}
              readOnly
              className="w-full border rounded p-2 bg-gray-100 text-gray-600"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold">New PM Due</label>
            <input
              type="text"
              value={data.first_cycle}
              name="pm_due"
              onChange={(e) => setData("first_cycle", e.target.value)}
               className="w-full border rounded p-2 text-gray-600"
               placeholder="Enter the new PM due  WW5**..."
            />
            {errors.first_cycle && <p className="text-red-500 text-sm">{errors.first_cycle}</p>}
          </div>

          <div>
            <label className="block text-gray-700 font-semibold">PMNT #</label>
            <input
              type="text"
              name="pmnt_no"
              value={scheduler.pmnt_no}
              readOnly
              className="w-full border rounded p-2 bg-gray-100 text-gray-600"
            />
          </div>
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-4">
            <div>
            <label className="block text-gray-700 font-semibold">Reason</label>
            <textarea name="reason"
              value={scheduler.reason}
              className="w-full h-32 border rounded p-2 text-gray-600"
              required
            ></textarea>
            </div>

            <div>
              <p className="text-lg text-gray-600 hover:text-black hover:font-semibold hover:text-xl hover:text-shadow-white">
                This extension should have no detrimental effect on the performance of the machine or the quality of the 
                unit products. <br/><br/>
                Production shall release this machine for P.M at the end of the extension and shall not start any prodcution 
                run until P.M has been successfully completed.<br/><br/>
                Current P.M. sticker shall not be changed until P.M. is completed. P.M extension sticker shall be placed 
                on the machine.
              </p>
            </div>

            
          </div>

          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 font-semibold">Requestor</label>
            <input 
            type="text" 
            name="requestor"
            value={empData?.emp_name}
            readOnly
            className="w-full border rounded p-2 bg-gray-100 text-gray-600"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold">Date Request</label>
           <input 
            type="text" 
            name="request_date"
            value={new Date().toLocaleString()} // current date & time
            readOnly
            className="w-full border rounded p-2 bg-gray-100 text-gray-600"
           />

            </div>
          </div>

          <div className="flex justify-end">
             <button
          type="button"
            onClick={() => window.history.back()}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded mr-4"
          >
            <i class="fa-solid fa-xmark mr-1"></i>
            Cancel
          </button>

            <button
              type="submit"
              disabled={processing}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
            >
              <i className="fa-solid fa-floppy-disk mr-1"></i>
              Save
            </button>

          

          </div>
          
        </form>
      </div>
    </AuthenticatedLayout>
  );
}
