import { Head, Link, useForm } from '@inertiajs/react';
import {
  ArrowLeft,
  BookOpen,
  Check,
  Loader2,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import {
  type BreadcrumbItem,
  type Course,
  type CurriculumProspectus,
  type Department,
  type Subject,
} from '@/types';

interface SubjectAssignment {
  subject_id: number;
  year_level: string;
  semester: string;
  sort_order: number;
}

interface Props {
  prospectus: CurriculumProspectus & {
    department: Department;
    course: Course;
  };
  availableSubjects: Subject[];
  currentSubjects: SubjectAssignment[];
  courseYears: number;
}

const yearLevelLabels: Record<string, string> = {
  '1st': 'First Year',
  '2nd': 'Second Year',
  '3rd': 'Third Year',
  '4th': 'Fourth Year',
  '5th': 'Fifth Year',
};

export default function ProspectusEdit({
  prospectus,
  availableSubjects,
  currentSubjects,
  courseYears,
}: Props) {
  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Curriculum Prospectus', href: '/prospectus' },
    { title: prospectus.name, href: `/prospectus/${prospectus.id}` },
    { title: 'Edit Subjects', href: `/prospectus/${prospectus.id}/edit` },
  ];

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYearLevel, setSelectedYearLevel] = useState('1st');
  const [selectedSemester, setSelectedSemester] = useState('1st');

  const { data, setData, patch, processing } = useForm<{
    subjects: SubjectAssignment[];
  }>({
    subjects: currentSubjects,
  });

  // Filter available subjects based on search
  const filteredSubjects = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return availableSubjects.filter(
      (subject) =>
        subject.code.toLowerCase().includes(term) ||
        subject.name.toLowerCase().includes(term)
    );
  }, [availableSubjects, searchTerm]);

  // Get subjects for current year/semester
  const currentSemesterSubjects = useMemo(() => {
    return data.subjects
      .filter(
        (s) =>
          s.year_level === selectedYearLevel &&
          s.semester === selectedSemester
      )
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((assignment) => ({
        ...assignment,
        subject: availableSubjects.find(
          (s) => s.id === assignment.subject_id
        ),
      }));
  }, [data.subjects, selectedYearLevel, selectedSemester, availableSubjects]);

  // Check if a subject is already assigned
  const isSubjectAssigned = (subjectId: number): boolean => {
    return data.subjects.some((s) => s.subject_id === subjectId);
  };

  // Add subject to current semester
  const addSubject = (subject: Subject) => {
    const newAssignment: SubjectAssignment = {
      subject_id: subject.id,
      year_level: selectedYearLevel,
      semester: selectedSemester,
      sort_order: currentSemesterSubjects.length + 1,
    };
    setData('subjects', [...data.subjects, newAssignment]);
  };

  // Remove subject from assignments
  const removeSubject = (subjectId: number) => {
    setData(
      'subjects',
      data.subjects.filter((s) => s.subject_id !== subjectId)
    );
  };

  // Get year levels based on course duration
  const yearLevels = Array.from({ length: courseYears }, (_, i) => {
    const levels = ['1st', '2nd', '3rd', '4th', '5th'];
    return levels[i];
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    patch(`/prospectus/${prospectus.id}`);
  };

  // Calculate totals for current semester
  const semesterTotals = useMemo(() => {
    let units = 0;
    let lecHours = 0;
    let labHours = 0;

    currentSemesterSubjects.forEach(({ subject }) => {
      if (subject) {
        units += subject.units;
        lecHours += subject.lecture_hours;
        labHours += subject.lab_hours;
      }
    });

    return { units, lecHours, labHours };
  }, [currentSemesterSubjects]);

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`Edit ${prospectus.name}`} />

      <form onSubmit={handleSubmit}>
        <div className="flex h-full flex-1 flex-col gap-6 p-6">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" asChild>
                <Link href={`/prospectus/${prospectus.id}`}>
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  Edit Subjects
                </h1>
                <p className="text-muted-foreground">
                  {prospectus.name} - {prospectus.course.code}
                </p>
              </div>
            </div>
            <Button type="submit" disabled={processing}>
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left Panel: Subject Selector */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-base">Available Subjects</CardTitle>
                <CardDescription>
                  Click to add subjects to the selected semester
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search subjects..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Subject List */}
                <div className="max-h-[500px] space-y-2 overflow-y-auto">
                  {filteredSubjects.map((subject) => {
                    const isAssigned = isSubjectAssigned(subject.id);
                    return (
                      <div
                        key={subject.id}
                        className={`flex items-center justify-between rounded-lg border p-3 transition-colors ${isAssigned
                            ? 'border-primary/50 bg-primary/5'
                            : 'hover:bg-muted/50'
                          }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-medium text-primary">
                              {subject.code}
                            </span>
                            {isAssigned && (
                              <Badge
                                variant="secondary"
                                className="text-xs"
                              >
                                Added
                              </Badge>
                            )}
                          </div>
                          <p className="truncate text-sm text-muted-foreground">
                            {subject.name}
                          </p>
                          <div className="mt-1 flex gap-2 text-xs text-muted-foreground">
                            <span>{subject.units} units</span>
                            <span>•</span>
                            <span>
                              {subject.lecture_hours}L/{subject.lab_hours}Lab
                            </span>
                          </div>
                        </div>
                        <Button
                          type="button"
                          size="icon"
                          variant={isAssigned ? 'destructive' : 'ghost'}
                          onClick={() =>
                            isAssigned
                              ? removeSubject(subject.id)
                              : addSubject(subject)
                          }
                        >
                          {isAssigned ? (
                            <X className="h-4 w-4" />
                          ) : (
                            <Plus className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Right Panel: Semester View */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">
                      Semester Subjects
                    </CardTitle>
                    <CardDescription>
                      Drag and reorder subjects within each semester
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {semesterTotals.units} units
                    </Badge>
                    <Badge variant="outline">
                      {semesterTotals.lecHours}L / {semesterTotals.labHours}Lab
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Year/Semester Selector */}
                <div className="mb-6 flex flex-wrap gap-4">
                  <div className="space-y-2">
                    <Label>Year Level</Label>
                    <Select
                      value={selectedYearLevel}
                      onValueChange={setSelectedYearLevel}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {yearLevels.map((year) => (
                          <SelectItem key={year} value={year}>
                            {yearLevelLabels[year]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Semester</Label>
                    <Tabs
                      value={selectedSemester}
                      onValueChange={setSelectedSemester}
                    >
                      <TabsList>
                        <TabsTrigger value="1st">1st Sem</TabsTrigger>
                        <TabsTrigger value="2nd">2nd Sem</TabsTrigger>
                        <TabsTrigger value="summer">Summer</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                </div>

                {/* Subjects Table */}
                {currentSemesterSubjects.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-12">
                    <BookOpen className="h-12 w-12 text-muted-foreground/50" />
                    <p className="mt-4 font-medium">No subjects added</p>
                    <p className="text-sm text-muted-foreground">
                      Search and add subjects from the left panel
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead>Subject Title</TableHead>
                        <TableHead className="w-16 text-center">
                          Lec
                        </TableHead>
                        <TableHead className="w-16 text-center">
                          Lab
                        </TableHead>
                        <TableHead className="w-16 text-center">
                          Units
                        </TableHead>
                        <TableHead className="w-16"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentSemesterSubjects.map(
                        ({ subject, subject_id }, index) =>
                          subject && (
                            <TableRow key={subject_id}>
                              <TableCell className="font-medium text-muted-foreground">
                                {index + 1}
                              </TableCell>
                              <TableCell className="font-mono text-sm font-medium text-primary">
                                {subject.code}
                              </TableCell>
                              <TableCell>{subject.name}</TableCell>
                              <TableCell className="text-center">
                                {subject.lecture_hours}
                              </TableCell>
                              <TableCell className="text-center">
                                {subject.lab_hours}
                              </TableCell>
                              <TableCell className="text-center font-semibold">
                                {subject.units}
                              </TableCell>
                              <TableCell>
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="ghost"
                                  onClick={() =>
                                    removeSubject(subject_id)
                                  }
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          )
                      )}
                      {/* Totals Row */}
                      <TableRow className="border-t-2 bg-muted/50 font-medium">
                        <TableCell colSpan={3}>
                          Total ({currentSemesterSubjects.length} subjects)
                        </TableCell>
                        <TableCell className="text-center">
                          {semesterTotals.lecHours}
                        </TableCell>
                        <TableCell className="text-center">
                          {semesterTotals.labHours}
                        </TableCell>
                        <TableCell className="text-center font-bold">
                          {semesterTotals.units}
                        </TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </AppLayout>
  );
}
