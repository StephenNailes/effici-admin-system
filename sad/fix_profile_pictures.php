<?php
require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';

use App\Models\User;

echo "Fixing profile picture paths...\n";

$users = User::whereNotNull('profile_picture')
    ->where('profile_picture', 'like', '/storage/%')
    ->get();

echo "Found " . $users->count() . " users with /storage/ prefix\n";

foreach ($users as $user) {
    $oldPath = $user->profile_picture;
    $newPath = str_replace('/storage/', '', $oldPath);
    
    $user->profile_picture = $newPath;
    $user->save();
    
    echo "Updated user {$user->id}: {$oldPath} -> {$newPath}\n";
}

echo "Done!\n";