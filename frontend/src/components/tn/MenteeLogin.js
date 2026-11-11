'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { getToken, setToken } from '@/lib/session';
import { startDemo } from '@/lib/demoEntry';
import AuthCard from './AuthCard';
import { useToast } from './Toast';

export default function MenteeLogin() {
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    if (getToken('mentee')) router.replace('/dashboard');
  }, [router]);

  return (
    <AuthCard
      icon="fa-graduation-cap"
      title="Mentee login"
      subtitle="Use the enrollment number and password your mentor gave you."
      fields={[
        { name: 'enrollmentNumber', label: 'Enrollment number', placeholder: 'e.g. TN2026001' },
        { name: 'password', label: 'Password', password: true }
      ]}
      hint="Don't have credentials yet? Your mentor creates them when adding you to a program."
      onSubmit={async ({ enrollmentNumber, password }) => {
        const { token } = await api.menteeLogin(enrollmentNumber.trim(), password);
        setToken('mentee', token);
        toast.success('Welcome back!');
        router.push('/dashboard');
      }}
      onDemo={() => { startDemo('mentee'); router.push('/dashboard'); }}
    />
  );
}
