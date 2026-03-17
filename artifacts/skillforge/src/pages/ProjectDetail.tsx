import React, { useState } from 'react';
import { useRoute, Link, useLocation } from 'wouter';
import { 
  useGetProjectById, 
  useCreateCollaborationRequest,
  useDeleteProject 
} from '@workspace/api-client-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { 
  Github, 
  Users, 
  Clock, 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Send 
} from 'lucide-react';
import { formatDate, generateSkillColor } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

export default function ProjectDetail() {
  const [_, params] = useRoute('/projects/:id');
  const projectId = Number(params?.id);
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);
  const [joinMessage, setJoinMessage] = useState('');

  const { data: project, isLoading, error } = useGetProjectById(projectId);
  
  const joinMut = useCreateCollaborationRequest({
    mutation: {
      onSuccess: () => {
        setIsJoinDialogOpen(false);
        toast({ title: "Request sent successfully!" });
      },
      onError: (err) => {
        toast({ title: "Failed to send request", description: err.message, variant: "destructive" });
      }
    }
  });

  const deleteMut = useDeleteProject({
    mutation: {
      onSuccess: () => {
        toast({ title: "Project deleted" });
        setLocation('/dashboard');
      }
    }
  });

  if (isLoading) return <AppLayout><div className="animate-pulse h-screen bg-card/20 rounded-xl" /></AppLayout>;
  if (error || !project) return <AppLayout><div className="text-center py-20 text-xl font-bold">Project not found.</div></AppLayout>;

  const isOwner = user?.id === project.ownerId;
  const isMember = project.members.some(m => m.id === user?.id);

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        <Link href="/projects" className="inline-flex items-center text-sm font-semibold text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to projects
        </Link>

        <div className="glass-card rounded-3xl p-6 md:p-10 mb-8 relative overflow-hidden">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-6 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Badge className={
                  project.status === 'active' ? 'bg-green-500/10 text-green-400' :
                  project.status === 'looking_for_team' ? 'bg-blue-500/10 text-blue-400' :
                  'bg-gray-500/10 text-gray-400'
                }>
                  {project.status.split('_').join(' ').toUpperCase()}
                </Badge>
                <span className="flex items-center text-sm text-muted-foreground font-medium">
                  <Clock className="w-4 h-4 mr-1" /> {formatDate(project.createdAt)}
                </span>
              </div>
              <h1 className="text-4xl font-display font-extrabold tracking-tight mb-4">{project.title}</h1>
              
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12 border-2 border-primary/20">
                  <AvatarImage src={project.ownerAvatarUrl || ''} />
                  <AvatarFallback>{project.ownerName.substring(0,2)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm text-muted-foreground">Maintained by</p>
                  <Link href={`/profile/${project.ownerId}`} className="font-semibold text-foreground hover:text-primary transition-colors">
                    {project.ownerName}
                  </Link>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              {project.githubUrl && (
                <a href={project.githubUrl} target="_blank" rel="noreferrer">
                  <Button variant="outline" size="icon" className="rounded-xl">
                    <Github className="w-5 h-5" />
                  </Button>
                </a>
              )}
              
              {isOwner ? (
                <>
                  <Link href={`/projects/${project.id}/edit`}>
                    <Button variant="secondary" className="gap-2">
                      <Edit className="w-4 h-4" /> Edit
                    </Button>
                  </Link>
                  <Button 
                    variant="destructive" 
                    className="gap-2"
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this project?')) {
                        deleteMut.mutate({ projectId: project.id });
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </>
              ) : !isMember && project.status === 'looking_for_team' ? (
                <Button className="gap-2 px-8 shadow-primary/30" onClick={() => setIsJoinDialogOpen(true)}>
                  <Send className="w-4 h-4" /> Request to Join
                </Button>
              ) : null}
            </div>
          </div>

          {/* Content */}
          <div className="grid md:grid-cols-3 gap-10">
            <div className="md:col-span-2 space-y-8">
              <section>
                <h3 className="text-xl font-display font-bold mb-4">About the Project</h3>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {project.description}
                </p>
              </section>

              <section>
                <h3 className="text-xl font-display font-bold mb-4">Tech Stack</h3>
                <div className="flex flex-wrap gap-2">
                  {project.techStack.map(tech => (
                    <span key={tech} className="px-3 py-1.5 bg-secondary rounded-lg text-sm font-medium text-secondary-foreground border border-white/5 shadow-sm">
                      {tech}
                    </span>
                  ))}
                </div>
              </section>
            </div>

            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-secondary/30 border border-white/5">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-display font-bold flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" /> Team
                  </h3>
                  <span className="text-sm font-semibold bg-background px-2 py-1 rounded-md">
                    {project.memberCount} / {project.teamSize}
                  </span>
                </div>
                
                <div className="space-y-4">
                  {project.members.map(member => (
                    <Link key={member.id} href={`/profile/${member.id}`} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors group">
                      <Avatar>
                        <AvatarImage src={member.avatarUrl || ''} />
                        <AvatarFallback>{member.name.substring(0,2)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">{member.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{member.skills.slice(0, 2).join(', ')}</p>
                      </div>
                      {member.id === project.ownerId && (
                        <Badge variant="outline" className="text-[10px] uppercase">Owner</Badge>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={isJoinDialogOpen} onOpenChange={setIsJoinDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request to Join</DialogTitle>
            <DialogDescription>
              Introduce yourself and explain how you can contribute to this project.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea 
              placeholder="Hi! I'm really interested in this project because..."
              value={joinMessage}
              onChange={(e) => setJoinMessage(e.target.value)}
              className="min-h-[150px]"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsJoinDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={() => joinMut.mutate({ data: { projectId: project.id, message: joinMessage }})}
              disabled={joinMut.isPending}
            >
              Send Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
