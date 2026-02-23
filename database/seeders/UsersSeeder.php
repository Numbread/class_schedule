<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UsersSeeder extends Seeder
{
    /**
     * Seed default users for the application.
     */
    public function run(): void
    {
        // Create default admin user
        User::firstOrCreate(
            ['email' => 'admin@mu.edu.ph'],
            [
                'fname' => 'Admin',
                'mname' => null,
                'lname' => 'User',
                'password' => Hash::make('password'),
                'user_type' => 'admin',
                'is_active' => true,
                'approval_status' => 'approved',
            ]
        );

        // Create a scheduler user
        User::firstOrCreate(
            ['email' => 'scheduler@mu.edu.ph'],
            [
                'fname' => 'Scheduler',
                'mname' => null,
                'lname' => 'User',
                'password' => Hash::make('password'),
                'user_type' => 'scheduler',
                'is_active' => true,
                'approval_status' => 'approved',
            ]
        );

        // Create a faculty user
        User::firstOrCreate(
            ['email' => 'faculty@mu.edu.ph'],
            [
                'fname' => 'Faculty',
                'mname' => 'Test',
                'lname' => 'User',
                'password' => Hash::make('password'),
                'user_type' => 'faculty',
                'is_active' => true,
                'approval_status' => 'approved',
            ]
        );

        $this->command->info('Users seeded successfully!');
    }
}

