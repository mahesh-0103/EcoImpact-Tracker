# EcoImpact-Tracker

## Overview
EcoImpact Tracker is a web application designed to help users monitor and reduce their carbon footprint through habit tracking, Google Calendar reminders, and Slack updates. Built for the Hackathon conducted by Descope, this project leverages Descope for secure authentication and integration with Google Calendar and Slack via Outbound Apps, offering a visually stunning, user-friendly interface. The app includes innovative features like a Carbon Challenge, tenant-based access control, and analytics, aligning with real-world sustainability needs.

## Features
- **Secure Authentication**: Uses Descope's "UserAuthFlow" with embedded Google Calendar and Slack connections.
- **Habit Tracking**: Input daily habits to estimate CO2 impact with AI-driven suggestions.
- **Google Calendar Integration**: Schedule eco-reminders automatically via Descope Outbound Apps.
- **Slack Integration**: Post CO2 savings and suggestions to a Slack channel using Descope tokens.
- **Carbon Challenge**: Join a challenge to set and track CO2 reduction goals via a custom Descope flow.
- **Tenant Management**: Restrict access to "TeamEcoA" and "TeamEcoB" teams using Descope tenant controls.
- **Analytics**: Display security audit logs for transparency.
- **Interactive Dashboard**: Real-time CO2 charts, progress bars for carbon challenges, and gamification (badges, leaderboard).
- **User-Friendly Design**: Onboarding tour, tooltips, dark mode, and responsive layout.

## Judging Criteria Alignment
- **Utility & Relevance (25)**: Supports agent-based workflows for habit tracking and reminders, addressing climate change needs across diverse scenarios.
- **Creativity & Originality (20)**: Innovative gamification and eco-themed design enhance autonomy and adaptability.
- **Security & Access Control (20)**: Descope ensures secure authentication and scoped tenant permissions.
- **Technical Execution (15)**: Integrates Descope and APIs with a stable architecture.
- **Connectivity & Compatibility (10)**: Reliable API calls with low latency and error handling.
- **Demonstration & Clarity (10)**: Clear video demo showcases end-to-end workflow and security.
- **Bonus**: Includes a custom Python client for API interaction.

5. **Test Features**
- Sign in via Descope to connect Google Calendar and Slack.
- Input habits, create events, post to Slack, join the challenge, switch tenants, and view audit logs.

## Technologies Used
- **Frontend**: React, Tailwind CSS, Chart.js, Intro.js
- **Backend**: Node.js, Express
- **Authentication & Integration**: Descope (Outbound Apps for Google Calendar and Slack)
- **Deployment**: Vercel

## Acknowledgments
- Thanks to the hackathon organizers and the Descope team for their support.


