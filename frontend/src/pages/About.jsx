import React from 'react';
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
      <section className="hero">
        <div className="container">
          <h1>About Kids in Motion</h1>
          <p>Kids in Motion was founded by student-athletes to make sports accessible to all children. Through free clinics and donated equipment, we empower kids to play, grow, and build lifelong skills.</p>
        </div>
      </section>
      
      <section className="container mt-4">
        <div className="card mb-4">
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
              <div className="col-half">
                <img src="/img/about-purpose.jpg" alt="Kids playing sports" style={{ width: '100%', borderRadius: '8px' }} />
              </div>
            </div>
          </div>
        </div>
        
        <div className="card mb-4">
          <div className="card-header">
            <h2>What We Do</h2>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-third">
                <div className="text-center mb-3">
                  <i className="fas fa-running" style={{ fontSize: '3rem', color: 'var(--primary)' }}></i>
                  <h3>Free Sports Clinics</h3>
                </div>
                <p>
                  We host free sports clinics across a range of games, giving kids the chance to learn from experienced athletes and develop their skills in a fun, supportive setting.
                </p>
              </div>
              
              <div className="col-third">
                <div className="text-center mb-3">
                  <i className="fas fa-baseball-ball" style={{ fontSize: '3rem', color: 'var(--primary)' }}></i>
                  <h3>Equipment Donations</h3>
                </div>
                <p>
                  We collect and distribute gently used sports equipment to communities where kids may not have the resources to play.
                </p>
              </div>
              
              <div className="col-third">
                <div className="text-center mb-3">
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
        
        <div className="card mb-4">
          <div className="card-header">
            <h2>Meet Our Team</h2>
          </div>
          <div className="card-body">
            <div className="row">
              {teamMembers.map((member, index) => (
                <div className="col-half mb-4" key={index}>
                  <div className="card">
                    <div className="card-body" style={{ display: 'flex', alignItems: 'center' }}>
                      <div style={{ flexShrink: 0, marginRight: '15px' }}>
                        <img 
                          src={member.image} 
                          alt={member.name}
                          style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover' }}
                          onError={(e) => {
                            e.target.src = '/img/team/placeholder.jpg';
                          }}
                        />
                      </div>
                      <div>
                        <h3>{member.name}</h3>
                        <h4>{member.role}</h4>
                        <p>{member.bio}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="card mb-4">
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
              <div className="col-half">
                <h4>Logistics</h4>
                <p>
                  The logistics team coordinates nonprofit status, manages equipment drives, handles funds, and ensures smooth operations between all branches.
                </p>
                
                <h4>Member Outreach</h4>
                <p>
                  This team recruits members to join and participate in events, coordinates roles, and manages attendance within the organization.
                </p>
              </div>
              
              <div className="col-half">
                <h4>Community Outreach</h4>
                <p>
                  Community outreach handles communication with external organizations, including local little leagues, schools, and programs for kids with disabilities or limited resources.
                </p>
                
                <h4>Event Coordination</h4>
                <p>
                  This team secures locations for clinics, develops curriculum for players, coordinates equipment, and ensures everyone has a positive experience.
                </p>
              </div>
            </div>
            
            <h3 className="mt-4">Supporting Roles</h3>
            <p>
              We also have dedicated volunteers who manage our social media presence, document our events through photography and video, maintain our website, and handle administrative tasks to keep the organization running smoothly.
            </p>
          </div>
        </div>
        
        <div className="card">
          <div className="card-header">
            <h2>Get Involved</h2>
          </div>
          <div className="card-body text-center">
            <p className="mb-4">
              Want to help us make sports accessible to every kid? There are many ways to support our mission and make a difference.
            </p>
            
            <div className="row">
              <div className="col-third">
                <a href="/volunteer" className="btn btn-primary btn-block mb-3">Become a Volunteer</a>
              </div>
              <div className="col-third">
                <a href="/donate" className="btn btn-secondary btn-block mb-3">Make a Donation</a>
              </div>
              <div className="col-third">
                <a href="/contact" className="btn btn-outline btn-block mb-3">Contact Us</a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default About;