import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';

const About = () => {
  const teamMembers = [
    {
      name: 'Danny Gardner',
      role: 'Co-Founder & Director',
      bio: 'Danny is a student-athlete dedicated to making sports accessible for every child. With a passion for giving back, he leads the organization\'s clinics and outreach programs.',
      image: '/img/team/danny.jpg'
    },
    {
      name: 'Ryan Spiess',
      role: 'Co-Founder & Operations Lead',
      bio: 'Ryan manages the logistics behind our clinics and donation drives, ensuring every event runs smoothly and every piece of equipment finds a home.',
      image: '/img/team/ryan.jpg'
    },
    {
      name: 'Ty Callahan',
      role: 'Co-Founder & Community Coordinator',
      bio: 'Ty connects with local communities to expand our reach, helping bring Kids in Motion\'s mission to more kids across the state.',
      image: '/img/team/ty.jpg'
    },
    {
      name: 'Nate Wilner',
      role: 'Co-Founder & Marketing Lead',
      bio: 'Nate handles the creative side, promoting our events and spreading the word to ensure as many kids as possible can benefit from our programs.',
      image: '/img/team/nate.jpg'
    }
  ];

  return (
    <Layout>
      {/* Hero Section with Parallax */}
      <section className="hero" style={{ minHeight: '50vh', display: 'flex', alignItems: 'center' }}>
        <div className="hero-bg" style={{ backgroundImage: 'url("/img/about-bg.jpg")' }}></div>
        
        <div className="container hero-content">
          <h1>About Kids in Motion</h1>
          <p>Kids in Motion was founded by student-athletes to make sports accessible to all children. Through free clinics and donated equipment, we empower kids to play, grow, and build lifelong skills.</p>
        </div>
        
        <div className="hero-wave">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 100" preserveAspectRatio="none">
            <path
              fill="#ede9e7"
              fillOpacity="1"
              d="M0,64L60,58.7C120,53,240,43,360,48C480,53,600,75,720,75C840,75,960,53,1080,48C1200,43,1320,53,1380,58.7L1440,64L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"
            ></path>
          </svg>
        </div>
      </section>
      
      <section className="section">
        <div className="container">
          <div className="card mb-4 fade-in">
            <div className="card-header">
              <h2>Our Purpose</h2>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-half">
                  <p>
                    At Kids in Motion, we believe that every child deserves the opportunity to play sports, regardless of their background. Sports teach teamwork, discipline, and resilience—values that extend far beyond the game.
                  </p>
                  <p>
                    Our organization provides free sports clinics across a variety of games, including baseball, soccer, and more. We also collect and distribute gently used sports equipment, ensuring kids who may not have access to the gear they need can still participate.
                  </p>
                  <p>
                    By connecting passionate athletes with communities in need, we aim to create a supportive environment where every child can discover their potential. Our goal is to remove barriers, foster a love for sports, and make sure no kid is left on the sidelines.
                  </p>
                </div>
                <div className="col-half slide-in-right">
                  <img 
                    src="/img/about-purpose.jpg" 
                    alt="Kids playing sports" 
                    style={{ 
                      width: '100%', 
                      borderRadius: '8px',
                      boxShadow: '0 15px 30px rgba(0, 0, 0, 0.1)',
                      transition: 'transform 0.3s ease',
                    }}
                    className="hover-zoom"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="card mb-4 fade-in">
            <div className="card-header">
              <h2>What We Do</h2>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-third slide-in-left" style={{ animationDelay: '0.1s' }}>
                  <div className="text-center mb-3 service-icon">
                    <i className="fas fa-running" style={{ fontSize: '3rem', color: 'var(--primary)' }}></i>
                    <h3>Free Sports Clinics</h3>
                  </div>
                  <p>
                    We host free sports clinics across a range of games, giving kids the chance to learn from experienced athletes and develop their skills in a fun, supportive setting.
                  </p>
                </div>
                
                <div className="col-third slide-in-left" style={{ animationDelay: '0.3s' }}>
                  <div className="text-center mb-3 service-icon">
                    <i className="fas fa-baseball-ball" style={{ fontSize: '3rem', color: 'var(--primary)' }}></i>
                    <h3>Equipment Donations</h3>
                  </div>
                  <p>
                    We collect and distribute gently used sports equipment to communities where kids may not have the resources to play.
                  </p>
                </div>
                
                <div className="col-third slide-in-left" style={{ animationDelay: '0.5s' }}>
                  <div className="text-center mb-3 service-icon">
                    <i className="fas fa-users" style={{ fontSize: '3rem', color: 'var(--primary)' }}></i>
                    <h3>Mentorship</h3>
                  </div>
                  <p>
                    Beyond sports, we provide mentorship and a welcoming environment where kids can build confidence, make friends, and learn valuable life lessons.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="section-head fade-in">
            <h2>Meet Our Team</h2>
          </div>
          
          <div className="row">
            {teamMembers.map((member, index) => (
              <div 
                className="col-half mb-4 fade-in" 
                key={index} 
                style={{ animationDelay: `${0.2 * index}s` }}
              >
                <div className="card team-card">
                  <div className="card-body" style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ flexShrink: 0, marginRight: '15px', overflow: 'hidden', borderRadius: '50%' }}>
                      <img 
                        src={member.image} 
                        alt={member.name}
                        className="team-image"
                        style={{ 
                          width: '120px', 
                          height: '120px', 
                          borderRadius: '50%', 
                          objectFit: 'cover',
                          transition: 'transform 0.5s ease'
                        }}
                        onError={(e) => {
                          e.target.src = '/img/team/placeholder.jpg';
                        }}
                      />
                    </div>
                    <div>
                      <h3>{member.name}</h3>
                      <h4 style={{ color: 'var(--secondary)', marginBottom: '0.5rem' }}>{member.role}</h4>
                      <p>{member.bio}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="card mb-4 fade-in">
            <div className="card-header">
              <h2>Our Structure</h2>
            </div>
            <div className="card-body">
              <h3>Board of Directors</h3>
              <p>
                Kids in Motion is led by our board of directors, consisting of the four co-founders and advisors from the community. The board meets regularly to plan events, coordinate fundraisers, and ensure the organization stays true to its mission.
              </p>
              
              <h3 className="mt-4">Branches</h3>
              <div className="row mt-3">
                <div className="col-half slide-in-left">
                  <div className="branch-box">
                    <h4>Logistics</h4>
                    <p>
                      The logistics team coordinates nonprofit status, manages equipment drives, handles funds, and ensures smooth operations between all branches.
                    </p>
                  </div>
                  
                  <div className="branch-box mt-3">
                    <h4>Member Outreach</h4>
                    <p>
                      This team recruits members to join and participate in events, coordinates roles, and manages attendance within the organization.
                    </p>
                  </div>
                </div>
                
                <div className="col-half slide-in-right">
                  <div className="branch-box">
                    <h4>Community Outreach</h4>
                    <p>
                      Community outreach handles communication with external organizations, including local little leagues, schools, and programs for kids with disabilities or limited resources.
                    </p>
                  </div>
                  
                  <div className="branch-box mt-3">
                    <h4>Event Coordination</h4>
                    <p>
                      This team secures locations for clinics, develops curriculum for players, coordinates equipment, and ensures everyone has a positive experience.
                    </p>
                  </div>
                </div>
              </div>
              
              <h3 className="mt-4">Supporting Roles</h3>
              <p>
                We also have dedicated volunteers who manage our social media presence, document our events through photography and video, maintain our website, and handle administrative tasks to keep the organization running smoothly.
              </p>
            </div>
          </div>
          
          <div className="card fade-in">
            <div className="card-header">
              <h2>Get Involved</h2>
            </div>
            <div className="card-body text-center">
              <p className="mb-4">
                Want to help us make sports accessible to every kid? There are many ways to support our mission and make a difference.
              </p>
              
              <div className="row">
                <div className="col-third">
                  <Link to="/volunteer" className="btn btn-primary btn-block mb-3">Become a Volunteer</Link>
                </div>
                <div className="col-third">
                  <Link to="/donate" className="btn btn-secondary btn-block mb-3">Make a Donation</Link>
                </div>
                <div className="col-third">
                  <Link to="/contact" className="btn btn-outline btn-block mb-3">Contact Us</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Parallax testimonial section */}
      <section className="section parallax" style={{ 
        backgroundImage: 'url("/img/volunteer-bg.jpg")', 
        backgroundAttachment: 'fixed',
        padding: '6rem 0',
        position: 'relative',
        marginTop: '3rem'
      }}>
        <div className="overlay" style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          width: '100%', 
          height: '100%', 
          backgroundColor: 'rgba(47, 80, 106, 0.85)' 
        }}></div>
        
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div className="text-center" style={{ color: 'white', maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{ color: 'white' }}>Join Our Community</h2>
            <p style={{ fontSize: '1.25rem', marginBottom: '2rem' }}>
              Whether you're a parent, athlete, coach, or community member, there's a place for you in our organization. Together, we can make a difference in the lives of children through the power of sports.
            </p>
            <Link to="/volunteer" className="btn btn-secondary">Sign Up Today</Link>
          </div>
        </div>
      </section>
      
      {/* Custom CSS for this page */}
      <style jsx>{`
        .team-card:hover .team-image {
          transform: scale(1.1);
        }
        
        .hover-zoom:hover {
          transform: scale(1.03);
        }
        
        .service-icon i {
          transition: transform 0.3s ease;
        }
        
        .service-icon:hover i {
          transform: scale(1.2);
        }
        
        .branch-box {
          padding: 1.5rem;
          border-radius: 8px;
          background-color: #f8f8f8;
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .branch-box:hover {
          transform: translateY(-5px);
          box-shadow: 0 15px 30px rgba(0, 0, 0, 0.1);
        }
        
        .branch-box h4 {
          color: var(--secondary);
          margin-bottom: 1rem;
        }
        
        @media (max-width: 768px) {
          .team-card {
            flex-direction: column;
            text-align: center;
          }
          
          .team-card img {
            margin-right: 0;
            margin-bottom: 1rem;
          }
        }
      `}</style>
    </Layout>
  );
};

export default About;
