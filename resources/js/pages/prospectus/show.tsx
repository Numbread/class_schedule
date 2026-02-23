import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Clock,
  FlaskConical,
  GraduationCap,
  Pencil,
  Download,
  Upload,
  AlertTriangle,
  FileSpreadsheet,
  Loader2,
  Check,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Course, type Department, type Subject } from '@/types';

interface CurriculumProspectus {
  id: number;
  department_id: number;
  course_id: number;
  name: string;
  academic_year: string;
  description: string | null;
  is_active: boolean;
  department?: Department;
  course?: Course;
  subjects?: Subject[];
  created_at: string;
  updated_at: string;
}

interface SemesterData {
  subjects: Subject[];
  total_units: number;
  total_lec_hours: number;
  total_lab_hours: number;
}

interface OrganizedSubjects {
  [yearLevel: string]: {
    [semester: string]: SemesterData;
  };
}

interface Props {
  prospectus: CurriculumProspectus;
  organizedSubjects: OrganizedSubjects;
  courseYears: number;
}

const yearLevelLabels: Record<string, string> = {
  '1st': 'First Year',
  '2nd': 'Second Year',
  '3rd': 'Third Year',
  '4th': 'Fourth Year',
  '5th': 'Fifth Year',
};

const semesterLabels: Record<string, string> = {
  '1st': 'First Semester',
  '2nd': 'Second Semester',
  summer: 'Summer',
};

const semesterColors: Record<string, string> = {
  '1st': 'from-blue-500/10 to-blue-600/5 border-blue-500/20',
  '2nd': 'from-emerald-500/10 to-emerald-600/5 border-emerald-500/20',
  summer: 'from-amber-500/10 to-amber-600/5 border-amber-500/20',
};

const semesterHeaderColors: Record<string, string> = {
  '1st': 'bg-blue-500 text-white',
  '2nd': 'bg-emerald-500 text-white',
  summer: 'bg-amber-500 text-white',
};

export default function ProspectusShow({
  prospectus,
  organizedSubjects,
  courseYears,
}: Props) {
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importStep, setImportStep] = useState<'upload' | 'validate'>('upload');
  const [validating, setValidating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [validationResult, setValidationResult] = useState<{
      valid: boolean;
      missing_subjects: Array<{ code: string; name: string; units: number; lecture_hours: number; lab_hours: number }>;
      total_rows: number;
      message?: string;
  } | null>(null);
  const [createMissing, setCreateMissing] = useState(false);

  // Reset dialog state
  const resetImport = () => {
      setImportFile(null);
      setImportStep('upload');
      setValidationResult(null);
      setCreateMissing(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
          setImportFile(e.target.files[0]);
      }
  };

  const validateFile = async () => {
      if (!importFile) return;

      setValidating(true);
      const formData = new FormData();
      formData.append('file', importFile);

      try {
          const response = await fetch(`/prospectus/${prospectus.id}/validate-import`, {
              method: 'POST',
              headers: {
                  'X-CSRF-TOKEN': (window as any).csrfToken || document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
              },
              body: formData,
          });

          const data = await response.json();

          if (response.ok) {
              setValidationResult(data);
              setImportStep('validate');
          } else {
              toast.error(data.message || 'Validation failed');
          }
      } catch (error) {
          toast.error('An error occurred during validation');
      } finally {
          setValidating(false);
      }
  };

  const confirmImport = async () => {
      if (!importFile) return;

      setImporting(true);
      const formData = new FormData();
      formData.append('file', importFile);
      if (createMissing) {
          formData.append('create_missing', '1');
          if (validationResult?.missing_subjects) {
             // Pass specific missing data to be created
             validationResult.missing_subjects.forEach((subj, index) => {
                 formData.append(`missing_subjects_data[${index}][code]`, subj.code);
                 formData.append(`missing_subjects_data[${index}][name]`, subj.name);
                 formData.append(`missing_subjects_data[${index}][units]`, subj.units.toString());
                 formData.append(`missing_subjects_data[${index}][lecture_hours]`, subj.lecture_hours.toString());
                 formData.append(`missing_subjects_data[${index}][lab_hours]`, subj.lab_hours.toString());
             });
          }
      }

      try {
          const response = await fetch(`/prospectus/${prospectus.id}/import`, {
              method: 'POST',
              headers: {
                  'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
              },
              body: formData,
          });

          const data = await response.json();

          if (response.ok) {
              toast.success('Subjects imported successfully');
              setImportDialogOpen(false);
              resetImport();
              router.reload();
          } else {
              toast.error(data.message || 'Import failed');
          }
      } catch (error) {
           toast.error('An error occurred during import');
      } finally {
          setImporting(false);
      }
  };

  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Curriculum Prospectus', href: '/prospectus' },
    { title: prospectus.name, href: `/prospectus/${prospectus.id}` },
  ];

  const yearLevels = Object.keys(organizedSubjects);

  // Calculate overall totals
  let totalSubjects = 0;
  let totalUnits = 0;
  Object.values(organizedSubjects).forEach((yearData) => {
    Object.values(yearData).forEach((semData) => {
      totalSubjects += semData.subjects.length;
      totalUnits += semData.total_units;
    });
  });

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`${prospectus.name} - Prospectus`} />

      <div className="flex h-full flex-1 flex-col gap-6 p-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/prospectus">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight">
                  {prospectus.name}
                </h1>
                <Badge variant={prospectus.is_active ? 'default' : 'secondary'}>
                  {prospectus.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <GraduationCap className="h-4 w-4" />
                  {prospectus.course?.code} - {prospectus.course?.name}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {prospectus.academic_year}
                </span>
              </div>
              {prospectus.department && (
                <p className="mt-1 text-sm font-medium text-primary">
                  {prospectus.department.name}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => window.open(`/prospectus/${prospectus.id}/export`, '_blank')}>
                <Download className="mr-2 h-4 w-4" />
                Export
            </Button>
            <Button variant="outline" size="sm" onClick={() => setImportDialogOpen(true)}>
                <Upload className="mr-2 h-4 w-4" />
                Import
            </Button>
            <Button asChild>
                <Link href={`/prospectus/${prospectus.id}/edit`}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit Subjects
                </Link>
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Subjects
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                <span className="text-2xl font-bold">{totalSubjects}</span>
              </div>
            </CardContent>
          </Card>
          <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-emerald-500/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Units
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-emerald-500" />
                <span className="text-2xl font-bold">{totalUnits}</span>
              </div>
            </CardContent>
          </Card>
          <Card className="border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-amber-500/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Course Duration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-amber-500" />
                <span className="text-2xl font-bold">{courseYears} Years</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Prospectus Grid by Year Level */}
        {yearLevels.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-lg font-medium">No subjects added yet</p>
              <p className="text-sm text-muted-foreground">
                Click "Edit Subjects" to add subjects to this prospectus.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue={yearLevels[0]} className="w-full">
            <TabsList className="w-full justify-start overflow-x-auto">
              {yearLevels.map((year) => (
                <TabsTrigger
                  key={year}
                  value={year}
                  className="min-w-[120px]"
                >
                  {yearLevelLabels[year] || year}
                </TabsTrigger>
              ))}
            </TabsList>

            {yearLevels.map((year) => {
              const activeSemesters = (['1st', '2nd', 'summer'] as const).filter(
                (bg) =>
                  organizedSubjects[year]?.[bg] &&
                  organizedSubjects[year][bg].subjects.length > 0
              );

              return (
                <TabsContent key={year} value={year} className="mt-6">
                  <div
                    className={`grid gap-6 ${activeSemesters.length >= 3
                        ? 'lg:grid-cols-2 xl:grid-cols-3'
                        : 'lg:grid-cols-2'
                      }`}
                  >
                    {activeSemesters.map((semester) => {
                      const semesterData = organizedSubjects[year][semester];
                      // We know it exists because of the filter

                      return (
                        <Card
                          key={semester}
                          className={`overflow-hidden border bg-gradient-to-br ${semesterColors[semester]}`}
                        >
                          <CardHeader
                            className={`${semesterHeaderColors[semester]} py-3`}
                          >
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-base">
                                {semesterLabels[semester]}
                              </CardTitle>
                              <Badge
                                variant="secondary"
                                className="bg-white/20 text-white hover:bg-white/30"
                              >
                                {semesterData.total_units} units
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="p-0">
                            <Table>
                              <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                  <TableHead className="h-9 text-xs">
                                    Code
                                  </TableHead>
                                  <TableHead className="h-9 text-xs">
                                    Title
                                  </TableHead>
                                  <TableHead className="h-9 w-12 text-center text-xs">
                                    Lec
                                  </TableHead>
                                  <TableHead className="h-9 w-12 text-center text-xs">
                                    Lab
                                  </TableHead>
                                  <TableHead className="h-9 w-12 text-center text-xs">
                                    Units
                                  </TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {semesterData.subjects.map(
                                  (subject, index) => (
                                    <TableRow
                                      key={`${subject.id}-${index}`}
                                      className="hover:bg-white/50 dark:hover:bg-white/10"
                                    >
                                      <TableCell className="py-2 font-mono text-xs font-medium text-primary">
                                        {subject.code}
                                      </TableCell>
                                      <TableCell className="max-w-[200px] truncate py-2 text-xs">
                                        {subject.name}
                                      </TableCell>
                                      <TableCell className="py-2 text-center text-xs">
                                        {subject.lecture_hours}
                                      </TableCell>
                                      <TableCell className="py-2 text-center text-xs">
                                        {subject.lab_hours > 0 ? (
                                          <span className="flex items-center justify-center gap-1">
                                            <FlaskConical className="h-3 w-3 text-purple-500" />
                                            {subject.lab_hours}
                                          </span>
                                        ) : (
                                          '0'
                                        )}
                                      </TableCell>
                                      <TableCell className="py-2 text-center text-xs font-semibold">
                                        {subject.units}
                                      </TableCell>
                                    </TableRow>
                                  )
                                )}
                                {/* Totals Row */}
                                <TableRow className="border-t-2 bg-muted/50 font-medium hover:bg-muted/50">
                                  <TableCell
                                    colSpan={2}
                                    className="py-2 text-xs"
                                  >
                                    Total ({semesterData.subjects.length} subjects)
                                  </TableCell>
                                  <TableCell className="py-2 text-center text-xs">
                                    {semesterData.total_lec_hours}
                                  </TableCell>
                                  <TableCell className="py-2 text-center text-xs">
                                    {semesterData.total_lab_hours}
                                  </TableCell>
                                  <TableCell className="py-2 text-center text-xs font-bold">
                                    {semesterData.total_units}
                                  </TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </TabsContent>
              );
            })}
          </Tabs>
        )}

        {/* Description */}
        {prospectus.description && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Description</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="whitespace-pre-wrap">
                {prospectus.description}
              </CardDescription>
            </CardContent>
          </Card>
        )}
      </div>
      <Dialog open={importDialogOpen} onOpenChange={(open) => {
          setImportDialogOpen(open);
          if (!open) setTimeout(resetImport, 300);
      }}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Import Subjects</DialogTitle>
                <DialogDescription>
                    Upload a CSV file to add subjects to this prospectus.
                </DialogDescription>
            </DialogHeader>

            {importStep === 'upload' ? (
                <div className="space-y-4 py-4">
                     <div className="grid w-full max-w-sm items-center gap-1.5">
                        <Label htmlFor="csv-file">CSV File</Label>
                        <Input 
                            id="csv-file" 
                            type="file" 
                            accept=".csv,.txt"
                            onChange={handleFileChange}
                        />
                        <p className="text-xs text-muted-foreground">
                            Required headers: Subject Code, Year Level, Semester
                        </p>
                    </div>
                    {importFile && (
                        <div className="rounded-md bg-muted p-3">
                            <div className="flex items-center gap-2">
                                <FileSpreadsheet className="h-5 w-5 text-green-600" />
                                <span className="text-sm font-medium">{importFile.name}</span>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-4 py-4">
                    <div className="flex items-center gap-2 text-green-600">
                        <Check className="h-5 w-5" />
                        <span className="font-medium">File Validated</span>
                    </div>
                    
                    <p className="text-sm text-muted-foreground">
                        Found {validationResult?.total_rows} subjects in file.
                    </p>

                    {validationResult?.missing_subjects && validationResult.missing_subjects.length > 0 && (
                        <Alert variant="destructive" className="border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-200">
                            <AlertTriangle className="h-4 w-4 text-amber-600! dark:text-amber-500!" />
                            <AlertTitle className="text-amber-800 dark:text-amber-300">Missing Subjects Detected</AlertTitle>
                            <AlertDescription>
                                <p className="mt-1 mb-2 text-xs opacity-90">
                                    {validationResult.missing_subjects.length} subjects in the file do not exist in the database yet:
                                </p>
                                <div className="max-h-32 overflow-y-auto rounded bg-background/50 p-2">
                                    <ul className="list-inside list-disc text-xs">
                                        {validationResult.missing_subjects.map(s => (
                                            <li key={s.code}>{s.code} - {s.name}</li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="mt-4 flex items-center space-x-2">
                                    <Checkbox 
                                        id="create-missing" 
                                        checked={createMissing}
                                        onCheckedChange={(c) => setCreateMissing(!!c)}
                                        className="border-amber-600 data-[state=checked]:bg-amber-600 data-[state=checked]:text-white"
                                    />
                                    <label
                                        htmlFor="create-missing"
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    >
                                        Create these missing subjects automatically
                                    </label>
                                </div>
                            </AlertDescription>
                        </Alert>
                    )}
                </div>
            )}

            <DialogFooter>
                {importStep === 'upload' ? (
                     <Button onClick={validateFile} disabled={!importFile || validating}>
                        {validating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Validate File
                    </Button>
                ) : (
                    <div className="flex gap-2">
                         <Button variant="outline" onClick={() => setImportStep('upload')}>
                            Back
                        </Button>
                        <Button 
                            onClick={confirmImport} 
                            disabled={importing || (validationResult?.missing_subjects && validationResult.missing_subjects.length > 0 && !createMissing)}
                        >
                            {importing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Import Subjects
                        </Button>
                    </div>
                )}
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
