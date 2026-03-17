import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useLocation } from 'wouter';
import { Zap, Mail, Lock, User as UserIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRegister } from '@workspace/api-client-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function Register() {
  const [_, setLocation] = useLocation();
  const { login: setAuthToken } = useAuth();
  const { toast } = useToast();

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const registerMut = useRegister({
    mutation: {
      onSuccess: (data) => {
        setAuthToken(data.token, data.user);
        setLocation('/dashboard');
        toast({ title: "Account created successfully!" });
      },
      onError: (error) => {
        toast({ 
          title: "Registration failed", 
          description: (error as any)?.data?.message || "An error occurred",
          variant: "destructive"
        });
      }
    }
  });

  const onSubmit = (data: RegisterForm) => {
    registerMut.mutate({ data });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-accent/20 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-2 mb-6 group">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
              <Zap className="w-7 h-7 text-white" />
            </div>
          </Link>
          <h1 className="text-3xl font-display font-bold mb-2">Create an account</h1>
          <p className="text-muted-foreground">Join the developer network</p>
        </div>

        <div className="glass-card rounded-3xl p-8 border border-white/10 shadow-2xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <Input 
                {...register('name')} 
                icon={<UserIcon className="w-5 h-5" />} 
                placeholder="Full Name" 
              />
              {errors.name && <p className="text-destructive text-sm mt-1 ml-1">{errors.name.message}</p>}
            </div>

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
                placeholder="Password (min 6 chars)" 
                type="password"
              />
              {errors.password && <p className="text-destructive text-sm mt-1 ml-1">{errors.password.message}</p>}
            </div>

            <Button 
              type="submit" 
              className="w-full mt-2" 
              size="lg"
              disabled={registerMut.isPending}
            >
              {registerMut.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Account"}
            </Button>
          </form>

          <div className="mt-8 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="text-primary font-semibold hover:underline">
              Log in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
