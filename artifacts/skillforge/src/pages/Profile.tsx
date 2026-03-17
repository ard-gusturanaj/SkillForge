import React from 'react';
import { useRoute, Link } from 'wouter';
import { useGetUserById } from '@workspace/api-client-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Github, Calendar, Briefcase, Mail } from 'lucide-react';
import { formatDate, generateSkillColor } from '@/lib/utils';
import { ProjectCard } from '@/components/shared/ProjectCard';
import { useAuth } from '@/hooks/use-auth';

export default function Profile() {
  const [match, params] = useRoute('/profile/:id');
  const { user: currentUser } = useAuth();
  
  // If no ID param, assume it's "My Profile" view
  const isMyProfileRoute = useRoute('/profile')[0];
  const profileId = isMyProfileRoute ? currentUser?.id : Number(params?.id);
  const isOwner = currentUser?.id === profileId;

  const { data: profile, isLoading } = useGetUserById(profileId as number, {
    query: {
      queryKey: ['profile', profileId],
      enabled: !!profileId
    }
  });

  if (isLoading) return <AppLayout><div className="animate-pulse h-screen bg-card/20 rounded-xl" /></AppLayout>;
  if (!profile) return <AppLayout><div className="text-center py-20 text-xl font-bold">Profile not found.</div></AppLayout>;

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Profile Header Card */}
        <div className="glass-card rounded-3xl overflow-hidden relative">
          <div className="h-32 md:h-48 bg-gradient-to-r from-primary/30 via-indigo-600/30 to-accent/30 relative">
            <div className="absolute inset-0 bg-grid-pattern opacity-30 mix-blend-overlay" />
          </div>
          
          <div className="px-6 md:px-10 pb-8 relative">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 -mt-16 md:-mt-20 mb-6">
              <Avatar className="w-32 h-32 md:w-40 md:h-40 border-4 border-background bg-secondary shadow-2xl">
                <AvatarImage src={profile.avatarUrl || ''} />
                <AvatarFallback className="text-4xl">{profile.name.substring(0,2)}</AvatarFallback>
              </Avatar>
              
              <div className="flex gap-3">
                {profile.githubUrl && (
                  <a href={profile.githubUrl} target="_blank" rel="noreferrer">
                    <Button variant="outline" className="gap-2 bg-background/50 backdrop-blur-sm">
                      <Github className="w-4 h-4" /> GitHub
                    </Button>
                  </a>
                )}
                {isOwner && (
                  <Link href="/profile/edit">
                    <Button className="shadow-lg shadow-primary/20">Edit Profile</Button>
                  </Link>
                )}
              </div>
            </div>

            <div className="max-w-2xl">
              <h1 className="text-3xl md:text-4xl font-display font-extrabold mb-2">{profile.name}</h1>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground font-medium mb-6">
                <span className="flex items-center gap-1.5"><Mail className="w-4 h-4" /> {profile.email}</span>
                <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> Joined {formatDate(profile.createdAt)}</span>
              </div>

              {profile.bio && (
                <p className="text-foreground/90 text-lg leading-relaxed mb-8">{profile.bio}</p>
              )}

              {profile.skills.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">Skills & Expertise</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map(skill => (
                      <span key={skill} className={`px-3 py-1.5 rounded-lg text-sm font-semibold border ${generateSkillColor(skill)}`}>
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Projects Section */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-primary/20 text-primary">
              <Briefcase className="w-5 h-5" />
            </div>
            <h2 className="text-2xl font-display font-bold">Projects</h2>
          </div>
          
          {profile.projects && profile.projects.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {profile.projects.map(project => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          ) : (
            <div className="glass-card rounded-2xl p-12 text-center border-dashed">
              <p className="text-muted-foreground">No projects to show.</p>
            </div>
          )}
        </div>

      </div>
    </AppLayout>
  );
}
