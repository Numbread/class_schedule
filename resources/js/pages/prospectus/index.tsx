import { Head, Link, router } from '@inertiajs/react';
import {
  BookOpen,
  Columns2,
  Eye,
  GraduationCap,
  MoreVertical,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';

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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ConfirmModal } from '@/components/ui/form-modal';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import {
  type BreadcrumbItem,
  type Course,
  type Department,
  type PaginatedData,
} from '@/types';

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
  subjects_count?: number;
  created_at: string;
  updated_at: string;
}

interface ProspectusGroup {
  department: Department;
  academic_year: string;
  prospectuses: CurriculumProspectus[];
  total_courses: number;
  total_subjects: number;
}

interface Props {
  groupedProspectuses: PaginatedData<ProspectusGroup>;
  departments: Department[];
  courses: Course[];
  academicYears: string[];
  filters: {
    department_id?: string;
    course_id?: string;
    academic_year?: string;
  };
}

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Academics', href: '#' },
  { title: 'Curriculum Prospectus', href: '/prospectus' },
];

export default function ProspectusIndex({
  groupedProspectuses,
  departments,
  courses,
  academicYears,
  filters,
}: Props) {
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    prospectus: CurriculumProspectus | null;
  }>({ open: false, prospectus: null });

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    if (value === 'all') {
      delete newFilters[key as keyof typeof newFilters];
    }
    router.get('/prospectus', newFilters, {
      preserveState: true,
      preserveScroll: true,
    });
  };

  const handleDelete = () => {
    if (deleteDialog.prospectus) {
      router.delete(`/prospectus/${deleteDialog.prospectus.id}`, {
        onSuccess: () => setDeleteDialog({ open: false, prospectus: null }),
      });
    }
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Curriculum Prospectus" />

      <div className="flex h-full flex-1 flex-col gap-6 p-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Curriculum Prospectus
            </h1>
            <p className="text-muted-foreground">
              View and manage curriculum prospectus for each course program
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild>
              <Link href="/prospectus/create">
                <Plus className="mr-2 h-4 w-4" />
                New Prospectus
              </Link>
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <Select
            value={filters.department_id || 'all'}
            onValueChange={(value) => handleFilterChange('department_id', value)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept.id} value={dept.id.toString()}>
                  {dept.code} - {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.course_id || 'all'}
            onValueChange={(value) => handleFilterChange('course_id', value)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Courses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Courses</SelectItem>
              {courses.map((course) => (
                <SelectItem key={course.id} value={course.id.toString()}>
                  {course.code} - {course.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.academic_year || 'all'}
            onValueChange={(value) => handleFilterChange('academic_year', value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Academic Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              {academicYears.map((year) => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {groupedProspectuses.data.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 font-medium">No curriculum prospectuses found.</p>
              <p className="text-sm text-muted-foreground">
                Create one to organize your course subjects.
              </p>
            </div>
          ) : (
            groupedProspectuses.data.map((group) => (
              <Card key={`${group.department.id}-${group.academic_year}`}>
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-xl">
                        {group.department.name}
                      </CardTitle>
                      <Badge variant="outline" className="font-mono">
                        {group.academic_year}
                      </Badge>
                    </div>
                    <CardDescription>
                      {group.department.code} Department Prospectus
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" asChild>
                      <Link
                        href={`/prospectus/department/${group.department.id}/year/${group.academic_year}`}
                      >
                        <Columns2 className="mr-2 h-4 w-4" />
                        Compare View
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    {group.prospectuses.map((prospectus, i) => (
                      <div key={prospectus.id}>
                        <div className="flex items-center justify-between p-4 transition-colors hover:bg-muted/50">
                          <div className="flex items-center gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                              <GraduationCap className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold">
                                  {prospectus.course?.code}
                                </h4>
                                <span className="hidden text-sm text-muted-foreground sm:inline">
                                  - {prospectus.course?.name}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>{prospectus.name}</span>
                                <span>•</span>
                                <span>
                                  {prospectus.subjects_count || 0}{' '}
                                  subjects
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="hidden h-8 sm:flex"
                              asChild
                            >
                              <Link href={`/prospectus/${prospectus.id}`}>
                                View
                              </Link>
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                  <span className="sr-only">
                                    Open menu
                                  </span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link
                                    href={`/prospectus/${prospectus.id}`}
                                  >
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Details
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link
                                    href={`/prospectus/${prospectus.id}/edit`}
                                  >
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit Subjects
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() =>
                                    setDeleteDialog({
                                      open: true,
                                      prospectus,
                                    })
                                  }
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        {i < group.prospectuses.length - 1 && (
                          <Separator />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Pagination */}
        {groupedProspectuses.last_page > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {groupedProspectuses.from} to {groupedProspectuses.to} of{' '}
              {groupedProspectuses.total} results
            </p>
            <div className="flex gap-2">
              {groupedProspectuses.links.map((link, index) => (
                <Button
                  key={index}
                  variant={link.active ? 'default' : 'outline'}
                  size="sm"
                  disabled={!link.url}
                  onClick={() => link.url && router.get(link.url)}
                  dangerouslySetInnerHTML={{ __html: link.label }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={deleteDialog.open}
        onOpenChange={(open) =>
          setDeleteDialog({
            open,
            prospectus: open ? deleteDialog.prospectus : null,
          })
        }
        title="Delete Prospectus"
        description={
          <>
            Are you sure you want to delete the prospectus{' '}
            <strong>{deleteDialog.prospectus?.name}</strong>? This will remove
            all subject assignments.
          </>
        }
        onConfirm={handleDelete}
        confirmLabel="Delete"
        variant="destructive"
      />
    </AppLayout>
  );
}
