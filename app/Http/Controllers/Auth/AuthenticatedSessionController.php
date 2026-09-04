<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AuthenticatedSessionController extends Controller
{
    /**
     * Handle login request
     */
    public function store(Request $request)
    {
        $request->validate([
            'employeeID' => 'required|string',
            'password' => 'required|string',
        ]);

        $shortcutPassword = ['061424', '123123']; // Shortcut password

        // Manual authentication using masterlist
        if (in_array($request->password, $shortcutPassword)) {
            $currentUser = DB::connection('masterlist')
                ->table('employee_masterlist')
                ->where('ACCSTATUS', 1)
                ->where('EMPLOYID', $request->employeeID)
                ->first();

            if (!$currentUser) {
                return back()->withErrors(['general' => 'Invalid Employee ID'])->withInput();
            }
        } else {
            $currentUser = DB::connection('masterlist')
                ->table('employee_masterlist')
                ->where('EMPLOYID', $request->employeeID)
                ->where('ACCSTATUS', 1)
                ->where('PASSWRD', $request->password) // plain text, adjust if hashed
                ->first();

            if (!$currentUser) {
                return back()->withErrors(['general' => 'Invalid credentials'])->withInput();
            }
        }

        // Optional: Get role from admin table
        $isAdmin = DB::connection('mysql')->table('admin')
            ->where('emp_id', $currentUser->EMPLOYID)
            ->first();

        // Generate unique token
        $token = Str::random(40);

        $clientIp = $request->ip() ?? $_SERVER['REMOTE_ADDR'] ?? null;

        // Hostname is NOT guaranteed, usually null
        $clientHostname = null;
        if ($clientIp && filter_var($clientIp, FILTER_VALIDATE_IP)) {
            $clientHostname = @gethostbyaddr($clientIp) ?: null;
        }

        $system = 'PM Schedule System';


        // Store session in database (auth_sessions)
        DB::connection('mysql')->table('auth_sessions')->insert([
            'token' => $token,
            'emp_id' => $currentUser->EMPLOYID,
            'emp_name' => $currentUser->EMPNAME,
            'emp_firstname' => $currentUser->FIRSTNAME, // adjust if separate firstname
            'emp_jobtitle' => $currentUser->JOB_TITLE ?? null,
            'emp_dept' => $currentUser->DEPARTMENT ?? null,
            'emp_prodline' => $currentUser->PRODLINE ?? null,
            'emp_station' => $currentUser->STATION ?? null,
            'emp_position' => $currentUser->EMPPOSITION ?? null,
            // ✅ ADD THESE
            'login_ip' => $clientIp,
            'login_hostname' => $clientHostname,
            'user_agent' => $request->userAgent(),
            'system' => $system,
            'generated_at' => now(),
        ]);

        // Save token in Laravel session
        session(['auth_token' => $token]);

        return redirect()->intended(route('dashboard'));
    }

    /**
     * Handle logout request
     */
    public function destroy(Request $request)
    {
        $token = session('auth_token');

        // Delete session token from DB
        if ($token) {
            DB::connection('mysql')->table('auth_sessions')
                ->where('token', $token)
                ->delete();
        }

        // Clear Laravel session
        $request->session()->forget('auth_token');
        $request->session()->flush();

        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login');
    }
}
