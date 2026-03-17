import React, { useState } from 'react';
import { useGetUsers } from '@workspace/api-client-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Link } from 'wouter';
import { Input } from '@/components/ui/input';
import { Search, Loader2, Github } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { generateSkillColor } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export default function Developers() {
  const [search, setSearch] = useState('');
  
  const [debouncedSearch, setDebouncedSearch] = useState('');
  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading } = useGetUsers({
    search: debouncedSearch || undefined,
  }, {
    query: {
      queryKey: ['users', debouncedSearch],
    }
  });

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold tracking-tight mb-2">Find Developers</h1>
        <p className="text-muted-foreground">Search by name or skills to find the perfect collaborator.</p>
      </div>

      <div className="mb-8 max-w-2xl">
        <Input 
          icon={<Search className="w-5 h-5" />}
          placeholder="Search developers e.g. 'React', 'Frontend', 'Alex'..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : data?.users.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <p className="text-muted-foreground">No developers found matching your search.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {data?.users.map(user => (
            <Link key={user.id} href={`/profile/${user.id}`}>
              <div className="glass-card rounded-2xl p-6 text-center h-full flex flex-col items-center group relative hover:-translate-y-1 transition-transform">
                <Avatar className="w-20 h-20 mb-4 border-2 border-primary/20 group-hover:border-primary transition-colors">
                  <AvatarImage src={user.avatarUrl || ''} />
                  <AvatarFallback className="text-2xl">{user.name.substring(0,2)}</AvatarFallback>
                </Avatar>
                
                <h3 className="text-lg font-display font-bold text-foreground mb-1 group-hover:text-primary transition-colors">{user.name}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
                  {user.bio || 'Software Developer'}
                </p>

                <div className="flex flex-wrap justify-center gap-1.5 mb-4">
                  {user.skills.slice(0, 4).map(skill => (
                    <span key={skill} className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${generateSkillColor(skill)}`}>
                      {skill}
                    </span>
                  ))}
                  {user.skills.length > 4 && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded border bg-secondary/50 text-muted-foreground border-white/5">
                      +{user.skills.length - 4}
                    </span>
                  )}
                </div>

                {user.githubUrl && (
                  <div className="pt-4 border-t border-border w-full flex justify-center mt-auto">
                    <Button variant="ghost" size="sm" className="w-full text-muted-foreground hover:text-foreground">
                      <Github className="w-4 h-4 mr-2" /> View GitHub
                    </Button>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
