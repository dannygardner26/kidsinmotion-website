<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<%@ taglib prefix="fmt" uri="jakarta.tags.fmt" %>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${event.title} - Kids in Motion</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.1.1/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&family=Open+Sans:wght@300;400;600&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/styles.css">
    <style>
        .event-details-container {
            padding: var(--spacing-xl) 0;
        }

        .event-header {
            background-color: var(--indigo-dye);
            color: var(--white);
            padding: var(--spacing-lg);
            border-radius: var(--border-radius-md) var(--border-radius-md) 0 0;
            position: relative;
        }

        .event-type-badge {
            position: absolute;
            top: 0;
            right: var(--spacing-lg);
            transform: translateY(-50%);
            background-color: var(--imperial-red);
            color: var(--white);
            padding: 0.5rem 1rem;
            border-radius: 30px;
            font-weight: 600;
            font-size: 0.875rem;
            text-transform: uppercase;
        }

        .event-content-wrapper {
            display: grid;
            grid-template-columns: 3fr 1fr;
            gap: var(--spacing-lg);
        }

        .event-content {
            background-color: var(--white);
            border-radius: 0 0 var(--border-radius-md) var(--border-radius-md);
            padding: var(--spacing-lg);
            margin-bottom: var(--spacing-lg);
        }

        .event-sidebar {
            margin-top: var(--spacing-xl);
        }

        .event-info-card {
            background-color: var(--white);
            border-radius: var(--border-radius-md);
            padding: var(--spacing-lg);
            margin-bottom: var(--spacing-lg);
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
        }

        .event-info-card h3 {
            margin-bottom: var(--spacing-md);
            color: var(--indigo-dye);
            font-size: 1.25rem;
        }

        .event-info-list {
            list-style: none;
        }

        .event-info-item {
            display: flex;
            margin-bottom: var(--spacing-md);
            align-items: flex-start;
        }

        .event-info-icon {
            color: var(--imperial-red);
            margin-right: var(--spacing-sm);
            font-size: 1.25rem;
            min-width: 24px;
            text-align: center;
        }

        .event-actions {
            margin-top: var(--spacing-lg);
        }

        .event-actions .btn {
            width: 100%;
            margin-bottom: var(--spacing-sm);
        }

        .event-countdown {
            display: flex;
            justify-content: space-between;
            margin-top: var(--spacing-md);
            text-align: center;
        }

        .countdown-item {
            flex: 1;
        }

        .countdown-item .number {
            display: block;
            font-size: 1.5rem;
            font-weight: 700;
            color: var(--indigo-dye);
        }

        .countdown-item .label {
            display: block;
            font-size: 0.75rem;
            color: var(--jet);
            text-transform: uppercase;
        }

        .countdown-expired {
            color: var(--imperial-red);
            font-weight: 600;
            text-align: center;
            width: 100%;
        }

        .status-available {
            color: #28a745;
        }

        .status-full {
            color: var(--imperial-red);
        }

        .status-needs {
            color: #fd7e14;
        }

        .progress-bar-container {
            width: 100%;
            height: 10px;
            background-color: #e9ecef;
            border-radius: 5px;
            margin-bottom: var(--spacing-sm);
            overflow: hidden;
        }

        .progress-bar {
            height: 100%;
            background-color: var(--imperial-red);
        }

        .event-description {
            margin-bottom: var(--spacing-lg);
        }

        .event-details-section {
            margin-bottom: var(--spacing-lg);
        }

        .event-image {
            width: 100%;
            border-radius: var(--border-radius-md);
            margin-bottom: var(--spacing-lg);
        }

        .volunteer-callout {
            background-color: #e6f7ff;
            border-left: 4px solid #1890ff;
            padding: var(--spacing-md);
            margin-bottom: var(--spacing-lg);
            border-radius: 0 var(--border-radius-sm) var(--border-radius-sm) 0;
        }

        .volunteer-callout h3 {
            color: #0050b3;
            margin-bottom: var(--spacing-sm);
        }

        @media (max-width: 768px) {
            .event-content-wrapper {
                grid-template-columns: 1fr;
            }

            .event-sidebar {
                margin-top: 0;
            }

            .event-header {
                padding-top: var(--spacing-lg);
                padding-bottom: var(--spacing-lg);
            }

            .event-type-badge {
                position: static;
                transform: none;
                display: inline-block;
                margin-bottom: var(--spacing-sm);
            }
        }
    </style>
</head>
<body>
    <!-- Header -->
    <jsp:include page="/WEB-INF/partials/header.jsp" />

    <div class="event-details-container">
        <div class="container">
            <!-- Alert Messages -->
            <c:if test="${not empty errorMessage}">
                <div class="alert alert-danger mb-3">
                    <i class="fas fa-exclamation-circle"></i> ${errorMessage}
                </div>
            </c:if>

            <c:if test="${not empty successMessage}">
                <div class="alert alert-success mb-3">
                    <i class="fas fa-check-circle"></i> ${successMessage}
                </div>
            </c:if>

            <div class="event-header">
                <span class="event-type-badge">${event.sportType}</span>
                <h1>${event.title}</h1>
                <p>${event.eventType} • <fmt:formatDate value="${event.startDate}" pattern="MMMM d, yyyy" /></p>
            </div>

            <div class="event-content-wrapper">
                <div>
                    <div class="event-content">
                        <c:if test="${not empty event.imageUrl}">
                            <img src="${event.imageUrl}" alt="${event.title}" class="event-image">
                        </c:if>

                        <div class="event-description">
                            <h2>About This Event</h2>
                            <p>${event.description}</p>
                        </div>

                        <c:if test="${event.needsVolunteers && event.volunteerCountNeeded > volunteerCount}">
                            <div class="volunteer-callout">
                                <h3><i class="fas fa-hand-holding-heart"></i> Volunteers Needed</h3>
                                <p>We're looking for ${event.volunteerCountNeeded - volunteerCount} more volunteer(s) to help make this event a success.</p>
                                <c:if test="${empty sessionScope.user}">
                                    <p><a href="${pageContext.request.contextPath}/auth/login?redirect=/events/${event.id}">Log in</a> to sign up as a volunteer.</p>
                                </c:if>
                                <c:if test="${not empty sessionScope.user && sessionScope.user.role == 'VOLUNTEER'}">
                                    <a href="${pageContext.request.contextPath}/volunteers/signup?eventId=${event.id}" class="btn btn-sm btn-secondary">Volunteer for This Event</a>
                                </c:if>
                            </div>
                        </c:if>

                        <div class="event-details-section">
                            <h2>What to Expect</h2>
                            <p>During this ${event.eventType.toLowerCase()}, participants will:</p>
                            <ul>
                                <li>Learn fundamental skills for ${event.sportType.toLowerCase()}</li>
                                <li>Receive personalized coaching from experienced mentors</li>
                                <li>Participate in fun drills and activities</li>
                                <li>Build confidence and teamwork skills</li>
                            </ul>
                        </div>

                        <div class="event-details-section">
                            <h2>What to Bring</h2>
                            <ul>
                                <li>Water bottle</li>
                                <li>Appropriate athletic wear</li>
                                <li>Sports shoes</li>
                                <c:if test="${event.sportType == 'BASEBALL'}">
                                    <li>Baseball glove (if available)</li>
                                </c:if>
                                <c:if test="${event.sportType == 'BASKETBALL'}">
                                    <li>Basketball (if available)</li>
                                </c:if>
                                <c:if test="${event.sportType == 'SOCCER'}">
                                    <li>Shin guards (if available)</li>
                                </c:if>
                                <li>Positive attitude and energy!</li>
                            </ul>
                            <p><strong>Note:</strong> Equipment will be provided for those who don't have their own.</p>
                        </div>
                    </div>
                </div>

                <div class="event-sidebar">
                    <div class="event-info-card">
                        <h3>Event Details</h3>
                        <ul class="event-info-list">
                            <li class="event-info-item">
                                <div class="event-info-icon">
                                    <i class="fas fa-calendar-alt"></i>
                                </div>
                                <div>
                                    <strong>Date:</strong><br>
                                    <fmt:formatDate value="${event.startDate}" pattern="EEEE, MMMM d, yyyy" />
                                </div>
                            </li>
                            <li class="event-info-item">
                                <div class="event-info-icon">
                                    <i class="fas fa-clock"></i>
                                </div>
                                <div>
                                    <strong>Time:</strong><br>
                                    <fmt:formatDate value="${event.startDate}" pattern="h:mm a" /> -
                                    <fmt:formatDate value="${event.endDate}" pattern="h:mm a" />
                                </div>
                            </li>
                            <li class="event-info-item">
                                <div class="event-info-icon">
                                    <i class="fas fa-map-marker-alt"></i>
                                </div>
                                <div>
                                    <strong>Location:</strong><br>
                                    ${event.location}
                                </div>
                            </li>
                            <li class="event-info-item">
                                <div class="event-info-icon">
                                    <i class="fas fa-users"></i>
                                </div>
                                <div>
                                    <strong>Available Spots:</strong><br>
                                    <c:choose>
                                        <c:when test="${availableSpots > 0}">
                                            <span class="status-available">${availableSpots} of ${event.maxParticipants} spots available</span>
                                        </c:when>
                                        <c:otherwise>
                                            <span class="status-full">Event is full</span>
                                        </c:otherwise>
                                    </c:choose>
                                    <div class="progress-bar-container">
                                        <div class="progress-bar" style="width: ${(event.maxParticipants - availableSpots) * 100 / event.maxParticipants}%"></div>
                                    </div>
                                </div>
                            </li>
                            <li class="event-info-item">
                                <div class="event-info-icon">
                                    <i class="fas fa-hand-holding-heart"></i>
                                </div>
                                <div>
                                    <strong>Volunteers:</strong><br>
                                    <c:choose>
                                        <c:when test="${event.needsVolunteers && volunteersNeeded > 0}">
                                            <span class="status-needs">${volunteersNeeded} more needed</span>
                                        </c:when>
                                        <c:otherwise>
                                            <span class="status-available">All volunteer positions filled</span>
                                        </c:otherwise>
                                    </c:choose>
                                </div>
                            </li>
                            <li class="event-info-item">
                                <div class="event-info-icon">
                                    <i class="fas fa-dollar-sign"></i>
                                </div>
                                <div>
                                    <strong>Cost:</strong><br>
                                    Free
                                </div>
                            </li>
                        </ul>

                        <div class="event-actions">
                            <c:choose>
                                <c:when test="${empty sessionScope.user}">
                                    <a href="${pageContext.request.contextPath}/auth/login?redirect=/events/${event.id}" class="btn btn-primary">Log in to Register</a>
                                </c:when>
                                <c:otherwise>
                                    <c:choose>
                                        <c:when test="${sessionScope.user.role == 'PARENT' && availableSpots > 0 && !isRegistered}">
                                            <a href="${pageContext.request.contextPath}/events/${event.id}/register" class="btn btn-primary">Register Child</a>
                                        </c:when>
                                        <c:when test="${sessionScope.user.role == 'PARENT' && isRegistered}">
                                            <button class="btn btn-secondary" disabled>Already Registered</button>
                                            <a href="${pageContext.request.contextPath}/participants/me" class="btn btn-outline">View Registration</a>
                                        </c:when>
                                        <c:when test="${sessionScope.user.role == 'PARENT' && availableSpots <= 0}">
                                            <button class="btn btn-secondary" disabled>Event Full</button>
                                            <a href="${pageContext.request.contextPath}/events/upcoming" class="btn btn-outline">Find Other Events</a>
                                        </c:when>
                                        <c:when test="${sessionScope.user.role == 'VOLUNTEER' && event.needsVolunteers && volunteersNeeded > 0 && !isVolunteer}">
                                            <a href="${pageContext.request.contextPath}/volunteers/signup?eventId=${event.id}" class="btn btn-primary">Volunteer for This Event</a>
                                        </c:when>
                                        <c:when test="${sessionScope.user.role == 'VOLUNTEER' && isVolunteer}">
                                            <button class="btn btn-secondary" disabled>Already Signed Up</button>
                                            <a href="${pageContext.request.contextPath}/volunteers/me" class="btn btn-outline">View Your Schedule</a>
                                        </c:when>
                                        <c:otherwise>
                                            <a href="${pageContext.request.contextPath}/events/upcoming" class="btn btn-primary">Browse More Events</a>
                                        </c:otherwise>
                                    </c:choose>
                                </c:otherwise>
                            </c:choose>

                            <c:if test="${event.startDate.time > currentDate.time}">
                                <h4 class="mt-3 mb-2">Registration Closes In:</h4>
                                <div class="event-countdown" data-event-date="${event.startDate.time}"></div>
                            </c:if>
                        </div>
                    </div>

                    <div class="event-info-card">
                        <h3>Share This Event</h3>
                        <div class="social-links">
                            <a href="https://www.facebook.com/sharer/sharer.php?u=${pageContext.request.requestURL}" target="_blank" aria-label="Share on Facebook">
                                <i class="fab fa-facebook-f"></i>
                            </a>
                            <a href="https://twitter.com/intent/tweet?text=Join us at ${event.title}&url=${pageContext.request.requestURL}" target="_blank" aria-label="Share on Twitter">
                                <i class="fab fa-twitter"></i>
                            </a>
                            <a href="mailto:?subject=Join us at ${event.title}&body=Check out this event: ${pageContext.request.requestURL}" aria-label="Share via Email">
                                <i class="fas fa-envelope"></i>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Footer -->
    <jsp:include page="/WEB-INF/partials/footer.jsp" />

    <!-- JavaScript -->
    <script src="${pageContext.request.contextPath}/js/main.js"></script>
</body>
</html>