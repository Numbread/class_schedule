<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\AcademicSetup;
use App\Models\ScheduleEntry;
use App\Services\Scheduling\GeneticAlgorithmService;

$setupId = 10;
$academicSetup = AcademicSetup::findOrFail($setupId);

$gaService = new GeneticAlgorithmService();
$gaService->setParameters(['max_generations' => 150]);
$gaService->setIncludedDays(['MW', 'TTH', 'FRI']);

echo "Generating new schedule for Setup $setupId...\n";
$schedule = $gaService->generate($academicSetup);

echo "Schedule generated! ID: {$schedule->id}, Fitness: {$schedule->fitness_score}\n";

$facultyId = 6; // Orong
$fridayEntries = ScheduleEntry::where('schedule_id', $schedule->id)
    ->where('user_id', $facultyId)
    ->where('day', 'friday')
    ->get();

if ($fridayEntries->isEmpty()) {
    echo "SUCCESS: No Friday entries found for User $facultyId.\n";
} else {
    echo "FAILURE: Still found " . $fridayEntries->count() . " Friday entries for User $facultyId.\n";
    foreach ($fridayEntries as $entry) {
        echo " - Subject: " . ($entry->academicSetupSubject->subject->code ?? 'Unknown') . ", Slot: " . $entry->time_slot_id . "\n";
    }
}
