import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AppLayout } from '@/components/layout/AppLayout';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useGetMe, useUpdateProfile } from '@workspace/api-client-react';
import { useToast } from '@/hooks/use-toast';
import { X, Plus, Loader2, ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import { getGetMeQueryKey } from '@workspace/api-client-react';

const profileSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  bio: z.string().optional(),
  avatarUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  githubUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  skills: z.array(z.string())
});

type ProfileData = z.infer<typeof profileSchema>;

export default function MyProfile() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [skillInput, setSkillInput] = useState('');

  const { data: user, isLoading } = useGetMe();

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<ProfileData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { skills: [] }
  });

  const skills = watch('skills') || [];

  useEffect(() => {
    if (user) {
      setValue('name', user.name);
      setValue('bio', user.bio || '');
      setValue('avatarUrl', user.avatarUrl || '');
      setValue('githubUrl', user.githubUrl || '');
      setValue('skills', user.skills || []);
    }
  }, [user, setValue]);

  const updateMut = useUpdateProfile({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        toast({ title: 'Profile updated successfully' });
        setLocation('/profile');
      }
    }
  });

  const onSubmit = (data: ProfileData) => {
    updateMut.mutate({ data });
  };

  const addSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setValue('skills', [...skills, skillInput.trim()]);
      setSkillInput('');
    }
  };

  const removeSkill = (skill: string) => {
    setValue('skills', skills.filter(s => s !== skill));
  };

  if (isLoading) return <AppLayout><div className="p-10 text-center"><Loader2 className="animate-spin w-8 h-8 mx-auto" /></div></AppLayout>;

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        <Link href="/profile" className="inline-flex items-center text-sm font-semibold text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Profile
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold tracking-tight mb-2">Edit Profile</h1>
          <p className="text-muted-foreground">Update your personal information and skills.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 glass-card rounded-3xl p-8 md:p-10">
          
          <div>
            <label className="text-sm font-semibold mb-2 block">Display Name</label>
            <Input {...register('name')} />
            {errors.name && <p className="text-destructive text-sm mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="text-sm font-semibold mb-2 block">Avatar URL</label>
            <Input {...register('avatarUrl')} placeholder="https://example.com/avatar.png" type="url" />
            {errors.avatarUrl && <p className="text-destructive text-sm mt-1">{errors.avatarUrl.message}</p>}
          </div>

          <div>
            <label className="text-sm font-semibold mb-2 block">GitHub Profile URL</label>
            <Input {...register('githubUrl')} placeholder="https://github.com/username" type="url" />
            {errors.githubUrl && <p className="text-destructive text-sm mt-1">{errors.githubUrl.message}</p>}
          </div>

          <div>
            <label className="text-sm font-semibold mb-2 block">Bio</label>
            <Textarea 
              {...register('bio')} 
              placeholder="Tell others about yourself..."
              className="min-h-[100px]"
            />
          </div>

          <div>
            <label className="text-sm font-semibold mb-2 block">Skills</label>
            <div className="flex gap-2 mb-3">
              <Input 
                value={skillInput} 
                onChange={e => setSkillInput(e.target.value)} 
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                placeholder="e.g. React, TypeScript, UI/UX..."
              />
              <Button type="button" onClick={addSkill} variant="secondary"><Plus className="w-4 h-4" /></Button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {skills.map(skill => (
                <div key={skill} className="flex items-center gap-1 bg-accent/20 text-accent border border-accent/30 px-3 py-1.5 rounded-lg text-sm font-medium">
                  {skill}
                  <button type="button" onClick={() => removeSkill(skill)} className="hover:text-white ml-1">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {skills.length === 0 && <span className="text-sm text-muted-foreground">No skills added yet.</span>}
            </div>
          </div>

          <div className="pt-6 border-t border-white/10 flex justify-end">
            <Button type="submit" disabled={updateMut.isPending} className="min-w-[150px]">
              {updateMut.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Profile'}
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
