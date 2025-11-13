
```markdown
# MercAU - VLC Marketplace

MercAU is a full-stack web and mobile marketplace designed to promote local commerce and sustainable delivery. The platform connects users with nearby stores through an AI-assisted interface, real-time synchronization, and a gamified reward system that encourages eco-friendly and community-focused shopping habits.

## Key Features

-   **Geolocation & Mapping**: Interactive map to explore local shops and nearby offers.
-   **Gamification System**: Custom challenges and rewards promoting physical activity and local consumption through VLCOIN points.
-   **AI Assistance**: Smart chat integration for product discovery and user support.
-   **Real-Time Database**: Dynamic cart and inventory updates using Firebase Firestore.
-   **User & Payment Management**: Secure authentication and streamlined checkout process.
-   **Sustainability Tracking**: CO₂ comparison between local and international deliveries to promote eco-friendly choices.

## Technologies Used

-   **Frontend**: Angular, TypeScript, Ionic Framework, HTML, SCSS
-   **Backend & Database**: Firebase (Firestore, Authentication, Hosting)
-   **AI Integration**: Custom AiChatComponent and AiChatService

## Collaborators

-   Mario Pérez
-   Laila Makmar
-   Silvia Barea
-   Saúl López
-   Agustín Payá ([@agustinpaya1](https://github.com/agustinpaya1))

## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

You will need Node.js, npm, the Angular CLI, and the Ionic CLI installed on your machine.

```sh
npm install -g @angular/cli
npm install -g @ionic/cli
```

### Installation

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/agustinpaya1/vlc-market-place.git
    ```
2.  **Navigate to the project directory:**
    ```sh
    cd vlc-market-place
    ```
3.  **Install NPM packages:**
    ```sh
    npm install
    ```
4.  **Set up Firebase:**
    -   Create a project at [firebase.google.com](https://firebase.google.com/).
    -   Obtain your Firebase configuration (apiKey, authDomain, etc.).
    -   Add your configuration to the files at `src/environments/environment.ts` and `src/environments/environment.prod.ts`.

5.  **Run the application:**
    To serve the application for web development:
    ```sh
    ionic serve
    ```
    Navigate to `http://localhost:8100/`. The app will automatically reload if you change any of the source files.

```

***
