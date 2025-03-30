<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<%@ taglib prefix="fmt" uri="jakarta.tags.fmt" %>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Volunteer Opportunities - Kids in Motion</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.1.1/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&family=Open+Sans:wght@300;400;600&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/styles.css">
    <style>
        .volunteer-page {
            padding: var(--spacing-xl) 0;
        }

        .volunteer-hero {
            background: linear-gradient(rgba(47, 80, 106, 0.8), rgba(47, 80, 106, 0.8)), url('../images/volunteer-hero.jpg');
            background-size: cover;
            background-position: center;
            padding: var(--spacing-xl) 0;
            color: var(--white);
            text-align: center;
            margin-bottom: var(--spacing-xl);
        }

        .volunteer-hero-content {
            max-width: 800px;
            margin: 0 auto;
        }

        .volunteer-hero h1 {
            font-size: 3rem;
            margin-bottom: var(--spacing-md);
        }

        .volunteer-hero p {
            font-size: 1.25rem;
            margin-bottom: var(--spacing-lg);
        }

        .benefits-section {
            background-color: var(--isabelline);
            padding: var(--spacing-xl) 0;
            margin-bottom: var(--spacing-xl);
        }

        .benefits-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: var(--spacing-lg);
        }

        .benefit-card {
            background-color: var(--white);
            border-radius: var(--border-radius-md);
            padding: var(--spacing-lg);
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
            text-align: center;
            transition: transform var(--transition-speed) ease;
        }

        .benefit-card:hover {
            transform: translateY(-5px);
        }

        .benefit-icon {
            font-size: 2.5rem;
            color: var(--imperial-red);
            margin-bottom: var(--spacing-md);
        }

        .benefit-card h3 {
            margin-bottom: var(--spacing-sm);
            color: var(--indigo-dye);
        }

        .opportunities-section {
            margin-bottom: var(--spacing-xl);
        }

        .opportunities-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
            gap: var(--spacing-lg);
        }

        .opportunity-card {
            background-color: var(--white);
            border-radius: var(--border-radius-md);
            overflow: hidden;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
            display: flex;
            flex-direction: column;
        }

        .opportunity-header {
            background-color: var(--indigo-dye);
            color: var(--white);
            padding: var(--spacing-md);
            position: relative;
        }

        .opportunity-status {
            position: absolute;
            top: 0;
            right: var(--spacing-md);
            transform: translateY(-50%);
            background-color: var(--imperial-red);
            color: var(--white);
            padding: 0.25rem 0.75rem;
            border-radius: 30px;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
        }

        .opportunity-content {
            padding: var(--spacing-lg);
            flex-grow: 1;
            display: flex;
            flex-direction: column;
        }

        .opportunity-details {
            margin-bottom: var(--spacing-md);
        }

        .opportunity-detail-item {
            display: flex;
            margin-bottom: var(--spacing-xs);
        }

        .opportunity-detail-icon {
            color: var(--imperial-red);
            width: 24px;
            margin-right: var(--spacing-sm);
            text-align: center;
        }

        .opportunity-content p {
            margin-bottom: var(--spacing-md);
            flex-grow: 1;
        }

        .opportunity-footer {
            margin-top: auto;
        }

        .volunteer-steps {
            background-color: var(--isabelline);
            padding: var(--spacing-xl) 0;
            margin-bottom: var(--spacing-xl);
        }

        .steps-container {
            max-width: 800px;
            margin: 0 auto;
        }

        .step-item {
            display: flex;
            margin-bottom: var(--spacing-lg);
            align-items: flex-start;
        }

        .step-number {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background-color: var(--imperial-red);
            color: var(--white);
            font-size: 1.5rem;
            font-weight: 700;
            margin-right: var(--spacing-md);
            flex-shrink: 0;
        }

        .step-content {
            flex-grow: 1;
        }

        .step-content h3 {
            margin-bottom: var(--spacing-xs);
            color: var(--indigo-dye);
        }

        .testimonials-section {
            margin-bottom: var(--spacing-xl);
        }

        .volunteer-cta {
            background-color: var(--indigo-dye);
            color: var(--white);
            padding: var(--spacing-xl) 0;
            text-align: center;
            margin-bottom: var(--spacing-xl);
        }

        .volunteer-cta h2 {
            margin-bottom: var(--spacing-md);
        }

        .volunteer-cta p {
            max-width: 700px;
            margin: 0 auto var(--spacing-lg);
        }

        .contact-section {
            margin-bottom: var(--spacing-xl);
        }

        .contact-card {
            background-color: var(--white);
            border-radius: var(--border-radius-md);
            padding: var(--spacing-lg);
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
            text-align: center;
            max-width: 600px;
            margin: 0 auto;
        }

        .contact-card h3 {
            margin-bottom: var(--spacing-md);
            color: var(--indigo-dye);
        }

        .contact-methods {
            display: flex;
            justify-content: center;
            gap: var(--spacing-lg);
            margin-top: var(--spacing-md);
        }

        .contact-method {
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        .contact-icon {
            font-size: 2rem;
            color: var(--imperial-red);
            margin-bottom: var(--spacing-xs);
        }

        .no-opportunities {
            grid-column: 1 / -1;
            background-color: var(--white);
            padding: var(--spacing-lg);
            border-radius: var(--border-radius-md);
            text-align: center;
        }

        @media (max-width: 768px) {
            .volunteer-hero h1 {
                font-size: 2.25rem;
            }

            .volunteer-hero p {
                font-size: 1rem;
            }

            .opportunities-grid {
                grid-template-columns: 1fr;
            }

            .contact-methods {
                flex-direction: column;
                gap: var(--spacing-md);
            }
        }
    </style>
</head>
<body>
    <!-- Header -->
    <jsp:include page="/WEB-INF/partials/header.jsp" />

    <div class="volunteer-page">
        <!-- Hero Section -->
        <section class="volunteer-hero">
            <div class="container">
                <div class="volunteer-hero-content">
                    <h1>Make a Difference</h1>
                    <p>Share your skills and passion for sports with the next generation of athletes. Volunteer with Kids in Motion and help build a stronger community.</p>
                    <a href="${pageContext.request.contextPath}/auth/register?role=VOLUNTEER" class="btn btn-primary">Become a Volunteer</a>
                </div>
            </div>
        </section>

        <!-- Benefits Section -->
        <section class="benefits-section">
            <div class="container">
                <h2 class="section-title">Why Volunteer With Us</h2>

                <div class="benefits-grid">
                    <div class="benefit-card">
                        <div class="benefit-icon">
                            <i class="fas fa-medal"></i>
                        </div>
                        <h3>Develop Leadership Skills</h3>
                        <p>Gain valuable experience coaching and mentoring younger athletes while developing your own leadership abilities.</p>
                    </div>

                    <div class="benefit-card">
                        <div class="benefit-icon">
                            <i class="fas fa-handshake"></i>
                        </div>
                        <h3>Community Service</h3>
                        <p>Give back to your community and make a positive impact on the lives of children through sports mentorship.</p>
                    </div>

                    <div class="benefit-card">
                        <div class="benefit-icon">
                            <i class="fas fa-certificate"></i>
                        </div>
                        <h3>Build Your Resume</h3>
                        <p>Gain volunteer experience that looks great on college applications, job resumes, and scholarship applications.</p>
                    </div>

                    <div class="benefit-card">
                        <div class="benefit-icon">
                            <i class="fas fa-users"></i>
                        </div>
                        <h3>Meet New People</h3>
                        <p>Connect with other volunteers who share your passion for sports and community service.</p>
                    </div>

                    <div class="benefit-card">
                        <div class="benefit-icon">
                            <i class="fas fa-basketball-ball"></i>
                        </div>
                        <h3>Improve Your Skills</h3>
                        <p>Teaching others is one of the best ways to improve your own understanding and abilities in your sport.</p>
                    </div>

                    <div class="benefit-card">
                        <div class="benefit-icon">
                            <i class="fas fa-heart"></i>
                        </div>
                        <h3>Have Fun</h3>
                        <p>Enjoy the rewarding experience of helping kids discover and develop their love for sports.</p>
                    </div>
                </div>
            </div>
        </section>

        <!-- Opportunities Section -->
        <section class="opportunities-section">
            <div class="container">
                <h2 class="section-title">Current Volunteer Opportunities</h2>

                <div class="opportunities-grid">
                    <c:choose>
                        <c:when test="${not empty opportunities}">
                            <c:forEach var="event" items="${opportunities}">
                                <div class="opportunity-card">
                                    <div class="opportunity-header">
                                        <span class="opportunity-status">${event.sportType}</span>
                                        <h3>${event.title}</h3>
                                        <p>${event.eventType}</p>
                                    </div>

                                    <div class="opportunity-content">
                                        <div class="opportunity-details">
                                            <div class="opportunity-detail-item">
                                                <div class="opportunity-detail-icon">
                                                    <i class="fas fa-calendar-alt"></i>
                                                </div>
                                                <div>
                                                    <fmt:formatDate value="${event.startDate}" pattern="EEEE, MMMM d, yyyy" />
                                                </div>
                                            </div>

                                            <div class="opportunity-detail-item">
                                                <div class="opportunity-detail-icon">
                                                    <i class="fas fa-clock"></i>
                                                </div>
                                                <div>
                                                    <fmt:formatDate value="${event.startDate}" pattern="h:mm a" /> -
                                                    <fmt:formatDate value="${event.endDate}" pattern="h:mm a" />
                                                </div>
                                            </div>

                                            <div class="opportunity-detail-item">
                                                <div class="opportunity-detail-icon">
                                                    <i class="fas fa-map-marker-alt"></i>
                                                </div>
                                                <div>
                                                    ${event.location}
                                                </div>
                                            </div>

                                            <div class="opportunity-detail-item">
                                                <div class="opportunity-detail-icon">
                                                    <i class="fas fa-user-friends"></i>
                                                </div>
                                                <div>
                                                    <c:set var="volunteersNeeded" value="${event.volunteerCountNeeded - volunteerCounts[event.id]}" />
                                                    ${volunteersNeeded} volunteer(s) needed
                                                </div>
                                            </div>
                                        </div>

                                        <p>${fn:substring(event.description, 0, 150)}${fn:length(event.description) > 150 ? '...' : ''}</p>

                                        <div class="opportunity-footer">
                                            <c:choose>
                                                <c:when test="${empty sessionScope.user}">
                                                    <a href="${pageContext.request.contextPath}/auth/login?redirect=/events/${event.id}" class="btn btn-primary">Log in to Volunteer</a>
                                                </c:when>
                                                <c:when test="${sessionScope.user.role == 'VOLUNTEER' && !isVolunteer[event.id]}">
                                                    <a href="${pageContext.request.contextPath}/volunteers/signup?eventId=${event.id}" class="btn btn-primary">Sign Up</a>
                                                </c:when>
                                                <c:when test="${sessionScope.user.role == 'VOLUNTEER' && isVolunteer[event.id]}">
                                                    <button class="btn btn-secondary" disabled>Already Signed Up</button>
                                                </c:when>
                                                <c:otherwise>
                                                    <a href="${pageContext.request.contextPath}/auth/register?role=VOLUNTEER&redirect=/events/${event.id}" class="btn btn-primary">Register to Volunteer</a>
                                                </c:otherwise>
                                            </c:choose>
                                            <a href="${pageContext.request.contextPath}/events/${event.id}" class="btn btn-outline mt-1">View Event Details</a>
                                        </div>
                                    </div>
                                </div>
                            </c:forEach>
                        </c:when>
                        <c:otherwise>
                            <div class="no-opportunities">
                                <h3>No volunteer opportunities available at this time</h3>
                                <p>Please check back soon for new opportunities or <a href="${pageContext.request.contextPath}/contact">contact us</a> for more information.</p>
                            </div>
                        </c:otherwise>
                    </c:choose>
                </div>
            </div>
        </section>

        <!-- How It Works Section -->
        <section class="volunteer-steps">
            <div class="container">
                <h2 class="section-title">How It Works</h2>

                <div class="steps-container">
                    <div class="step-item">
                        <div class="step-number">1</div>
                        <div class="step-content">
                            <h3>Sign Up</h3>
                            <p>Create an account as a volunteer and complete your profile with your sports experience, skills, and availability.</p>
                        </div>
                    </div>

                    <div class="step-item">
                        <div class="step-number">2</div>
                        <div class="step-content">
                            <h3>Browse Opportunities</h3>
                            <p>Explore upcoming events and clinics that need volunteers. Filter by sport, date, or location to find the perfect fit.</p>
                        </div>
                    </div>

                    <div class="step-item">
                        <div class="step-number">3</div>
                        <div class="step-content">
                            <h3>Apply to Volunteer</h3>
                            <p>Submit your application for specific events that interest you. Our coordinators will review your application.</p>
                        </div>
                    </div>

                    <div class="step-item">
                        <div class="step-number">4</div>
                        <div class="step-content">
                            <h3>Get Confirmed</h3>
                            <p>Once approved, you'll receive a confirmation email with all the details about the event and your role.</p>
                        </div>
                    </div>

                    <div class="step-item">
                        <div class="step-number">5</div>
                        <div class="step-content">
                            <h3>Make a Difference</h3>
                            <p>Show up on the day of the event ready to inspire and mentor young athletes in your community!</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Testimonials Section -->
        <section class="testimonials-section">
            <div class="container">
                <h2 class="section-title">Volunteer Experiences</h2>

                <div class="testimonials-grid">
                    <div class="testimonial-card">
                        <div class="testimonial-content">
                            <p>"Volunteering with Kids in Motion has been such a rewarding experience. Seeing the kids improve their skills and confidence week after week is incredible. I've also developed my own leadership abilities and made great connections."</p>
                        </div>
                        <div class="testimonial-author">
                            <p><strong>Ethan M.</strong> - Baseball Volunteer, Age 17</p>
                        </div>
                    </div>

                    <div class="testimonial-card">
                        <div class="testimonial-content">
                            <p>"As someone who loves basketball, getting to share my passion with younger kids has been amazing. The program is well-organized, and the kids are so enthusiastic. It's a great way to give back to the community while doing something I love."</p>
                        </div>
                        <div class="testimonial-author">
                            <p><strong>Sophia L.</strong> - Basketball Volunteer, Age 16</p>
                        </div>
                    </div>

                    <div class="testimonial-card">
                        <div class="testimonial-content">
                            <p>"I was nervous at first about being a mentor, but the Kids in Motion staff provided great training and support. Now I look forward to every session, and I can see the positive impact we're having on these young athletes."</p>
                        </div>
                        <div class="testimonial-author">
                            <p><strong>Miguel R.</strong> - Soccer Volunteer, Age 18</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- CTA Section -->
        <section class="volunteer-cta">
            <div class="container">
                <h2>Ready to Make a Difference?</h2>
                <p>Join our team of volunteers today and help inspire the next generation of athletes in your community.</p>
                <a href="${pageContext.request.contextPath}/auth/register?role=VOLUNTEER" class="btn btn-primary">Sign Up Now</a>
            </div>
        </section>

        <!-- Contact Section -->
        <section class="contact-section">
            <div class="container">
                <h2 class="section-title">Have Questions?</h2>

                <div class="contact-card">
                    <h3>Contact our Volunteer Coordinator</h3>
                    <p>We're here to answer any questions you might have about volunteering with Kids in Motion.</p>

                    <div class="contact-methods">
                        <div class="contact-method">
                            <div class="contact-icon">
                                <i class="fas fa-envelope"></i>
                            </div>
                            <p><a href="mailto:volunteers@kidsinmotion.org">volunteers@kidsinmotion.org</a></p>
                        </div>

                        <div class="contact-method">
                            <div class="contact-icon">
                                <i class="fas fa-phone"></i>
                            </div>
                            <p><a href="tel:5551234567">(555) 123-4567</a></p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    </div>

    <!-- Footer -->
    <jsp:include page="/WEB-INF/partials/footer.jsp" />

    <!-- JavaScript -->
    <script src="${pageContext.request.contextPath}/js/main.js"></script>
</body>
</html>