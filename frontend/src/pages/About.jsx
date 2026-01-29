import { Link } from 'react-router-dom';
import {
  BookOpen,
  Target,
  Heart,
  Lightbulb,
  Users,
  Award,
  ArrowRight,
  CheckCircle,
  Github,
  Mail
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';

function About() {
  const values = [
    {
      icon: Target,
      title: 'Mission-Driven',
      description: 'We believe in making quality education accessible to everyone through technology.'
    },
    {
      icon: Heart,
      title: 'Student-First',
      description: 'Every feature is designed with students\' needs and learning experience in mind.'
    },
    {
      icon: Lightbulb,
      title: 'Innovation',
      description: 'Leveraging AI and modern tech to create smarter learning solutions.'
    },
    {
      icon: Users,
      title: 'Community',
      description: 'Building a collaborative space where knowledge is shared freely.'
    }
  ];

  const team = [
    { name: 'AI Learning Team', role: 'Development', avatar: '🚀' },
    { name: 'Open Source', role: 'Contributors', avatar: '💻' },
    { name: 'Students', role: 'Community', avatar: '📚' }
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-emerald-600 to-emerald-700 text-white py-20">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">About Our Platform</h1>
            <p className="text-lg md:text-xl text-emerald-100">
              We're on a mission to revolutionize how students access and interact with
              course materials using the power of artificial intelligence.
            </p>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Story</h2>
              <div className="space-y-4 text-gray-600">
                <p>
                  The AI-Powered Learning Platform was born from a simple observation: students
                  often struggle to find and organize their course materials effectively.
                  Lecture slides get lost, lab resources are scattered, and valuable study
                  time is wasted searching for content.
                </p>
                <p>
                  We set out to solve this problem by creating a centralized, intelligent
                  platform that not only stores course materials but also helps students
                  find exactly what they need, when they need it.
                </p>
                <p>
                  Using modern AI techniques, our platform categorizes, tags, and organizes
                  content automatically, making it easier than ever to access supplementary
                  learning materials.
                </p>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Centralized Access</h3>
                    <p className="text-gray-600 text-sm">All your course materials in one place</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Smart Organization</h3>
                    <p className="text-gray-600 text-sm">AI-powered categorization and tagging</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Easy Search</h3>
                    <p className="text-gray-600 text-sm">Find materials by topic, week, or type</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Always Available</h3>
                    <p className="text-gray-600 text-sm">24/7 access to your learning resources</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-white">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Values</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              These core principles guide everything we do
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <Card key={index} className="text-center border-gray-200">
                <CardContent className="p-6">
                  <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <value.icon className="h-7 w-7 text-emerald-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{value.title}</h3>
                  <p className="text-gray-600 text-sm">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-gray-50">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Built With Love</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              This platform is made possible by dedicated developers and an amazing community
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-8">
            {team.map((member, index) => (
              <div key={index} className="text-center">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-4xl shadow-lg mb-4 mx-auto border border-gray-100">
                  {member.avatar}
                </div>
                <h3 className="font-semibold text-gray-900">{member.name}</h3>
                <p className="text-gray-600 text-sm">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="py-20 bg-white">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Built With Modern Tech</h2>
              <p className="text-lg text-gray-600">
                We use cutting-edge technologies to deliver the best experience
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="bg-gray-50 rounded-xl p-6 text-center">
                <div className="text-2xl mb-2">⚛️</div>
                <div className="font-medium text-gray-900">React</div>
                <div className="text-xs text-gray-500">Frontend</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-6 text-center">
                <div className="text-2xl mb-2">🐍</div>
                <div className="font-medium text-gray-900">Python</div>
                <div className="text-xs text-gray-500">Backend</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-6 text-center">
                <div className="text-2xl mb-2">🤖</div>
                <div className="font-medium text-gray-900">AI/ML</div>
                <div className="text-xs text-gray-500">Intelligence</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-6 text-center">
                <div className="text-2xl mb-2">🎨</div>
                <div className="font-medium text-gray-900">Tailwind</div>
                <div className="text-xs text-gray-500">Styling</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-emerald-600 to-emerald-700">
        <div className="container max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-emerald-100 mb-8 max-w-2xl mx-auto">
            Start exploring our library of course materials today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-white text-emerald-600 hover:bg-gray-100 px-8">
              <Link to="/dashboard">
                Go to Dashboard
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-emerald-500 px-8">
              <Link to="/browse">
                Browse Materials
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default About;
