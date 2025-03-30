<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kids in Motion - Sports Mentorship</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.1.1/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&family=Open+Sans:wght@300;400;600&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/styles.css">
</head>
<body>
    <!-- Header -->
    <jsp:include page="/WEB-INF/partials/header.jsp" />

    <!-- Hero Banner -->
    <section class="hero">
        <div class="container">
            <div class="hero-content">
                <h1>Empowering Youth Through Sports</h1>
                <p>We believe in a community where knowledge is passed through generations. Our goal is for younger kids to receive sports-related mentoring from older kids.</p>
                <div class="hero-buttons">
                    <a href="${pageContext.request.contextPath}/events/upcoming" class="btn btn-primary">Find Events</a>
                    <a href="${pageContext.request.contextPath}/volunteers/opportunities" class="btn btn-secondary">Volunteer</a>
                </div>
            </div>
        </div>
    </section>

    <!-- Featured Programs -->
    <section class="featured-programs">
        <div class="container">
            <h2 class="section-title">Our Programs</h2>
            <div class="programs-grid">
                <div class="program-card">
                    <div class="program-icon">
                        <i class="fas fa-baseball-ball"></i>
                    </div>
                    <h3>Baseball</h3>
                    <p>Free clinics and mentorship opportunities with local little leagues and youth baseball organizations.</p>
                </div>
                <div class="program-card">
                    <div class="program-icon">
                        <i class="fas fa-basketball-ball"></i>
                    </div>
                    <h3>Basketball</h3>
                    <p>Skills training and mentoring sessions with experienced young athletes to help develop fundamentals.</p>
                </div>
                <div class="program-card">
                    <div class="program-icon">
                        <i class="fas fa-futbol"></i>
                    </div>
                    <h3>Soccer</h3>
                    <p>Community-based soccer programs focusing on teamwork, skills development, and positive mindset.</p>
                </div>
            </div>
        </div>
    </section>

    <!-- Upcoming Events -->
    <section class="upcoming-events">
        <div class="container">
            <h2 class="section-title">Upcoming Events</h2>
            <div class="events-grid">
                <c:forEach var="event" items="${upcomingEvents}" varStatus="status">
                    <c:if test="${status.index < 3}">
                        <div class="event-card">
                            <div class="event-date">
                                <span class="month">${event.formattedMonth}</span>
                                <span class="day">${event.formattedDay}</span>
                            </div>
                            <div class="event-details">
                                <h3>${event.title}</h3>
                                <p class="event-type">${event.eventType} • ${event.sportType}</p>
                                <p class="event-location"><i class="fas fa-map-marker-alt"></i> ${event.location}</p>
                                <a href="${pageContext.request.contextPath}/events/${event.id}" class="btn btn-sm">View Details</a>
                            </div>
                        </div>
                    </c:if>
                </c:forEach>

                <c:if test="${empty upcomingEvents}">
                    <div class="no-events">
                        <p>No upcoming events at this time. Check back soon!</p>
                    </div>
                </c:if>
            </div>

            <c:if test="${not empty upcomingEvents}">
                <div class="view-all-container">
                    <a href="${pageContext.request.contextPath}/events/upcoming" class="btn btn-outline">View All Events</a>
                </div>
            </c:if>
        </div>
    </section>

    <!-- Mission Statement -->
    <section class="mission-statement">
        <div class="container">
            <h2 class="section-title">Our Mission</h2>
            <div class="mission-content">
                <div class="mission-text">
                    <p>We believe in a community where knowledge is passed and spread through generations. Our goal is for younger kids to receive sports related mentoring from older kids.</p>
                    <p>Our hope behind this is to help support players' athletic goals, foster a good mindset, and help lead productive lives outside of the sport.</p>
                    <a href="${pageContext.request.contextPath}/about" class="btn btn-secondary">Learn More</a>
                </div>
                <div class="mission-image">
                    <img src="${pageContext.request.contextPath}/images/mentoring.jpg" alt="Kids mentoring in sports">
                </div>
            </div>
        </div>
    </section>

    <!-- Volunteer CTA -->
    <section class="volunteer-cta">
        <div class="container">
            <h2>Make a Difference in Your Community</h2>
            <p>Join our team of volunteers and help the next generation of athletes develop their skills and confidence.</p>
            <a href="${pageContext.request.contextPath}/volunteers/signup" class="btn btn-primary">Become a Volunteer</a>
        </div>
    </section>

    <!-- Testimonials -->
    <section class="testimonials">
        <div class="container">
            <h2 class="section-title">What People Are Saying</h2>
            <div class="testimonials-grid">
                <div class="testimonial-card">
                    <div class="testimonial-content">
                        <p>"My son has grown so much both as a player and a person since joining Kids in Motion. The mentorship from the older players has been invaluable."</p>
                    </div>
                    <div class="testimonial-author">
                        <p><strong>Sarah J.</strong> - Parent</p>
                    </div>
                </div>
                <div class="testimonial-card">
                    <div class="testimonial-content">
                        <p>"Volunteering with Kids in Motion has been one of the most rewarding experiences. Seeing the younger kids improve week after week is incredible."</p>
                    </div>
                    <div class="testimonial-author">
                        <p><strong>Ethan M.</strong> - Volunteer</p>
                    </div>
                </div>
                <div class="testimonial-card">
                    <div class="testimonial-content">
                        <p>"The program has built my confidence both on and off the field. I've made new friends and learned skills I never thought I could master."</p>
                    </div>
                    <div class="testimonial-author">
                        <p><strong>Lily R.</strong> - Participant, Age 11</p>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Newsletter Signup -->
    <section class="newsletter">
        <div class="container">
            <h2>Stay Updated</h2>
            <p>Sign up for our newsletter to receive updates about upcoming events and programs.</p>
            <form action="${pageContext.request.contextPath}/newsletter/subscribe" method="post" class="newsletter-form">
                <div class="form-group">
                    <input type="email" name="email" placeholder="Your Email Address" required>
                    <button type="submit" class="btn btn-primary">Subscribe</button>
                </div>
            </form>
        </div>
    </section>

    <!-- Footer -->
    <jsp:include page="/WEB-INF/partials/footer.jsp" />

    <!-- JavaScript -->
    <script src="${pageContext.request.contextPath}/js/main.js"></script>
</body>
</html>