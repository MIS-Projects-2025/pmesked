<?php

namespace App\Http\Controllers;

use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\File;
use Inertia\Inertia;

class PdfController extends Controller
{
    public function listPdfs()
    {
        $path = public_path('forms');

        // Auto-create folder kung wala pa
        if (!file_exists($path)) {
            mkdir($path, 0777, true);
        }

        $files = File::files($path);

        $pdfs = [];
        foreach ($files as $file) {
            if ($file->getExtension() === 'pdf') {
                $pdfs[] = [
                    'name' => $file->getFilename(),
                    'url'  => url('forms/' . $file->getFilename()),
                ];
            }
        }

        // Render React component via Inertia
        return Inertia::render('PdfList', [
            'pdfs' => $pdfs,
        ]);
    }

    public function uploadFilledPdf(Request $request)
    {
        $request->validate([
            'pdf' => 'required|mimes:pdf|max:20480', // max 20MB
        ]);

        $path = $request->file('pdf')->store('forms_save', 'public');

        return response()->json([
            'message' => 'PDF uploaded successfully!',
            'path' => $path,
            'url' => asset('storage/' . $path),
        ]);
    }
}
