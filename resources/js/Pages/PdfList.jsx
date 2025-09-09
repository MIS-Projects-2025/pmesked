import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { usePage } from "@inertiajs/react";
import DataTable from "react-data-table-component";

export default function PdfList() {
  const { pdfs } = usePage().props;

  const columns = [
    {
      name: "#",
      selector: (row, index) => index + 1,
      width: "70px",
    },
    {
      name: "Filename",
      selector: (row) => row.name,
      sortable: true,
    },
    {
      name: "Actions",
      cell: (row) => (
        <div className="space-x-2">
          <a
            href={row.url}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-blue-500 text-white px-3 py-1 rounded-lg"
          >
            Open
          </a>
          <a
            href={row.url}
            download
            className="bg-green-500 text-white px-3 py-1 rounded-lg"
          >
            Download
          </a>
        </div>
      ),
    },
  ];

  return (
    <AuthenticatedLayout>
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">📑 Available Fillable PDFs</h1>
      <DataTable
        columns={columns}
        data={pdfs}
        pagination
        highlightOnHover
        striped
        responsive
      />
    </div>
    </AuthenticatedLayout>
  );
}
