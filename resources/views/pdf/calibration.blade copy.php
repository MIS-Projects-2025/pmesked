{{-- 🔹 Calibration Standards Used --}}
@if(!empty($report->cal_std_use))
<h3>Calibration Standards Used</h3>
<table border="1" cellspacing="0" cellpadding="6" width="100%">
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
            <td>{{ $std['cal_date'] ?? '' }}</td>
            <td>{{ $std['cal_due'] ?? '' }}</td>
            <td>{{ $std['traceability'] ?? '' }}</td>
        </tr>
        @endforeach
    </tbody>
</table>
@endif

{{-- 🔹 Calibration Details --}}
@if(!empty($report->cal_details))
<h3>Calibration Details</h3>
<table border="1" cellspacing="0" cellpadding="6" width="100%">
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