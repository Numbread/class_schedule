<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\TimeSlot;

$t = TimeSlot::find(15);
if ($t) {
    echo "ID: 15, Group: {$t->day_group}, Days: " . json_encode($t->days) . "\n";
} else {
    echo "Slot 15 not found\n";
}
