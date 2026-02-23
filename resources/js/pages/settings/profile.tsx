import { Transition } from '@headlessui/react';
import { Form, Head, Link, usePage } from '@inertiajs/react';
import { useState } from 'react';

import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import DeleteUser from '@/components/delete-user';
import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
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
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { edit } from '@/routes/profile';
import { send } from '@/routes/verification';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { detectTimezone } from '@/utils/timezone';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Profile settings',
        href: edit().url,
    },
];

export default function Profile({
    mustVerifyEmail,
    status,
    commonTimezones = {},
    allTimezones = {},
}: {
    mustVerifyEmail: boolean;
    status?: string;
    commonTimezones?: Record<string, string>;
    allTimezones?: Record<string, Record<string, string>>;
}) {
    const { auth } = usePage<SharedData>().props;
    const [detectedTimezone] = useState<string>(() => detectTimezone());
    const [showAllTimezones, setShowAllTimezones] = useState(false);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Profile settings" />

            <h1 className="sr-only">Profile Settings</h1>

            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall
                        title="Profile information"
                        description="Update your name and email address"
                    />

                    <Form
                        {...ProfileController.update.form()}
                        options={{
                            preserveScroll: true,
                        }}
                        className="space-y-6"
                    >
                        {({ processing, recentlySuccessful, errors }) => (
                            <>
                                <div className="grid gap-4 sm:grid-cols-3">
                                    <div className="grid gap-2">
                                        <Label htmlFor="fname">First Name</Label>
                                        <Input
                                            id="fname"
                                            className="mt-1 block w-full"
                                            defaultValue={auth.user.fname}
                                            name="fname"
                                            required
                                            autoComplete="given-name"
                                            placeholder="First name"
                                        />
                                        <InputError
                                            className="mt-1"
                                            message={errors.fname}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="mname">Middle Name</Label>
                                        <Input
                                            id="mname"
                                            className="mt-1 block w-full"
                                            defaultValue={auth.user.mname || ''}
                                            name="mname"
                                            autoComplete="additional-name"
                                            placeholder="Middle name"
                                        />
                                        <InputError
                                            className="mt-1"
                                            message={errors.mname}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="lname">Last Name</Label>
                                        <Input
                                            id="lname"
                                            className="mt-1 block w-full"
                                            defaultValue={auth.user.lname}
                                            name="lname"
                                            required
                                            autoComplete="family-name"
                                            placeholder="Last name"
                                        />
                                        <InputError
                                            className="mt-1"
                                            message={errors.lname}
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="email">Email address</Label>

                                    <Input
                                        id="email"
                                        type="email"
                                        className="mt-1 block w-full"
                                        defaultValue={auth.user.email}
                                        name="email"
                                        required
                                        autoComplete="username"
                                        placeholder="Email address"
                                    />

                                    <InputError
                                        className="mt-2"
                                        message={errors.email}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="timezone">Timezone</Label>
                                    <div className="space-y-2">
                                        <input
                                            type="hidden"
                                            name="timezone"
                                            id="timezone"
                                            defaultValue={auth.user.timezone || detectedTimezone || 'UTC'}
                                        />
                                        <Select
                                            defaultValue={auth.user.timezone || detectedTimezone || 'UTC'}
                                            onValueChange={(value) => {
                                                const hiddenInput = document.getElementById('timezone') as HTMLInputElement;
                                                if (hiddenInput) {
                                                    hiddenInput.value = value;
                                                }
                                            }}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select timezone" />
                                            </SelectTrigger>
                                            <SelectContent className="max-h-[300px]">
                                                {detectedTimezone && (
                                                    <>
                                                        <SelectItem value={detectedTimezone}>
                                                            {detectedTimezone} (Auto-detected)
                                                        </SelectItem>
                                                        <div className="px-2 py-1.5 text-xs text-muted-foreground border-t">
                                                            Common Timezones
                                                        </div>
                                                    </>
                                                )}
                                                {Object.entries(commonTimezones).map(([tz, label]) => (
                                                    <SelectItem key={tz} value={tz}>
                                                        {label}
                                                    </SelectItem>
                                                ))}
                                                {Object.keys(allTimezones).length > 0 && (
                                                    <>
                                                        <div className="px-2 py-1.5 text-xs text-muted-foreground border-t">
                                                            All Timezones
                                                        </div>
                                                        {Object.entries(allTimezones).map(([region, tzList]) => (
                                                            <div key={region}>
                                                                <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">
                                                                    {region}
                                                                </div>
                                                                {Object.entries(tzList).slice(0, showAllTimezones ? undefined : 5).map(([tz, label]) => (
                                                                    <SelectItem key={tz} value={tz}>
                                                                        {label}
                                                                    </SelectItem>
                                                                ))}
                                                                {!showAllTimezones && Object.keys(tzList).length > 5 && (
                                                                    <div
                                                                        className="px-2 py-1 text-xs text-primary cursor-pointer hover:underline"
                                                                        onClick={(e) => {
                                                                            e.preventDefault();
                                                                            e.stopPropagation();
                                                                            setShowAllTimezones(true);
                                                                        }}
                                                                    >
                                                                        Show more...
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </>
                                                )}
                                            </SelectContent>
                                        </Select>
                                        <p className="text-xs text-muted-foreground">
                                            {detectedTimezone && (
                                                <>Auto-detected: <strong>{detectedTimezone}</strong>. </>
                                            )}
                                            All times will be displayed in your selected timezone.
                                        </p>
                                        <InputError
                                            className="mt-1"
                                            message={errors.timezone}
                                        />
                                    </div>
                                </div>

                                {mustVerifyEmail &&
                                    auth.user.email_verified_at === null && (
                                        <div>
                                            <p className="text-muted-foreground -mt-4 text-sm">
                                                Your email address is
                                                unverified.{' '}
                                                <Link
                                                    href={send()}
                                                    as="button"
                                                    className="text-foreground hover:decoration-current! underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out dark:decoration-neutral-500"
                                                >
                                                    Click here to resend the
                                                    verification email.
                                                </Link>
                                            </p>

                                            {status ===
                                                'verification-link-sent' && (
                                                <div className="mt-2 text-sm font-medium text-green-600">
                                                    A new verification link has
                                                    been sent to your email
                                                    address.
                                                </div>
                                            )}
                                        </div>
                                    )}

                                <div className="flex items-center gap-4">
                                    <Button
                                        disabled={processing}
                                        data-test="update-profile-button"
                                    >
                                        Save
                                    </Button>

                                    <Transition
                                        show={recentlySuccessful}
                                        enter="transition ease-in-out"
                                        enterFrom="opacity-0"
                                        leave="transition ease-in-out"
                                        leaveTo="opacity-0"
                                    >
                                        <p className="text-sm text-neutral-600">
                                            Saved
                                        </p>
                                    </Transition>
                                </div>
                            </>
                        )}
                    </Form>
                </div>

                <DeleteUser />
            </SettingsLayout>
        </AppLayout>
    );
}
