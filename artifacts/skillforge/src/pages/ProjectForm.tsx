import React, { useEffect, useState } from 'react';
import { useRoute, useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AppLayout } from '@/components/layout/AppLayout';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateProject, useUpdateProject, useGetProjectById } from '@workspace/api-client-react';
import { useToast } from '@/hooks/use-toast';
import { X, Plus, Loader2 } from 'lucide-react';

const formSchema = z.object({
  title: z.string().min(3, 'Title is required'),
  description: z.string().min(10, 'Description must be at least 10 chars'),
  githubUrl: z.string().url().optional().or(z.literal('')),
  teamSize: z.coerce.number().min(1, 'Team size must be at least 1'),
  status: z.enum(['looking_for_team', 'active', 'completed']),
  techStack: z.array(z.string()).min(1, 'Add at least one technology')
});

type FormData = z.infer<typeof formSchema>;

export default function ProjectForm() {
  const [match, params] = useRoute('/projects/:id/edit');
  const isEdit = match && params?.id !== 'new';
  const projectId = Number(params?.id);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [techInput, setTechInput] = useState('');

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      teamSize: 3,
      status: 'looking_for_team',
      techStack: []
    }
  });

  const techStack = watch('techStack') || [];

  const { data: project, isLoading: loadingProject } = useGetProjectById(projectId, {
    query: {
      queryKey: ['project', projectId],
      enabled: isEdit
    }
  });

  useEffect(() => {
    if (project && isEdit) {
      setValue('title', project.title);
      setValue('description', project.description);
      setValue('githubUrl', project.githubUrl || '');
      setValue('teamSize', project.teamSize);
      setValue('status', project.status as any);
      setValue('techStack', project.techStack);
    }
  }, [project, isEdit, setValue]);

  const createMut = useCreateProject({
    mutation: {
      onSuccess: (data) => {
        toast({ title: 'Project created!' });
        setLocation(`/projects/${data.id}`);
      }
    }
  });

  const updateMut = useUpdateProject({
    mutation: {
      onSuccess: (data) => {
        toast({ title: 'Project updated!' });
        setLocation(`/projects/${data.id}`);
      }
    }
  });

  const onSubmit = (data: FormData) => {
    if (isEdit) {
      updateMut.mutate({ projectId, data });
    } else {
      createMut.mutate({ data });
    }
  };

  const addTech = () => {
    if (techInput.trim() && !techStack.includes(techInput.trim())) {
      setValue('techStack', [...techStack, techInput.trim()]);
      setTechInput('');
    }
  };

  const removeTech = (tech: string) => {
    setValue('techStack', techStack.filter(t => t !== tech));
  };

  if (isEdit && loadingProject) return <AppLayout><div className="p-10 text-center"><Loader2 className="animate-spin w-8 h-8 mx-auto" /></div></AppLayout>;

  const isPending = createMut.isPending || updateMut.isPending;

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold tracking-tight mb-2">
            {isEdit ? 'Edit Project' : 'Launch a New Project'}
          </h1>
          <p className="text-muted-foreground">Define your idea, stack, and what kind of team you're looking for.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 glass-card rounded-3xl p-8 md:p-10">
          
          <div className="space-y-5">
            <div>
              <label className="text-sm font-semibold mb-2 block">Project Title</label>
              <Input {...register('title')} placeholder="e.g. NextGen API Gateway" />
              {errors.title && <p className="text-destructive text-sm mt-1">{errors.title.message}</p>}
            </div>

            <div>
              <label className="text-sm font-semibold mb-2 block">Description</label>
              <Textarea 
                {...register('description')} 
                placeholder="Describe what you are building, the problem it solves, and current progress..."
                className="min-h-[150px]"
              />
              {errors.description && <p className="text-destructive text-sm mt-1">{errors.description.message}</p>}
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className="text-sm font-semibold mb-2 block">Status</label>
                <Select 
                  value={watch('status')} 
                  onValueChange={(val: any) => setValue('status', val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="looking_for_team">Looking for Team</SelectItem>
                    <SelectItem value="active">Active Development</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-semibold mb-2 block">Target Team Size</label>
                <Input type="number" {...register('teamSize')} min={1} max={20} />
                {errors.teamSize && <p className="text-destructive text-sm mt-1">{errors.teamSize.message}</p>}
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold mb-2 block">GitHub Repository URL (Optional)</label>
              <Input {...register('githubUrl')} placeholder="https://github.com/username/repo" type="url" />
            </div>

            <div>
              <label className="text-sm font-semibold mb-2 block">Tech Stack</label>
              <div className="flex gap-2 mb-3">
                <Input 
                  value={techInput} 
                  onChange={e => setTechInput(e.target.value)} 
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTech())}
                  placeholder="e.g. React, Python, Docker..."
                />
                <Button type="button" onClick={addTech} variant="secondary"><Plus className="w-4 h-4" /></Button>
              </div>
              {errors.techStack && <p className="text-destructive text-sm mt-1 mb-3">{errors.techStack.message}</p>}
              
              <div className="flex flex-wrap gap-2">
                {techStack.map(tech => (
                  <div key={tech} className="flex items-center gap-1 bg-primary/20 text-primary border border-primary/30 px-3 py-1.5 rounded-lg text-sm font-medium">
                    {tech}
                    <button type="button" onClick={() => removeTech(tech)} className="hover:text-white ml-1">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-white/10 flex justify-end gap-4">
            <Button type="button" variant="ghost" onClick={() => setLocation('/projects')}>Cancel</Button>
            <Button type="submit" disabled={isPending} className="min-w-[150px]">
              {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : (isEdit ? 'Save Changes' : 'Publish Project')}
            </Button>
          </div>

        </form>
      </div>
    </AppLayout>
  );
}
