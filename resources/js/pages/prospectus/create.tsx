import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, BookOpen, GraduationCap, Loader2 } from 'lucide-react';
import { FormEvent, useMemo } from 'react';

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
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Course, type Department } from '@/types';

interface Props {
  departments: Department[];
  courses: Course[];
}

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Dashboard', href: '/dashboard' },
  { title: 'Curriculum Prospectus', href: '/prospectus' },
  { title: 'Create New', href: '/prospectus/create' },
];

export default function ProspectusCreate({ departments, courses }: Props) {
  const { data, setData, post, processing, errors } = useForm({
    department_id: '',
    course_id: '',
    name: '',
    academic_year: '',
    description: '',
  });

  // Filter courses based on selected department
  const filteredCourses = useMemo(() => {
    if (!data.department_id) return courses;
    return courses.filter(
      (course) => course.department_id === parseInt(data.department_id)
    );
  }, [data.department_id, courses]);

  // Generate current academic year suggestion
  const currentYear = new Date().getFullYear();
  const suggestedAcademicYears = [
    `${currentYear}-${currentYear + 1}`,
    `${currentYear - 1}-${currentYear}`,
    `${currentYear - 2}-${currentYear - 1}`,
  ];

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    post('/prospectus');
  };

  // Auto-generate prospectus name when course and academic year are selected
  const handleCourseChange = (courseId: string) => {
    setData('course_id', courseId);
    const course = courses.find((c) => c.id === parseInt(courseId));
    if (course && data.academic_year) {
      setData('name', `${course.code} Curriculum ${data.academic_year}`);
    }
  };

  const handleAcademicYearChange = (year: string) => {
    setData('academic_year', year);
    const course = courses.find((c) => c.id === parseInt(data.course_id));
    if (course) {
      setData('name', `${course.code} Curriculum ${year}`);
    }
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Create Prospectus" />

      <div className="flex h-full flex-1 flex-col gap-6 p-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/prospectus">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Create New Prospectus
            </h1>
            <p className="text-muted-foreground">
              Set up a new curriculum prospectus for a course program
            </p>
          </div>
        </div>

        <div className="mx-auto w-full max-w-2xl">
          <Card className="border-2 border-dashed">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <GraduationCap className="h-8 w-8 text-primary" />
              </div>
              <CardTitle>Curriculum Prospectus Details</CardTitle>
              <CardDescription>
                Provide the basic information for the new curriculum prospectus.
                You can add subjects after creation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Department Selection */}
                <div className="space-y-2">
                  <Label htmlFor="department_id">Department</Label>
                  <Select
                    value={data.department_id}
                    onValueChange={(value) => {
                      setData('department_id', value);
                      // Reset course when department changes
                      setData('course_id', '');
                    }}
                  >
                    <SelectTrigger
                      id="department_id"
                      className={errors.department_id ? 'border-destructive' : ''}
                    >
                      <SelectValue placeholder="Select a department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem
                          key={dept.id}
                          value={dept.id.toString()}
                        >
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                            <span>{dept.code}</span>
                            <span className="text-muted-foreground">
                              - {dept.name}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.department_id && (
                    <p className="text-sm text-destructive">
                      {errors.department_id}
                    </p>
                  )}
                </div>

                {/* Course Selection */}
                <div className="space-y-2">
                  <Label htmlFor="course_id">Course Program</Label>
                  <Select
                    value={data.course_id}
                    onValueChange={handleCourseChange}
                    disabled={!data.department_id}
                  >
                    <SelectTrigger
                      id="course_id"
                      className={errors.course_id ? 'border-destructive' : ''}
                    >
                      <SelectValue
                        placeholder={
                          data.department_id
                            ? 'Select a course'
                            : 'Select department first'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredCourses.map((course) => (
                        <SelectItem
                          key={course.id}
                          value={course.id.toString()}
                        >
                          <div className="flex items-center gap-2">
                            <GraduationCap className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {course.code}
                            </span>
                            <span className="text-muted-foreground">
                              - {course.name}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.course_id && (
                    <p className="text-sm text-destructive">
                      {errors.course_id}
                    </p>
                  )}
                </div>

                {/* Academic Year */}
                <div className="space-y-2">
                  <Label htmlFor="academic_year">Academic Year</Label>
                  <Select
                    value={data.academic_year}
                    onValueChange={handleAcademicYearChange}
                  >
                    <SelectTrigger
                      id="academic_year"
                      className={
                        errors.academic_year ? 'border-destructive' : ''
                      }
                    >
                      <SelectValue placeholder="Select academic year" />
                    </SelectTrigger>
                    <SelectContent>
                      {suggestedAcademicYears.map((year) => (
                        <SelectItem key={year} value={year}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.academic_year && (
                    <p className="text-sm text-destructive">
                      {errors.academic_year}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Or type a custom academic year below
                  </p>
                  <Input
                    placeholder="e.g., 2018-2019"
                    value={data.academic_year}
                    onChange={(e) =>
                      handleAcademicYearChange(e.target.value)
                    }
                  />
                </div>

                {/* Prospectus Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">Prospectus Name</Label>
                  <Input
                    id="name"
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    placeholder="e.g., BSIT Curriculum 2024-2025"
                    className={errors.name ? 'border-destructive' : ''}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name}</p>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">
                    Description{' '}
                    <span className="text-muted-foreground">(Optional)</span>
                  </Label>
                  <Textarea
                    id="description"
                    value={data.description}
                    onChange={(e) => setData('description', e.target.value)}
                    placeholder="Brief description of this curriculum prospectus..."
                    rows={3}
                  />
                </div>

                {/* Submit Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    asChild
                  >
                    <Link href="/prospectus">Cancel</Link>
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={processing}
                  >
                    {processing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <GraduationCap className="mr-2 h-4 w-4" />
                        Create Prospectus
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
