import { redirect } from 'next/navigation';

export default function AdminHomePage() {
  // TODO: Check if authenticated, if not redirect to login
  redirect('/dashboard');
}
