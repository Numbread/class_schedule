<?php

namespace App\Jobs;

use App\Models\AcademicSetup;
use App\Models\Schedule;
use App\Services\Scheduling\GeneticAlgorithmService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Cache;

class GenerateScheduleJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 300; // 5 minutes max

    protected int $academicSetupId;
    protected array $params;
    protected ?int $userId;
    protected string $jobKey;

    /**
     * Create a new job instance.
     */
    public function __construct(
        int $academicSetupId,
        array $params,
        ?int $userId,
        string $jobKey
    ) {
        $this->academicSetupId = $academicSetupId;
        $this->params = $params;
        $this->userId = $userId;
        $this->jobKey = $jobKey;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        // Update status to running
        $this->updateProgress(0, 'Initializing...');

        try {
            $academicSetup = AcademicSetup::with([
                'subjects.subject',
                'faculty.user',
                'subjectFacultyAssignments',
            ])->findOrFail($this->academicSetupId);

            // Create GA service with progress callback
            $gaService = new GeneticAlgorithmService();

            // Set parameters
            $gaParams = [];
            if (isset($this->params['population_size'])) {
                $gaParams['population_size'] = $this->params['population_size'];
            }
            if (isset($this->params['max_generations'])) {
                $gaParams['max_generations'] = $this->params['max_generations'];
            }
            if (isset($this->params['mutation_rate'])) {
                $gaParams['mutation_rate'] = $this->params['mutation_rate'];
            }
            if (isset($this->params['target_fitness_min'])) {
                $gaParams['target_fitness_min'] = $this->params['target_fitness_min'];
            }
            if (isset($this->params['target_fitness_max'])) {
                $gaParams['target_fitness_max'] = $this->params['target_fitness_max'];
            }
            if (!empty($gaParams)) {
                $gaService->setParameters($gaParams);
            }
            if (isset($this->params['included_days'])) {
                $gaService->setIncludedDays($this->params['included_days']);
            }

            // Set progress callback
            $gaService->setProgressCallback(function ($generation, $maxGenerations, $bestFitness) {
                $progress = min(95, ($generation / $maxGenerations) * 100);
                $this->updateProgress(
                    $progress,
                    "Generation {$generation}/{$maxGenerations} - Best Fitness: {$bestFitness}"
                );
            });

            // Generate schedule
            $this->updateProgress(5, 'Starting genetic algorithm...');
            $schedule = $gaService->generate($academicSetup, $this->userId);

            // Update final status
            $this->updateProgress(100, 'Complete', 'completed', $schedule->id);

        } catch (\Exception $e) {
            $this->updateProgress(0, $e->getMessage(), 'failed');
        }
    }

    /**
     * Update progress in cache.
     */
    protected function updateProgress(
        float $progress,
        string $message,
        string $status = 'running',
        ?int $scheduleId = null
    ): void {
        Cache::put($this->jobKey, [
            'progress' => round($progress, 1),
            'message' => $message,
            'status' => $status,
            'schedule_id' => $scheduleId,
            'updated_at' => now()->toISOString(),
        ], 600); // Cache for 10 minutes
    }

    /**
     * Handle job failure.
     */
    public function failed(\Throwable $exception): void
    {
        $this->updateProgress(0, 'Generation failed: ' . $exception->getMessage(), 'failed');
    }
}

