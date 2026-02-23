import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
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
import AppLayout from '@/layouts/app-layout';
import {
  type BreadcrumbItem,
  type CurriculumProspectus,
  type Department,
  type Subject,
} from '@/types';

interface ProspectusData {
  subjects: Subject[];
  total_units: number;
}

interface Structure {
  [year: string]: {
    [semester: string]: {
      [prospectusId: number]: ProspectusData;
    };
  };
}

interface Props {
  department: Department;
  academicYear: string;
  prospectuses: CurriculumProspectus[];
  structure: Structure;
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

export default function DepartmentProspectusShow({
  department,
  academicYear,
  prospectuses,
  structure,
}: Props) {
  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Curriculum Prospectus', href: '/prospectus' },
    { title: 'Department View', href: '#' },
  ];

  // Get ordered year levels and semesters present in structure
  const years = ['1st', '2nd', '3rd', '4th', '5th'].filter(
    (y) => structure[y]
  );
  const semesters = ['1st', '2nd', 'summer'];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`${department.code} Prospectus ${academicYear}`} />

      <div className="flex flex-col gap-6 p-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/prospectus">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {department.name}
              </h1>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Badge variant="outline">{academicYear}</Badge>
                <span>Curriculum Prospectus</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          {years.map((year) => (
            <div key={year} className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-1 rounded-full bg-primary" />
                <h2 className="text-xl font-bold">{yearLevelLabels[year]}</h2>
              </div>

              <div className="grid gap-6">
                {semesters.map((sem) => {
                  const semesterData = structure[year]?.[sem];
                  if (!semesterData) return null;

                  return (
                    <Card key={`${year}-${sem}`} className="overflow-hidden">
                      <CardHeader className="bg-muted/30 pb-4">
                        <CardTitle className="text-lg font-medium text-primary">
                          {semesterLabels[sem]}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="grid divide-x overflow-x-auto" style={{
                          gridTemplateColumns: `repeat(${prospectuses.length}, minmax(400px, 1fr))`
                        }}>
                          {prospectuses.map((prospectus) => {
                            const data = semesterData[prospectus.id];

                            return (
                              <div key={prospectus.id} className="min-w-[400px]">
                                <div className="border-b bg-muted/10 p-3 text-center">
                                  <div className="font-bold">{prospectus.course?.code}</div>
                                  {data && (
                                    <div className="text-xs text-muted-foreground">
                                      {data.subjects.length} subjects • {data.total_units} units
                                    </div>
                                  )}
                                </div>

                                {!data || data.subjects.length === 0 ? (
                                  <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                                    No subjects
                                  </div>
                                ) : (
                                  <Table>
                                    <TableHeader>
                                      <TableRow className="hover:bg-transparent">
                                        <TableHead className="w-[15%]">Code</TableHead>
                                        <TableHead className="w-[55%]">Title</TableHead>
                                        <TableHead className="w-[10%] text-center">Lec</TableHead>
                                        <TableHead className="w-[10%] text-center">Lab</TableHead>
                                        <TableHead className="w-[10%] text-center">Units</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {data.subjects.map((subject) => (
                                        <TableRow key={subject.id} className="hover:bg-muted/50">
                                          <TableCell className="font-mono text-xs font-medium text-primary">
                                            {subject.code}
                                          </TableCell>
                                          <TableCell className="text-xs">
                                            <div className="line-clamp-2" title={subject.name}>
                                              {subject.name}
                                            </div>
                                          </TableCell>
                                          <TableCell className="text-center text-xs">
                                            {subject.lecture_hours}
                                          </TableCell>
                                          <TableCell className="text-center text-xs">
                                            {subject.lab_hours}
                                          </TableCell>
                                          <TableCell className="text-center text-xs font-bold">
                                            {subject.units}
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                      {/* Total Row */}
                                      <TableRow className="bg-muted/20 font-medium hover:bg-muted/20">
                                        <TableCell colSpan={2} className="text-right text-xs">Total</TableCell>
                                        <TableCell className="text-center text-xs">
                                          {data.subjects.reduce((sum, s) => sum + s.lecture_hours, 0)}
                                        </TableCell>
                                        <TableCell className="text-center text-xs">
                                          {data.subjects.reduce((sum, s) => sum + s.lab_hours, 0)}
                                        </TableCell>
                                        <TableCell className="text-center text-xs font-bold">
                                          {data.total_units}
                                        </TableCell>
                                      </TableRow>
                                    </TableBody>
                                  </Table>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
