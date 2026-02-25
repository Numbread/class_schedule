<?php

namespace App\Services\Scheduling;

use App\Models\AcademicSetup;
use App\Models\AcademicSetupSubject;
use App\Models\Room;
use App\Models\Schedule;
use App\Models\ScheduleEntry;
use App\Models\Subject;
use App\Models\TimeSlot;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class GeneticAlgorithmService
{
    // GA Parameters - Optimized for speed
    protected int $populationSize = 200;
    protected int $maxGenerations = 150;
    protected float $mutationRate = 0.5;
    protected float $crossoverRate = 0.8;
    protected int $eliteCount = 6;
    protected int $tournamentSize = 4;
    protected ?int $targetFitnessMin = null;
    protected ?int $targetFitnessMax = null;

    // Adaptive parameters
    protected float $baseMutationRate = 0.25;
    protected int $stagnationCounter = 0;
    protected int $stagnationThreshold = 6;
    protected int $lastBestFitness = PHP_INT_MIN;

    // Constraints and data - ALL CACHED (no DB queries during algorithm)
    protected AcademicSetup $academicSetup;
    protected array $subjectsArray = [];      // Cached as array for speed
    protected array $subjectsById = [];       // Indexed by ID
    protected array $roomsArray = [];         // Cached as array
    protected array $roomsById = [];          // Indexed by ID
    protected array $timeSlotsArray = [];     // Cached as array
    protected array $timeSlotsById = [];      // Indexed by ID
    protected array $lectureRoomIds = [];     // Just IDs for fast lookup
    protected array $labRoomIds = [];         // Just IDs for fast lookup
    protected array $facultyDayOffMap = [];
    protected array $facultyDayOffTimeMap = [];
    protected array $facultyTimePeriodMap = [];
    protected array $roomAssignmentRules = [];  // Category -> allowed room IDs
    protected array $subjectCategories = [];    // Subject ID -> category

    // Keep collections for compatibility
    protected Collection $subjects;
    protected Collection $subjectsKeyed;
    protected Collection $rooms;
    protected Collection $timeSlots;

    // Day group filter
    protected array $includedDays = ['MW', 'TTH', 'FRI'];

    // Progress callback
    protected $progressCallback = null;

    // Fitness weights - Goal: 0 = perfect, negative = conflicts
    // Each conflict subtracts from 0, so more negative = worse
    protected array $fitnessWeights = [
        'room_conflict' => -100,          // Same room, same time
        'section_conflict' => -100,       // Same subject at same time
        'faculty_conflict' => -100,       // Same faculty, same time
        'year_level_conflict' => -100,    // Same block students overlap
        'block_conflict' => -50,          // Same base subject at same time
        'capacity_mismatch' => -30,       // Room too small
        'room_type_mismatch' => -40,      // Lab in lecture room
        'faculty_day_off' => -100,        // Faculty on day off (harder soft constraint)
        'faculty_time_period' => -50,     // Outside preferred time (harder soft constraint)
    ];

    // Track subject_id to AcademicSetupSubject mapping
    protected array $subjectBlockMap = [];

    /**
     * Generate a schedule using Genetic Algorithm with adaptive optimization.
     */
    public function generate(AcademicSetup $academicSetup, ?int $userId = null): Schedule
    {
        $this->academicSetup = $academicSetup;
        $this->loadData();
        $this->buildCaches();

        // Initialize population with smart seeding
        $population = $this->initializePopulation();

        $bestChromosome = null;
        $bestFitness = PHP_INT_MIN;
        $generationStats = [];
        $this->stagnationCounter = 0;
        $this->lastBestFitness = PHP_INT_MIN;
        $this->mutationRate = $this->baseMutationRate;

        // Evolution loop
        for ($generation = 1; $generation <= $this->maxGenerations; $generation++) {
            // Evaluate fitness
            $fitnessScores = $this->evaluatePopulation($population);

            // Track best
            $maxIndex = array_keys($fitnessScores, max($fitnessScores))[0];
            $currentBestFitness = $fitnessScores[$maxIndex];

            if ($currentBestFitness > $bestFitness) {
                $bestFitness = $currentBestFitness;
                $bestChromosome = $population[$maxIndex];
                $this->stagnationCounter = 0;
            } else {
                $this->stagnationCounter++;
            }

            // Adaptive mutation: increase when stuck, reset when improving
            if ($this->stagnationCounter > $this->stagnationThreshold) {
                // Increase mutation rate to escape local optima
                $this->mutationRate = min(0.4, $this->mutationRate + 0.05);

                // Inject new random solutions to increase diversity
                if ($this->stagnationCounter % 5 === 0) {
                    $population = $this->injectDiversity($population, $fitnessScores);
                }
            } elseif ($currentBestFitness > $this->lastBestFitness) {
                // Reset mutation rate when improving
                $this->mutationRate = $this->baseMutationRate;
            }
            $this->lastBestFitness = $currentBestFitness;

            $generationStats[] = [
                'generation' => $generation,
                'best_fitness' => max($fitnessScores),
                'avg_fitness' => array_sum($fitnessScores) / count($fitnessScores),
                'worst_fitness' => min($fitnessScores),
            ];

            // Report progress
            $this->reportProgress($generation, $this->maxGenerations, (int) $bestFitness);

            // Early termination: 0 = perfect schedule
            if ($bestFitness >= 0) {
                break; // Perfect! No conflicts
            }

            // Check if user target is reached (if set)
            if ($this->targetFitnessMin !== null && $bestFitness >= $this->targetFitnessMin) {
                break;
            }

            // Also terminate if converged (no improvement for a while)
            // BUT: If user set a target and we haven't reached it, keep going until maxGenerations!
            if ($this->stagnationCounter > 12) {
                // If no target set, or if target is set and reached, we can stop.
                // Otherwise (target set but not reached), continue.
                $hasTarget = $this->targetFitnessMin !== null;
                $targetReached = $hasTarget && $bestFitness >= $this->targetFitnessMin;

                if (!$hasTarget || $targetReached) {
                    break;
                }
                // If target set and NOT reached, we ignore stagnation and continue
            }

            // Create next generation
            $population = $this->evolve($population, $fitnessScores);
        }

        // Final repair pass if still has conflicts
        if ($bestFitness < 0) {
            $bestChromosome = $this->repairChromosome($bestChromosome);
            $bestFitness = $this->calculateFitness($bestChromosome);
        }

        // Create and save the schedule
        return $this->createSchedule($bestChromosome, $bestFitness, count($generationStats), $generationStats, $userId);
    }

    /**
     * Repair a chromosome by systematically resolving conflicts.
     * Uses greedy reassignment to find conflict-free slots.
     */
    protected function repairChromosome(array $chromosome): array
    {
        // Build maps
        $usedRoomTimeSlots = [];
        $usedFacultyTimeSlots = [];
        $usedSectionTimeSlots = [];
        $usedBaseSubjectTimeSlots = [];
        $yearLevelBlockTimeSlots = [];

        // First pass: mark all used slots
        foreach ($chromosome as $gene) {
            $this->updateConflictMaps($gene, $usedRoomTimeSlots, $usedFacultyTimeSlots, $usedSectionTimeSlots, $usedBaseSubjectTimeSlots, 1);
            $this->updateYearLevelBlockMap($gene, $yearLevelBlockTimeSlots, 1);
        }

        // Multiple repair iterations - Increased to 20 to solve stubborn conflicts
        for ($iteration = 0; $iteration < 20; $iteration++) {
            $hasConflicts = false;

            foreach ($chromosome as $index => $gene) {
                if ($this->isGeneInConflict($gene, $usedRoomTimeSlots, $usedFacultyTimeSlots, $usedSectionTimeSlots, $usedBaseSubjectTimeSlots, $yearLevelBlockTimeSlots)) {
                    $hasConflicts = true;

                    // Remove from maps
                    $this->updateConflictMaps($gene, $usedRoomTimeSlots, $usedFacultyTimeSlots, $usedSectionTimeSlots, $usedBaseSubjectTimeSlots, -1);
                    $this->updateYearLevelBlockMap($gene, $yearLevelBlockTimeSlots, -1);

                    // Try to find a better slot using greedy approach
                    $setupSubject = $this->subjects->firstWhere('id', $gene['setup_subject_id']);
                    if ($setupSubject) {
                        $repairedGene = $this->findBestAlternativeSlot(
                            $gene,
                            $setupSubject,
                            $usedRoomTimeSlots,
                            $usedFacultyTimeSlots,
                            $usedSectionTimeSlots,
                            $usedBaseSubjectTimeSlots,
                            $yearLevelBlockTimeSlots
                        );
                        $chromosome[$index] = $repairedGene;
                    }

                    // Add back to maps
                    $this->updateConflictMaps($chromosome[$index], $usedRoomTimeSlots, $usedFacultyTimeSlots, $usedSectionTimeSlots, $usedBaseSubjectTimeSlots, 1);
                    $this->updateYearLevelBlockMap($chromosome[$index], $yearLevelBlockTimeSlots, 1);
                }
            }

            if (!$hasConflicts)
                break;
        }

        return $chromosome;
    }

    /**
     * Find the best alternative slot for a conflicting gene using CACHED data.
     * Prioritizes MW/TTH over Friday.
     * Checks Room Capacity to avoid trading time conflict for capacity conflict.
     */
    protected function findBestAlternativeSlot(
        array $gene,
        $setupSubject,
        array $usedRoomTimeSlots,
        array $usedFacultyTimeSlots,
        array $usedSectionTimeSlots,
        array $usedBaseSubjectTimeSlots,
        array $yearLevelBlockTimeSlots
    ): array {
        $isLab = $gene['is_lab'];
        $roomIds = $isLab ? $this->labRoomIds : $this->lectureRoomIds;
        if (empty($roomIds))
            $roomIds = array_column($this->roomsArray, 'id');

        $subjectData = $this->subjectsById[$gene['setup_subject_id']] ?? null;
        $facultyId = $subjectData ? $subjectData['faculty_id'] : null;
        $yearLevelId = $subjectData ? $subjectData['year_level_id'] : 0;
        $blockNumber = $subjectData ? $subjectData['block_number'] : 1;
        $expectedStudents = $subjectData ? $subjectData['expected_students'] : 0;

        $bestGene = $gene;
        $bestConflictCount = PHP_INT_MAX;
        $bestIsFriday = true;

        // Prioritize MW/TTH over Friday
        $mwTthSlots = [];
        $friSlots = [];
        foreach ($this->timeSlotsArray as $slot) {
            if (in_array($slot['day_group'], ['MW', 'TTH'])) {
                $mwTthSlots[] = $slot;
            } else {
                $friSlots[] = $slot;
            }
        }
        $orderedSlots = array_merge($mwTthSlots, $friSlots);

        foreach ($orderedSlots as $slot) {
            $isFriday = !in_array($slot['day_group'], ['MW', 'TTH']);

            foreach ($roomIds as $roomId) {
                $testGene = $gene;
                $testGene['time_slot_id'] = $slot['id'];
                $testGene['day_group'] = $slot['day_group'];
                $testGene['days'] = $slot['days'];
                $testGene['room_id'] = $roomId;

                $conflicts = 0;

                // Check Room Capacity
                $roomCap = $this->roomsById[$roomId]['capacity'] ?? 0;
                if ($roomCap < $expectedStudents) {
                    $conflicts++;
                }

                foreach ($slot['days'] as $day) {
                    $roomKey = "{$roomId}_{$slot['id']}_{$day}";
                    $facultyKey = $facultyId ? "{$facultyId}_{$slot['id']}_{$day}" : null;
                    $yearLevelBlockKey = "{$yearLevelId}_{$blockNumber}_{$slot['id']}_{$day}";

                    if (isset($usedRoomTimeSlots[$roomKey]))
                        $conflicts++;
                    if ($facultyKey && isset($usedFacultyTimeSlots[$facultyKey]))
                        $conflicts++;
                    if (isset($yearLevelBlockTimeSlots[$yearLevelBlockKey]))
                        $conflicts++;

                    // Faculty Day Off check
                    if ($facultyId && isset($this->facultyDayOffMap[$facultyId])) {
                        if (strtolower($day) === $this->facultyDayOffMap[$facultyId]) {
                            $offTime = $this->facultyDayOffTimeMap[$facultyId] ?? 'wholeday';
                            if ($offTime === 'wholeday') {
                                $conflicts++;
                            } else {
                                $period = $this->getTimePeriodFromSlot($slot);
                                if ($period === $offTime) {
                                    $conflicts++;
                                }
                            }
                        }
                    }

                    // Faculty Time preference check
                    if ($facultyId && isset($this->facultyTimePeriodMap[$facultyId])) {
                        $period = $this->getTimePeriodFromSlot($slot);
                        if ($period && $period !== $this->facultyTimePeriodMap[$facultyId]) {
                            $conflicts++;
                        }
                    }
                }

                if ($conflicts === 0)
                    return $testGene;

                $isBetter = ($conflicts < $bestConflictCount) ||
                    ($conflicts == $bestConflictCount && !$isFriday && $bestIsFriday);

                if ($isBetter) {
                    $bestConflictCount = $conflicts;
                    $bestIsFriday = $isFriday;
                    $bestGene = $testGene;
                }
            }
        }

        return $bestGene;
    }

    /**
     * Load and cache ALL required data upfront.
     * No database queries happen after this method completes.
     */
    protected function loadData(): void
    {
        // Load subjects with all relationships
        $this->subjects = $this->academicSetup->subjects()
            ->with(['subject', 'facultyAssignments', 'yearLevel'])
            ->active()
            ->get();
        $this->subjectsKeyed = $this->subjects->keyBy('id');

        // Load rooms - Use academic setup's available rooms if configured
        $availableRooms = $this->academicSetup->available_rooms;
        if ($availableRooms instanceof \Illuminate\Support\Collection && $availableRooms->isNotEmpty()) {
            $this->rooms = $availableRooms->where('is_active', true)->where('is_available', true);
        } else {
            // Fallback to all active rooms
            $this->rooms = Room::where('is_active', true)
                ->where('is_available', true)
                ->orderBy('priority')
                ->get();
        }

        // Load time slots
        $this->timeSlots = TimeSlot::active()
            ->whereIn('day_group', $this->includedDays)
            ->orderByPriority()
            ->get();

        // Load faculty
        $faculty = $this->academicSetup->faculty()->get();
        foreach ($faculty as $f) {
            if ($f->preferred_day_off) {
                $this->facultyDayOffMap[$f->user_id] = strtolower($f->preferred_day_off);

                $offTime = $f->preferred_day_off_time;
                if (!$offTime || strtolower($offTime) === 'whole day') {
                    $offTime = 'wholeday';
                }
                $this->facultyDayOffTimeMap[$f->user_id] = strtolower($offTime);
            }
            if ($f->preferred_time_period) {
                $this->facultyTimePeriodMap[$f->user_id] = $f->preferred_time_period;
            }
        }
    }

    /**
     * Cache all data into arrays for zero-query algorithm execution.
     */
    protected function buildCaches(): void
    {
        // Cache subjects as arrays with all needed properties
        $this->subjectsArray = [];
        $this->subjectsById = [];
        $this->subjectCategories = [];

        // Preload all parallel subjects to avoid N+1 queries
        $allParallelSubjectIds = [];
        foreach ($this->subjects as $s) {
            if (!empty($s->parallel_subject_ids)) {
                $allParallelSubjectIds = array_merge($allParallelSubjectIds, $s->parallel_subject_ids);
            }
        }
        $parallelSubjectsMap = [];
        if (!empty($allParallelSubjectIds)) {
            $parallelSubjectsMap = Subject::whereIn('id', array_unique($allParallelSubjectIds))
                ->get()
                ->keyBy('id')
                ->toArray();
        }

        foreach ($this->subjects as $s) {
            // Determine lab hours - check primary subject and parallel subjects
            $labHours = $s->subject->lab_hours ?? 0;
            $lectureHours = $s->subject->lecture_hours ?? 0;
            $hasParallelSubjects = !empty($s->parallel_subject_ids);

            // For parallel subjects, ALWAYS check all subjects in the group for hours
            // This handles cases where the primary subject might not have hours defined
            // but one of the parallel subjects does
            if ($hasParallelSubjects) {
                // Check ALL parallel subjects for the maximum lab hours
                $maxLabHours = $labHours;
                $maxLectureHours = $lectureHours;

                foreach ($s->parallel_subject_ids as $psId) {
                    $ps = $parallelSubjectsMap[$psId] ?? null;
                    if ($ps) {
                        $psLabHours = $ps['lab_hours'] ?? 0;
                        $psLectureHours = $ps['lecture_hours'] ?? 0;

                        // Use the maximum lab hours found across all parallel subjects
                        if ($psLabHours > $maxLabHours) {
                            $maxLabHours = $psLabHours;
                        }
                        // Use the maximum lecture hours found
                        if ($psLectureHours > $maxLectureHours) {
                            $maxLectureHours = $psLectureHours;
                        }
                    }
                }

                $labHours = $maxLabHours;
                $lectureHours = $maxLectureHours;

                // For parallel subjects, if needs_lab is true but no lab hours found in any subject,
                // default to 3 hours
                if ($s->needs_lab && $labHours === 0) {
                    $labHours = 3;
                }

                // For parallel subjects, if any subject in the group has lab hours > 0,
                // we should schedule labs even if needs_lab is false (data might be inconsistent)
                // This ensures labs are scheduled when they should be based on curriculum data
            } else {
                // Non-parallel subject
                // If needs_lab is explicitly set but still no lab hours found, default to 3 hours
                if ($s->needs_lab && $labHours === 0) {
                    $labHours = 3;
                }
            }

            // Default lecture hours if still 0 (at least have some lecture)
            if ($lectureHours === 0) {
                $lectureHours = 2; // Default lecture hours
            }

            $cached = [
                'id' => $s->id,
                'subject_id' => $s->subject_id,
                'year_level_id' => $s->year_level_id,
                'block_number' => $s->block_number ?? 1,
                'expected_students' => $s->expected_students ?? 40,
                'lecture_hours' => $lectureHours,
                'lab_hours' => $labHours,
                'faculty_id' => $s->facultyAssignments->first()?->user_id,
                'category' => $s->subject->category ?? null,
                'preferred_lecture_room_id' => $s->preferred_lecture_room_id,
                'preferred_lab_room_id' => $s->preferred_lab_room_id,
            ];
            $this->subjectsArray[] = $cached;
            $this->subjectsById[$s->id] = $cached;

            // Cache subject category for room assignment rules
            if ($s->subject->category) {
                $this->subjectCategories[$s->id] = $s->subject->category;
            }

            // Build block map
            $baseId = $s->subject_id;
            if (!isset($this->subjectBlockMap[$baseId])) {
                $this->subjectBlockMap[$baseId] = [];
            }
            $this->subjectBlockMap[$baseId][] = $s->id;
        }

        // Cache room assignment rules
        $rules = \App\Models\RoomAssignmentRule::active()->get();
        foreach ($rules as $rule) {
            if ($rule->subject_category && !empty($rule->allowed_room_ids)) {
                $this->roomAssignmentRules[$rule->subject_category] = [
                    'allowed' => $rule->allowed_room_ids,
                    'priority' => $rule->priority_room_ids ?? [],
                    'faculty_specialization' => $rule->faculty_specialization,
                ];
            }
        }

        // Cache rooms as arrays
        $this->roomsArray = [];
        $this->roomsById = [];
        $this->lectureRoomIds = [];
        $this->labRoomIds = [];
        foreach ($this->rooms as $r) {
            $cached = [
                'id' => $r->id,
                'capacity' => $r->capacity,
                'room_type' => $r->room_type,
                'priority' => $r->priority,
            ];
            $this->roomsArray[] = $cached;
            $this->roomsById[$r->id] = $cached;

            if ($r->room_type === 'lecture') {
                $this->lectureRoomIds[] = $r->id;
            } elseif (in_array($r->room_type, ['laboratory', 'hybrid'])) {
                $this->labRoomIds[] = $r->id;
            }
        }

        // Cache time slots as arrays
        $this->timeSlotsArray = [];
        $this->timeSlotsById = [];
        foreach ($this->timeSlots as $t) {
            $cached = [
                'id' => $t->id,
                'day_group' => $t->day_group,
                'days' => $t->days,
                'priority' => $t->priority,
                'start_time' => $t->start_time,
            ];
            $this->timeSlotsArray[] = $cached;
            $this->timeSlotsById[$t->id] = $cached;
        }
    }

    /**
     * Inject diversity into population when stuck in local optima.
     */
    protected function injectDiversity(array $population, array $fitnessScores): array
    {
        // Sort by fitness (worst first)
        asort($fitnessScores);
        $indices = array_keys($fitnessScores);

        // Replace bottom 25% with new conflict-free solutions
        $replaceCount = (int) ceil(count($population) * 0.25);
        $replaceIndices = array_slice($indices, 0, $replaceCount);

        foreach ($replaceIndices as $index) {
            $population[$index] = $this->createConflictFreeChromosome();
        }

        return $population;
    }

    /**
     * Set included day groups for scheduling.
     */
    public function setIncludedDays(array $days): self
    {
        $this->includedDays = $days;
        return $this;
    }

    /**
     * Set progress callback for tracking generation progress.
     */
    public function setProgressCallback(callable $callback): self
    {
        $this->progressCallback = $callback;
        return $this;
    }

    /**
     * Report progress if callback is set.
     */
    protected function reportProgress(int $generation, int $maxGenerations, int $bestFitness): void
    {
        if ($this->progressCallback) {
            call_user_func($this->progressCallback, $generation, $maxGenerations, $bestFitness);
        }
    }

    /**
     * Initialize population - 100% conflict-free greedy solutions.
     * Each solution has slight random variation for diversity.
     */
    protected function initializePopulation(): array
    {
        $population = [];

        // Create ALL greedy solutions with randomized subject order for diversity
        for ($i = 0; $i < $this->populationSize; $i++) {
            $population[] = $this->createConflictFreeChromosome();
        }

        return $population;
    }

    /**
     * Create a conflict-free chromosome using CACHED data only.
     * Uses load balancing to spread classes evenly across day groups.
     */
    protected function createConflictFreeChromosome(): array
    {
        $chromosome = [];
        $usedSlots = []; // "type_id_slotId_day" => true

        // Track load per day group for balancing
        $dayGroupLoad = ['MW' => 0, 'TTH' => 0, 'FRI' => 0];

        // Shuffle subjects array for diversity
        $subjects = $this->subjectsArray;
        shuffle($subjects);

        foreach ($subjects as $subject) {
            $subjectId = $subject['id'];
            $facultyId = $subject['faculty_id'];
            $yearLevelId = $subject['year_level_id'];
            $blockNumber = $subject['block_number'];
            $expectedStudents = $subject['expected_students'];
            $lectureHours = $subject['lecture_hours'];
            $labHours = $subject['lab_hours'];
            $preferredLectureRoomId = $subject['preferred_lecture_room_id'] ?? null;
            $preferredLabRoomId = $subject['preferred_lab_room_id'] ?? null;

            // Schedule lecture
            if ($lectureHours > 0) {
                $gene = $this->findFreeSlotBalanced($subjectId, false, $lectureHours, $expectedStudents, $facultyId, $yearLevelId, $blockNumber, $usedSlots, $dayGroupLoad, $preferredLectureRoomId);
                if ($gene) {
                    $chromosome[] = $gene;
                    $dayGroupLoad[$gene['day_group']]++;
                }
            }

            // Schedule lab
            if ($labHours > 0) {
                $gene = $this->findFreeSlotBalanced($subjectId, true, $labHours, $expectedStudents, $facultyId, $yearLevelId, $blockNumber, $usedSlots, $dayGroupLoad, $preferredLabRoomId);
                if ($gene) {
                    $chromosome[] = $gene;
                    $dayGroupLoad[$gene['day_group']]++;
                }
            }
        }

        return $chromosome;
    }

    /**
     * Calculate the maximum allowed entries per day group for load balancing.
     * Friday is STRICTLY limited based on actual available slots.
     */
    protected function getMaxEntriesPerDayGroup(): array
    {
        // Count actual slots per day group
        $slotsPerDayGroup = ['MW' => 0, 'TTH' => 0, 'FRI' => 0];
        foreach ($this->timeSlotsArray as $slot) {
            $dg = $slot['day_group'] ?? 'FRI';
            if (isset($slotsPerDayGroup[$dg])) {
                $slotsPerDayGroup[$dg]++;
            }
        }

        $roomCount = count($this->roomsArray);

        // Max capacity = slots * rooms
        // But we use 80% to leave room for constraints
        $maxMW = (int) floor($slotsPerDayGroup['MW'] * $roomCount * 0.8);
        $maxTTH = (int) floor($slotsPerDayGroup['TTH'] * $roomCount * 0.8);
        // Friday is STRICTLY limited to 60% of capacity (less room for error)
        $maxFRI = (int) floor($slotsPerDayGroup['FRI'] * $roomCount * 0.6);

        return [
            'MW' => max($maxMW, 10),
            'TTH' => max($maxTTH, 10),
            'FRI' => max($maxFRI, 5), // Minimum 5, but limited
        ];
    }

    /**
     * Get valid room IDs for a subject based on room assignment rules.
     * Returns filtered room IDs respecting category-based rules.
     */
    protected function getValidRoomIds(int $subjectId, bool $isLab): array
    {
        // Start with room type filter
        $roomIds = $isLab ? $this->labRoomIds : $this->lectureRoomIds;
        if (empty($roomIds)) {
            $roomIds = array_column($this->roomsArray, 'id');
        }

        // Check if subject has a category with room assignment rules
        $category = $this->subjectCategories[$subjectId] ?? null;
        if ($category && isset($this->roomAssignmentRules[$category])) {
            $rule = $this->roomAssignmentRules[$category];

            // Filter to only allowed rooms
            $allowedIds = $rule['allowed'];
            $filteredIds = array_intersect($roomIds, $allowedIds);

            // If we have priority rooms, put them first
            if (!empty($rule['priority']) && !empty($filteredIds)) {
                $priorityIds = array_intersect($filteredIds, $rule['priority']);
                $otherIds = array_diff($filteredIds, $priorityIds);
                return array_merge(array_values($priorityIds), array_values($otherIds));
            }

            return array_values($filteredIds);
        }

        return $roomIds;
    }

    /**
     * Find a conflict-free slot with LOAD BALANCING.
     * Actively avoids Friday when it's getting congested.
     * Prioritizes preferred room if specified.
     */
    protected function findFreeSlotBalanced(
        int $subjectId,
        bool $isLab,
        int $sessionHours,
        int $expectedStudents,
        ?int $facultyId,
        int $yearLevelId,
        int $blockNumber,
        array &$usedSlots,
        array $dayGroupLoad,
        ?int $preferredRoomId = null
    ): ?array {
        $maxPerDayGroup = $this->getMaxEntriesPerDayGroup();

        // Get room IDs using room assignment rules
        $roomIds = $this->getValidRoomIds($subjectId, $isLab);
        if (empty($roomIds)) {
            // Fallback to all rooms of type
            $roomIds = $isLab ? $this->labRoomIds : $this->lectureRoomIds;
            if (empty($roomIds)) {
                $roomIds = array_column($this->roomsArray, 'id');
            }
        }

        // Filter rooms by capacity
        $validRoomIds = [];
        foreach ($roomIds as $rid) {
            if (($this->roomsById[$rid]['capacity'] ?? 0) >= $expectedStudents) {
                $validRoomIds[] = $rid;
            }
        }
        if (empty($validRoomIds))
            $validRoomIds = $roomIds;

        // Prioritize preferred room if specified and available
        if ($preferredRoomId && in_array($preferredRoomId, $validRoomIds)) {
            // Move preferred room to the front
            $validRoomIds = array_diff($validRoomIds, [$preferredRoomId]);
            array_unshift($validRoomIds, $preferredRoomId);
        } else {
            shuffle($validRoomIds);
        }

        // Build slot list based on load balancing
        // Exclude day groups that are at capacity
        $mwSlots = [];
        $tthSlots = [];
        $friSlots = [];

        foreach ($this->timeSlotsArray as $slot) {
            if ($slot['day_group'] === 'MW' && $dayGroupLoad['MW'] < $maxPerDayGroup['MW']) {
                $mwSlots[] = $slot;
            } elseif ($slot['day_group'] === 'TTH' && $dayGroupLoad['TTH'] < $maxPerDayGroup['TTH']) {
                $tthSlots[] = $slot;
            } elseif ($slot['day_group'] === 'FRI' && $dayGroupLoad['FRI'] < $maxPerDayGroup['FRI']) {
                $friSlots[] = $slot;
            }
        }

        shuffle($mwSlots);
        shuffle($tthSlots);
        shuffle($friSlots);

        // Priority order: MW -> TTH -> FRI (Friday last and limited)
        $slots = array_merge($mwSlots, $tthSlots, $friSlots);

        // If all day groups are at capacity, use all slots as fallback
        if (empty($slots)) {
            $slots = $this->timeSlotsArray;
            shuffle($slots);
        }

        // Try to find conflict-free combination
        foreach ($slots as $slot) {
            $slotId = $slot['id'];
            $days = $slot['days'];
            $dayGroup = $slot['day_group'];

            foreach ($validRoomIds as $roomId) {
                $isAvailable = true;

                foreach ($days as $day) {
                    $roomKey = "R_{$roomId}_{$slotId}_{$day}";
                    $sectionKey = "S_{$yearLevelId}_{$blockNumber}_{$slotId}_{$day}";
                    $facultyKey = $facultyId ? "F_{$facultyId}_{$slotId}_{$day}" : null;

                    if (
                        isset($usedSlots[$roomKey]) || isset($usedSlots[$sectionKey]) ||
                        ($facultyKey && isset($usedSlots[$facultyKey]))
                    ) {
                        $isAvailable = false;
                        break;
                    }

                    // Faculty Day Off check
                    if ($facultyId && isset($this->facultyDayOffMap[$facultyId])) {
                        if (strtolower($day) === $this->facultyDayOffMap[$facultyId]) {
                            $offTime = $this->facultyDayOffTimeMap[$facultyId] ?? 'wholeday';
                            if ($offTime === 'wholeday') {
                                $isAvailable = false;
                                break;
                            }

                            $period = $this->getTimePeriodFromSlot($slot);
                            if ($period === $offTime) {
                                $isAvailable = false;
                                break;
                            }
                        }
                    }

                    // Faculty Time preference check
                    if ($facultyId && isset($this->facultyTimePeriodMap[$facultyId])) {
                        $period = $this->getTimePeriodFromSlot($slot);
                        if ($period && $period !== $this->facultyTimePeriodMap[$facultyId]) {
                            $isAvailable = false;
                            break;
                        }
                    }
                }

                if ($isAvailable) {
                    // Mark as used
                    foreach ($days as $day) {
                        $usedSlots["R_{$roomId}_{$slotId}_{$day}"] = true;
                        $usedSlots["S_{$yearLevelId}_{$blockNumber}_{$slotId}_{$day}"] = true;
                        if ($facultyId)
                            $usedSlots["F_{$facultyId}_{$slotId}_{$day}"] = true;
                    }

                    return [
                        'setup_subject_id' => $subjectId,
                        'room_id' => $roomId,
                        'time_slot_id' => $slotId,
                        'day_group' => $dayGroup,
                        'days' => $days,
                        'is_lab' => $isLab,
                        'session_hours' => $sessionHours,
                    ];
                }
            }
        }

        // Fallback: find least conflicting
        return $this->findLeastConflicting($subjectId, $isLab, $sessionHours, $facultyId, $yearLevelId, $blockNumber, $usedSlots);
    }

    /**
     * Find least conflicting slot when no free slot exists.
     * Prefers MW/TTH over Friday to reduce Friday congestion.
     */
    protected function findLeastConflicting(
        int $subjectId,
        bool $isLab,
        int $sessionHours,
        ?int $facultyId,
        int $yearLevelId,
        int $blockNumber,
        array &$usedSlots
    ): ?array {
        $roomIds = $isLab ? $this->labRoomIds : $this->lectureRoomIds;
        if (empty($roomIds))
            $roomIds = array_column($this->roomsArray, 'id');

        $bestGene = null;
        $bestConflicts = PHP_INT_MAX;
        $bestIsFriday = true; // Prefer non-Friday

        // Prioritize MW/TTH over Friday
        $mwTthSlots = [];
        $friSlots = [];
        foreach ($this->timeSlotsArray as $slot) {
            if (in_array($slot['day_group'], ['MW', 'TTH'])) {
                $mwTthSlots[] = $slot;
            } else {
                $friSlots[] = $slot;
            }
        }
        $orderedSlots = array_merge($mwTthSlots, $friSlots);

        foreach ($orderedSlots as $slot) {
            $isFriday = !in_array($slot['day_group'], ['MW', 'TTH']);

            foreach ($roomIds as $roomId) {
                $conflicts = 0;
                $days = $slot['days'];

                foreach ($days as $day) {
                    if (isset($usedSlots["R_{$roomId}_{$slot['id']}_{$day}"]))
                        $conflicts++;
                    if (isset($usedSlots["S_{$yearLevelId}_{$blockNumber}_{$slot['id']}_{$day}"]))
                        $conflicts++;
                    if ($facultyId && isset($usedSlots["F_{$facultyId}_{$slot['id']}_{$day}"]))
                        $conflicts++;

                    // Faculty Day Off check
                    if ($facultyId && isset($this->facultyDayOffMap[$facultyId])) {
                        if (strtolower($day) === $this->facultyDayOffMap[$facultyId]) {
                            $offTime = $this->facultyDayOffTimeMap[$facultyId] ?? 'wholeday';
                            if ($offTime === 'wholeday') {
                                $conflicts++;
                            } else {
                                $period = $this->getTimePeriodFromSlot($slot);
                                if ($period === $offTime) {
                                    $conflicts++;
                                }
                            }
                        }
                    }

                    // Faculty Time preference check
                    if ($facultyId && isset($this->facultyTimePeriodMap[$facultyId])) {
                        $period = $this->getTimePeriodFromSlot($slot);
                        if ($period && $period !== $this->facultyTimePeriodMap[$facultyId]) {
                            $conflicts++;
                        }
                    }
                }

                // Prefer: less conflicts, and non-Friday over Friday
                $isBetter = ($conflicts < $bestConflicts) ||
                    ($conflicts == $bestConflicts && !$isFriday && $bestIsFriday);

                if ($isBetter) {
                    $bestConflicts = $conflicts;
                    $bestIsFriday = $isFriday;
                    $bestGene = [
                        'setup_subject_id' => $subjectId,
                        'room_id' => $roomId,
                        'time_slot_id' => $slot['id'],
                        'day_group' => $slot['day_group'],
                        'days' => $days,
                        'is_lab' => $isLab,
                        'session_hours' => $sessionHours,
                    ];
                }
            }
        }

        if ($bestGene) {
            foreach ($bestGene['days'] as $day) {
                $usedSlots["R_{$bestGene['room_id']}_{$bestGene['time_slot_id']}_{$day}"] = true;
                $usedSlots["S_{$yearLevelId}_{$blockNumber}_{$bestGene['time_slot_id']}_{$day}"] = true;
                if ($facultyId)
                    $usedSlots["F_{$facultyId}_{$bestGene['time_slot_id']}_{$day}"] = true;
            }
        }

        return $bestGene;
    }

    /**
     * Get time period (morning/afternoon) for a time slot based on start time.
     * Morning: before 12:00, Afternoon: 12:00 and after
     */
    protected function getTimePeriodForTimeSlot(TimeSlot $timeSlot): ?string
    {
        $startTime = $timeSlot->start_time;
        if (!$startTime) {
            return null;
        }

        // start_time is cast as datetime:H:i, so it's a Carbon instance
        // Extract hour from the time
        $hour = (int) $startTime->format('H');

        // Morning: 00:00 - 11:59, Afternoon: 12:00 - 23:59
        return $hour < 12 ? 'morning' : 'afternoon';
    }

    /**
     * Evaluate fitness of entire population.
     */
    protected function evaluatePopulation(array $population): array
    {
        $fitnessScores = [];

        foreach ($population as $index => $chromosome) {
            $fitnessScores[$index] = $this->calculateFitness($chromosome);
        }

        return $fitnessScores;
    }

    /**
     * Calculate fitness score for a chromosome using CACHED data only.
     *
     * Fitness logic:
     * - 0 = PERFECT (no conflicts)
     * - Negative = has conflicts (more negative = worse)
     * - Goal: reach 0
     */
    protected function calculateFitness(array $chromosome): int
    {
        $fitness = 0; // Start at 0, subtract for each problem

        // Tracking maps for conflict detection
        $roomSlots = [];      // "roomId_slotId_day" => true
        $facultySlots = [];   // "facultyId_slotId_day" => true
        $sectionSlots = [];   // "yearLevel_block_slotId_day" => true
        $baseSubjectSlots = []; // "subjectId_slotId_day" => setupSubjectId

        foreach ($chromosome as $gene) {
            $days = $gene['days'] ?? ['monday'];
            $subjectId = $gene['setup_subject_id'];
            $roomId = $gene['room_id'];
            $slotId = $gene['time_slot_id'];

            // Get cached data (NO database queries)
            $subject = $this->subjectsById[$subjectId] ?? null;
            $room = $this->roomsById[$roomId] ?? null;
            $slot = $this->timeSlotsById[$slotId] ?? null;

            if (!$subject || !$room || !$slot) {
                $fitness -= 50; // Invalid gene
                continue;
            }

            $yearLevelId = $subject['year_level_id'];
            $blockNumber = $subject['block_number'];
            $baseSubjectId = $subject['subject_id'];
            $facultyId = $subject['faculty_id'];
            $expectedStudents = $subject['expected_students'];

            // Extra penalty multiplier for Friday (harder to resolve)
            $isFriday = ($gene['day_group'] ?? '') === 'FRI';
            $fridayMultiplier = $isFriday ? 1.5 : 1.0;

            // Check conflicts for ALL days in this gene
            foreach ($days as $day) {
                // Room conflict
                $roomKey = "{$roomId}_{$slotId}_{$day}";
                if (isset($roomSlots[$roomKey])) {
                    $fitness += (int) ($this->fitnessWeights['room_conflict'] * $fridayMultiplier);
                }
                $roomSlots[$roomKey] = true;

                // Section/Year-level-block conflict (students can't be in 2 places)
                $sectionKey = "{$yearLevelId}_{$blockNumber}_{$slotId}_{$day}";
                if (isset($sectionSlots[$sectionKey])) {
                    $fitness += (int) ($this->fitnessWeights['year_level_conflict'] * $fridayMultiplier);
                }
                $sectionSlots[$sectionKey] = true;

                // Faculty conflict
                if ($facultyId) {
                    $facultyKey = "{$facultyId}_{$slotId}_{$day}";
                    if (isset($facultySlots[$facultyKey])) {
                        $fitness += (int) ($this->fitnessWeights['faculty_conflict'] * $fridayMultiplier);
                    }
                    $facultySlots[$facultyKey] = true;

                    // Soft: Faculty day off and time
                    if (isset($this->facultyDayOffMap[$facultyId])) {
                        if (strtolower($day) === $this->facultyDayOffMap[$facultyId]) {
                            $offTime = $this->facultyDayOffTimeMap[$facultyId] ?? 'wholeday';

                            $isConflict = false;
                            if ($offTime === 'wholeday') {
                                $isConflict = true;
                            } else {
                                $period = $this->getTimePeriodFromSlot($slot);
                                if ($period === $offTime) {
                                    $isConflict = true;
                                }
                            }

                            if ($isConflict) {
                                $fitness += $this->fitnessWeights['faculty_day_off'];
                            }
                        }
                    }

                    // Soft: Faculty time preference
                    if (isset($this->facultyTimePeriodMap[$facultyId])) {
                        $period = $this->getTimePeriodFromSlot($slot);
                        if ($period && $period !== $this->facultyTimePeriodMap[$facultyId]) {
                            $fitness += $this->fitnessWeights['faculty_time_period'];
                        }
                    }
                }

                // Block conflict (same base subject, different blocks, same time)
                $baseKey = "{$baseSubjectId}_{$slotId}_{$day}";
                if (isset($baseSubjectSlots[$baseKey]) && $baseSubjectSlots[$baseKey] !== $subjectId) {
                    $fitness += $this->fitnessWeights['block_conflict'];
                }
                $baseSubjectSlots[$baseKey] = $subjectId;
            }

            // Room capacity check
            if ($room['capacity'] < $expectedStudents) {
                $fitness += $this->fitnessWeights['capacity_mismatch'];
            }

            // Room type check
            if ($gene['is_lab'] && $room['room_type'] === 'lecture') {
                $fitness += $this->fitnessWeights['room_type_mismatch'];
            }
        }

        return $fitness;
    }

    /**
     * Get time period from cached slot data.
     */
    protected function getTimePeriodFromSlot(array $slot): ?string
    {
        $startTime = $slot['start_time'] ?? null;
        if (!$startTime)
            return null;

        $hour = is_object($startTime) ? (int) $startTime->format('H') : (int) substr($startTime, 0, 2);
        return $hour < 12 ? 'morning' : 'afternoon';
    }

    /**
     * Evolve population to next generation.
     */
    protected function evolve(array $population, array $fitnessScores): array
    {
        $newPopulation = [];

        // Elitism - keep best chromosomes
        arsort($fitnessScores);
        $eliteIndices = array_slice(array_keys($fitnessScores), 0, $this->eliteCount);

        foreach ($eliteIndices as $index) {
            $newPopulation[] = $population[$index];
        }

        // Fill rest of population with crossover and mutation
        while (count($newPopulation) < $this->populationSize) {
            // Tournament selection
            $parent1 = $this->tournamentSelection($population, $fitnessScores);
            $parent2 = $this->tournamentSelection($population, $fitnessScores);

            // Crossover
            if (mt_rand() / mt_getrandmax() < $this->crossoverRate) {
                [$child1, $child2] = $this->crossover($parent1, $parent2);
            } else {
                $child1 = $parent1;
                $child2 = $parent2;
            }

            // Mutation
            $child1 = $this->mutate($child1);
            $child2 = $this->mutate($child2);

            $newPopulation[] = $child1;
            if (count($newPopulation) < $this->populationSize) {
                $newPopulation[] = $child2;
            }
        }

        return $newPopulation;
    }

    /**
     * Tournament selection.
     */
    protected function tournamentSelection(array $population, array $fitnessScores): array
    {
        $tournamentIndices = array_rand($population, min($this->tournamentSize, count($population)));
        if (!is_array($tournamentIndices)) {
            $tournamentIndices = [$tournamentIndices];
        }

        $bestIndex = $tournamentIndices[0];
        $bestFitness = $fitnessScores[$bestIndex];

        foreach ($tournamentIndices as $index) {
            if ($fitnessScores[$index] > $bestFitness) {
                $bestFitness = $fitnessScores[$index];
                $bestIndex = $index;
            }
        }

        return $population[$bestIndex];
    }

    /**
     * Uniform crossover - better for scheduling problems.
     * Each gene is independently chosen from either parent with 50% probability.
     * Prevents duplicate genes (same subject + session type).
     */
    protected function crossover(array $parent1, array $parent2): array
    {
        $length = max(count($parent1), count($parent2));
        if ($length < 2) {
            return [$parent1, $parent2];
        }

        $child1 = [];
        $child2 = [];
        $child1Used = []; // Track "subjectId_isLab" to prevent duplicates
        $child2Used = [];

        for ($i = 0; $i < $length; $i++) {
            // Use uniform crossover with 50% probability
            if (mt_rand(0, 1) === 0) {
                // Child1 gets from Parent1, Child2 gets from Parent2
                if (isset($parent1[$i])) {
                    $key = $parent1[$i]['setup_subject_id'] . '_' . ($parent1[$i]['is_lab'] ? '1' : '0');
                    if (!isset($child1Used[$key])) {
                        $child1[] = $parent1[$i];
                        $child1Used[$key] = true;
                    }
                }
                if (isset($parent2[$i])) {
                    $key = $parent2[$i]['setup_subject_id'] . '_' . ($parent2[$i]['is_lab'] ? '1' : '0');
                    if (!isset($child2Used[$key])) {
                        $child2[] = $parent2[$i];
                        $child2Used[$key] = true;
                    }
                }
            } else {
                // Child1 gets from Parent2, Child2 gets from Parent1
                if (isset($parent2[$i])) {
                    $key = $parent2[$i]['setup_subject_id'] . '_' . ($parent2[$i]['is_lab'] ? '1' : '0');
                    if (!isset($child1Used[$key])) {
                        $child1[] = $parent2[$i];
                        $child1Used[$key] = true;
                    }
                }
                if (isset($parent1[$i])) {
                    $key = $parent1[$i]['setup_subject_id'] . '_' . ($parent1[$i]['is_lab'] ? '1' : '0');
                    if (!isset($child2Used[$key])) {
                        $child2[] = $parent1[$i];
                        $child2Used[$key] = true;
                    }
                }
            }
        }

        // Fill missing genes from the other parent to ensure completeness
        foreach ($parent2 as $gene) {
            $key = $gene['setup_subject_id'] . '_' . ($gene['is_lab'] ? '1' : '0');
            if (!isset($child1Used[$key])) {
                $child1[] = $gene;
                $child1Used[$key] = true;
            }
        }
        foreach ($parent1 as $gene) {
            $key = $gene['setup_subject_id'] . '_' . ($gene['is_lab'] ? '1' : '0');
            if (!isset($child2Used[$key])) {
                $child2[] = $gene;
                $child2Used[$key] = true;
            }
        }

        // Ensure children have all genes (fill missing with random if needed)
        if (empty($child1))
            $child1 = $parent1;
        if (empty($child2))
            $child2 = $parent2;

        return [$child1, $child2];
    }

    /**
     * Mutation - smartly change genes to resolve conflicts and improve fitness.
     * Uses guided mutation: targets conflicting genes first.
     */
    protected function mutate(array $chromosome): array
    {
        // Build maps of used slots for conflict detection
        $usedRoomTimeSlots = [];
        $usedFacultyTimeSlots = [];
        $usedSectionTimeSlots = [];
        $usedBaseSubjectTimeSlots = [];
        $yearLevelBlockTimeSlots = [];

        foreach ($chromosome as $gene) {
            $this->updateConflictMaps($gene, $usedRoomTimeSlots, $usedFacultyTimeSlots, $usedSectionTimeSlots, $usedBaseSubjectTimeSlots, 1);
            $this->updateYearLevelBlockMap($gene, $yearLevelBlockTimeSlots, 1);
        }

        // First pass: identify and prioritize conflicting genes
        $conflictingIndices = [];
        $normalIndices = [];

        foreach ($chromosome as $index => $gene) {
            if ($this->isGeneInConflict($gene, $usedRoomTimeSlots, $usedFacultyTimeSlots, $usedSectionTimeSlots, $usedBaseSubjectTimeSlots, $yearLevelBlockTimeSlots)) {
                $conflictingIndices[] = $index;
            } else {
                $normalIndices[] = $index;
            }
        }

        // Higher mutation rate for conflicting genes (always try to fix them)
        $conflictMutationRate = min(0.9, $this->mutationRate * 3);

        // Mutate conflicting genes first (with higher priority)
        foreach ($conflictingIndices as $index) {
            if (mt_rand() / mt_getrandmax() < $conflictMutationRate) {
                $chromosome[$index] = $this->mutateGene(
                    $chromosome[$index],
                    $usedRoomTimeSlots,
                    $usedFacultyTimeSlots,
                    $usedSectionTimeSlots,
                    $usedBaseSubjectTimeSlots,
                    $yearLevelBlockTimeSlots,
                    true
                );
            }
        }

        // Regular mutation for non-conflicting genes
        foreach ($normalIndices as $index) {
            if (mt_rand() / mt_getrandmax() < $this->mutationRate) {
                $gene = $chromosome[$index];
                $this->updateConflictMaps($gene, $usedRoomTimeSlots, $usedFacultyTimeSlots, $usedSectionTimeSlots, $usedBaseSubjectTimeSlots, -1);
                $this->updateYearLevelBlockMap($gene, $yearLevelBlockTimeSlots, -1);

                $chromosome[$index] = $this->mutateGene(
                    $gene,
                    $usedRoomTimeSlots,
                    $usedFacultyTimeSlots,
                    $usedSectionTimeSlots,
                    $usedBaseSubjectTimeSlots,
                    $yearLevelBlockTimeSlots,
                    false
                );
            }
        }

        return $chromosome;
    }

    /**
     * Check if a gene is currently in conflict.
     */
    protected function isGeneInConflict(
        array $gene,
        array $usedRoomTimeSlots,
        array $usedFacultyTimeSlots,
        array $usedSectionTimeSlots,
        array $usedBaseSubjectTimeSlots,
        array $yearLevelBlockTimeSlots
    ): bool {
        $days = $gene['days'] ?? ['monday'];
        $subject = $this->subjectsById[$gene['setup_subject_id']] ?? null;

        if (!$subject)
            return true;

        $yearLevelId = $subject['year_level_id'];
        $blockNumber = $subject['block_number'];
        $facultyId = $subject['faculty_id'];

        foreach ($days as $day) {
            $roomKey = "{$gene['room_id']}_{$gene['time_slot_id']}_{$day}";
            $facultyKey = $facultyId ? "{$facultyId}_{$gene['time_slot_id']}_{$day}" : null;
            $yearLevelBlockKey = "{$yearLevelId}_{$blockNumber}_{$gene['time_slot_id']}_{$day}";

            if (($usedRoomTimeSlots[$roomKey] ?? 0) > 1)
                return true;
            if ($facultyKey && ($usedFacultyTimeSlots[$facultyKey] ?? 0) > 1)
                return true;
            if (($yearLevelBlockTimeSlots[$yearLevelBlockKey] ?? 0) > 1)
                return true;

            // Check Faculty Day Off preference
            if ($facultyId && isset($this->facultyDayOffMap[$facultyId])) {
                if (strtolower($day) === $this->facultyDayOffMap[$facultyId]) {
                    $offTime = $this->facultyDayOffTimeMap[$facultyId] ?? 'wholeday';
                    if ($offTime === 'wholeday') {
                        return true;
                    }

                    $slot = $this->timeSlotsById[$gene['time_slot_id']] ?? null;
                    if ($slot) {
                        $period = $this->getTimePeriodFromSlot($slot);
                        if ($period === $offTime) {
                            return true;
                        }
                    }
                }
            }

            // Check Faculty time preference
            if ($facultyId && isset($this->facultyTimePeriodMap[$facultyId])) {
                $slot = $this->timeSlotsById[$gene['time_slot_id']] ?? null;
                if ($slot) {
                    $period = $this->getTimePeriodFromSlot($slot);
                    if ($period && $period !== $this->facultyTimePeriodMap[$facultyId]) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    /**
     * Update year level/block tracking map.
     */
    protected function updateYearLevelBlockMap(array $gene, array &$yearLevelBlockTimeSlots, int $delta): void
    {
        $days = $gene['days'] ?? ['monday'];
        $subject = $this->subjectsById[$gene['setup_subject_id']] ?? null;

        if (!$subject)
            return;

        $yearLevelId = $subject['year_level_id'];
        $blockNumber = $subject['block_number'];

        foreach ($days as $day) {
            $key = "{$yearLevelId}_{$blockNumber}_{$gene['time_slot_id']}_{$day}";
            if (!isset($yearLevelBlockTimeSlots[$key])) {
                $yearLevelBlockTimeSlots[$key] = 0;
            }
            $yearLevelBlockTimeSlots[$key] += $delta;
            if ($yearLevelBlockTimeSlots[$key] <= 0) {
                unset($yearLevelBlockTimeSlots[$key]);
            }
        }
    }

    /**
     * Mutate a single gene using CACHED data.
     */
    protected function mutateGene(
        array $gene,
        array &$usedRoomTimeSlots,
        array &$usedFacultyTimeSlots,
        array &$usedSectionTimeSlots,
        array &$usedBaseSubjectTimeSlots,
        array &$yearLevelBlockTimeSlots,
        bool $forceResolve
    ): array {
        $this->updateConflictMaps($gene, $usedRoomTimeSlots, $usedFacultyTimeSlots, $usedSectionTimeSlots, $usedBaseSubjectTimeSlots, -1);
        $this->updateYearLevelBlockMap($gene, $yearLevelBlockTimeSlots, -1);

        $maxAttempts = $forceResolve ? 40 : 20;
        $bestGene = $gene;
        $bestConflictCount = PHP_INT_MAX;
        $bestIsFriday = true;

        // Get room IDs from cache
        $roomIds = $gene['is_lab'] ? $this->labRoomIds : $this->lectureRoomIds;
        if (empty($roomIds))
            $roomIds = array_column($this->roomsArray, 'id');

        // Separate MW/TTH from Friday slots (prefer MW/TTH)
        $mwTthSlots = [];
        $friSlots = [];
        foreach ($this->timeSlotsArray as $slot) {
            if (in_array($slot['day_group'], ['MW', 'TTH'])) {
                $mwTthSlots[] = $slot;
            } else {
                $friSlots[] = $slot;
            }
        }

        for ($attempt = 0; $attempt < $maxAttempts; $attempt++) {
            $newGene = $gene;
            $mutationType = mt_rand(1, 10);

            // Room mutation (40% + 20% both)
            if ($mutationType <= 4 || $mutationType > 8) {
                $newGene['room_id'] = $roomIds[array_rand($roomIds)];
            }

            // Time slot mutation - 70% prefer MW/TTH, 30% Friday
            if ($mutationType > 4) {
                $preferMwTth = mt_rand(1, 10) <= 7;
                if ($preferMwTth && !empty($mwTthSlots)) {
                    $slot = $mwTthSlots[array_rand($mwTthSlots)];
                } elseif (!empty($friSlots)) {
                    $slot = $friSlots[array_rand($friSlots)];
                } else {
                    $slot = $this->timeSlotsArray[array_rand($this->timeSlotsArray)];
                }
                $newGene['time_slot_id'] = $slot['id'];
                $newGene['day_group'] = $slot['day_group'];
                $newGene['days'] = $slot['days'];
            }

            $conflictCount = $this->countGeneConflicts($newGene, $usedRoomTimeSlots, $usedFacultyTimeSlots, $usedSectionTimeSlots, $usedBaseSubjectTimeSlots, $yearLevelBlockTimeSlots);
            $isFriday = !in_array($newGene['day_group'], ['MW', 'TTH']);

            if ($conflictCount == 0) {
                $this->updateConflictMaps($newGene, $usedRoomTimeSlots, $usedFacultyTimeSlots, $usedSectionTimeSlots, $usedBaseSubjectTimeSlots, 1);
                $this->updateYearLevelBlockMap($newGene, $yearLevelBlockTimeSlots, 1);
                return $newGene;
            }

            // Prefer: less conflicts, and non-Friday over Friday
            $isBetter = ($conflictCount < $bestConflictCount) ||
                ($conflictCount == $bestConflictCount && !$isFriday && $bestIsFriday);

            if ($isBetter) {
                $bestConflictCount = $conflictCount;
                $bestIsFriday = $isFriday;
                $bestGene = $newGene;
            }
        }

        $this->updateConflictMaps($bestGene, $usedRoomTimeSlots, $usedFacultyTimeSlots, $usedSectionTimeSlots, $usedBaseSubjectTimeSlots, 1);
        $this->updateYearLevelBlockMap($bestGene, $yearLevelBlockTimeSlots, 1);
        return $bestGene;
    }

    /**
     * Count conflicts for a gene using CACHED data.
     */
    protected function countGeneConflicts(
        array $gene,
        array $usedRoomTimeSlots,
        array $usedFacultyTimeSlots,
        array $usedSectionTimeSlots,
        array $usedBaseSubjectTimeSlots,
        array $yearLevelBlockTimeSlots
    ): int {
        $conflicts = 0;
        $days = $gene['days'] ?? ['monday'];
        $subject = $this->subjectsById[$gene['setup_subject_id']] ?? null;

        if (!$subject)
            return 99;

        $yearLevelId = $subject['year_level_id'];
        $blockNumber = $subject['block_number'];
        $facultyId = $subject['faculty_id'];

        foreach ($days as $day) {
            $roomKey = "{$gene['room_id']}_{$gene['time_slot_id']}_{$day}";
            $facultyKey = $facultyId ? "{$facultyId}_{$gene['time_slot_id']}_{$day}" : null;
            $yearLevelBlockKey = "{$yearLevelId}_{$blockNumber}_{$gene['time_slot_id']}_{$day}";

            if (isset($usedRoomTimeSlots[$roomKey]))
                $conflicts++;
            if ($facultyKey && isset($usedFacultyTimeSlots[$facultyKey]))
                $conflicts++;
            if (isset($yearLevelBlockTimeSlots[$yearLevelBlockKey]))
                $conflicts++;

            // Faculty Day Off preference
            if ($facultyId && isset($this->facultyDayOffMap[$facultyId])) {
                if (strtolower($day) === $this->facultyDayOffMap[$facultyId]) {
                    $offTime = $this->facultyDayOffTimeMap[$facultyId] ?? 'wholeday';
                    if ($offTime === 'wholeday') {
                        $conflicts++;
                    } else {
                        $slot = $this->timeSlotsById[$gene['time_slot_id']] ?? null;
                        if ($slot) {
                            $period = $this->getTimePeriodFromSlot($slot);
                            if ($period === $offTime) {
                                $conflicts++;
                            }
                        }
                    }
                }
            }

            // Faculty time preference
            if ($facultyId && isset($this->facultyTimePeriodMap[$facultyId])) {
                $slot = $this->timeSlotsById[$gene['time_slot_id']] ?? null;
                if ($slot) {
                    $period = $this->getTimePeriodFromSlot($slot);
                    if ($period && $period !== $this->facultyTimePeriodMap[$facultyId]) {
                        $conflicts++;
                    }
                }
            }
        }

        return $conflicts;
    }

    /**
     * Create schedule from best chromosome.
     * Creates entries for ALL days in paired day groups (MW, TTH).
     */

    protected function createSchedule(
        array $chromosome,
        int $fitness,
        int $generations,
        array $stats,
        ?int $userId
    ): Schedule {
        $schedule = Schedule::create([
            'academic_setup_id' => $this->academicSetup->id,
            'name' => "Schedule - " . now()->format('Y-m-d H:i'),
            'status' => 'draft',
            'fitness_score' => $fitness,
            'generation' => $generations,
            'metadata' => [
                'population_size' => $this->populationSize,
                'max_generations' => $this->maxGenerations,
                'mutation_rate' => $this->mutationRate,
                'included_days' => $this->includedDays,
                'generation_stats' => array_slice($stats, -10),
            ],
            'created_by' => $userId,
        ]);

        $validFacultyIds = $this->academicSetup->faculty()->pluck('user_id')->toArray();
        $occupiedKeys = []; // Track used slots to prevent DB Unique Constraint Violation

        // SAFETY: Deduplicate chromosome to prevent duplicate entries
        // Key = "subjectId_isLab" - each subject should have at most 1 LEC and 1 LAB
        $deduplicatedChromosome = [];
        $seenGenes = [];
        foreach ($chromosome as $gene) {
            $geneKey = $gene['setup_subject_id'] . '_' . ($gene['is_lab'] ? 'lab' : 'lec');
            if (!isset($seenGenes[$geneKey])) {
                $deduplicatedChromosome[] = $gene;
                $seenGenes[$geneKey] = true;
            }
        }

        foreach ($deduplicatedChromosome as $gene) {
            $setupSubject = $this->subjects->firstWhere('id', $gene['setup_subject_id']);
            $facultyId = null;

            if ($setupSubject) {
                $assignment = $setupSubject->facultyAssignments->first();
                $assignedFacultyId = $assignment?->user_id;

                if ($assignedFacultyId && in_array($assignedFacultyId, $validFacultyIds)) {
                    $facultyId = $assignedFacultyId;
                }
            }

            $timeSlot = $this->timeSlots->firstWhere('id', $gene['time_slot_id']);

            $days = $gene['days'] ?? [$gene['day'] ?? 'monday'];
            $dayGroup = $gene['day_group'] ?? $timeSlot?->day_group ?? 'MW';
            $sessionHours = $gene['session_hours'] ?? ($gene['is_lab'] ? 3 : 2);
            $sessionGroupId = Str::uuid()->toString();

            $customTimes = $this->calculateCustomTime($timeSlot, $dayGroup, $gene['is_lab'], $sessionHours);

            foreach ($days as $day) {
                // Check DB Constraint: (schedule_id, room_id, time_slot_id, day)
                $uniqueKey = "{$gene['room_id']}_{$gene['time_slot_id']}_{$day}";
                $finalRoomId = $gene['room_id'];

                if (isset($occupiedKeys[$uniqueKey])) {
                    // Conflict detected! Set room to null to avoid SQL crash
                    $finalRoomId = null;
                } else {
                    $occupiedKeys[$uniqueKey] = true;
                }

                ScheduleEntry::create([
                    'schedule_id' => $schedule->id,
                    'academic_setup_subject_id' => $gene['setup_subject_id'],
                    'room_id' => $finalRoomId,
                    'time_slot_id' => $gene['time_slot_id'],
                    'user_id' => $facultyId,
                    'day' => $day,
                    'is_lab_session' => $gene['is_lab'],
                    'custom_start_time' => $customTimes['start'],
                    'custom_end_time' => $customTimes['end'],
                    'session_group_id' => $sessionGroupId,
                    'slots_span' => $customTimes['slots_span'] ?? 1,
                ]);
            }
        }

        return $schedule;
    }

    /**
     * Calculate custom start and end times based on session type and day group.
     *
     * STANDARD HOURS (regardless of subject configuration):
     *
     * For MW/TTH paired schedules:
     * - Lecture: 1 hour per day (total 2 hours across both days)
     * - Lab: 1.5 hours per day (total 3 hours) - uses full time slot
     *
     * For FRI/SAT/SUN single day:
     * - Lecture: 2 hours continuous
     * - Lab: 3 hours continuous
     */
    protected function calculateCustomTime(?TimeSlot $timeSlot, string $dayGroup, bool $isLab, int $sessionHours): array
    {
        if (!$timeSlot) {
            return ['start' => null, 'end' => null, 'slots_span' => 1];
        }

        $startTime = $timeSlot->start_time;
        $endTime = $timeSlot->end_time;

        if (!$startTime || !$endTime) {
            return ['start' => null, 'end' => null, 'slots_span' => 1];
        }

        $isPairedDayGroup = in_array($dayGroup, ['MW', 'TTH']);

        if ($isPairedDayGroup) {
            // Use STANDARD hours for MW/TTH:
            // - Lecture: 1 hour per day (60 minutes)
            // - Lab: 1.5 hours per day (90 minutes) - uses full slot

            if ($isLab) {
                // Lab uses full 1.5 hour slot, no custom time needed
                return ['start' => null, 'end' => null, 'slots_span' => 1];
            } else {
                // Lecture is 1 hour per day (60 minutes)
                $perDayMinutes = 60;
                $customEndTime = $startTime->copy()->addMinutes($perDayMinutes);

                return [
                    'start' => $startTime->format('H:i:s'),
                    'end' => $customEndTime->format('H:i:s'),
                    'slots_span' => 1,
                ];
            }
        } else {
            // Single day schedules (FRI, SAT, SUN) - continuous sessions
            // Use STANDARD hours:
            // - Lecture: 2 hours continuous (120 minutes)
            // - Lab: 3 hours continuous (180 minutes)

            $sessionMinutes = $isLab ? 180 : 120; // 3 hours for lab, 2 hours for lecture

            // Calculate how many time slots this session spans
            // Each slot is 90 minutes, with 5 minute breaks between
            $slotDuration = 90;
            $breakDuration = 5;
            $slotsSpan = 1;

            if ($sessionMinutes > $slotDuration) {
                // Calculate slots needed: first slot is 90 min, subsequent slots add 95 min each (90 + 5 break)
                $remainingMinutes = $sessionMinutes - $slotDuration;
                $slotsSpan = 1 + ceil($remainingMinutes / ($slotDuration + $breakDuration));
            }

            $customEndTime = $startTime->copy()->addMinutes($sessionMinutes);

            return [
                'start' => $startTime->format('H:i:s'),
                'end' => $customEndTime->format('H:i:s'),
                'slots_span' => $slotsSpan,
            ];
        }
    }

    /**
     * Set GA parameters.
     */
    public function setParameters(array $params): self
    {
        if (isset($params['population_size'])) {
            $this->populationSize = max(10, min(200, (int) $params['population_size']));
        }
        if (isset($params['max_generations'])) {
            $this->maxGenerations = max(10, min(500, (int) $params['max_generations']));
        }
        if (isset($params['mutation_rate'])) {
            $this->mutationRate = max(0.01, min(0.5, (float) $params['mutation_rate']));
        }
        if (isset($params['crossover_rate'])) {
            $this->crossoverRate = max(0.1, min(1.0, (float) $params['crossover_rate']));
        }
        if (isset($params['elite_count'])) {
            $this->eliteCount = max(1, min(20, (int) $params['elite_count']));
        }
        if (isset($params['tournament_size'])) {
            $this->tournamentSize = max(2, min(10, (int) $params['tournament_size']));
        }
        if (isset($params['target_fitness_min'])) {
            $this->targetFitnessMin = is_numeric($params['target_fitness_min']) && $params['target_fitness_min'] !== '' ? (int) $params['target_fitness_min'] : null;
        }
        if (isset($params['target_fitness_max'])) {
            $this->targetFitnessMax = is_numeric($params['target_fitness_max']) && $params['target_fitness_max'] !== '' ? (int) $params['target_fitness_max'] : null;
        }
        return $this;
    }

    /**
     * Update conflict maps based on gene usage.
     * Now handles multi-day genes (MW/TTH pairs).
     */
    protected function updateConflictMaps($gene, &$rooms, &$faculty, &$sections, &$baseSub, int $diff): void
    {
        // Get all days from the gene
        $days = $gene['days'] ?? [$gene['day'] ?? 'monday'];

        foreach ($days as $day) {
            $keySuffix = "_{$gene['time_slot_id']}_{$day}";

            // Room
            $roomKey = $gene['room_id'] . $keySuffix;
            $rooms[$roomKey] = ($rooms[$roomKey] ?? 0) + $diff;

            // Subject Info
            $subject = $this->subjectsKeyed[$gene['setup_subject_id']] ?? null;
            if ($subject) {
                // Faculty
                $assignment = $subject->facultyAssignments->first();
                if ($assignment) {
                    $fKey = $assignment->user_id . $keySuffix;
                    $faculty[$fKey] = ($faculty[$fKey] ?? 0) + $diff;
                }

                // Section
                $sKey = $subject->year_level_id . '_' . ($subject->block_number ?? 1) . $keySuffix;
                $sections[$sKey] = ($sections[$sKey] ?? 0) + $diff;

                // Base Subject
                $bKey = $subject->subject_id . $keySuffix;
                $baseSub[$bKey] = ($baseSub[$bKey] ?? 0) + $diff;
            }
        }
    }

    /**
     * Check if a gene creates any conflict.
     * Now handles multi-day genes (MW/TTH pairs).
     */
    protected function checkGeneConflict($gene, array $rooms, array $faculty, array $sections, array $baseSub): bool
    {
        // Get all days from the gene
        $days = $gene['days'] ?? [$gene['day'] ?? 'monday'];

        foreach ($days as $day) {
            $keySuffix = "_{$gene['time_slot_id']}_{$day}";

            // Room Check
            if (($rooms[$gene['room_id'] . $keySuffix] ?? 0) > 0)
                return true;

            $subject = $this->subjectsKeyed[$gene['setup_subject_id']] ?? null;
            if ($subject) {
                // Faculty Check
                $assignment = $subject->facultyAssignments->first();
                if ($assignment && ($faculty[$assignment->user_id . $keySuffix] ?? 0) > 0)
                    return true;

                // Section Check
                if (($sections[$subject->year_level_id . '_' . ($subject->block_number ?? 1) . $keySuffix] ?? 0) > 0)
                    return true;

                // Base Subject Check
                if (($baseSub[$subject->subject_id . $keySuffix] ?? 0) > 0)
                    return true;

                // Faculty Day Off Check
                if (isset($this->facultyDayOffMap[$assignment->user_id])) {
                    if (strtolower($day) === $this->facultyDayOffMap[$assignment->user_id]) {
                        $offTime = $this->facultyDayOffTimeMap[$assignment->user_id] ?? 'wholeday';
                        if ($offTime === 'wholeday') {
                            return true;
                        }

                        $slot = $this->timeSlotsById[$gene['time_slot_id']] ?? null;
                        if ($slot) {
                            $period = $this->getTimePeriodFromSlot($slot);
                            if ($period === $offTime) {
                                return true;
                            }
                        }
                    }
                }

                // Faculty Time preference check
                if (isset($this->facultyTimePeriodMap[$assignment->user_id])) {
                    $slot = $this->timeSlotsById[$gene['time_slot_id']] ?? null;
                    if ($slot) {
                        $period = $this->getTimePeriodFromSlot($slot);
                        if ($period && $period !== $this->facultyTimePeriodMap[$assignment->user_id]) {
                            return true;
                        }
                    }
                }
            }
        }

        return false;
    }
}
