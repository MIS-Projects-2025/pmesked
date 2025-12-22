<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>Non-TNR Checklist</title>
    <style>
        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 10px;
            color: #000;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            font-size: 9px;
        }

        th,
        td {
            border: 1px solid #000;
            padding: 4px;
            text-align: center;
        }

        th {
            background: #f0f0f0;
        }

        .table-head {
            width: 100%;
            border: none;
            margin-top: 5px;
            font-size: 9px;
        }

        .activity-code {
            border: 1px solid #000;
            padding: 3px;
            margin-top: 5px;
            font-size: 9px;
            text-align: center;
        }
    </style>
</head>

<body>
    <h1 style="text-align: center; color: #790d0dff; margin: 0; margin-top: -40px; margin-bottom: -50px;">{{ $checklist->platform }}</h1>
    <h2 style="text-align: center; color: #000; margin: 0; font-size: 12px;">NON-TNR CHECKLIST</h2>
    <div style="display: flex; justify-content: space-between; align-items: center;">
        <h5 style="margin: 0; font-size: 8px; text-align: right;">
            Date Downloaded: {{ date('m-d-Y h:i A') }}
        </h5>
    </div>
    <table class="table-head">
        <tr>
            <th>Description</th>
            <th>Control No</th>
            <th>Serial No</th>
        </tr>
        <tr>
            <td>{{ $checklist->description }}</td>
            <td>{{ $checklist->control_no }}</td>
            <td>{{ $checklist->serial }}</td>
        </tr>
        <tr>
            <th>PM Date</th>
            <th>PM Due</th>
            <th>Frequency</th>
        </tr>
        <tr>
            <td>{{ $checklist->pm_date }}</td>
            <td>{{ $checklist->pm_due }}</td>
            <td>{{ $checklist->frequency }}</td>
        </tr>
        <tr>
            <th>Performed By</th>
            <th colspan="2">Date Performed</th>
        </tr>
        <tr>
            <td>{{ $checklist->performed_by }}</td>
            <td colspan="2">{{ $checklist->created_at }} <br> {{ \Carbon\Carbon::parse($checklist['created_at'])->format('m/d/Y h:i A') }}</td>
        </tr>

    </table>

    <!-- <table class="activity-code">
        <tr>
            <th>Technician Sign:</th>
            <td>{{ $checklist->tech_sign }} <br> {{ $checklist->tech_sign_date }} </td>
        </tr>
        <tr>
            <th>QA Sign:</th>
            <td>{{ $checklist->qa_sign }} <br> {{ $checklist->qa_sign_date }} </td>
        </tr>
        <tr>
            <th>Engineer Sign:</th>
            <td>{{ $checklist->senior_ee_sign }} <br> {{ $checklist->senior_ee_sign_date }} </td>
        </tr>
    </table> -->
    <div class="activity-code">
        <label><strong>Activity Code:</strong></label>
        <p>
            A - check ; B - Clean ; C - Lubricant ; D - Adjust ; E - Align; F - Calibrate; G - Modify ; H- Repair ; I - Replace; J-Replace;L - Measure
        </p>
    </div>
    @if(!empty($checkItems))
    <table>
        <thead>
            <tr>
                <th>#</th>
                <th>Check Item</th>
                <th>Requirement</th>
                <th>Activity</th>
                <th>Compliance</th>
                <th>Remarks</th>
            </tr>
        </thead>
        <tbody>
            @foreach($checkItems as $i => $row)
            <tr>
                <td>{{ $i + 1 }}</td>
                <td>{{ $row['assy_item'] ?? '' }}</td>
                <td>{{ $row['requirement'] ?? '' }}</td>
                <td>{{ $row['activity'] ?? '' }}</td>
                <td>
                    {{ isset($row['compliance']) && $row['compliance'] == 1 ? '✔' : '' }}
                </td>
                <td>{{ $row['remarks'] ?? '' }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
    @else
    <p>No checklist items available.</p>
    @endif





    @if(!empty($stdVerifications))
    <table>
        <thead>
            <tr>
                <th>Description</th>
                <th>Instrument 1</th>
                <th>Instrument 2</th>
                <th>Instrument 3</th>
            </tr>
        </thead>
        <tbody>
            @foreach($stdVerifications as $i => $ver)
            <tr>
                <td>{{ $ver['description'] ?? '' }}</td>
                <td>{{ $ver['instrument1'] ?? '' }}</td>
                <td>{{ $ver['instrument2'] ?? '' }}</td>
                <td>{{ $ver['instrument3'] ?? '' }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
    @endif

    <table border="1" cellspacing="0" cellpadding="6">
        <thead>
            <tr style="background-color: #f0f0f0;">
                <th colspan="3">Validations</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Technician</td>
                <td>{{ $checklist->tech_sign }}</td>
                <td>{{ \Carbon\Carbon::parse($checklist->tech_sign_date)->format('m/d/Y h:i A') }}</td>
            </tr>
            <tr>
                <td>QA</td>
                <td>{{ $checklist->qa_sign }}</td>
                <td>{{ \Carbon\Carbon::parse($checklist->qa_sign_date)->format('m/d/Y h:i A') }}</td>
            </tr>
            <tr>
                <td>Engineer</td>
                <td>{{ $checklist->senior_ee_sign }}</td>
                <td>{{ \Carbon\Carbon::parse($checklist->senior_ee_sign_date)->format('m/d/Y h:i A') }}</td>
            </tr>
        </tbody>
    </table>

    @if(!empty($toolLife))
    <table>
        <thead>
            <tr>
                <th>Description</th>
                <th>Duration of Usage</th>
                <th>Expected Tool Life</th>
                <th>Remarks</th>
            </tr>
        </thead>
        <tbody>
            @foreach($toolLife as $i => $tool)
            <tr>
                <td>{{ $tool['description'] ?? '' }}</td>
                <td>{{ $tool['duration_of_usage'] ?? '' }}</td>
                <td>{{ $tool['expected_tool_life'] ?? '' }}</td>
                <td>{{ $tool['remarks'] ?? '' }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
    @endif

</body>

</html>