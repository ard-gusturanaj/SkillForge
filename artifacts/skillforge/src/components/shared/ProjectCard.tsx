import React from 'react';
import { Project } from '@workspace/api-client-react';
import { Link } from 'wouter';
import { Users, Clock, Bookmark, BookmarkCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDate } from '@/lib/utils';
import { useAddBookmark, useRemoveBookmark } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { getGetProjectsQueryKey, getGetBookmarksQueryKey, getGetMyProjectsQueryKey } from '@workspace/api-client-react';

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const queryClient = useQueryClient();
  
  const addBookmarkMut = useAddBookmark({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetProjectsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetBookmarksQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetMyProjectsQueryKey() });
      }
    }
  });

  const removeBookmarkMut = useRemoveBookmark({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetProjectsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetBookmarksQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetMyProjectsQueryKey() });
      }
    }
  });

  const toggleBookmark = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (project.isBookmarked) {
      removeBookmarkMut.mutate({ projectId: project.id });
    } else {
      addBookmarkMut.mutate({ projectId: project.id });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'looking_for_team': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'active': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'completed': return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const formatStatus = (status: string) => {
    return status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  return (
    <Link href={`/projects/${project.id}`} className="block h-full">
      <div className="glass-card rounded-2xl p-6 flex flex-col h-full group relative overflow-hidden">
        {/* Glow effect on hover */}
        <div className="absolute -inset-0.5 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500 -z-10" />
        
        <div className="flex justify-between items-start mb-4 z-10">
          <Badge className={getStatusColor(project.status)}>
            {formatStatus(project.status)}
          </Badge>
          <button 
            onClick={toggleBookmark}
            className="p-2 rounded-full hover:bg-white/10 transition-colors text-muted-foreground hover:text-primary z-20"
            disabled={addBookmarkMut.isPending || removeBookmarkMut.isPending}
          >
            {project.isBookmarked ? (
              <BookmarkCheck className="w-5 h-5 text-primary fill-primary/20" />
            ) : (
              <Bookmark className="w-5 h-5" />
            )}
          </button>
        </div>

        <h3 className="text-xl font-display font-bold text-foreground mb-2 line-clamp-1 z-10 group-hover:text-primary transition-colors">
          {project.title}
        </h3>
        
        <p className="text-muted-foreground text-sm line-clamp-2 mb-6 flex-1 z-10">
          {project.description}
        </p>

        <div className="flex flex-wrap gap-2 mb-6 z-10">
          {project.techStack.slice(0, 3).map(tech => (
            <span key={tech} className="px-2 py-1 bg-secondary rounded-md text-xs font-medium text-secondary-foreground border border-white/5">
              {tech}
            </span>
          ))}
          {project.techStack.length > 3 && (
            <span className="px-2 py-1 bg-secondary/50 rounded-md text-xs font-medium text-muted-foreground border border-white/5">
              +{project.techStack.length - 3}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border z-10">
          <div className="flex items-center gap-2">
            <Avatar className="w-8 h-8">
              <AvatarImage src={project.ownerAvatarUrl || ''} />
              <AvatarFallback>{project.ownerName.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium text-foreground">{project.ownerName}</span>
          </div>
          
          <div className="flex items-center gap-4 text-muted-foreground text-xs font-medium">
            <div className="flex items-center gap-1" title="Team Size">
              <Users className="w-4 h-4" />
              <span>{project.memberCount}/{project.teamSize}</span>
            </div>
            <div className="flex items-center gap-1" title="Created">
              <Clock className="w-4 h-4" />
              <span>{formatDate(project.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
