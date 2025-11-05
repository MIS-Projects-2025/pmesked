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

        h2,
        h3 {
            margin-top: 20px;
        }

        table {
            border-collapse: collapse;
            margin-top: 8px;
            width: 100%;
            table-layout: fixed;
            /* 🔹 Para di lumampas */
            word-wrap: break-word;
            /* 🔹 Wrap kapag mahaba */
            font-size: 10px;
        }

        th,
        td {
            border: 1px solid #000;
            padding: 4px;
            text-align: left;
            vertical-align: top;
        }

        th {
            background: #f2f2f2;
        }
    </style>
</head>

<body>
    <h2 style="color: #790d0dff; margin-top: -20px; margin-bottom: 30px; text-align: center;"><i class="fa-solid fa-t"></i> Calibration Report</h2>

    {{-- 🔹 Report Summary --}}
    <table>
        <tr>

            <th>Equipment</th>
            <td>{{ $report->equipment ?? '' }}</td>
            <th>Manufacturer</th>
            <td>{{ $report->manufacturer ?? '' }}</td>
            <th>Control No.</th>
            <td>{{ $report->control_no ?? '' }}</td>
            <th>Report No.</th>
            <td>{{ $report->report_no ?? '' }}</td>
        </tr>
        <tr>
            <th>Model</th>
            <td>{{ $report->model ?? '' }}</td>
            <th>Serial</th>
            <td>{{ $report->serial ?? '' }}</td>
            <th>Cal Spec No.</th>
            <td>{{ $report->specs ?? '' }}</td>
            <th>Calibration Interval</th>
            <td>{{ $report->cal_interval ?? '' }}</td>
        </tr>
        <tr>
            <th>Temperature</th>
            <td>{{ $report->temperature ?? '' }}</td>
            <th>Calibration Date</th>
            <td>{{ $report->calibration_date ?? '' }}</td>
            <th>Calibrated By</th>
            <td colspan="3">{{ $report->performed_by ?? '' }}</td>
        </tr>
        <tr>
            <th>Relative Humidity</th>
            <td>{{ $report->relative_humidity ?? '' }}</td>
            <th>Calibration Due</th>
            <td colspan="5">{{ $report->calibration_due ?? '' }}</td>
        </tr>
        <tr>
            <th>Reviewed By</th>
            <td>{{ $report->review_by ?? '' }}</td>
            <th>Review Date</th>
            <td>
                {{ !empty($report['review_date']) 
        ? \Carbon\Carbon::parse($report['review_date'])->format('m/d/Y h:i A') 
        : '' }}
            </td>
            <th>QA Sign</th>
            <td>{{ $report->qa_sign ?? '' }}</td>
            <th>QA Sign Date</th>
            <td>
                {{ !empty($report['qa_sign_date']) 
        ? \Carbon\Carbon::parse($report['qa_sign_date'])->format('m/d/Y h:i A') 
        : '' }}
            </td>

        </tr>
    </table>

    {{-- 🔹 Calibration Standards Used --}}
    @if(!empty($report->cal_std_use))
    <h3 style="margin-bottom: -30px;">Calibration Standards Used</h3>
    <table style="margin-top: 30px;">
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
                <td>
                    {{ !empty($std['cal_date']) 
        ? \Carbon\Carbon::parse($std['cal_date'])->format('m/d/Y') 
        : '' }}
                </td>
                <td>
                    {{ !empty($std['cal_due']) 
        ? \Carbon\Carbon::parse($std['cal_due'])->format('m/d/Y') 
        : '' }}
                </td>
                <td>{{ $std['traceability'] ?? '' }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
    @endif

    {{-- 🔹 Calibration Details --}}
    @if(!empty($report->cal_details))
    <h3 style="margin-bottom: -30px;">Calibration Details</h3>
    <table style="margin-top: 30px;">
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
    <h4 style="margin-top: 10px; justify-content: end;">Maint - 03 (Rev. 5)</h4>
    @endif
</body>

</html>