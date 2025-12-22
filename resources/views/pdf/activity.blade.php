<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>PREVENTIVE MAINTENANCE CHECKLIST</title>
    <style>
        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 10px;
            /* konting liit para magkasya */
            color: #000;
        }

        h1 {
            text-align: center;
            margin-bottom: 15px;
            color: #942b2bff;
            margin-top: -30px;
        }

        h2 {
            text-align: center;
            margin-bottom: 15px;
            color: #000;
            margin-top: -20px;
        }

        table {
            width: 100%;
            /* gawin full width ng page */
            table-layout: fixed;
            /* pantay na column sizes */
            border-collapse: collapse;
            margin-top: 15px;
            word-wrap: break-word;
            /* iwas overflow ng text */
        }


        td {
            border: 1px solid #000;
            padding: 4px;
            /* mas maliit na padding */
            text-align: center;
            font-size: 9px;
            /* mas compact */
        }

        th {
            background: #f0f0f0;
            border: 1px solid #000;
            padding: 3px;
            text-align: center;
        }

        .table-head {
            width: 100%;
            border: none;
            margin-top: 5px;
        }

        .activity-code {
            border: 1px solid #000;
            padding: 6px;
            margin-top: 10px;
            font-size: 9px;
            text-align: center;
        }
    </style>

</head>

<body>
    <h1>{{ $scheduler->machine->machine_platform }}</h1>
    <h2>PREVENTIVE MAINTENANCE CHECKLIST</h2>
    <!-- <p><strong>Machine:</strong> {{ $scheduler->machine_num }}</p>
    <p><strong>Control No:</strong> {{ $scheduler->pmnt_no }}</p>
    <p><strong>Serial No:</strong> {{ $scheduler->serial }}</p>
    <p><strong>PM Date:</strong> {{ $scheduler->first_cycle }}</p>
    <p><strong>PM Due:</strong> {{ $scheduler->pm_due }}</p>

    <p><strong>Technician:</strong> {{ $scheduler->tech_ack ?? 'Waiting...' }}</p>
    <p><strong>ESD Technician:</strong> {{ $scheduler->qa_ack ?? 'Waiting...' }}</p>
    <p><strong>Engineer/Section Head:</strong> {{ $scheduler->senior_ee_ack ?? $scheduler->section_ack ?? 'Waiting...' }}</p> -->

    <table class="table-head">
        <tr>
            <th>Machine</th>
            <th>Control No</th>
            <th>Serial No</th>
        </tr>
        <tr>
            <td>{{ $scheduler->machine_num }}</td>
            <td>{{ $scheduler->pmnt_no }}</td>
            <td>{{ $scheduler->serial }}</td>
        </tr>
    </table>
    <table class="table-head">
        <tr>
            <th>PM Date</th>
            <th>PM Due</th>
            <th>Technician</th>
        </tr>
        <tr>
            <td>{{ $scheduler->first_cycle }}</td>
            <td>{{ $scheduler->pm_due }}</td>
            <td>{{ $scheduler->responsible_person }}</td>
        </tr>
    </table>
    <table class="table-head">
        <tr>
            <th>Senior Technician</th>
            <th>QA Personnel</th>
            <th>Sr. Engineer/ Engineer</th>
        </tr>
        <tr>
            <td>
                {{ $scheduler->tech_ack 
        ? $scheduler->tech_ack . ' / ' . \Carbon\Carbon::parse($scheduler['tecjh_ack_date'])->format('m/d/Y h:i A') 
        : 'Waiting...' }}
            </td>
            <td>
                {{ $scheduler->qa_ack 
        ? $scheduler->qa_ack . ' / ' . \Carbon\Carbon::parse($scheduler['qa_ack_date'])->format('m/d/Y h:i A') 
        : 'Waiting...' }}
            </td>
            <td>
                {{ $scheduler->senior_ee_ack 
        ? $scheduler->senior_ee_ack . ' / ' . \Carbon\Carbon::parse($scheduler['senior_ee_ack_date'])->format('m/d/Y h:i A') 
        : 'Waiting...' }}
            </td>

        </tr>
    </table>
    <div class="activity-code">
        <label><strong>Activity Code:</strong></label>
        <p>
            A - Check; B - Clean; C - Lubricate; D - Adjust; E - Align; F - Calibrate; G - Modify; H - Repair;
            I - Replace; J - Refill; K - Drain; L - Measure; M - Scan/Disk Defragment; N - Change Oil;
        </p>
    </div>

    @if(count($answers))
    <table>
        <thead>
            <tr>
                <th>#</th>
                <th>Assy Item</th>
                <th style="font-size: 8px;">Description</th>
                <th style="font-size: 8px;">Requirements</th>
                <th>Activity</th>
                <th style="font-size: 8px;">Compliance</th>
                <th>Remarks</th>
                <th>Activity</th>
                <th style="font-size: 8px;">Compliance</th>
                <th>Remarks</th>
            </tr>
        </thead>
        <tbody>
            @foreach($answers as $i => $ans)
            <tr>
                <td>{{ $i+1 }}</td>
                <td>{{ $ans['assy_item'] ?? '' }}</td>
                <td>{{ $ans['description'] ?? '' }}</td>
                <td>{{ $ans['requirements'] ?? '' }}</td>
                <td>{{ !empty($ans['activity_1']) && $ans['activity_1'] != 'N/A' ? $ans['activity_1'] : $ans['activity_1'] ?? '' }}</td>
                <!-- <td>{{ isset($ans['compliance1']) && $ans['compliance1'] == 1 ? '✔' : '✘' }}</td> -->
                <td>{{ !empty($ans['compliance1']) && $ans['compliance1'] == 1 ? '✔' : '' }}</td>
                <td>{{ !empty($ans['compliance1']) && $ans['compliance1'] == 1 ? ($ans['remarks1'] ?? '') : '' }}</td>

                <!-- <td>{{ $ans['activity_2'] ?? '' }}</td> -->
                <td>{{ !empty($ans['activity_2']) && $ans['activity_2'] != 'N/A' ? $ans['activity_2'] : $ans['activity_2'] ?? '' }}</td>

                <td>{{ !empty($ans['compliance2']) && $ans['compliance2'] == 1 ? '✔' : '' }}</td>
                <td>{{ !empty($ans['compliance2']) && $ans['compliance2'] == 1 ? ($ans['remarks2'] ?? '') : '' }}</td>

            </tr>
            @endforeach
        </tbody>
    </table>
    @else
    <p>No answers available.</p>
    @endif

    @if(count($tool_life))
    <table>
        <thead>
            <tr>
                <th>#</th>
                <th>Description</th>
                <th>Part Number</th>
                <th>Duration of Usage (Day)</th>
                <th>Expected Tool Life</th>
                <th>Remarks</th>
            </tr>
        </thead>
        <tbody>
            @foreach($tool_life as $i => $tl)
            <tr>
                <td>{{ $i+1 }}</td>
                <td>{{ $tl['description'] ?? '' }}</td>
                <td>{{ $tl['partnumber'] ?? '' }}</td>
                <td>{{ $tl['duration_usage'] ?? '' }}</td>
                <td>{{ $tl['expected_tool_life'] ?? '' }}</td>
                <td>{{ $tl['remarks'] ?? '' }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
    @else
    <p>No tool_life available.</p>
    @endif
</body>

</html>