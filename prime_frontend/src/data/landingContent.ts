export interface LandingContent {
  hero: {
    badge: string;
    title: string;
    highlight: string;
    description: string;
  };
  stats: Array<{
    value: string;
    label: string;
  }>;
  features: Array<{
    title: string;
    description: string;
  }>;
  howItWorks: Array<{
    title: string;
    description: string;
  }>;
  cta: {
    title: string;
    description: string;
  };
}

export const defaultLandingContent: LandingContent = {
  hero: {
    badge: 'The Future of Academic Collaboration',
    title: 'Project Repository &',
    highlight: 'Integrated Monitoring Environment',
    description: 'A powerful platform connecting students and faculty. Host projects, collaborate on research, and showcase your academic achievements in one secure, professional space.',
  },
  stats: [
    { value: '1000+', label: 'Projects Hosted' },
    { value: '500+', label: 'Active Students' },
    { value: '200+', label: 'Faculty Members' },
    { value: '15+', label: 'Departments' },
  ],
  features: [
    {
      title: 'Host Projects',
      description: 'Students can showcase their academic projects with detailed documentation and team contributions.',
    },
    {
      title: 'Collaborate Seamlessly',
      description: 'Faculty and students work together through integrated discussion and review features.',
    },
    {
      title: 'Access Control',
      description: 'Private by default with a request-approve workflow ensuring project privacy and security.',
    },
    {
      title: 'Real-time Updates',
      description: 'Track project timelines, commits, and discussions in one centralized workspace.',
    },
  ],
  howItWorks: [
    {
      title: 'Create & Upload',
      description: 'Students create projects with detailed documentation, team members, and contributions',
    },
    {
      title: 'Request Access',
      description: 'Faculty browse projects and request access to review work and provide guidance',
    },
    {
      title: 'Collaborate',
      description: 'Work together through discussions, timeline tracking, and real-time updates',
    },
  ],
  cta: {
    title: 'Ready to Get Started?',
    description: 'Join thousands of students and faculty members already collaborating on PRIME',
  },
};
