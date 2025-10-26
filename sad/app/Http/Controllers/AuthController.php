<?php


namespace App\Http\Controllers;


use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Facades\Auth;
use App\Models\User;
use Illuminate\Validation\ValidationException;


class AuthController extends Controller
{
    public function login(Request $request)
    {
        // Validate input
        $request->validate([
            'username' => 'required|string',
            'password' => 'required|string',
        ]);

        // Call UIC API
        try {
            $response = Http::withHeaders([
                'Accept' => 'application/json',
                'X-API-Client-ID' => env('UIC_API_CLIENT_ID'),
                'X-API-Client-Secret' => env('UIC_API_CLIENT_SECRET'),
                'Content-Type' => 'application/json',
            ])->post(env('UIC_API_BASE_URL') . '/accounts/auth/login', [
                'username' => $request->input('username'),
                'password' => $request->input('password'),
            ]);

            $result = $response->json();
            
            Log::info('UIC API Response', [
                'status' => $response->status(),
                'body' => $result
            ]);

            // Check if API call failed
            if ($response->failed() || !$response->successful()) {
                $errorMessage = 'Invalid credentials. Please check your username and password.';
                
                // Try to get specific error from API response
                if (isset($result['errors']['username'])) {
                    $errorMessage = is_array($result['errors']['username']) 
                        ? $result['errors']['username'][0] 
                        : $result['errors']['username'];
                } elseif (isset($result['message'])) {
                    $errorMessage = $result['message'];
                }
                
                throw ValidationException::withMessages([
                    'username' => [$errorMessage],
                ]);
            }

            // Store token in session - handle different response structures
            $token = $result['data']['token'] ?? $result['token'] ?? null;
            
            if (!$token) {
                Log::error('UIC API: No token in response', ['result' => $result]);
                throw ValidationException::withMessages([
                    'username' => ['Authentication successful but no token received.'],
                ]);
            }

            Session::put('uic_api_token', $token);
            
            // Get user data from API response
            $userData = $result['data']['user'] ?? $result['user'] ?? null;
            Log::info('UIC API User Data', ['user' => $userData]);
            
            if (!$userData) {
                throw ValidationException::withMessages([
                    'username' => ['User data not found in API response.'],
                ]);
            }
            
            // Create or update user in local database
            // Important: NEVER downgrade local elevated roles on login.
            // Preserve existing role if already set (e.g., student_officer, admin_assistant, dean).
            
            // Use the actual email address from the API response
            $emailAddress = $userData['email_address'] ?? null;
            
            if (!$emailAddress) {
                throw ValidationException::withMessages([
                    'username' => ['Email address not found in API response.'],
                ]);
            }
            
            $existingUser = User::where('email', $emailAddress)->first();

            $roleToPersist = $existingUser?->role ?: 'student';

            if ($existingUser && $existingUser->role !== 'student') {
                Log::info('Preserving elevated role on login', [
                    'email' => $emailAddress,
                    'role' => $existingUser->role,
                ]);
            }
            
            // Extract school ID from email address (12 digits after underscore, before @)
            // Example: snailes_230000001146@uic.edu.ph -> 230000001146
            $schoolId = null;
            if (preg_match('/_(\d{12})@/', $emailAddress, $matches)) {
                $schoolId = $matches[1];
                Log::info('Extracted school ID from email', [
                    'email' => $emailAddress,
                    'school_id' => $schoolId
                ]);
            } else {
                Log::info('Could not extract school ID - email format does not match pattern', [
                    'email' => $emailAddress
                ]);
            }

            $user = User::updateOrCreate(
                ['email' => $emailAddress], // Use actual email address
                [
                    'first_name' => $userData['first_name'] ?? '',
                    'middle_name' => $userData['middle_name'] ?? '',
                    'last_name' => $userData['last_name'] ?? '',
                    'name' => trim(($userData['first_name'] ?? '') . ' ' . ($userData['last_name'] ?? '')),
                    // Extract school ID from email address (12 digits before @)
                    'school_id_number' => $schoolId,
                    // Preserve any previously elevated role; default to student for first-time logins
                    'role' => $roleToPersist,
                    'password' => bcrypt($request->input('password')), // Store encrypted password (not used by UIC but kept locally)
                    'email_verified_at' => now(), // Auto-verify since authenticated by UIC API
                ]
            );
            
            Log::info('User created/updated', [
                'email' => $emailAddress,
                'school_id_number' => $user->school_id_number,
                'role' => $user->role
            ]);
            
            // Log the user into the system
            Auth::login($user, $request->boolean('remember'));
            
            // Redirect to student dashboard
            return redirect()->route('student.dashboard');
            
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Exception $e) {
            Log::error('UIC API Login Exception', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            throw ValidationException::withMessages([
                'username' => ['Unable to connect to UIC API. Please try again later.'],
            ]);
        }
    }


    public function logout(Request $request)
    {
        $response = Http::withHeaders([
            'Accept' => 'application/json',
            'X-API-Client-ID' => env('UIC_API_CLIENT_ID'),
            'X-API-Client-Secret' => env('UIC_API_CLIENT_SECRET'),
            'Content-Type' => 'application/json',
            'Authorization' => 'Bearer ' . Session::get('uic_api_token')
        ])->post(env('UIC_API_BASE_URL') . '/accounts/auth/logout');
            

        Log::info('UIC API Logout Response: ', ['response' => $response]);


        return $response->json();
    }
}
