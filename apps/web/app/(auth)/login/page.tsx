import { LoginForm } from '@/app/components/login-form';

export default function LoginPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col gap-6 p-6 md:p-10 bg-background">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="#" className="flex items-center gap-2 font-medium text-primary hover:underline">
            <span className="text-lg font-semibold">Chaya Inc</span>
          </a>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm">
            <LoginForm />
          </div>
        </div>
      </div>

      <div className="relative hidden lg:block bg-muted">
        {/* Add any background image or content here if needed */}
      </div>
    </div>
  );
}
