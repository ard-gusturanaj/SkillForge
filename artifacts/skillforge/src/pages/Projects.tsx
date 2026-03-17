import React, { useState } from 'react';
import { useGetProjects } from '@workspace/api-client-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProjectCard } from '@/components/shared/ProjectCard';
import { Input } from '@/components/ui/input';
import { Search, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Projects() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('all');
  
  // Debounce search slightly
  const [debouncedSearch, setDebouncedSearch] = useState('');
  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading } = useGetProjects({
    search: debouncedSearch || undefined,
    status: status !== 'all' ? (status as any) : undefined
  }, {
    query: {
      queryKey: ['projects', debouncedSearch, status],
    }
  });

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold tracking-tight mb-2">Explore Projects</h1>
        <p className="text-muted-foreground">Find open source projects and startup ideas looking for contributors.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="flex-1">
          <Input 
            icon={<Search className="w-5 h-5" />}
            placeholder="Search projects by title, description or tech..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-64">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="looking_for_team">Looking for Team</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : data?.projects.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
          <img src={`${import.meta.env.BASE_URL}images/empty-state.png`} alt="No projects" className="w-48 h-48 opacity-40 mb-6" />
          <h3 className="text-2xl font-bold mb-2">No projects found</h3>
          <p className="text-muted-foreground max-w-md">Try adjusting your search filters or check back later for new opportunities.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {data?.projects.map(project => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </AppLayout>
  );
}
