# MU Scheduler - Class Management System

<p align="center">
  <img src="public/logo.svg" alt="MU Scheduler Logo" width="120">
</p>

<p align="center">
  A comprehensive class scheduling and management system built for educational institutions.
</p>

## 📋 Overview

**MU Scheduler** is a full-stack web application designed to automate and streamline the complex process of academic class scheduling. It handles department management, course configuration, subject assignments, room allocation, faculty scheduling, and generates conflict-free timetables.

## ✨ Features

### 🏛️ Department Management
- Create and manage academic departments
- Assign courses to departments
- Track department status (active/inactive)

### 📚 Course Management
- Define courses with their respective year levels (1st-5th year)
- Configure course majors/specializations
- Support for multiple courses sharing subjects

### 📖 Subject Management
- Create subjects with lecture and lab hour configurations
- Define subject prerequisites
- **Multi-course subjects**: Subjects can be shared across multiple courses (e.g., General Education)
- Assign subjects to specific courses or make them available globally

### 🏫 Room Management
- Configure lecture halls and laboratories
- Set room capacity and type
- Track room availability for scheduling

### 👨‍🏫 Faculty Management
- Manage faculty members and their information
- Configure faculty teaching load limits
- Set preferred day-off for faculty

### 📅 Academic Setup (Semester Configuration)
- **Multi-year configuration**: Configure subjects for each year level (1st-4th year)
- **Block management**: Create multiple blocks/sections per subject
- **Fused blocks**: Combine students from different courses into one block
- **Separate blocks**: Keep course students separate with course-specific block codes
- **Faculty assignments**: Assign faculty to specific subject blocks

### 🗓️ Schedule Generation
- Automated schedule generation algorithm
- Conflict detection and resolution
- Room-based scheduling with capacity constraints
- Faculty workload balancing

### 📊 Export & Reports
- **Teaching Load Report**: Faculty teaching assignments summary
- **Room Allocation Report**: Room usage schedule
- **Registrar Template**: Official schedule format for registrar
- Export to Excel format

## 🛠️ Tech Stack

### Backend
- **PHP 8.2+**
- **Laravel 12** - PHP Framework
- **MySQL/SQLite** - Database
- **Laravel Fortify** - Authentication
- **Inertia.js** - Server-side adapter

### Frontend
- **React 19** - UI Library
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS 4** - Utility-first CSS
- **Radix UI** - Headless UI components
- **Lucide React** - Icon library
- **Vite** - Build tool

### Additional Libraries
- **PHPSpreadsheet** - Excel export functionality
- **Inertia.js React** - Client-side adapter

## 📦 Installation

### Prerequisites
- PHP 8.2 or higher
- Composer
- Node.js 18+ and npm
- MySQL or SQLite

### Quick Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ClassScheduler
   ```

2. **Install dependencies**
   ```bash
   composer install
   npm install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```

4. **Configure database**
   
   Edit `.env` file with your database credentials:
   ```env
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=class_scheduling_db
   DB_USERNAME=root
   DB_PASSWORD=
   ```

5. **Run migrations and seeders**
   ```bash
   php artisan migrate
   php artisan db:seed
   ```

6. **Build frontend assets**
   ```bash
   npm run build
   ```

7. **Start the development server**
   ```bash
   composer dev
   ```
   
   Or manually:
   ```bash
   php artisan serve
   npm run dev
   ```

8. **Access the application**
   
   Open [http://localhost:8000](http://localhost:8000) in your browser.

### Default Credentials
After seeding, you can login with:
- **Email**: `admin@example.com`
- **Password**: `password`

## 🚀 Usage

### 1. Initial Setup
1. **Departments**: Create your academic departments
2. **Courses**: Add courses under each department
3. **Subjects**: Create subjects and assign them to courses
4. **Rooms**: Configure available classrooms and labs
5. **Users**: Add faculty members

### 2. Academic Setup
1. Navigate to **Academic Setup**
2. Create a new setup for the semester
3. Select department and courses
4. Configure each year level:
   - Add subjects from the available pool
   - Configure blocks (sections)
   - Choose **Fused** or **Separate** for shared subjects
   - Assign faculty to blocks

### 3. Schedule Generation
1. Go to **Scheduling**
2. Select an active academic setup
3. Click **Generate Schedule**
4. Review and publish the schedule

### 4. Export Reports
- **Teaching Load**: Export faculty assignments
- **Room Allocation**: Export room schedules
- **Registrar Template**: Official format for records

## 📁 Project Structure

```
ClassScheduler/
├── app/
│   ├── Http/Controllers/     # API Controllers
│   ├── Models/               # Eloquent Models
│   ├── Services/             # Business Logic
│   └── Jobs/                 # Queue Jobs
├── database/
│   ├── migrations/           # Database Migrations
│   └── seeders/              # Data Seeders
├── resources/
│   └── js/
│       ├── components/       # React Components
│       ├── layouts/          # Page Layouts
│       ├── pages/            # Page Components
│       └── types/            # TypeScript Definitions
├── routes/
│   └── web.php               # Web Routes
└── public/                   # Public Assets
```

## 🔑 Key Concepts

### Block Codes
Block codes uniquely identify each subject section:
- **Format**: `[SubjectCode][CourseGroup][BlockNumber]`
- **Examples**:
  - `CSIT01` - CSIT subject, Block 1 (fused or single course)
  - `CSITCS01` - CSIT subject, CS course, Block 1 (separate)
  - `CSITIS01` - CSIT subject, IS course, Block 1 (separate)

### Fused vs Separate Blocks
- **Fused**: Students from multiple courses share the same block (e.g., BSCS + BSIT together)
- **Separate**: Each course has its own block (e.g., BSCS students separate from BSIT)

## 🧪 Testing

```bash
# Run all tests
php artisan test

# Run with coverage
php artisan test --coverage

# Run specific test
php artisan test --filter=ExampleTest
```

## 🔧 Development

### Code Quality
```bash
# PHP Linting
composer lint

# JavaScript/TypeScript Linting
npm run lint

# Type Checking
npm run types
```

### Building for Production
```bash
npm run build
```

## 📝 License

This project is licensed under the MIT License.

