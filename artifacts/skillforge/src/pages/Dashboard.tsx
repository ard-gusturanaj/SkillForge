import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { 
  useGetMyProjects, 
  useGetIncomingRequests, 
  useGetBookmarks,
  useRespondToCollaborationRequest
} from '@workspace/api-client-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProjectCard } from '@/components/shared/ProjectCard';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Plus, Check, X, Clock, ExternalLink } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { formatDate, generateSkillColor } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import { getGetIncomingRequestsQueryKey } from '@workspace/api-client-react';
import { useToast } from '@/hooks/use-toast';

export default function Dashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: myProjects, isLoading: loadingProjects } = useGetMyProjects();
  const { data: requests, isLoading: loadingRequests } = useGetIncomingRequests();
  const { data: bookmarks, isLoading: loadingBookmarks } = useGetBookmarks();

  const respondMut = useRespondToCollaborationRequest({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetIncomingRequestsQueryKey() });
        toast({ title: "Request updated successfully" });
      },
      onError: (err) => {
        toast({ title: "Error updating request", description: err.message, variant: "destructive" });
      }
    }
  });

  const handleRespond = (id: number, action: 'accept' | 'reject') => {
    respondMut.mutate({ requestId: id, data: { action } });
  };

  const pendingRequests = requests?.filter(r => r.status === 'pending') || [];

  return (
    <AppLayout>
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight">Welcome back, {user?.name.split(' ')[0]}</h1>
          <p className="text-muted-foreground mt-1">Here's what's happening with your projects today.</p>
        </div>
        <Link href="/projects/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            New Project
          </Button>
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* My Projects */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-display font-semibold">My Projects</h2>
              <Link href="/profile" className="text-sm font-semibold text-primary hover:underline">
                View all
              </Link>
            </div>
            
            {loadingProjects ? (
              <div className="grid sm:grid-cols-2 gap-4">
                {[1, 2].map(i => <div key={i} className="h-64 rounded-2xl bg-secondary/50 animate-pulse" />)}
              </div>
            ) : myProjects && myProjects.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-4">
                {myProjects.slice(0, 4).map(project => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            ) : (
              <div className="glass-card rounded-2xl p-8 text-center flex flex-col items-center">
                <img src={`${import.meta.env.BASE_URL}images/empty-state.png`} alt="Empty" className="w-32 h-32 opacity-50 mb-4" />
                <h3 className="text-lg font-bold mb-2">No projects yet</h3>
                <p className="text-muted-foreground mb-4">Create your first project to start building a team.</p>
                <Link href="/projects/new">
                  <Button variant="outline">Create Project</Button>
                </Link>
              </div>
            )}
          </section>

          {/* Bookmarks */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-display font-semibold">Saved Projects</h2>
              <Link href="/projects" className="text-sm font-semibold text-primary hover:underline">
                Explore more
              </Link>
            </div>
            
            {loadingBookmarks ? (
              <div className="grid sm:grid-cols-2 gap-4">
                {[1, 2].map(i => <div key={i} className="h-64 rounded-2xl bg-secondary/50 animate-pulse" />)}
              </div>
            ) : bookmarks && bookmarks.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-4">
                {bookmarks.slice(0, 2).map(project => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            ) : (
              <div className="glass-card rounded-2xl p-8 text-center border-dashed">
                <p className="text-muted-foreground">You haven't bookmarked any projects yet.</p>
              </div>
            )}
          </section>
        </div>

        {/* Right Column - Sidebar style */}
        <div className="space-y-8">
          
          {/* Action Center / Requests */}
          <section className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-display font-bold">Action Needed</h2>
              {pendingRequests.length > 0 && (
                <Badge className="bg-primary text-primary-foreground">
                  {pendingRequests.length}
                </Badge>
              )}
            </div>

            {loadingRequests ? (
              <div className="space-y-4">
                {[1, 2].map(i => <div key={i} className="h-24 rounded-xl bg-secondary/50 animate-pulse" />)}
              </div>
            ) : pendingRequests.length > 0 ? (
              <div className="space-y-4">
                {pendingRequests.map(req => (
                  <div key={req.id} className="p-4 rounded-xl bg-secondary/30 border border-white/5 relative overflow-hidden group">
                    <div className="mb-3 flex items-start gap-3">
                      <Avatar className="w-10 h-10 border-primary/20">
                        <AvatarImage src={req.requesterAvatarUrl || ''} />
                        <AvatarFallback>{req.requesterName.substring(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold">
                          <Link href={`/profile/${req.requesterId}`} className="hover:text-primary transition-colors">
                            {req.requesterName}
                          </Link>
                          <span className="text-muted-foreground font-normal"> wants to join </span>
                        </p>
                        <p className="text-sm text-primary font-medium line-clamp-1">
                          <Link href={`/projects/${req.projectId}`}>{req.projectTitle}</Link>
                        </p>
                      </div>
                    </div>
                    
                    {req.message && (
                      <p className="text-sm text-muted-foreground bg-black/20 p-2 rounded-lg mb-3 italic">
                        "{req.message}"
                      </p>
                    )}

                    <div className="flex flex-wrap gap-1 mb-3">
                      {req.requesterSkills.slice(0, 3).map(skill => (
                        <span key={skill} className={`text-[10px] px-1.5 py-0.5 rounded border ${generateSkillColor(skill)}`}>
                          {skill}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button 
                        size="sm" 
                        className="w-full bg-green-500/20 text-green-400 hover:bg-green-500/30 hover:text-green-300"
                        onClick={() => handleRespond(req.id, 'accept')}
                        disabled={respondMut.isPending}
                      >
                        <Check className="w-4 h-4 mr-1" /> Accept
                      </Button>
                      <Button 
                        size="sm" 
                        variant="glass" 
                        className="w-full hover:bg-destructive/20 hover:text-destructive hover:border-destructive/30"
                        onClick={() => handleRespond(req.id, 'reject')}
                        disabled={respondMut.isPending}
                      >
                        <X className="w-4 h-4 mr-1" /> Decline
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mx-auto mb-3">
                  <Check className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground text-sm">You're all caught up!</p>
              </div>
            )}
          </section>

          {/* Quick Stats */}
          <section className="grid grid-cols-2 gap-4">
            <div className="glass-card rounded-2xl p-4">
              <h4 className="text-muted-foreground text-sm font-medium mb-1">Active Projects</h4>
              <p className="text-3xl font-display font-bold">{myProjects?.filter(p => p.status === 'active').length || 0}</p>
            </div>
            <div className="glass-card rounded-2xl p-4">
              <h4 className="text-muted-foreground text-sm font-medium mb-1">Total Members</h4>
              <p className="text-3xl font-display font-bold">
                {myProjects?.reduce((acc, p) => acc + p.memberCount, 0) || 0}
              </p>
            </div>
          </section>
        </div>
      </div>
    </AppLayout>
  );
}
