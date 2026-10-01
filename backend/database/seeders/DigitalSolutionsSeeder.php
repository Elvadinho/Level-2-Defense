<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DigitalSolutionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Create a "Digital Solutions" Department
        $departmentId = DB::table('departments')->insertGetId([
            'name' => 'Digital Solutions',
            'description' => 'Focuses on digital transformation and cloud solutions.',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // 2. Create Employees with 100k - 200k salaries
        $jobTitles = ['Cloud Architect', 'SEO Specialist', 'Frontend Developer', 'Backend Engineer'];
        foreach ($jobTitles as $title) {
            $userId = DB::table('users')->insertGetId([
                'name' => 'Mock ' . $title,
                'email' => strtolower(str_replace(' ', '.', $title)) . '@digitalsolutions.com',
                'password' => bcrypt('password123'),
                'role' => 'employee',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::table('employees')->insert([
                'user_id' => $userId,
                'department_id' => $departmentId,
                'job_title' => $title,
                'employment_status' => 'full_time',
                'salary' => rand(100000, 200000),
                'hire_date' => now()->subMonths(rand(1, 12)),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // 3. Create a Customer and Project
        $customerId = DB::table('customers')->insertGetId([
            'company_name' => 'TechNova Inc.',
            'contact_name' => 'Jane Doe',
            'email' => 'jane@technova.com',
            'phone' => '123-456-7890',
            'address' => '123 Innovation Drive',
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $projectId = DB::table('projects')->insertGetId([
            'name' => 'E-Commerce Cloud Migration',
            'description' => 'Migrating the legacy e-commerce system to AWS.',
            'customer_id' => $customerId,
            'status' => 'in_progress',
            'start_date' => now()->subDays(10),
            'end_date' => now()->addDays(30),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // 4. Create some tasks for the project
        DB::table('tasks')->insert([
            ['project_id' => $projectId, 'title' => 'Setup AWS VPC', 'status' => 'in_progress', 'priority' => 'high', 'created_at' => now(), 'updated_at' => now()],
            ['project_id' => $projectId, 'title' => 'Migrate Database', 'status' => 'todo', 'priority' => 'urgent', 'created_at' => now(), 'updated_at' => now()],
        ]);
    }
}
