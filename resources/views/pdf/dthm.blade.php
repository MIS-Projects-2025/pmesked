<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>Thermohygrometer Calibration Data Logsheet</title>
    <style>
        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 12px;
            color: #333;
        }

        table {
            border-collapse: collapse;
            width: 100%;
            margin-top: 10px;
        }

        th,
        td {
            border: 1px solid #999;
            padding: 6px;
            text-align: left;
        }

        h2 {
            text-align: center;
            margin-bottom: 15px;
        }

        .section-title {
            font-weight: bold;
            border-bottom: 2px solid #007bff;
            margin-top: 20px;
        }

        .remarks {
            background: #fff9db;
            border-left: 4px solid #ffc107;
            padding: 8px;
            margin-top: 10px;
        }
    </style>
</head>

<body>
    <h2>Thermohygrometer Calibration Data Logsheet</h2>

    <div class="section-title">General Information</div>
    <table>
        <tr>
            <th>Control No</th>
            <td>{{ $record->control_no }}</td>
        </tr>
        <tr>
            <th>IP Address</th>
            <td>{{ $record->ip_address }}</td>
        </tr>
        <tr>
            <th>Location</th>
            <td>{{ $record->location }}</td>
        </tr>
        <tr>
            <th>Calibration Date</th>
            <td>{{ $record->cal_date }}</td>
        </tr>
        <tr>
            <th>Calibration Due</th>
            <td>{{ $record->cal_due }}</td>
        </tr>
        <tr>
            <th>Performed By</th>
            <td>{{ $record->performed_by }}</td>
        </tr>
        <tr>
            <th>Recording Interval</th>
            <td>{{ $record->recording_interval }}</td>
        </tr>
        <tr>
            <th>Temperature Offset</th>
            <td>{{ $record->temp_offset }}</td>
        </tr>
        <tr>
            <th>RH Offset</th>
            <td>{{ $record->rh_offset }}</td>
        </tr>
        <tr>
            <th>Sample Frequency</th>
            <td>{{ $record->sample_frequency }}</td>
        </tr>
    </table>

    <div class="section-title">Temperature & Humidity Readings</div>
    <table>
        <thead>
            <tr>
                <th>Reading Type</th>
                <th>Temperature (°C)</th>
                <th>Humidity (%)</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Master Reference</td>
                <td>{{ $record->master_temp }}</td>
                <td>{{ $record->master_humidity }}</td>
            </tr>
            <tr>
                <td>Test Instrument (DUC)</td>
                <td>{{ $record->test_temp }}</td>
                <td>{{ $record->test_humidity }}</td>
            </tr>
            <tr>
                <td>Expanded Uncertainty (±)</td>
                <td>{{ $record->expand_temp }}</td>
                <td>{{ $record->expand_humidity }}</td>
            </tr>
        </tbody>
    </table>

    <div class="section-title">Remarks</div>
    <div class="remarks">
        ⚠️ Anyway, or develop inconsistent readings, the result may not be valid and the unit with the calibration results in the tables refer to the data at the time of calibration and should the instrument be modified or damaged in require recalibration. The user should determine the sustainability of this instrument for its intended use.
        <br><br>
        ⚙️ <strong>DUC</strong> = Device Under Calibration
    </div>

    <div class="section-title">QA Verification</div>
    <table>
        <tr>
            <th>QA Sign</th>
            <td>{{ $record->qa_sign ?? 'Waiting for verification...' }}</td>
        </tr>
        <tr>
            <th>QA Sign Date</th>
            <td>{{ $record->qa_sign_date ?? 'Waiting for verification...' }}</td>
        </tr>
    </table>
</body>

</html>