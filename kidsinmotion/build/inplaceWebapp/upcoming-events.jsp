<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="fmt" uri="http://java.sun.com/jsp/jstl/fmt" %>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Upcoming Events - Kids in Motion</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.1.1/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&family=Open+Sans:wght@300;400;600&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/styles.css">
    <style>
        .events-page {
            padding: var(--spacing-xl) 0;
            background-color: var(--isabelline);
        }

        .page-header {
            text-align: center;
            margin-bottom: var(--spacing-lg);
        }

        .filters-section {
            background-color: var(--white);
            border-radius: var(--border-radius-md);
            padding: var(--spacing-md);
            margin-bottom: var(--spacing-lg);
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
        }

        .filter-buttons {
            display: flex;
            flex-wrap: wrap;
            gap: var(--spacing-sm);
            margin-bottom: var(--spacing-md);
        }

        .filter-btn {
            background-color: var(--isabelline);
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 20px;
            cursor: pointer;
            font-family: var(--font-body);
            font-weight: 600;
            transition: all var(--transition-speed) ease;
        }

        .filter-btn.active {
            background-color: var(--indigo-dye);
            color: var(--white);
        }

        .filter-btn:hover:not(.active) {
            background-color: #ddd;
        }

        .search-filter {
            display: flex;
            gap: var(--spacing-sm);
        }

        .search-filter input {
            flex: 1;
            padding: 0.5rem 1rem;
            border: 1px solid #ddd;
            border-radius: var(--border-radius-sm);
            font-family: var(--font-body);
        }

        .search-filter button {
            background-color: var(--imperial-red);
            color: var(--white);
            border: none;
            padding: 0.5rem 1rem;
            border-radius: var(--border-radius-sm);
            cursor: pointer;
            transition: background-color var(--transition-speed) ease;
        }

        .search-filter button:hover {
            background-color: #d1494a;
        }

        .events-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
            gap: var(--spacing-lg);
        }

        .event-card {
            background-color: var(--white);
            border-radius: var(--border-radius-md);
            overflow: hidden;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
            transition: transform var(--transition-speed) ease, box-shadow var(--transition-speed) ease;
            display: flex;
            flex-direction: column;
        }

        .event-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        }

        .event-card-image {
            height: 180px;
            background-size: cover;
            background-position: center;
            position: relative;
        }

        .event-card-badge {
            position: absolute;
            top: var(--spacing-md);
            right: var(--spacing-md);
            background-color: var(--imperial-red);
            color: var(--white);
            padding: 0.25rem 0.75rem;
            border-radius: 20px;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
        }

        .event-date-tag {
            position: absolute;
            bottom: 0;
            left: var(--spacing-md);
            transform: translateY(50%);
            background-color: var(--white);
            border-radius: var(--border-radius-sm);
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            padding: var(--spacing-xs);
            text-align: center;
            min-width: 60px;
        }

        .event-date-tag .month {
            display: block;
            font-size: 0.75rem;
            text-transform: uppercase;
            color: var(--imperial-red);
            font-weight: 600;
        }

        .event-date-tag .day {
            display: block;
            font-size: 1.25rem;
            font-weight: 700;
            line-height: 1;
        }

        .event-card-content {
            padding: var(--spacing-lg);
            flex-grow: 1;
            display: flex;
            flex-direction: column;
        }

        .event-card-title {
            margin-bottom: var(--spacing-xs);
            font-size: 1.25rem;
        }

        .event-card-details {
            margin-bottom: var(--spacing-sm);
            color: var(--jet);
            font-size: 0.875rem;
        }

        .event-card-details i {
            color: var(--imperial-red);
            width: 20px;
            text-align: center;
            margin-right: var(--spacing-xs);
        }

        .event-card-description {
            margin-bottom: var(--spacing-md);
            font-size: 0.875rem;
            flex-grow: 1;
        }

        .event-card-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .event-spots {
            font-size: 0.875rem;
            font-weight: 600;
        }

        .spots-available {
            color: #28a745;
        }

        .spots-limited {
            color: #fd7e14;
        }

        .spots-full {
            color: var(--imperial-red);
        }

        .no-events {
            grid-column: 1 / -1;
            background-color: var(--white);
            padding: var(--spacing-lg);
            border-radius: var(--border-radius-md);
            text-align: center;
        }

        .pagination {
            display: flex;
            justify-content: center;
            margin-top: var(--spacing-lg);
        }

        .pagination-item {
            display: inline-block;
            margin: 0 var(--spacing-xs);
        }

        .pagination-link {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background-color: var(--white);
            color: var(--jet);
            text-decoration: none;
            transition: all var(--transition-speed) ease;
        }

        .pagination-link:hover {
            background-color: var(--isabelline);
        }

        .pagination-link.active {
            background-color: var(--indigo-dye);
            color: var(--white);
        }

        @media (max-width: 768px) {
            .events-grid {
                grid-template-columns: 1fr;
            }

            .filter-buttons {
                flex-wrap: nowrap;
                overflow-x: auto;
                padding-bottom: var(--spacing-xs);
                margin-bottom: var(--spacing-sm);
            }

            .search-filter {
                flex-direction: column;
            }

            .search-filter button {
                width: 100%;
            }
        }
    </style>
</head>
<body>
    <!-- Header -->
    <jsp:include page="/WEB-INF/partials/header.jsp" />

    <div class="events-page">
        <div class="container">
            <div class="page-header">
                <h1>Upcoming Events</h1>
                <p>Find and register for our upcoming sports programs and activities</p>
            </div>

            <div class="filters-section">
                <h3>Filter Events</h3>

                <div class="filter-buttons">
                    <button class="filter-btn event-filter-btn active" data-filter="all">All Events</button>
                    <button class="filter-btn event-filter-btn" data-filter="baseball">Baseball</button>
                    <button class="filter-btn event-filter-btn" data-filter="basketball">Basketball</button>
                    <button class="filter-btn event-filter-btn" data-filter="soccer">Soccer</button>
                    <button class="filter-btn event-filter-btn" data-filter="clinic">Clinics</button>
                    <button class="filter-btn event-filter-btn" data-filter="camp">Camps</button>
                </div>

                <form class="search-filter" action="${pageContext.request.contextPath}/events/search" method="get">
                    <input type="text" name="query" placeholder="Search events by title, location, or sport" value="${param.query}">
                    <button type="submit"><i class="fas fa-search"></i> Search</button>
                </form>
            </div>

            <div class="events-grid">
                <c:choose>
                    <c:when test="${not empty events}">
                        <c:forEach var="event" items="${events}">
                            <div class="event-card event-item ${fn:toLowerCase(event.sportType)} ${fn:toLowerCase(event.eventType)}">
                                <div class="event-card-image" style="background-image: url('${pageContext.request.contextPath}/images/events/${event.sportType.toLowerCase()}.jpg')">
                                    <div class="event-card-badge">${event.sportType}</div>
                                    <div class="event-date-tag">
                                        <span class="month"><fmt:formatDate value="${event.startDate}" pattern="MMM" /></span>
                                        <span class="day"><fmt:formatDate value="${event.startDate}" pattern="d" /></span>
                                    </div>
                                </div>

                                <div class="event-card-content">
                                    <h3 class="event-card-title">${event.title}</h3>

                                    <div class="event-card-details">
                                        <p><i class="fas fa-calendar-alt"></i> <fmt:formatDate value="${event.startDate}" pattern="EEEE, MMMM d, yyyy" /></p>
                                        <p><i class="fas fa-clock"></i> <fmt:formatDate value="${event.startDate}" pattern="h:mm a" /> - <fmt:formatDate value="${event.endDate}" pattern="h:mm a" /></p>
                                        <p><i class="fas fa-map-marker-alt"></i> ${event.location}</p>
                                    </div>

                                    <div class="event-card-description">
                                        <p>${fn:substring(event.description, 0, 150)}${fn:length(event.description) > 150 ? '...' : ''}</p>
                                    </div>

                                    <div class="event-card-footer">
                                        <c:set var="availableSpots" value="${event.maxParticipants - participantCounts[event.id]}" />

                                        <div class="event-spots">
                                            <c:choose>
                                                <c:when test="${availableSpots > 5}">
                                                    <span class="spots-available">${availableSpots} spots available</span>
                                                </c:when>
                                                <c:when test="${availableSpots > 0}">
                                                    <span class="spots-limited">Only ${availableSpots} spots left!</span>
                                                </c:when>
                                                <c:otherwise>
                                                    <span class="spots-full">Event Full</span>
                                                </c:otherwise>
                                            </c:choose>
                                        </div>

                                        <a href="${pageContext.request.contextPath}/events/${event.id}" class="btn btn-sm btn-outline">View Details</a>
                                    </div>
                                </div>
                            </div>
                        </c:forEach>
                    </c:when>
                    <c:otherwise>
                        <div class="no-events">
                            <h3>No upcoming events found</h3>
                            <p>Please check back soon for new events, or adjust your search filters.</p>
                        </div>
                    </c:otherwise>
                </c:choose>
            </div>

            <c:if test="${totalPages > 1}">
                <div class="pagination">
                    <c:if test="${currentPage > 1}">
                        <div class="pagination-item">
                            <a href="${pageContext.request.contextPath}/events/upcoming?page=${currentPage - 1}${not empty param.query ? '&query=' + param.query : ''}" class="pagination-link">
                                <i class="fas fa-chevron-left"></i>
                            </a>
                        </div>
                    </c:if>

                    <c:forEach begin="1" end="${totalPages}" var="i">
                        <div class="pagination-item">
                            <a href="${pageContext.request.contextPath}/events/upcoming?page=${i}${not empty param.query ? '&query=' + param.query : ''}"
                               class="pagination-link ${currentPage == i ? 'active' : ''}">
                                ${i}
                            </a>
                        </div>
                    </c:forEach>

                    <c:if test="${currentPage < totalPages}">
                        <div class="pagination-item">
                            <a href="${pageContext.request.contextPath}/events/upcoming?page=${currentPage + 1}${not empty param.query ? '&query=' + param.query : ''}" class="pagination-link">
                                <i class="fas fa-chevron-right"></i>
                            </a>
                        </div>
                    </c:if>
                </div>
            </c:if>
        </div>
    </div>

    <!-- Footer -->
    <jsp:include page="/WEB-INF/partials/footer.jsp" />

    <!-- JavaScript -->
    <script src="${pageContext.request.contextPath}/js/main.js"></script>
</body>
</html>