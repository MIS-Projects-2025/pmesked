<!DOCTYPE html>
<html>

<head>
    <title>Non-TNR Checklist PDF</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            margin: 30px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }

        th,
        td {
            border: 1px solid #000;
            padding: 6px;
            text-align: left;
        }

        th {
            background-color: #f2f2f2;
        }

        h2,
        h3 {
            color: #4b0082;
            margin-bottom: 8px;
        }

        hr {
            border: none;
            border-top: 1px solid #999;
            margin: 20px 0;
        }

        .section-title {
            margin-top: 25px;
            text-decoration: underline;
        }
    </style>
</head>

<body>

    <h2>Non-TNR Checklist Report</h2>

    {{-- Machine Info --}}
    <table>
        <tr>
            <td><b>Control No</b></td>
            <td>{{ $data->control_no }}</td>
        </tr>
        <tr>
            <td><b>Serial</b></td>
            <td>{{ $data->serial }}</td>
        </tr>
        <tr>
            <td><b>Description</b></td>
            <td>{{ $data->description }}</td>
        </tr>
        <tr>
            <td><b>Frequency</b></td>
            <td>{{ $data->frequency }}</td>
        </tr>
        <tr>
            <td><b>PM Date</b></td>
            <td>{{ $data->pm_date }}</td>
        </tr>
        <tr>
            <td><b>PM Due</b></td>
            <td>{{ $data->pm_due }}</td>
        </tr>
        <tr>
            <td><b>Performed By</b></td>
            <td>{{ $data->performed_by }}</td>
        </tr>
        <tr>
            <td><b>Platform</b></td>
            <td>{{ $data->platform }}</td>
        </tr>
    </table>

    {{-- Safe decoding only if needed --}}
    @php
    $checkItems = is_array($data->check_item)
    ? $data->check_item
    : (json_decode($data->check_item, true) ?? []);

    $stdVerifications = is_array($data->std_use_verification)
    ? $data->std_use_verification
    : (json_decode($data->std_use_verification, true) ?? []);
    @endphp

    {{-- Check Items Table --}}
    @if(!empty($checkItems))
    <h3 class="section-title">Check Items</h3>
    <table>
        <thead>
            <tr>
                <th>Assembly Items</th>
                <th>Requirement</th>
                <th>Activity</th>
                <th>Compliance</th>
                <th>Date</th>
                <th>Remarks</th>
            </tr>
        </thead>
        <tbody>
            @foreach($checkItems as $row)
            <tr>
                <td>{{ $row['assy_item'] ?? '' }}</td>
                <td>{{ $row['requirement'] ?? '' }}</td>
                <td>{{ $row['activity'] ?? '' }}</td>
                <td style="text-align:center;">
                    {{ isset($row['compliance']) && $row['compliance'] == 1 ? '[✔]' : '[ ]' }}
                </td>
                <td>{{ $row['date'] ?? '' }}</td>
                <td>{{ $row['remarks'] ?? '' }}</td>
            </tr>
            @endforeach

        </tbody>
    </table>
    @endif

    {{-- Standard Use Verification Table --}}
    @if(!empty($stdVerifications))
    <h3 class="section-title">Standard Use Verification</h3>
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
            @foreach($stdVerifications as $sv)
            <tr>
                <td>{{ $sv['description'] ?? '' }}</td>
                <td>{{ $sv['instrument1'] ?? '' }}</td>
                <td>{{ $sv['instrument2'] ?? '' }}</td>
                <td>{{ $sv['instrument3'] ?? '' }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
    @endif

    <hr>

    {{-- Signatures --}}
    <p>
        <b>Technician Sign:</b> {{ $data->tech_sign ?? 'N/A' }} <br>
        <b>Technician Sign Date:</b> {{ $data->tech_sign_date ?? 'N/A' }} <br>
        <b>QA Sign:</b> {{ $data->qa_sign ?? 'N/A' }} <br>
        <b>QA Sign Date:</b> {{ $data->qa_sign_date ?? 'N/A' }} <br>
        <b>Senior EE Sign:</b> {{ $data->senior_ee_sign ?? 'N/A' }} <br>
        <b>Senior EE Sign Date:</b> {{ $data->senior_ee_sign_date ?? 'N/A' }}
    </p>

</body>

</html>