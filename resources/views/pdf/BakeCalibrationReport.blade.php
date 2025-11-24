<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>Bake Oven Calibration Report</title>

    <style>
        @page {
            margin: 20px;
        }

        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 11px;
            color: #333;
            margin: 0;
            padding: 0;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 16px;
        }

        th,
        td {
            border: 1px solid #444;
            padding: 6px;
        }

        th {
            background: #efefef;
            font-weight: bold;
        }

        .section-title {
            margin: 15px 0 8px;
            font-size: 13px;
            font-weight: bold;
        }

        .header {
            font-size: 18px;
            font-weight: bold;
            text-align: center;
            margin-bottom: 20px;
        }

        .page-break {
            page-break-before: always;
        }

        tr,
        td,
        th {
            page-break-inside: avoid;
        }
    </style>
</head>

<body>

    {{-- PAGE 1 --}}
    <div class="header">Bake Oven Calibration Report</div>

    <table>
        <tbody>
            <tr>
                <th>Machine Number</th>
                <td>{{ $report->machine_num }}</td>
            </tr>
            <tr>
                <th>Controller Number</th>
                <td>{{ $report->control_no }}</td>
            </tr>
            <tr>
                <th>Serial Number</th>
                <td>{{ $report->serial_no }}</td>
            </tr>
            <tr>
                <th>Performed By</th>
                <td>{{ $report->performed_by }}</td>
            </tr>
            <tr>
                <th>Date Performed</th>
                <td>{{ $report->date_performed ? \Carbon\Carbon::parse($report->date_performed)->format('m/d/y') : 'N/A' }}</td>
            </tr>
            <tr>
                <th>Due Date</th>
                <td>{{ $report->due_date ? \Carbon\Carbon::parse($report->due_date)->format('m/d/y') : 'N/A' }}</td>
            </tr>
        </tbody>
    </table>

    {{-- Oven Set Point 1 --}}
    @php $oven1 = json_decode($report->{"oven_set_point1"} ?? '{}'); @endphp
    @if($oven1 && isset($oven1->profiling))

    <div class="section-title">Oven Set Point 1 — Tolerance: {{ $oven1->tolerance }}</div>

    <table>
        <thead>
            <tr>
                <th>Description</th>
                @for($x = 1; $x <= 12; $x++)
                    <th>{{ $x }}</th>
                    @endfor
                    <th>Remarks</th>
            </tr>
        </thead>
        <tbody>
            @foreach($oven1->profiling as $row)
            <tr>
                <td>{{ $row->description }}</td>
                @foreach($row->values as $v)
                <td>{{ $v }}</td>
                @endforeach
                <td>{{ $row->remarks }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
    @endif


    {{-- PAGE 2 --}}
    <div class="page-break"></div>

    @php $oven2 = json_decode($report->{"oven_set_point2"} ?? '{}'); @endphp
    @if($oven2 && isset($oven2->profiling))
    <div class="section-title">Oven Set Point 2 — Tolerance: {{ $oven2->tolerance }}</div>

    <table>
        <thead>
            <tr>
                <th>Description</th>
                @for($x = 1; $x <= 12; $x++)
                    <th>{{ $x }}</th>
                    @endfor
                    <th>Remarks</th>
            </tr>
        </thead>
        <tbody>
            @foreach($oven2->profiling as $row)
            <tr>
                <td>{{ $row->description }}</td>
                @foreach($row->values as $v)
                <td>{{ $v }}</td>
                @endforeach
                <td>{{ $row->remarks }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
    @endif


    {{-- PAGE 3 --}}
    <div class="page-break"></div>

    @php $oven3 = json_decode($report->{"oven_set_point3"} ?? '{}'); @endphp
    @if($oven3 && isset($oven3->profiling))
    <div class="section-title">Oven Set Point 3 — Tolerance: {{ $oven3->tolerance }}</div>

    <table>
        <thead>
            <tr>
                <th>Description</th>
                @for($x = 1; $x <= 12; $x++)
                    <th>{{ $x }}</th>
                    @endfor
                    <th>Remarks</th>
            </tr>
        </thead>
        <tbody>
            @foreach($oven3->profiling as $row)
            <tr>
                <td>{{ $row->description }}</td>
                @foreach($row->values as $v)
                <td>{{ $v }}</td>
                @endforeach
                <td>{{ $row->remarks }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
    @endif

    <div class="section-title">Note:</div>
    <p>{{ $report->note }}</p>

</body>

</html>