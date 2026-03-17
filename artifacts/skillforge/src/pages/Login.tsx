import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useLocation } from 'wouter';
import { Zap, Mail, Lock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLogin } from '@workspace/api-client-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const [_, setLocation] = useLocation();
  const { login: setAuthToken } = useAuth();
  const { toast } = useToast();

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const loginMut = useLogin({
    mutation: {
      onSuccess: (data) => {
        setAuthToken(data.token, data.user);
        setLocation('/dashboard');
        toast({ title: "Welcome back!" });
      },
      onError: (error) => {
        toast({ 
          title: "Login failed", 
          description: (error as any)?.data?.message || "Invalid credentials",
          variant: "destructive"
        });
      }
    }
  });

  const onSubmit = (data: LoginForm) => {
    loginMut.mutate({ data });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-accent/20 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-2 mb-6 group">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
              <Zap className="w-7 h-7 text-white" />
            </div>
          </Link>
          <h1 className="text-3xl font-display font-bold mb-2">Welcome back</h1>
          <p className="text-muted-foreground">Sign in to continue to SkillForge</p>
        </div>

        <div className="glass-card rounded-3xl p-8 border border-white/10 shadow-2xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <Input 
                {...register('email')} 
                icon={<Mail className="w-5 h-5" />} 
                placeholder="Email address" 
                type="email"
              />
              {errors.email && <p className="text-destructive text-sm mt-1 ml-1">{errors.email.message}</p>}
            </div>
            
            <div>
              <Input 
                {...register('password')} 
                icon={<Lock className="w-5 h-5" />} 
                placeholder="Password" 
                type="password"
              />
              {errors.password && <p className="text-destructive text-sm mt-1 ml-1">{errors.password.message}</p>}
            </div>

            <Button 
              type="submit" 
              className="w-full mt-2" 
              size="lg"
              disabled={loginMut.isPending}
            >
              {loginMut.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign In"}
            </Button>
          </form>

          <div className="mt-8 text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link href="/register" className="text-primary font-semibold hover:underline">
              Create one
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
