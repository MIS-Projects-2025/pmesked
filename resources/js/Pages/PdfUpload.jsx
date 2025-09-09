import { useState } from "react";

export default function UploadPdf() {
  const [file, setFile] = useState(null);

  const handleUpload = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("pdf", file);

    const res = await fetch("http://127.0.0.1:8000/api/pdfs/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    alert(data.message);
  };

  return (
    <form onSubmit={handleUpload} className="p-4 border rounded-lg space-y-3">
      <input
        type="file"
        accept="application/pdf"
        onChange={(e) => setFile(e.target.files[0])}
        className="block"
      />
      <button
        type="submit"
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Upload Filled PDF
      </button>
    </form>
  );
}
