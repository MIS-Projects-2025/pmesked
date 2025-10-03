<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>Calibration Report</title>
    <style>
        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 12px;
        }

        h3 {
            margin-top: 20px;
        }

        table {
            border-collapse: collapse;
            margin-top: 10px;
        }

        th,
        td {
            border: 1px solid #000;
            padding: 6px;
            text-align: left;
        }
    </style>
</head>

<body>
    <div style="text-align: center;">
        <h2>Calibration Report</h2>
    </div>
    {{-- 🔹 Calibration Standards Used --}}
    @if(!empty($report->cal_std_use))
    <h3>Calibration Standards Used</h3>
    <table width="100%">
        <thead>
            <tr>
                <th>Description</th>
                <th>Manufacturer</th>
                <th>Model No.</th>
                <th>Control No.</th>
                <th>Serial No.</th>
                <th>Accuracy</th>
                <th>Calibration Date</th>
                <th>Calibration Due</th>
                <th>Traceability</th>
            </tr>
        </thead>
        <tbody>
            @foreach($report->cal_std_use as $std)
            <tr>
                <td>{{ $std['description'] ?? '' }}</td>
                <td>{{ $std['cal_manufacturer'] ?? '' }}</td>
                <td>{{ $std['model_no'] ?? '' }}</td>
                <td>{{ $std['cal_control_no'] ?? '' }}</td>
                <td>{{ $std['serial_no'] ?? '' }}</td>
                <td>{{ $std['accuracy'] ?? '' }}</td>
                <td>{{ \Carbon\Carbon::parse($std['cal_date'])->format('m/d/Y H:i:s') ?? '' }}</td>
                <td>{{ \Carbon\Carbon::parse($std['cal_due'])->format('m/d/Y H:i:s') ?? '' }}</td>
                <td>{{ $std['traceability'] ?? '' }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
    @endif

    {{-- 🔹 Calibration Details --}}
    @if(!empty($report->cal_details))
    <h3>Calibration Details</h3>
    <table width="100%">
        <thead>
            <tr>
                <th>Function Tested</th>
                <th>Nominal</th>
                <th>Tolerance</th>
                <th>Unit Under Test</th>
                <th>Standard Instrument</th>
                <th>Disparity</th>
                <th>Correction</th>
                <th>Remarks</th>
            </tr>
        </thead>
        <tbody>
            @foreach($report->cal_details as $detail)
            <tr>
                <td>{{ $detail['function_tested'] ?? '' }}</td>
                <td>{{ $detail['nominal'] ?? '' }}</td>
                <td>{{ $detail['tolerance'] ?? '' }}</td>
                <td>{{ $detail['unit_under_test'] ?? '' }}</td>
                <td>{{ $detail['standard_instrument'] ?? '' }}</td>
                <td>{{ $detail['disparity'] ?? '' }}</td>
                <td>{{ $detail['correction'] ?? '' }}</td>
                <td>{{ $detail['remarks'] ?? '' }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
    @endif
</body>

</html>