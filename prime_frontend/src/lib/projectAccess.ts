import type { Project, User } from '../App';

const normalize = (value?: string) => (value || '').trim().toLowerCase();

export const isProjectOwner = (project: Project, user: User) =>
  project.ownerId === user.id || normalize(project.owner) === normalize(user.name);

export const isProjectTeammate = (project: Project, user: User) => {
  const userEmail = normalize(user.email || user.username);
  const userName = normalize(user.name);

  return (project.teamMembers || []).some((member) => {
    const memberEmail = normalize(member.email);
    const memberName = normalize(member.name);
    return (userEmail && userEmail === memberEmail) || (userName && userName === memberName);
  });
};

export const hasProjectGrantedAccess = (project: Project, user: User) =>
  Boolean(project.approvedFacultyIds?.includes(user.id));
