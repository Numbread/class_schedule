<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class FacultySeeder extends Seeder
{
    /**
     * Seed faculty members.
     */
    public function run(): void
    {
        $facultyMembers = [
            [
                'fname' => 'Roseclaremath',
                'mname' => 'A.',
                'lname' => 'Caroro',
                'email' => 'roseclaremath.caroro@mu.edu.ph',
                'title' => 'Dr.',
            ],
            [
                'fname' => 'Florence Jean',
                'mname' => 'B.',
                'lname' => 'Talirongan',
                'email' => 'florencejean.talirongan@mu.edu.ph',
                'title' => 'Dr.',
            ],
            [
                'fname' => 'Markdy',
                'mname' => 'Y.',
                'lname' => 'Orong',
                'email' => 'markdy.orong@mu.edu.ph',
                'title' => 'Dr.',
            ],
            [
                'fname' => 'Rolysent',
                'mname' => 'K.',
                'lname' => 'Paredes',
                'email' => 'rolysent.paredes@mu.edu.ph',
                'title' => 'Dr.',
            ],
            [
                'fname' => 'Hidear',
                'mname' => null,
                'lname' => 'Talirongan',
                'email' => 'hidear.talirongan@mu.edu.ph',
                'title' => 'Dr.',
            ],
            [
                'fname' => 'Charies',
                'mname' => 'L.',
                'lname' => 'Malicay',
                'email' => 'charies.malicay@mu.edu.ph',
                'title' => 'Dr.',
            ],
            [
                'fname' => 'Jerry',
                'mname' => 'M.',
                'lname' => 'Lumasag',
                'email' => 'jerry.lumasag@mu.edu.ph',
                'title' => 'Engr.',
            ],
            [
                'fname' => 'Goldah Grace',
                'mname' => 'D.',
                'lname' => 'Sultan',
                'email' => 'goldahgrace.sultan@mu.edu.ph',
                'title' => 'Mrs.',
            ],
        ];

        foreach ($facultyMembers as $faculty) {
            User::firstOrCreate(
                ['email' => $faculty['email']],
                [
                    'fname' => $faculty['fname'],
                    'mname' => $faculty['mname'],
                    'lname' => $faculty['lname'],
                    'password' => Hash::make('password'),
                    'user_type' => 'faculty',
                    'is_active' => true,
                ]
            );
        }

        $this->command->info('Faculty members seeded successfully!');
    }
}

