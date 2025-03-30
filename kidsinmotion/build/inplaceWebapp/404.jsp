<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" isErrorPage="true" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %><!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Page Not Found - Kids in Motion</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.1.1/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&family=Open+Sans:wght@300;400;600&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/styles.css">
    <style>
        .error-page {
            min-height: 80vh;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: var(--spacing-xl) 0;
        }

        .error-container {
            max-width: 600px;
        }

        .error-code {
            font-size: 8rem;
            font-weight: 700;
            color: var(--imperial-red);
            line-height: 1;
            margin-bottom: var(--spacing-md);
        }

        .error-message {
            font-size: 2rem;
            font-weight: 600;
            margin-bottom: var(--spacing-lg);
            color: var(--indigo-dye);
        }

        .error-description {
            margin-bottom: var(--spacing-lg);
            font-size: 1.1rem;
        }

        .error-actions {
            display: flex;
            justify-content: center;
            gap: var(--spacing-md);
        }

        .error-illustration {
            max-width: 300px;
            margin: 0 auto var(--spacing-lg);
        }

        @media (max-width: 768px) {
            .error-code {
                font-size: 6rem;
            }

            .error-message {
                font-size: 1.5rem;
            }

            .error-actions {
                flex-direction: column;
            }

            .error-actions .btn {
                width: 100%;
            }
        }
    </style>
</head>
<body>
    <!-- Header -->
    <jsp:include page="/WEB-INF/partials/header.jsp" />

    <div class="error-page">
        <div class="container">
            <div class="error-container">
                <div class="error-illustration">
                    <img src="${pageContext.request.contextPath}/images/error-404.svg" alt="Page Not Found Illustration">
                </div>

                <div class="error-code">404</div>
                <h1 class="error-message">Page Not Found</h1>

                <p class="error-description">Oops! The page you're looking for seems to have gone missing. It might have moved, been removed, or maybe you typed the wrong URL.</p>

                <div class="error-actions">
                    <a href="${pageContext.request.contextPath}/" class="btn btn-primary">
                        <i class="fas fa-home"></i> Back to Home
                    </a>
                    <a href="${pageContext.request.contextPath}/events/upcoming" class="btn btn-secondary">
                        <i class="fas fa-calendar-alt"></i> Browse Events
                    </a>
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