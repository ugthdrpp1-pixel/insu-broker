import { useTranslations } from 'next-intl';
import { redirect } from 'next/navigation';
import { auth, signIn } from '@/lib/auth';
import { LoginForm } from './login-form';
import { ShieldCheck, Users, Calculator, Award } from 'lucide-react';

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: { locale: string };
  searchParams: { error?: string };
}) {
  const session = await auth();
  if (session?.user) redirect(`/${params.locale}/dashboard`);

  const messages = await import(`@/i18n/messages/${params.locale}.json`);

  async function handleSignIn(formData: FormData) {
    'use server';
    const email = String(formData.get('email') ?? '').toLowerCase().trim();
    const password = String(formData.get('password') ?? '');
    const locale = String(formData.get('locale') ?? 'th');
    try {
      await signIn('credentials', {
        email,
        password,
        redirectTo: `/${locale}/dashboard`,
      });
    } catch (e: any) {
      redirect(`/${locale}/login?error=invalid`);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between p-12 gradient-bg text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 20% 20%, white 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <div>
              <p className="text-2xl font-bold">{messages.default.common.appName}</p>
              <p className="text-sm opacity-80">{messages.default.common.appTagline}</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <h1 className="text-4xl font-bold leading-tight">
            {messages.default.auth.thaiInsurance}
          </h1>
          <p className="text-lg opacity-90 max-w-md">
            {messages.default.auth.thaiInsuranceDescription}
          </p>

          <div className="grid grid-cols-2 gap-4 mt-8">
            {[
              { Icon: Users, title: messages.default.auth.featureCRMTitle, desc: messages.default.auth.featureCRMDesc },
              { Icon: Calculator, title: messages.default.auth.featureQuoteTitle, desc: messages.default.auth.featureQuoteDesc },
              { Icon: ShieldCheck, title: messages.default.auth.featureClaimTitle, desc: messages.default.auth.featureClaimDesc },
              { Icon: Award, title: messages.default.auth.featureCommissionTitle, desc: messages.default.auth.featureCommissionDesc },
            ].map(({ Icon, title, desc }) => (
              <div key={title} className="bg-white/10 backdrop-blur rounded-lg p-4 border border-white/10">
                <Icon className="h-6 w-6 mb-2" />
                <p className="font-semibold text-sm">{title}</p>
                <p className="text-xs opacity-80">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-xs opacity-70">
          © {new Date().getFullYear()} Insu Broker. All rights reserved.
        </div>
      </div>

      <div className="flex flex-col justify-center items-center p-6 lg:p-12 bg-background">
        <div className="w-full max-w-sm">
          <LoginForm
            locale={params.locale}
            action={handleSignIn}
            messages={{
              welcomeBack: messages.default.auth.welcomeBack,
              signInDescription: messages.default.auth.signInDescription,
              email: messages.default.auth.email,
              password: messages.default.auth.password,
              signIn: messages.default.auth.signIn,
              invalidCredentials: messages.default.auth.invalidCredentials,
              demoAccounts: messages.default.auth.demoAccounts,
              adminAccount: messages.default.auth.adminAccount,
              managerAccount: messages.default.auth.managerAccount,
              agentAccount: messages.default.auth.agentAccount,
            }}
            error={searchParams.error === 'invalid'}
          />
        </div>
      </div>
    </div>
  );
}
