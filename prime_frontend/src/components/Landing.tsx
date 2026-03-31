import { ArrowRight, BookOpen, Users, Shield, Zap, FolderKanban, Award } from 'lucide-react';
import { LandingContent } from '../data/landingContent';
import { useState, useEffect } from 'react';

interface LandingProps {
  onGetStarted: () => void;
  content: LandingContent;
}

export function Landing({ onGetStarted, content }: LandingProps) {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const featureIcons = [BookOpen, Users, Shield, Zap];

  const features = [
    {
      icon: BookOpen,
      title: 'Host Projects',
      description: 'Students can showcase their academic projects with detailed documentation and team contributions.',
    },
    {
      icon: Users,
      title: 'Collaborate Seamlessly',
      description: 'Faculty and students work together through integrated discussion and review features.',
    },
    {
      icon: Shield,
      title: 'Access Control',
      description: 'Private by default with a request-approve workflow ensuring project privacy and security.',
    },
    {
      icon: Zap,
      title: 'Real-time Updates',
      description: 'Track project timelines, commits, and discussions in one centralized workspace.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white relative overflow-x-hidden">
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        {/* College Background Image with Parallax */}
        <div 
          className="absolute inset-0 w-full h-full bg-cover bg-center transition-transform duration-100 ease-out"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1603857365671-93cd96dc1df8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1bml2ZXJzaXR5JTIwY2FtcHVzJTIwYnVpbGRpbmclMjBhZXJpYWwlMjB2aWV3fGVufDF8fHx8MTc3MDY0NDk3OHww&ixlib=rb-4.1.0&q=80&w=1080')`,
            transform: `translateY(${scrollY * 0.5}px)`,
            minHeight: 'calc(100vh + 200px)',
          }}
        />
        {/* Gradient Overlay - Made more transparent to see the background */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/85 via-white/70 to-white/95" />
        {/* Pattern Overlay */}
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgb(99 102 241 / 0.15) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Navigation */}
        <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                  <FolderKanban className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold text-slate-800">PRIME</span>
              </div>
              <button
                onClick={onGetStarted}
                className="px-6 py-2.5 text-indigo-600 font-medium hover:bg-indigo-50 rounded-lg transition"
              >
                Sign In
              </button>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-6 pt-20 pb-16">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full font-medium text-sm mb-8">
              <Award className="w-4 h-4" />
              {content.hero.badge}
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
              {content.hero.title}
              <span className="text-indigo-600"> {content.hero.highlight}</span>
            </h1>
            
            <p className="text-xl text-slate-600 mb-10 leading-relaxed">
              {content.hero.description}
            </p>

            <div className="flex items-center justify-center gap-4">
              <button
                onClick={onGetStarted}
                className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-indigo-700 transition shadow-xl shadow-indigo-500/30 text-lg"
              >
                Get Started
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={onGetStarted}
                className="px-8 py-4 border-2 border-slate-300 text-slate-700 rounded-xl font-semibold hover:border-slate-400 transition text-lg"
              >
                Learn More
              </button>
            </div>
          </div>

          {/* Hero Image/Mockup */}
          <div className="mt-20 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent z-10" />
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-8 max-w-5xl mx-auto">
              <div className="bg-slate-100 rounded-xl h-96 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="w-10 h-10 text-indigo-600" />
                  </div>
                  <p className="text-slate-600 font-medium">Dashboard Preview</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {content.stats.map((stat, index) => (
              <div key={index} className="text-center">
                <p className="text-4xl font-bold text-indigo-600 mb-2">{stat.value}</p>
                <p className="text-slate-600">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Features Section */}
        <section className="max-w-7xl mx-auto px-6 py-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-xl text-slate-600">
              Powerful features designed for modern academic collaboration
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {content.features.map((feature, index) => {
              const Icon = featureIcons[index];
              return (
                <div
                  key={index}
                  className="bg-white rounded-2xl border border-slate-200 p-8 hover:shadow-xl hover:border-indigo-200 transition"
                >
                  <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center mb-6">
                    <Icon className="w-7 h-7 text-indigo-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 mb-3">{feature.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* How It Works */}
        <section className="bg-slate-50 py-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-slate-900 mb-4">How It Works</h2>
              <p className="text-xl text-slate-600">Simple workflow for maximum impact</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {content.howItWorks.map((step, index) => (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 bg-indigo-600 text-white rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                    {index + 1}
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-3">{step.title}</h3>
                  <p className="text-slate-600">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="max-w-7xl mx-auto px-6 py-20">
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-12 text-center text-white">
            <h2 className="text-4xl font-bold mb-4">{content.cta.title}</h2>
            <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
              {content.cta.description}
            </p>
            <button
              onClick={onGetStarted}
              className="bg-white text-indigo-600 px-8 py-4 rounded-xl font-semibold hover:bg-indigo-50 transition shadow-xl text-lg inline-flex items-center gap-2"
            >
              Create Free Account
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-slate-200 bg-slate-50">
          <div className="max-w-7xl mx-auto px-6 py-12">
            <div className="grid md:grid-cols-4 gap-8 mb-8">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                    <FolderKanban className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-bold text-slate-800">Project Hub</span>
                </div>
                <p className="text-slate-600 text-sm">
                  Empowering academic collaboration through technology
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-slate-800 mb-4">Product</h4>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li><button onClick={onGetStarted} className="hover:text-indigo-600 transition">Features</button></li>
                  <li><button onClick={onGetStarted} className="hover:text-indigo-600 transition">Pricing</button></li>
                  <li><button onClick={onGetStarted} className="hover:text-indigo-600 transition">Security</button></li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-slate-800 mb-4">Resources</h4>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li><button onClick={onGetStarted} className="hover:text-indigo-600 transition">Documentation</button></li>
                  <li><button onClick={onGetStarted} className="hover:text-indigo-600 transition">Help Center</button></li>
                  <li><button onClick={onGetStarted} className="hover:text-indigo-600 transition">Contact</button></li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-slate-800 mb-4">Legal</h4>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li><button onClick={onGetStarted} className="hover:text-indigo-600 transition">Privacy</button></li>
                  <li><button onClick={onGetStarted} className="hover:text-indigo-600 transition">Terms</button></li>
                  <li><button onClick={onGetStarted} className="hover:text-indigo-600 transition">License</button></li>
                </ul>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-8 text-center text-sm text-slate-600">
              <p>&copy; 2026 Handsome & Her Minions. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}