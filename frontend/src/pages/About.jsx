import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { ArrowRight, Users, Award, Gift, Heart } from 'lucide-react';

const About = () => {
  const teamMembers = [
    {
      name: 'Danny Gardner',
      role: 'Co-Founder & Director',
      bio: 'Danny is a student-athlete dedicated to making sports accessible for every child. With a passion for giving back, he leads the organization\'s clinics and outreach programs.',
      image: '/assets/placeholder.png'
    },
    {
      name: 'Ryan Spiess',
      role: 'Co-Founder & Operations Lead',
      bio: 'Ryan manages the logistics behind our clinics and donation drives, ensuring every event runs smoothly and every piece of equipment finds a home.',
      image: '/assets/placeholder.png'
    },
    {
      name: 'Ty Callahan',
      role: 'Co-Founder & Community Coordinator',
      bio: 'Ty connects with local communities to expand our reach, helping bring Kids in Motion\'s mission to more kids across the state.',
      image: '/assets/placeholder.png'
    },
    {
      name: 'Nate Wilner',
      role: 'Co-Founder & Marketing Lead',
      bio: 'Nate handles the creative side, promoting our events and spreading the word to ensure as many kids as possible can benefit from our programs.',
      image: '/assets/placeholder.png'
    }
  ];

  const services = [
    {
      icon: <Award className="h-12 w-12 text-indigo-600" />,
      title: 'Free Sports Clinics',
      description: 'We host free sports clinics across a range of games, giving kids the chance to learn from experienced athletes and develop their skills in a fun, supportive setting.'
    },
    {
      icon: <Gift className="h-12 w-12 text-indigo-600" />,
      title: 'Equipment Donations',
      description: 'We collect and distribute gently used sports equipment to communities where kids may not have the resources to play.'
    },
    {
      icon: <Users className="h-12 w-12 text-indigo-600" />,
      title: 'Mentorship',
      description: 'Beyond sports, we provide mentorship and a welcoming environment where kids can build confidence, make friends, and learn valuable life lessons.'
    }
  ];

  const branches = [
    {
      title: "Logistics",
      description: "The logistics team coordinates nonprofit status, manages equipment drives, handles funds, and ensures smooth operations between all branches."
    },
    {
      title: "Member Outreach",
      description: "This team recruits members to join and participate in events, coordinates roles, and manages attendance within the organization."
    },
    {
      title: "Community Outreach",
      description: "Community outreach handles communication with external organizations, including local little leagues, schools, and programs for kids with disabilities or limited resources."
    },
    {
      title: "Event Coordination",
      description: "This team secures locations for clinics, develops curriculum for players, coordinates equipment, and ensures everyone has a positive experience."
    }
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <div className="relative bg-indigo-800 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 pb-8 bg-indigo-800 sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
            <svg
              className="hidden lg:block absolute right-0 inset-y-0 h-full w-48 text-indigo-800 transform translate-x-1/2"
              fill="currentColor"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <polygon points="50,0 100,0 50,100 0,100" />
            </svg>

            <div className="pt-10 sm:pt-16 lg:pt-8 lg:pb-14 lg:mr-4 xl:mr-16">
              <div className="sm:text-center lg:text-left px-4 sm:px-8 xl:pl-12">
                <h1 className="text-4xl tracking-tight font-extrabold text-white sm:text-5xl md:text-6xl">
                  <span className="block">About</span>
                  <span className="block text-indigo-300">Kids in Motion</span>
                </h1>
                <p className="mt-3 text-base text-gray-200 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                  Kids in Motion was founded by student-athletes to make sports accessible to all children. Through free clinics and donated equipment, we empower kids to play, grow, and build lifelong skills.
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
          <img
            className="h-56 w-full object-cover sm:h-72 md:h-96 lg:w-full lg:h-full"
            src="/assets/placeholder.png"
            alt="Kids playing sports"
          />
        </div>
      </div>

      {/* Our Purpose Section */}
      <div className="py-16 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Our Purpose
            </h2>
            <div className="mt-4 max-w-3xl mx-auto text-xl text-gray-500">
              <p>
                At Kids in Motion, we believe that every child deserves the opportunity to play sports, regardless of their background. Sports teach teamwork, discipline, and resilience—values that extend far beyond the game.
              </p>
            </div>
          </div>

          <div className="mt-16">
            <div className="lg:grid lg:grid-cols-2 lg:gap-12">
              <div className="mt-10 lg:mt-0">
                <p className="text-lg text-gray-500 mb-4">
                  Our organization provides free sports clinics across a variety of games, including baseball, soccer, and more. We also collect and distribute gently used sports equipment, ensuring kids who may not have access to the gear they need can still participate.
                </p>
                <p className="text-lg text-gray-500">
                  By connecting passionate athletes with communities in need, we aim to create a supportive environment where every child can discover their potential. Our goal is to remove barriers, foster a love for sports, and make sure no kid is left on the sidelines.
                </p>
              </div>
              <div className="relative mt-10 lg:mt-0">
                <div className="aspect-w-16 aspect-h-9 lg:aspect-none">
                  <img 
                    className="rounded-xl shadow-xl object-cover object-center transform transition-transform duration-300 hover:scale-105" 
                    src="/assets/placeholder.png" 
                    alt="Kids playing sports" 
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* What We Do Section */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              What We Do
            </h2>
          </div>

          <div className="mt-16">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {services.map((service, index) => (
                <div key={index} className="flex flex-col bg-white rounded-2xl shadow-lg overflow-hidden transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                  <div className="px-6 py-8">
                    <div className="flex items-center justify-center h-16">
                      {service.icon}
                    </div>
                    <h3 className="mt-6 text-xl font-medium text-gray-900 text-center">
                      {service.title}
                    </h3>
                    <p className="mt-4 text-base text-gray-500 text-center">
                      {service.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Meet Our Team Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Meet Our Team
            </h2>
            <p className="max-w-2xl mt-4 text-xl text-gray-500 mx-auto">
              The passionate individuals behind Kids in Motion
            </p>
          </div>

          <div className="mt-16 space-y-12 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-x-6 lg:gap-y-12">
            {teamMembers.map((member, index) => (
              <div key={index} className="group relative bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-500 rounded-xl shadow-md transition-all duration-300 hover:shadow-lg">
                <div className="flex items-center space-x-6">
                  <div className="flex-shrink-0">
                    <img 
                      className="h-24 w-24 rounded-full object-cover ring-4 ring-indigo-50 transition-all duration-300 group-hover:ring-indigo-200" 
                      src={member.image} 
                      alt={member.name}
                      onError={(e) => {
                        e.target.src = '/assets/placeholder.png';
                      }} 
                    />
                  </div>
                  <div>
                    <h3 className="text-xl font-medium text-gray-900">{member.name}</h3>
                    <p className="text-indigo-600 text-sm font-medium">{member.role}</p>
                    <p className="mt-2 text-base text-gray-500">{member.bio}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Our Structure Section */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Our Structure
            </h2>
          </div>

          <div className="mt-12 max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-md overflow-hidden p-6">
              <h3 className="text-2xl font-medium text-gray-900">Board of Directors</h3>
              <p className="mt-4 text-base text-gray-500">
                Kids in Motion is led by our board of directors, consisting of the four co-founders and advisors from the community. The board meets regularly to plan events, coordinate fundraisers, and ensure the organization stays true to its mission.
              </p>
            </div>

            <h3 className="mt-12 text-2xl font-medium text-gray-900 text-center">Branches</h3>
            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
              {branches.map((branch, index) => (
                <div key={index} className="bg-white rounded-xl shadow-md overflow-hidden p-6 transform transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                  <h4 className="text-xl font-medium text-indigo-600">{branch.title}</h4>
                  <p className="mt-2 text-gray-500">{branch.description}</p>
                </div>
              ))}
            </div>

            <div className="mt-12 bg-white rounded-xl shadow-md overflow-hidden p-6">
              <h3 className="text-2xl font-medium text-gray-900">Supporting Roles</h3>
              <p className="mt-4 text-base text-gray-500">
                We also have dedicated volunteers who manage our social media presence, document our events through photography and video, maintain our website, and handle administrative tasks to keep the organization running smoothly.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Get Involved CTA */}
      <div className="py-12 bg-indigo-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-8 items-center">
            <div>
              <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
                Join Our Community
              </h2>
              <p className="mt-3 max-w-md mx-auto text-lg text-indigo-200 sm:text-xl md:mt-5 md:max-w-3xl">
                Whether you're a parent, athlete, coach, or community member, there's a place for you in our organization. Together, we can make a difference in the lives of children through the power of sports.
              </p>
            </div>
            <div className="mt-10 lg:mt-0 flex flex-col sm:flex-row sm:justify-center lg:justify-start gap-4">
              <Link 
                to="/volunteer" 
                className="flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-indigo-700 bg-white hover:bg-indigo-50 md:py-4 md:text-lg md:px-10 transition-all duration-300"
              >
                Become a Volunteer
              </Link>
              <Link 
                to="/donate" 
                className="flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-500 hover:bg-indigo-600 md:py-4 md:text-lg md:px-10 transition-all duration-300"
              >
                Make a Donation
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Contact CTA */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            <span className="block">Ready to get started?</span>
            <span className="block text-indigo-600">Contact us today.</span>
          </h2>
          <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
            <div className="inline-flex rounded-md shadow">
              <Link
                to="/contact"
                className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-all duration-300"
              >
                Contact Us
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default About;