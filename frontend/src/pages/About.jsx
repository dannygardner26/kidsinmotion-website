import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

import DynamicImage from '../components/DynamicImage';
import { ArrowRight, Users, Award, Gift, Heart, DollarSign, UserX, MapPin } from 'lucide-react';
import { assetUrls } from '../utils/firebaseAssets';
import { useAuth } from '../context/AuthContext';

const About = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const handleVolunteerClick = () => {
    if (currentUser) {
      // User is logged in - take them to volunteer application
      navigate('/volunteer');
    } else {
      // User is not logged in - take them to registration
      navigate('/register');
    }
  };

  const teamMembers = [
    {
      name: 'Danny Gardner',
      role: 'Co-Founder & Director',
      bio: 'Danny is a student-athlete dedicated to making sports accessible for every child. With a passion for giving back, he leads the organization\'s clinics and outreach programs.',
      image: assetUrls['danny-profile.jpg']
    },
    {
      name: 'Ryan Spiess',
      role: 'Co-Founder & Operations Lead',
      bio: 'Ryan manages the logistics behind our clinics and donation drives, ensuring every event runs smoothly and every piece of equipment finds a home.',
      image: assetUrls['ryan-profile-new.jpg']
    },
    {
      name: 'Nate Wilner',
      role: 'Co-Founder & Marketing Lead',
      bio: 'Nate handles the creative side, promoting our events and spreading the word to ensure as many kids as possible can benefit from our programs.',
      image: assetUrls['nate-profile-new.jpg']
    },
    {
      name: 'Ty Callahan',
      role: 'Community Coordinator',
      bio: 'Ty connects with local communities to expand our reach, helping bring Kids in Motion\'s mission to more kids across the state.',
      image: assetUrls['ty-profile.jpg']
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
    },
    {
      title: "Social Media Team",
      description: "Manages our social media presence, documents events through photography and video, and handles creative content to spread our mission."
    },
    {
      title: "Website Team",
      description: "Maintains our website, handles online content updates, manages digital communications, and ensures our web presence effectively represents our organization."
    }
  ];

  const problems = [
    {
      icon: <DollarSign className="h-12 w-12" />,
      title: 'Sports Programs Are Too Expensive',
      description: 'Many families struggle to afford the high costs of youth sports programs, equipment, and club fees, leaving talented kids on the sidelines.'
    },
    {
      icon: <UserX className="h-12 w-12" />,
      title: 'Lack of Mentorship & Role Models',
      description: 'Young athletes need positive mentors and role models to guide them both on and off the field, but many communities lack these crucial relationships.'
    },
    {
      icon: <MapPin className="h-12 w-12" />,
      title: 'Limited Access to Quality Programs',
      description: 'Underserved communities often lack access to well-organized, consistent sports programs that can provide structure and skill development.'
    }
  ];

  return (
    <>
      {/* Hero Section */}
      <section className="hero" style={{
        background: 'linear-gradient(135deg, #4a7ca3 0%, #2f506a 100%)',
        color: 'white',
        paddingTop: '8rem',
        paddingBottom: '4rem',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background decorative elements */}
        <div style={{
          position: 'absolute',
          top: '-50px',
          right: '-50px',
          width: '200px',
          height: '200px',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '50%'
        }}></div>
        <div style={{
          position: 'absolute',
          bottom: '-100px',
          left: '-100px',
          width: '300px',
          height: '300px',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '50%'
        }}></div>
        
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem', position: 'relative', zIndex: 2 }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div style={{
              display: 'inline-block',
              backgroundColor: 'rgba(255,255,255,0.2)',
              padding: '0.5rem 1.5rem',
              borderRadius: '25px',
              marginBottom: '1.5rem',
              fontSize: '0.9rem',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              Our Story
            </div>
            
            <h1 style={{ 
              fontSize: '3.5rem', 
              fontWeight: '800', 
              marginBottom: '1.5rem', 
              margin: '0 0 1.5rem 0',
              color: 'white'
            }}>
              About Kids in Motion
            </h1>
            
            <p style={{ 
              fontSize: '1.3rem', 
              lineHeight: '1.7', 
              opacity: '0.95', 
              maxWidth: '750px', 
              margin: '0 auto',
              fontWeight: '300'
            }}>
              Kids in Motion was founded by passionate student-athletes to make sports accessible to all children. Through free clinics and donated equipment, we empower kids to play, grow, and build lifelong skills.
            </p>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{
              display: 'inline-block',
              background: 'rgba(255,255,255,0.15)',
              padding: '1.5rem',
              borderRadius: '20px',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)'
            }}>
              <img
                src={assetUrls['team-huddle.jpg']}
                alt="Kids in Motion team building community"
                style={{ 
                  width: '100%', 
                  maxWidth: '700px',
                  height: 'auto', 
                  borderRadius: '16px', 
                  boxShadow: '0 25px 50px rgba(0,0,0,0.3)'
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Problems We Solve Section */}
      <section className="section" style={{ backgroundColor: '#f8f8f8' }}>
        <div className="container">
          <div className="section-head text-center">
            <h2>The Problems We Solve</h2>
            <p>Understanding the challenges facing young athletes in our communities</p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1.5rem',
            marginTop: '2rem'
          }}>
            {problems.map((problem, index) => {
              const colors = [
                { bg: '#e3f2fd', border: '#2f506a', text: '#1a365d' }, // Light blue
                { bg: '#f0f9ff', border: '#4a7ca3', text: '#2d3748' }, // Lighter blue
                { bg: '#e6f3ff', border: '#1e40af', text: '#1e3a8a' }  // Medium blue
              ];
              const colorScheme = colors[index % colors.length];

              return (
                <div
                  key={index}
                  style={{
                    background: `linear-gradient(135deg, ${colorScheme.bg} 0%, #ffffff 100%)`,
                    border: `3px solid ${colorScheme.border}`,
                    borderRadius: '20px',
                    padding: '2.5rem 2rem',
                    textAlign: 'center',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                  }}
                  onMouseEnter={(e) => {
                    if (e.target === e.currentTarget) {
                      e.target.style.transform = 'translateY(-5px)';
                      e.target.style.boxShadow = `0 10px 25px rgba(0,0,0,0.15)`;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (e.target === e.currentTarget) {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
                    }
                  }}
                >
                  <div style={{
                    marginBottom: '1.5rem',
                    display: 'flex',
                    justifyContent: 'center',
                    pointerEvents: 'none'
                  }}>
                    <div style={{
                      color: colorScheme.border,
                      background: 'transparent !important',
                      border: 'none',
                      padding: '0',
                      margin: '0',
                      outline: 'none',
                      boxShadow: 'none',
                      pointerEvents: 'none'
                    }}>
                      {problem.icon}
                    </div>
                  </div>
                  <h3 style={{
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    color: colorScheme.text,
                    marginBottom: '1rem',
                    background: 'transparent',
                    pointerEvents: 'none'
                  }}>
                    {problem.title}
                  </h3>
                  <p style={{
                    color: colorScheme.text,
                    lineHeight: '1.6',
                    fontSize: '1rem',
                    margin: '0',
                    background: 'transparent',
                    pointerEvents: 'none'
                  }}>
                    {problem.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* What We Do Section */}
      <section className="section" style={{ backgroundColor: '#f0f9ff' }}>
        <div className="container">
          <div className="section-head text-center">
            <h2 style={{ color: '#1e40af' }}>What We Do</h2>
            <p style={{ color: '#1e40af', opacity: '0.8' }}>Three core pillars that drive our mission</p>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '1.5rem',
            marginTop: '2rem'
          }}>
            {services.map((service, index) => {
              const colors = [
                { bg: '#e1f5fe', border: '#2f506a', text: '#1a365d', icon: '#2f506a' }, // Light blue
                { bg: '#f0f9ff', border: '#4a7ca3', text: '#2d3748', icon: '#4a7ca3' }, // Lighter blue  
                { bg: '#e6f3ff', border: '#1e40af', text: '#1e3a8a', icon: '#1e40af' }  // Medium blue
              ];
              const colorScheme = colors[index % colors.length];
              
              return (
                <div 
                  key={index} 
                  style={{
                    backgroundColor: colorScheme.bg,
                    border: `3px solid ${colorScheme.border}`,
                    borderRadius: '20px',
                    padding: '2.5rem 2rem',
                    textAlign: 'center',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-10px) scale(1.02)';
                    e.currentTarget.style.boxShadow = `0 25px 50px ${colorScheme.border}30`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0) scale(1)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {/* Background Pattern */}
                  <div style={{
                    position: 'absolute',
                    top: '-50%',
                    right: '-50%',
                    width: '200%',
                    height: '200%',
                    background: `radial-gradient(circle, ${colorScheme.border}15 0%, transparent 70%)`,
                    zIndex: 0
                  }}></div>
                  
                  {/* Content */}
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{
                      width: '80px',
                      height: '80px',
                      backgroundColor: 'white',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 1.5rem',
                      boxShadow: `0 10px 30px ${colorScheme.border}40`,
                      border: `2px solid ${colorScheme.border}`
                    }}>
                      <div style={{ color: colorScheme.icon, fontSize: '2rem' }}>
                        {React.cloneElement(service.icon, { 
                          style: { width: '40px', height: '40px', color: colorScheme.icon }
                        })}
                      </div>
                    </div>
                    
                    <h3 style={{ 
                      fontSize: '1.5rem', 
                      fontWeight: 'bold', 
                      color: colorScheme.text,
                      marginBottom: '1rem'
                    }}>
                      {service.title}
                    </h3>
                    
                    <p style={{ 
                      color: colorScheme.text, 
                      lineHeight: '1.6',
                      fontSize: '1rem',
                      opacity: '0.9'
                    }}>
                      {service.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Meet Our Team Section */}
      <section className="section" style={{ backgroundColor: '#f8f8f8' }}>
        <div className="container">
          <div className="section-head text-center">
            <h2>Meet Our Team</h2>
            <p>The passionate individuals behind Kids in Motion</p>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: '1.5rem',
            marginTop: '2rem'
          }}>
            {teamMembers.map((member, index) => (
              <div 
                key={index} 
                style={{
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  padding: '2rem',
                  textAlign: 'center',
                  boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.boxShadow = '0 15px 30px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 5px 15px rgba(0,0,0,0.1)';
                }}
              >
                <img 
                  src={member.image} 
                  alt={member.name}
                  style={{ 
                    width: '100px', 
                    height: '100px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    objectPosition: 'center',
                    margin: '0 auto 1.5rem',
                    border: '4px solid #e5e7eb'
                  }}
                  onError={(e) => {
                    e.target.src = assetUrls['placeholder.png'];
                  }} 
                />
                <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#2f506a' }}>
                  {member.name}
                </h3>
                <p style={{ color: '#e53e3e', fontWeight: '600', marginBottom: '1rem', fontSize: '0.9rem' }}>
                  {member.role}
                </p>
                <p style={{ color: '#6b7280', lineHeight: '1.6', fontSize: '0.95rem' }}>
                  {member.bio}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How Our Team Operates Section */}
      <section className="section" style={{ backgroundColor: 'white' }}>
        <div className="container">
          <div className="section-head text-center">
            <h2>How Our Team Operates</h2>
            <p>Our organizational structure built for maximum impact</p>
          </div>

          {/* Board of Directors */}
          <div style={{ 
            textAlign: 'center', 
            marginBottom: '4rem',
            backgroundColor: '#2f506a',
            color: 'white',
            padding: '3rem 2rem',
            borderRadius: '16px',
            boxShadow: '0 10px 30px rgba(47, 80, 106, 0.3)'
          }}>
            <h3 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem', color: 'white' }}>
              Board of Directors
            </h3>
            <p style={{ fontSize: '1.1rem', opacity: '0.9', maxWidth: '600px', margin: '0 auto' }}>
              Kids in Motion is led by our board of directors, consisting of the three co-founders and advisors from the community. 
              The board meets regularly to plan events, coordinate fundraisers, and ensure the organization stays true to its mission.
            </p>
          </div>

          {/* Organizational Flow */}
          <div style={{ position: 'relative', marginBottom: '3rem' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '2rem',
              position: 'relative'
            }}>
              {branches.map((branch, index) => (
                <div 
                  key={index}
                  style={{
                    position: 'relative',
                    backgroundColor: 'white',
                    border: '3px solid #e5e7eb',
                    borderRadius: '20px',
                    padding: '2.5rem 2rem',
                    textAlign: 'center',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#2f506a';
                    e.currentTarget.style.transform = 'translateY(-8px)';
                    e.currentTarget.style.boxShadow = '0 20px 40px rgba(47, 80, 106, 0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {/* Branch Number */}
                  <div style={{
                    position: 'absolute',
                    top: '-20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: '#e53e3e',
                    color: 'white',
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    fontSize: '1.2rem'
                  }}>
                    {index + 1}
                  </div>
                  
                  <h4 style={{ 
                    fontSize: '1.5rem', 
                    fontWeight: 'bold', 
                    color: '#2f506a',
                    marginBottom: '1rem',
                    marginTop: '0.5rem'
                  }}>
                    {branch.title}
                  </h4>
                  <p style={{ 
                    color: '#6b7280', 
                    lineHeight: '1.6',
                    fontSize: '1rem'
                  }}>
                    {branch.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* Open to All Sports Section */}
      <section className="section" style={{
        background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #f8f8f8 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background decorative elements */}
        <div style={{
          position: 'absolute',
          top: '-100px',
          right: '-100px',
          width: '300px',
          height: '300px',
          background: 'radial-gradient(circle, rgba(47, 80, 106, 0.1) 0%, transparent 70%)',
          borderRadius: '50%'
        }}></div>
        <div style={{
          position: 'absolute',
          bottom: '-50px',
          left: '-50px',
          width: '200px',
          height: '200px',
          background: 'radial-gradient(circle, rgba(74, 124, 163, 0.1) 0%, transparent 70%)',
          borderRadius: '50%'
        }}></div>

        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <div className="section-head text-center" style={{ marginBottom: '4rem' }}>
            <div style={{
              display: 'inline-block',
              backgroundColor: 'rgba(47, 80, 106, 0.1)',
              padding: '0.5rem 1.5rem',
              borderRadius: '25px',
              marginBottom: '1rem',
              fontSize: '0.9rem',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              color: '#2f506a'
            }}>
              All Sports Welcome
            </div>
            <h2 style={{
              fontSize: '3rem',
              fontWeight: '800',
              color: '#2f506a',
              marginBottom: '1rem',
              background: 'linear-gradient(135deg, #2f506a 0%, #4a7ca3 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              Open to All Sports
            </h2>
            <p style={{
              fontSize: '1.2rem',
              color: '#4a5568',
              maxWidth: '600px',
              margin: '0 auto',
              lineHeight: '1.7'
            }}>
              From baseball diamonds to basketball courts, every sport has the power to transform young lives
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '4rem',
            alignItems: 'center',
            '@media (max-width: 768px)': {
              gridTemplateColumns: '1fr',
              gap: '2rem'
            }
          }}>
            {/* Content Side */}
            <div style={{ order: 1 }}>
              {/* Sports Icons Row */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-around',
                marginBottom: '2.5rem',
                padding: '1.5rem',
                backgroundColor: 'white',
                borderRadius: '20px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                border: '2px solid rgba(47, 80, 106, 0.1)'
              }}>
                {['⚾', '🏀', '⚽', '🏈', '🎾', '🏐'].map((sport, index) => (
                  <div
                    key={index}
                    style={{
                      fontSize: '2.5rem',
                      padding: '0.5rem',
                      borderRadius: '50%',
                      backgroundColor: '#f0f9ff',
                      border: '2px solid #2f506a',
                      width: '60px',
                      height: '60px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'scale(1.2) rotate(10deg)';
                      e.target.style.backgroundColor = '#2f506a';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'scale(1) rotate(0deg)';
                      e.target.style.backgroundColor = '#f0f9ff';
                    }}
                  >
                    {sport}
                  </div>
                ))}
              </div>

              <div style={{
                backgroundColor: 'white',
                padding: '2.5rem',
                borderRadius: '20px',
                boxShadow: '0 15px 40px rgba(0,0,0,0.1)',
                border: '2px solid rgba(47, 80, 106, 0.1)',
                position: 'relative'
              }}>
                {/* Accent border */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '6px',
                  background: 'linear-gradient(90deg, #2f506a 0%, #4a7ca3 50%, #e53e3e 100%)',
                  borderRadius: '20px 20px 0 0'
                }}></div>

                <h3 style={{
                  fontSize: '2.2rem',
                  fontWeight: '800',
                  marginBottom: '1.5rem',
                  color: '#2f506a',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <span style={{ fontSize: '2rem' }}>🌟</span>
                  Beyond Baseball
                </h3>

                <div style={{ marginBottom: '2rem' }}>
                  <p style={{
                    fontSize: '1.1rem',
                    lineHeight: '1.8',
                    marginBottom: '1.5rem',
                    color: '#4a5568'
                  }}>
                    While we started with <strong style={{ color: '#2f506a' }}>baseball</strong>, Kids in Motion welcomes directors and coaches from <strong style={{ color: '#e53e3e' }}>all sports backgrounds</strong>.
                  </p>

                  <p style={{
                    fontSize: '1.1rem',
                    lineHeight: '1.8',
                    marginBottom: '1.5rem',
                    color: '#4a5568'
                  }}>
                    Whether it's <em>basketball, soccer, football, tennis, volleyball, track & field,</em> or any other sport, we're excited to help you bring your expertise to underserved communities.
                  </p>

                  <p style={{
                    fontSize: '1.1rem',
                    lineHeight: '1.8',
                    marginBottom: '2rem',
                    color: '#4a5568',
                    fontWeight: '500'
                  }}>
                    If you're passionate about your sport and want to make a difference in children's lives, <strong style={{ color: '#2f506a' }}>we want to hear from you!</strong>
                  </p>
                </div>

                {/* Call to Action Box */}
                <div style={{
                  background: 'linear-gradient(135deg, #2f506a 0%, #4a7ca3 100%)',
                  color: 'white',
                  padding: '2rem',
                  borderRadius: '16px',
                  textAlign: 'center',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  {/* Background pattern */}
                  <div style={{
                    position: 'absolute',
                    top: '-50%',
                    right: '-50%',
                    width: '200%',
                    height: '200%',
                    background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
                    zIndex: 0
                  }}></div>

                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <h4 style={{
                      fontSize: '1.5rem',
                      fontWeight: 'bold',
                      marginBottom: '1rem',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem'
                    }}>
                      <span style={{ fontSize: '1.8rem' }}>📞</span>
                      Ready to Join Us?
                    </h4>

                    <p style={{
                      marginBottom: '1.5rem',
                      opacity: '0.95',
                      fontSize: '1.1rem',
                      lineHeight: '1.6'
                    }}>
                      Have a sport you'd like to teach? Let's talk about bringing your passion to Kids in Motion!
                    </p>

                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem',
                      fontSize: '1rem'
                    }}>
                      <div style={{
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        padding: '0.75rem 1rem',
                        borderRadius: '10px',
                        fontWeight: '600'
                      }}>
                        📧 kidsinmotion0@gmail.com
                      </div>
                      <div style={{
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        padding: '0.75rem 1rem',
                        borderRadius: '10px',
                        fontWeight: '600'
                      }}>
                        📱 (484) 885-6284
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Image Side */}
            <div style={{
              textAlign: 'center',
              order: 2
            }}>
              <div style={{
                position: 'relative',
                display: 'inline-block',
                padding: '1.5rem',
                background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(240,249,255,0.9) 100%)',
                borderRadius: '30px',
                boxShadow: '0 25px 60px rgba(0,0,0,0.15)',
                border: '3px solid rgba(47, 80, 106, 0.2)'
              }}>
                {/* Decorative elements around image */}
                <div style={{
                  position: 'absolute',
                  top: '-15px',
                  left: '-15px',
                  width: '30px',
                  height: '30px',
                  backgroundColor: '#e53e3e',
                  borderRadius: '50%'
                }}></div>
                <div style={{
                  position: 'absolute',
                  top: '-10px',
                  right: '-10px',
                  width: '20px',
                  height: '20px',
                  backgroundColor: '#4a7ca3',
                  borderRadius: '50%'
                }}></div>
                <div style={{
                  position: 'absolute',
                  bottom: '-10px',
                  left: '-10px',
                  width: '25px',
                  height: '25px',
                  backgroundColor: '#2f506a',
                  borderRadius: '50%'
                }}></div>

                <DynamicImage
                  src={assetUrls['team-huddle.jpg']}
                  alt="Kids in Motion team building community through various sports"
                  style={{
                    width: '100%',
                    maxWidth: '500px',
                    borderRadius: '20px',
                    boxShadow: '0 15px 35px rgba(0,0,0,0.2)',
                    transition: 'transform 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'scale(1)';
                  }}
                />

                {/* Image caption */}
                <div style={{
                  marginTop: '1.5rem',
                  padding: '1rem',
                  backgroundColor: 'white',
                  borderRadius: '15px',
                  border: '2px solid rgba(47, 80, 106, 0.1)',
                  boxShadow: '0 5px 15px rgba(0,0,0,0.1)'
                }}>
                  <p style={{
                    margin: 0,
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: '#2f506a',
                    fontStyle: 'italic'
                  }}>
                    "Building community and teamwork through all sports"
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Get Involved CTA */}
      <section className="section" style={{ backgroundColor: '#2f506a', color: 'white' }}>
        <div className="container">
          <div className="section-head text-center" style={{ marginBottom: '2rem' }}>
            <h2 style={{ color: 'white', marginBottom: '0.5rem' }}>Get Involved</h2>
            <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '1.1rem' }}>Ready to make a difference in your community?</p>
          </div>
          
          <div className="row items-center">
            <div className="col-half">
              <h3 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
                Join Our Community
              </h3>
              <p style={{ fontSize: '1.2rem', lineHeight: '1.6', opacity: '0.9' }}>
                Whether you're a parent, athlete, coach, or community member, there's a place for you in our organization. Together, we can make a difference in the lives of children through the power of sports.
              </p>
            </div>
            <div className="col-half" style={{ textAlign: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '300px', margin: '0 auto' }}>
                <button
                  onClick={handleVolunteerClick}
                  className="btn"
                  style={{
                    backgroundColor: 'white',
                    color: '#2f506a',
                    padding: '1rem 2rem',
                    border: 'none',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontWeight: 'bold',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f8f8'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                >
                  {currentUser ? 'Apply to Volunteer' : 'Become a Volunteer'}
                </button>
                <a
                  href="https://venmo.com/ryanspiess22"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn"
                  style={{
                    backgroundColor: '#e53e3e',
                    color: 'white',
                    padding: '1rem 2rem',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontWeight: 'bold',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#c53030'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#e53e3e'}
                >
                  Make a Donation
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default About;