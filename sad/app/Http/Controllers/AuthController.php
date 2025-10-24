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
            $emailIdentifier = ($userData['user_account_id'] ?? '') . '@uic.edu.ph';
            $existingUser = User::where('email', $emailIdentifier)->first();

            $roleToPersist = $existingUser?->role ?: 'student';

            if ($existingUser && $existingUser->role !== 'student') {
                Log::info('Preserving elevated role on login', [
                    'email' => $emailIdentifier,
                    'role' => $existingUser->role,
                ]);
            }

            $user = User::updateOrCreate(
                ['email' => $emailIdentifier], // Use account ID as email identifier
                [
                    'first_name' => $userData['first_name'] ?? '',
                    'middle_name' => $userData['middle_name'] ?? '',
                    'last_name' => $userData['last_name'] ?? '',
                    'name' => trim(($userData['first_name'] ?? '') . ' ' . ($userData['last_name'] ?? '')),
                    // Persist to the correct field in our schema
                    'school_id_number' => $userData['user_account_id'] ?? null,
                    // Preserve any previously elevated role; default to student for first-time logins
                    'role' => $roleToPersist,
                    'password' => bcrypt($request->input('password')), // Store encrypted password (not used by UIC but kept locally)
                    'email_verified_at' => now(), // Auto-verify since authenticated by UIC API
                ]
            );
            
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
