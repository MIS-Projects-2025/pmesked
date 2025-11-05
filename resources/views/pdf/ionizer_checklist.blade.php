<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>Ionizer Checklist</title>
    <style>
        table {
            width: 100%;
            border-collapse: collapse;
        }


        td {
            border: 1px solid #000;
            padding: 6px;
            text-align: left;
            font-size: 11px;
            text-align: center;
        }

        th {
            border: 1px solid #000;
            padding: 6px;
            text-align: left;
            font-size: 12px;
            text-align: center;
            background-color: #dbdbdbff;
        }

        h3 {
            margin: 5px 0;
            font-size: 12px;
            color: #2113e2ff;
        }

        .tableFooter {
            margin-top: -0.1%;
            border: none;
        }

        .tableFooter td {
            border: none !important;
        }
    </style>
</head>

<body>
    <div style="text-align: center;">
        <h2 style="color: #790d0dff; margin-top: -35px;">AIR IONIZER CHECKLIST</h2>
        <h4 style="margin-top: -3%; font-size: 12px;">PREVENTIVE MAINTENANCE CHECKLIST</h4>
    </div>
    <div style="display: flex; justify-content: space-between; align-items: center;">
        <h5 style="margin: 0; font-size: 10px;">
            REFERENCE PM PROCEDURE SPECIFICATION : TFP05-002 and TFP05-027
        </h5>
        <h5 style="margin: 0; font-size: 10px; text-align: right;">
            Date Downloaded: {{ date('m-d-Y h:i A') }}
        </h5>
    </div>

    <table>

        <tbody>
            <tr>
                <th>Description</th>
                <td>{{ $record->description }}</td>
                <th>PM Date</th>
                <td>{{ $record->pm_date }}</td>


            </tr>
            <tr>
                <th>Control No</th>
                <td>{{ $record->control_no }}</td>
                <th>PM Due</th>
                <td>{{ $record->pm_due }}</td>
            </tr>
            <tr>
                <th>Serial</th>
                <td>{{ $record->serial }}</td>
                <th>Performed By</th>
                <td>{{ $record->performed_by }} <br> {{ \Carbon\Carbon::parse($record['created_at'])->format('m/d/Y h:i A') }}</td>
            </tr>
            <tr>
                <th>Frequency</th>
                <td colspan="3">{{ $record->frequency }}</td>
            </tr>
            <tr>
                <th>Technician Verifier</th>
                <td>{{ $record->tech_sign }} <br> {{ \Carbon\Carbon::parse($record['tech_sign_date'])->format('m/d/Y h:i A') }}</td>
                <th>QA Verifier</th>
                <td>{{ $record->qa_sign }} <br> {{ \Carbon\Carbon::parse($record['qa_sign_date'])->format('m/d/Y h:i A') }}</td>
            </tr>
        </tbody>
    </table>

    {{-- Check Items --}}
    <h3><i class="fa-solid fa-list-check"></i> Check Items</h3>
    <div style="text-align: center; border: 1px solid #000;">
        <h5 style="font-weight: bold;  margin-top: 1%;"> ACTIVITY CODE</h5>
        <p style="font-size: 12px; margin-top: -2%;">
            A - Check ; B - Clean ; C - Lubricant ; D - Adjust ; E - Align ;
            F - Calibrate ; G - Modify ; H - Repair ; I - Replace ; L - Measure
        </p>
    </div>
    <table>
        <thead>
            <tr>
                <th>Assembly Item</th>
                <th>Requirement</th>
                <th>Activity</th>
                <th>Compliance</th>
                <th>Date</th>
                <th>Remarks</th>
            </tr>
        </thead>
        <tbody>
            @foreach($checkItems as $ci)
            <tr>
                <td>{{ $ci['assy_item'] ?? '' }}</td>
                <td>{{ $ci['requirement'] ?? '' }}</td>
                <td>{{ $ci['activity'] ?? '' }}</td>
                <td class="text-center">
                    <input type="checkbox" class="text-center" disabled {{ !empty($ci['compliance']) && $ci['compliance'] == 1 ? 'checked' : '' }}>
                </td>

                <td>
                    @if(!empty($ci['date']))
                    {{ \Carbon\Carbon::parse($ci['date'])->format('m/d/Y') }}
                    @endif
                </td>
                <td>{{ $ci['remarks'] ?? '' }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    {{-- Verification Readings --}}
    <h3>Verification Readings</h3>
    <table>
        <thead>
            <tr>
                <th rowspan="2">Parameter</th>
                <th rowspan="2">Specs Value</th>
                <th colspan="2">Trial 1</th>
                <th colspan="2">Trial 2</th>
                <th colspan="2">Trial 3</th>
            </tr>
            <tr>
                <th>min</th>
                <th>max</th>
                <th>min</th>
                <th>max</th>
                <th>min</th>
                <th>max</th>
            </tr>
        </thead>
        <tbody>
            @foreach($verificationReadings as $vr)
            <tr>
                <td>{{ $vr['parameter'] ?? '' }}</td>
                <td>{{ $vr['specs_value'] ?? '' }}</td>
                <td>{{ $vr['trial1_min'] ?? '' }}</td>
                <td>{{ $vr['trial1_max'] ?? '' }}</td>
                <td>{{ $vr['trial2_min'] ?? '' }}</td>
                <td>{{ $vr['trial2_max'] ?? '' }}</td>
                <td>{{ $vr['trial3_min'] ?? '' }}</td>
                <td>{{ $vr['trial3_max'] ?? '' }}</td>
            </tr>
            @endforeach
            <tr>
                <th>OMEGA DTHM (REFERENCE EQUIPMENT) :</th>
                <td colspan="3">{{ $record->dthm_temp }} (°C)</td>
                <td colspan="4">{{ $record->dthm_rh }} (%RH)</td>
            </tr>
        </tbody>
    </table>

    {{-- Standard Use for Verification --}}
    <h3>Std Use Verification</h3>
    <table>
        <thead>
            <tr>
                <th>Description</th>
                <th>Instrument1</th>
                <th>Instrument2</th>
                <th>Instrument3</th>
            </tr>
        </thead>
        <tbody>
            @foreach($stdUseVerifications as $sv)
            <tr>
                <td>{{ $sv['description'] ?? '' }}</td>
                <td>{{ $sv['instrument1'] ?? '' }}</td>
                <td>{{ $sv['instrument2'] ?? '' }}</td>
                <td>{{ $sv['instrument3'] ?? '' }}</td>
            </tr>
            @endforeach
            <tr>
                <th>Duration Usage</th>
                <td>{{ $record->days }}</td>
                <th>Remarks</th>
                <td>{{ $record->remarks }}</td>
            </tr>
        </tbody>

    </table>
    <table class="tableFooter" style="border: none;">
        <tr>
            <td style="font-size: 10px; text-align: left; color: #e21313ff;">TELFORD SVC. PHILS., INC.</td>
            <td style="font-size: 10px; text-align: right; color: #e21313ff;">MAINT - 79 (Rev. 3)</td>
        </tr>
    </table>

</body>

</html>