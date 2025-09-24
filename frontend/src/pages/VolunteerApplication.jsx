import React, { useState } from 'react';
import Layout from '../components/Layout';

const VolunteerApplication = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    grade: '',
    school: '',
    preferredContact: '',
    selectedCategories: [],
    motivation: '',
    dynamicAnswers: {}
  });

  const categories = [
    'Logistics',
    'Member Outreach',
    'Community Outreach',
    'Event Coordination',
    'Social Media Team',
    'Website Team',
    'Coach'
  ];

  // Dynamic questions for each category
  const dynamicQuestions = {
    'coach': 'Tell us about your baseball/coaching experience and what sports you\'ve played or coached.',
    'community-outreach': 'What organizations, sports leagues, or community groups do you know that could benefit from Kids in Motion?',
    'social-media-team': 'Describe your social media experience and any platforms you\'re familiar with.',
    'website-team': 'Tell us about your web development, design, or technical experience.',
    'event-coordination': 'Do you have experience organizing events, managing logistics, or coordinating groups?',
    'member-outreach': 'How would you help recruit and engage new members for Kids in Motion?',
    'logistics': 'Do you have experience with financial management, equipment handling, or organizational operations?'
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCategoryChange = (categoryValue) => {
    setFormData(prev => {
      const newSelectedCategories = prev.selectedCategories.includes(categoryValue)
        ? prev.selectedCategories.filter(cat => cat !== categoryValue)
        : [...prev.selectedCategories, categoryValue];

      return {
        ...prev,
        selectedCategories: newSelectedCategories
      };
    });
  };

  const handleDynamicAnswerChange = (category, value) => {
    setFormData(prev => ({
      ...prev,
      dynamicAnswers: {
        ...prev.dynamicAnswers,
        [category]: value
      }
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate at least one team is selected
    if (formData.selectedCategories.length === 0) {
      alert('Please select at least one team to join.');
      return;
    }

    // Validate all dynamic answers are provided
    for (const category of formData.selectedCategories) {
      if (!formData.dynamicAnswers[category] || formData.dynamicAnswers[category].trim() === '') {
        const teamName = categories.find(cat => cat.toLowerCase().replace(/\s+/g, '-') === category);
        alert(`Please answer the ${teamName} team question.`);
        return;
      }
    }

    console.log('Form submitted:', formData);
    // TODO: Add API call to submit form
    alert('Application submitted successfully! We\'ll review your application and get back to you soon.');
  };

  return (
    <Layout>
      {/* Hero Section */}
      <section style={{
        background: 'linear-gradient(135deg, #4a7ca3 0%, #2f506a 100%)',
        color: 'white',
        marginTop: '-5rem',
        paddingTop: '7rem',
        paddingBottom: '4rem'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem' }}>
          <div style={{ textAlign: 'center' }}>
            <h1 style={{
              fontSize: '3rem',
              fontWeight: '800',
              marginBottom: '1rem',
              color: 'white'
            }}>
              Become a Volunteer
            </h1>
            <p style={{
              fontSize: '1.2rem',
              opacity: '0.9',
              maxWidth: '600px',
              margin: '0 auto'
            }}>
              Join our team and help make sports accessible to every child in our community.
            </p>
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section style={{ backgroundColor: '#f8f8f8', padding: '4rem 0' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 2rem' }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '3rem',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              marginBottom: '2rem',
              color: '#2f506a',
              textAlign: 'center'
            }}>
              Volunteer Application
            </h2>

            <form onSubmit={handleSubmit}>
              {/* Name Fields Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                {/* First Name */}
                <div>
                  <label style={{
                    display: 'block',
                    fontWeight: 'bold',
                    marginBottom: '0.5rem',
                    color: '#2f506a'
                  }}>
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      outline: 'none'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#4a7ca3'}
                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                  />
                </div>

                {/* Last Name */}
                <div>
                  <label style={{
                    display: 'block',
                    fontWeight: 'bold',
                    marginBottom: '0.5rem',
                    color: '#2f506a'
                  }}>
                    Last Name *
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      outline: 'none'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#4a7ca3'}
                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                  />
                </div>
              </div>

              {/* Email */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  fontWeight: 'bold',
                  marginBottom: '0.5rem',
                  color: '#2f506a'
                }}>
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#4a7ca3'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>

              {/* Phone */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  fontWeight: 'bold',
                  marginBottom: '0.5rem',
                  color: '#2f506a'
                }}>
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#4a7ca3'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>

              {/* Grade and School Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', marginBottom: '1.5rem' }}>
                {/* Grade */}
                <div>
                  <label style={{
                    display: 'block',
                    fontWeight: 'bold',
                    marginBottom: '0.5rem',
                    color: '#2f506a'
                  }}>
                    Grade *
                  </label>
                  <select
                    name="grade"
                    value={formData.grade}
                    onChange={handleInputChange}
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      outline: 'none',
                      backgroundColor: 'white'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#4a7ca3'}
                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                  >
                    <option value="">Select grade...</option>
                    <option value="middleschool">Middle School</option>
                    <option value="9">9th Grade</option>
                    <option value="10">10th Grade</option>
                    <option value="11">11th Grade</option>
                    <option value="12">12th Grade</option>
                    <option value="college">College</option>
                    <option value="adult">Adult</option>
                  </select>
                </div>

                {/* School */}
                <div>
                  <label style={{
                    display: 'block',
                    fontWeight: 'bold',
                    marginBottom: '0.5rem',
                    color: '#2f506a'
                  }}>
                    School/Organization *
                  </label>
                  <input
                    type="text"
                    name="school"
                    value={formData.school}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., Great Valley High School, Penn State, etc."
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      outline: 'none'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#4a7ca3'}
                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                  />
                </div>
              </div>

              {/* Preferred Contact Method */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  fontWeight: 'bold',
                  marginBottom: '0.5rem',
                  color: '#2f506a'
                }}>
                  Preferred Contact Method for Alerts *
                </label>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  {['Email', 'Phone', 'Both'].map((option) => (
                    <label key={option} style={{
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                      fontSize: '1rem'
                    }}>
                      <input
                        type="radio"
                        name="preferredContact"
                        value={option.toLowerCase()}
                        checked={formData.preferredContact === option.toLowerCase()}
                        onChange={handleInputChange}
                        required
                        style={{
                          marginRight: '0.5rem',
                          transform: 'scale(1.2)'
                        }}
                      />
                      {option}
                    </label>
                  ))}
                </div>
              </div>

              {/* Team Selection - Multi-select */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  fontWeight: 'bold',
                  marginBottom: '1rem',
                  color: '#2f506a'
                }}>
                  Which teams would you like to join? (Select all that apply) *
                </label>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '0.75rem',
                  padding: '1rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  backgroundColor: '#f9fafb'
                }}>
                  {categories.map((category) => {
                    const categoryValue = category.toLowerCase().replace(/\s+/g, '-');
                    return (
                      <label key={category} style={{
                        display: 'flex',
                        alignItems: 'center',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        padding: '0.5rem',
                        borderRadius: '6px',
                        backgroundColor: formData.selectedCategories.includes(categoryValue) ? '#e1f5fe' : 'white',
                        border: `2px solid ${formData.selectedCategories.includes(categoryValue) ? '#4a7ca3' : '#e5e7eb'}`,
                        transition: 'all 0.2s ease'
                      }}>
                        <input
                          type="checkbox"
                          checked={formData.selectedCategories.includes(categoryValue)}
                          onChange={() => handleCategoryChange(categoryValue)}
                          style={{
                            marginRight: '0.75rem',
                            transform: 'scale(1.2)'
                          }}
                        />
                        <span style={{ fontWeight: formData.selectedCategories.includes(categoryValue) ? 'bold' : 'normal' }}>
                          {category}
                        </span>
                      </label>
                    );
                  })}
                </div>
                {formData.selectedCategories.length === 0 && (
                  <p style={{ color: '#e53e3e', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                    Please select at least one team.
                  </p>
                )}
              </div>

              {/* Motivation */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  fontWeight: 'bold',
                  marginBottom: '0.5rem',
                  color: '#2f506a'
                }}>
                  Why do you want to join Kids in Motion? *
                </label>
                <textarea
                  name="motivation"
                  value={formData.motivation}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  placeholder="Tell us what motivates you to volunteer with Kids in Motion..."
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#4a7ca3'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>

              {/* Dynamic Questions Based on Selected Teams */}
              {formData.selectedCategories.length > 0 && (
                <div style={{ marginBottom: '2rem' }}>
                  <h3 style={{
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    color: '#2f506a',
                    marginBottom: '1rem',
                    borderBottom: '2px solid #e5e7eb',
                    paddingBottom: '0.5rem'
                  }}>
                    Team-Specific Questions
                  </h3>
                  {formData.selectedCategories.map((category) => (
                    <div key={category} style={{ marginBottom: '1.5rem' }}>
                      <label style={{
                        display: 'block',
                        fontWeight: 'bold',
                        marginBottom: '0.5rem',
                        color: '#2f506a',
                        fontSize: '1.1rem'
                      }}>
                        {categories.find(cat => cat.toLowerCase().replace(/\s+/g, '-') === category)} Team: *
                      </label>
                      <p style={{
                        color: '#6b7280',
                        marginBottom: '0.5rem',
                        fontStyle: 'italic'
                      }}>
                        {dynamicQuestions[category]}
                      </p>
                      <textarea
                        value={formData.dynamicAnswers[category] || ''}
                        onChange={(e) => handleDynamicAnswerChange(category, e.target.value)}
                        required
                        rows={3}
                        placeholder="Please provide your answer here..."
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '2px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '1rem',
                          outline: 'none',
                          resize: 'vertical',
                          fontFamily: 'inherit'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#4a7ca3'}
                        onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                      />
                    </div>
                  ))}

                  {/* Portfolio Upload for Social Media and Website Teams */}
                  {(formData.selectedCategories.includes('social-media-team') || formData.selectedCategories.includes('website-team')) && (
                    <div style={{ marginBottom: '1.5rem' }}>
                      <label style={{
                        display: 'block',
                        fontWeight: 'bold',
                        marginBottom: '0.5rem',
                        color: '#2f506a'
                      }}>
                        Portfolio (Optional)
                      </label>
                      <p style={{
                        color: '#6b7280',
                        marginBottom: '0.5rem',
                        fontSize: '0.9rem'
                      }}>
                        Share a link to your portfolio, GitHub, social media work, or any relevant examples. You can also mention you'll email a ZIP file.
                      </p>
                      <input
                        type="url"
                        name="portfolioLink"
                        value={formData.portfolioLink || ''}
                        onChange={handleInputChange}
                        placeholder="https://yourportfolio.com or mention you'll email files"
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '2px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '1rem',
                          outline: 'none'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#4a7ca3'}
                        onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                style={{
                  backgroundColor: '#4a7ca3',
                  color: 'white',
                  padding: '1rem 2rem',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  width: '100%',
                  marginTop: '1rem',
                  transition: 'background-color 0.3s ease'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#2f506a'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#4a7ca3'}
              >
                Submit Application
              </button>
            </form>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default VolunteerApplication;