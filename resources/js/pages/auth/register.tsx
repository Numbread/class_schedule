import { Form, Head, usePage } from '@inertiajs/react';
import { useState } from 'react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { login } from '@/routes';
import { store } from '@/routes/register';

interface Department {
    id: number;
    code: string;
    name: string;
}

interface PageProps {
    departments: Department[];
    specializations: Record<string, string>;
}

export default function Register() {
    const { departments, specializations } = usePage<PageProps>().props;
    const [userType, setUserType] = useState<string>('');
    const [departmentId, setDepartmentId] = useState<string>('');
    const [specialization, setSpecialization] = useState<string>('');

    return (
        <AuthLayout
            title="Create an account"
            description="Enter your details below to create your account. Your registration will require admin approval."
        >
            <Head title="Register" />
            <Form
                {...store.form()}
                resetOnSuccess={['password', 'password_confirmation']}
                disableWhileProcessing
                className="flex flex-col gap-6"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-6">
                            {/* Name Fields */}
                            <div className="grid gap-4 sm:grid-cols-3">
                                <div className="grid gap-2">
                                    <Label htmlFor="fname">First Name</Label>
                                    <Input
                                        id="fname"
                                        type="text"
                                        required
                                        autoFocus
                                        tabIndex={1}
                                        autoComplete="given-name"
                                        name="fname"
                                        placeholder="Juan"
                                    />
                                    <InputError
                                        message={errors.fname}
                                        className="mt-1"
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="mname">Middle Name</Label>
                                    <Input
                                        id="mname"
                                        type="text"
                                        tabIndex={2}
                                        autoComplete="additional-name"
                                        name="mname"
                                        placeholder="Dela"
                                    />
                                    <InputError
                                        message={errors.mname}
                                        className="mt-1"
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="lname">Last Name</Label>
                                    <Input
                                        id="lname"
                                        type="text"
                                        required
                                        tabIndex={3}
                                        autoComplete="family-name"
                                        name="lname"
                                        placeholder="Cruz"
                                    />
                                    <InputError
                                        message={errors.lname}
                                        className="mt-1"
                                    />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email">Email address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    required
                                    tabIndex={4}
                                    autoComplete="email"
                                    name="email"
                                    placeholder="email@example.com"
                                />
                                <InputError message={errors.email} />
                            </div>

                            {/* Role and Department Selection */}
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="user_type">Role</Label>
                                    <input type="hidden" name="user_type" value={userType} />
                                    <Select
                                        value={userType}
                                        onValueChange={setUserType}
                                    >
                                        <SelectTrigger tabIndex={5}>
                                            <SelectValue placeholder="Select your role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="scheduler">Scheduler</SelectItem>
                                            <SelectItem value="faculty">Faculty</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.user_type} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="department_id">Department</Label>
                                    <input type="hidden" name="department_id" value={departmentId} />
                                    <Select
                                        value={departmentId}
                                        onValueChange={setDepartmentId}
                                    >
                                        <SelectTrigger tabIndex={6}>
                                            <SelectValue placeholder="Select your department" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {departments?.map((dept) => (
                                                <SelectItem key={dept.id} value={dept.id.toString()}>
                                                    {dept.code} - {dept.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.department_id} />
                                </div>
                            </div>

                            {/* Specialization (for faculty) */}
                            {userType === 'faculty' && (
                                <div className="grid gap-2">
                                    <Label htmlFor="specialization">Specialization</Label>
                                    <input type="hidden" name="specialization" value={specialization} />
                                    <Select
                                        value={specialization}
                                        onValueChange={setSpecialization}
                                    >
                                        <SelectTrigger tabIndex={7}>
                                            <SelectValue placeholder="Select your specialization (optional)" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(specializations || {}).map(([key, label]) => (
                                                <SelectItem key={key} value={key}>
                                                    {label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.specialization} />
                                </div>
                            )}

                            <div className="grid gap-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    required
                                    tabIndex={8}
                                    autoComplete="new-password"
                                    name="password"
                                    placeholder="Password"
                                />
                                <InputError message={errors.password} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password_confirmation">
                                    Confirm password
                                </Label>
                                <Input
                                    id="password_confirmation"
                                    type="password"
                                    required
                                    tabIndex={9}
                                    autoComplete="new-password"
                                    name="password_confirmation"
                                    placeholder="Confirm password"
                                />
                                <InputError
                                    message={errors.password_confirmation}
                                />
                            </div>

                            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-sm text-amber-700 dark:text-amber-400">
                                <strong>Note:</strong> Your account will require admin approval before you can log in.
                            </div>

                            <Button
                                type="submit"
                                className="mt-2 w-full"
                                tabIndex={10}
                                data-test="register-user-button"
                            >
                                {processing && <Spinner />}
                                Create account
                            </Button>
                        </div>

                        <div className="text-muted-foreground text-center text-sm">
                            Already have an account?{' '}
                            <TextLink href={login()} tabIndex={11}>
                                Log in
                            </TextLink>
                        </div>
                    </>
                )}
            </Form>
        </AuthLayout>
    );
}
