<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>About Kids in Motion - Sports Mentorship</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.1.1/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&family=Open+Sans:wght@300;400;600&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/styles.css">
    <style>
        .about-page {
            padding: var(--spacing-xl) 0;
        }

        .about-hero {
            background: linear-gradient(rgba(47, 80, 106, 0.8), rgba(47, 80, 106, 0.8)), url('../images/about-hero.jpg');
            background-size: cover;
            background-position: center;
            padding: var(--spacing-xl) 0;
            color: var(--white);
            text-align: center;
            margin-bottom: var(--spacing-xl);
        }

        .about-hero-content {
            max-width: 800px;
            margin: 0 auto;
        }

        .about-hero h1 {
            font-size: 3rem;
            margin-bottom: var(--spacing-md);
        }

        .about-hero p {
            font-size: 1.25rem;
            margin-bottom: var(--spacing-lg);
        }

        .mission-section {
            margin-bottom: var(--spacing-xl);
        }

        .mission-content {
            display: flex;
            align-items: center;
            gap: var(--spacing-lg);
        }

        .mission-text {
            flex: 1;
        }

        .mission-image {
            flex: 1;
        }

        .mission-image img {
            border-radius: var(--border-radius-md);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
            width: 100%;
        }

        .about-section {
            margin-bottom: var(--spacing-xl);
        }

        .vision-section {
            background-color: var(--isabelline);
            padding: var(--spacing-xl) 0;
            margin-bottom: var(--spacing-xl);
        }

        .values-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: var(--spacing-lg);
            margin-top: var(--spacing-lg);
        }

        .value-card {
            background-color: var(--white);
            border-radius: var(--border-radius-md);
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
            padding: var(--spacing-lg);
            text-align: center;
        }

        .value-icon {
            color: var(--imperial-red);
            font-size: 2.5rem;
            margin-bottom: var(--spacing-md);
        }

        .value-card h3 {
            margin-bottom: var(--spacing-sm);
            color: var(--indigo-dye);
        }

        .team-section {
            margin-bottom: var(--spacing-xl);
        }

        .team-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: var(--spacing-lg);
        }

        .team-member {
            background-color: var(--white);
            border-radius: var(--border-radius-md);
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
            overflow: hidden;
            text-align: center;
        }

        .team-member-photo {
            height: 250px;
            background-size: cover;
            background-position: center;
        }

        .team-member-info {
            padding: var(--spacing-md);
        }

        .team-member-name {
            font-weight: 700;
            margin-bottom: var(--spacing-xs);
            font-size: 1.25rem;
        }

        .team-member-role {
            color: var(--imperial-red);
            font-size: 0.875rem;
            font-weight: 600;
            margin-bottom: var(--spacing-sm);
        }

        .team-member-bio {
            font-size: 0.875rem;
            margin-bottom: var(--spacing-md);
        }

        .history-section {
            background-color: var(--isabelline);
            padding: var(--spacing-xl) 0;
            margin-bottom: var(--spacing-xl);
        }

        .timeline {
            position: relative;
            max-width: 800px;
            margin: 0 auto;
            padding: var(--spacing-lg) 0;
        }

        .timeline::after {
            content: '';
            position: absolute;
            width: 4px;
            background-color: var(--indigo-dye);
            top: 0;
            bottom: 0;
            left: 50%;
            margin-left: -2px;
        }

        .timeline-item {
            position: relative;
            width: 50%;
            padding: 0 var(--spacing-lg);
            margin-bottom: var(--spacing-lg);
        }

        .timeline-item::after {
            content: '';
            position: absolute;
            width: 20px;
            height: 20px;
            background-color: var(--white);
            border: 4px solid var(--imperial-red);
            border-radius: 50%;
            top: 0;
            z-index: 1;
        }

        .timeline-left {
            left: 0;
        }

        .timeline-right {
            left: 50%;
        }

        .timeline-left::after {
            right: -10px;
        }

        .timeline-right::after {
            left: -10px;
        }

        .timeline-content {
            background-color: var(--white);
            border-radius: var(--border-radius-md);
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
            padding: var(--spacing-md);
        }

        .timeline-year {
            color: var(--imperial-red);
            font-weight: 700;
            margin-bottom: var(--spacing-xs);
        }

        .cta-section {
            text-align: center;
            margin-bottom: var(--spacing-xl);
        }

        .cta-buttons {
            display: flex;
            justify-content: center;
            gap: var(--spacing-md);
            margin-top: var(--spacing-lg);
        }

        @media (max-width: 768px) {
            .about-hero h1 {
                font-size: 2.25rem;
            }

            .about-hero p {
                font-size: 1rem;
            }

            .mission-content {
                flex-direction: column;
            }

            .timeline::after {
                left: 31px;
            }

            .timeline-item {
                width: 100%;
                padding-left: 70px;
                padding-right: 0;
            }

            .timeline-right {
                left: 0;
            }

            .timeline-left::after,
            .timeline-right::after {
                left: 21px;
            }

            .cta-buttons {
                flex-direction: column;
            }
        }
    </style>
</head>
<body>
    <!-- Header -->
    <jsp:include page="/WEB-INF/partials/header.jsp" />

    <div class="about-page">
        <!-- About Hero -->
        <section class="about-hero">
            <div class="container">
                <div class="about-hero-content">
                    <h1>About Kids in Motion</h1>
                    <p>Our story, mission, and the passionate people behind our community sports mentorship program.</p>
                </div>
            </div>
        </section>

        <!-- Mission Section -->
        <section class="mission-section">
            <div class="container">
                <h2 class="section-title">Our Mission</h2>

                <div class="mission-content">
                    <div class="mission-text">
                        <p>We believe in a community where knowledge is passed and spread through generations. Our goal is for younger kids to receive sports related mentoring from older kids.</p>

                        <p>Our hope behind this is to help support players' athletic goals, foster a good mindset, and help lead productive lives outside of the sport.</p>

                        <p>At Kids in Motion, we're dedicated to creating an inclusive environment where every child can develop their athletic skills, build confidence, and form lasting friendships - all while being guided by peer mentors who understand the journey.</p>
                    </div>

                    <div class="mission-image">
                        <img src="${pageContext.request.contextPath}/images/mission.jpg" alt="Kids playing sports with mentors">
                    </div>
                </div>
            </div>
        </section>

        <!-- Vision Section -->
        <section class="vision-section">
            <div class="container">
                <h2 class="section-title">Our Core Values</h2>

                <div class="values-grid">
                    <div class="value-card">
                        <div class="value-icon">
                            <i class="fas fa-handshake"></i>
                        </div>
                        <h3>Mentorship</h3>
                        <p>We believe in the power of peer-to-peer learning, where knowledge and experience are shared across generations.</p>
                    </div>

                    <div class="value-card">
                        <div class="value-icon">
                            <i class="fas fa-users"></i>
                        </div>
                        <h3>Community</h3>
                        <p>Building strong communities through sports participation and creating a sense of belonging for all.</p>
                    </div>

                    <div class="value-card">
                        <div class="value-icon">
                            <i class="fas fa-medal"></i>
                        </div>
                        <h3>Growth</h3>
                        <p>Fostering personal development both on and off the field, focusing on skills, character, and mindset.</p>
                    </div>

                    <div class="value-card">
                        <div class="value-icon">
                            <i class="fas fa-hands-helping"></i>
                        </div>
                        <h3>Inclusion</h3>
                        <p>Creating opportunities for all children regardless of ability, background, or resources.</p>
                    </div>

                    <div class="value-card">
                        <div class="value-icon">
                            <i class="fas fa-heart"></i>
                        </div>
                        <h3>Passion</h3>
                        <p>Sharing the joy and love of sports with the next generation of athletes and community leaders.</p>
                    </div>

                    <div class="value-card">
                        <div class="value-icon">
                            <i class="fas fa-balance-scale"></i>
                        </div>
                        <h3>Responsibility</h3>
                        <p>Teaching accountability, commitment, and the importance of being a positive role model.</p>
                    </div>
                </div>
            </div>
        </section>

        <!-- Our Team Section -->
        <section class="team-section">
            <div class="container">
                <h2 class="section-title">Meet Our Team</h2>

                <div class="team-grid">
                    <div class="team-member">
                        <div class="team-member-photo" style="background-image: url('${pageContext.request.contextPath}/images/team/danny.jpg');"></div>
                        <div class="team-member-info">
                            <h3 class="team-member-name">Danny Gardner</h3>
                            <p class="team-member-role">Logistics Coordinator</p>
                            <p class="team-member-bio">Responsible for coordinating nonprofit status, managing fundraisers and equipment drives, and ensuring all branches work well together.</p>
                        </div>
                    </div>

                    <div class="team-member">
                        <div class="team-member-photo" style="background-image: url('${pageContext.request.contextPath}/images/team/nate.jpg');"></div>
                        <div class="team-member-info">
                            <h3 class="team-member-name">Nate</h3>
                            <p class="team-member-role">Member Outreach Coordinator</p>
                            <p class="team-member-bio">Leads our member recruitment efforts, coordinates roles and attendance for events, and helps build our volunteer community.</p>
                        </div>
                    </div>

                    <div class="team-member">
                        <div class="team-member-photo" style="background-image: url('${pageContext.request.contextPath}/images/team/ryan.jpg');"></div>
                        <div class="team-member-info">
                            <h3 class="team-member-name">Ryan</h3>
                            <p class="team-member-role">Community Outreach Coordinator</p>
                            <p class="team-member-bio">Manages communications with external organizations including local little leagues and programs for kids with special needs.</p>
                        </div>
                    </div>

                    <div class="team-member">
                        <div class="team-member-photo" style="background-image: url('${pageContext.request.contextPath}/images/team/ty.jpg');"></div>
                        <div class="team-member-info">
                            <h3 class="team-member-name">Ty Callahan</h3>
                            <p class="team-member-role">Event Coordinator</p>
                            <p class="team-member-bio">Coordinates and runs events, secures locations, develops program curriculum, and ensures everyone has a great experience.</p>
                        </div>
                    </div>

                    <div class="team-member">
                        <div class="team-member-photo" style="background-image: url('${pageContext.request.contextPath}/images/team/mr-turgeon.jpg');"></div>
                        <div class="team-member-info">
                            <h3 class="team-member-name">Mr. Turgeon</h3>
                            <p class="team-member-role">Advisor</p>
                            <p class="team-member-bio">Provides guidance and oversight to the organization, and serves as a tiebreaker for major organizational decisions.</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Our History Section -->
        <section class="history-section">
            <div class="container">
                <h2 class="section-title">Our Journey</h2>

                <div class="timeline">
                    <div class="timeline-item timeline-left">
                        <div class="timeline-content">
                            <div class="timeline-year">2020</div>
                            <h3>The Idea</h3>
                            <p>The concept for Kids in Motion was born when a group of high school athletes recognized the need for more accessible sports mentorship in their community.</p>
                        </div>
                    </div>

                    <div class="timeline-item timeline-right">
                        <div class="timeline-content">
                            <div class="timeline-year">2021</div>
                            <h3>First Clinic</h3>
                            <p>We held our first baseball clinic in partnership with the local little league, with 15 high school volunteers and over 40 young athletes participating.</p>
                        </div>
                    </div>

                    <div class="timeline-item timeline-left">
                        <div class="timeline-content">
                            <div class="timeline-year">2022</div>
                            <h3>Program Expansion</h3>
                            <p>Expanded our programs to include basketball and soccer, and began holding specialized clinics for children with special needs.</p>
                        </div>
                    </div>

                    <div class="timeline-item timeline-right">
                        <div class="timeline-content">
                            <div class="timeline-year">2023</div>
                            <h3>Nonprofit Status</h3>
                            <p>Officially became a registered nonprofit organization, allowing us to accept tax-deductible donations and apply for grants to further our mission.</p>
                        </div>
                    </div>

                    <div class="timeline-item timeline-left">
                        <div class="timeline-content">
                            <div class="timeline-year">2024</div>
                            <h3>Digital Platform Launch</h3>
                            <p>Launched our online platform to better connect mentors with young athletes and make our programs more accessible to the wider community.</p>
                        </div>
                    </div>

                    <div class="timeline-item timeline-right">
                        <div class="timeline-content">
                            <div class="timeline-year">2025</div>
                            <h3>Looking Forward</h3>
                            <p>With over 500 children served and 200 active volunteers, we're expanding to new communities while deepening our impact in existing ones.</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- CTA Section -->
        <section class="cta-section">
            <div class="container">
                <h2>Join Our Community</h2>
                <p>Whether you're a young athlete looking to learn, a teen interested in mentoring others, or a parent wanting to support your child's development, there's a place for you at Kids in Motion.</p>

                <div class="cta-buttons">
                    <a href="${pageContext.request.contextPath}/events/upcoming" class="btn btn-primary">Find Events</a>
                    <a href="${pageContext.request.contextPath}/volunteers/opportunities" class="btn btn-secondary">Volunteer</a>
                    <a href="${pageContext.request.contextPath}/contact" class="btn btn-outline">Contact Us</a>
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